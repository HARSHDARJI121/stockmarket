require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const mongoose = require('mongoose'); // MongoDB ORM
const userController = require('./controllers/userController'); // Import the user controller
const isAuthenticated = require('./controllers/auth'); // Authentication check
const cron = require('node-cron');
const MongoStore = require('connect-mongo');
const favicon = require('serve-favicon');
const Message = require('./models/Message'); // Import the Message model
const { User, Transaction, AcceptedTransaction } = require('./models'); // Import other models
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); 
const ExcelJS = require('exceljs');
const transporter = require('./utils/email');
const helmet = require('helmet');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;

// Check for MongoDB URI in environment variables
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI is not defined in .env file');
  process.exit(1);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
})
  .then(() => {
    console.log('MongoDB connection successful!');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Please check your MongoDB Atlas configuration and network connection');
  });

// MongoDB error and disconnection handlers
mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Middleware setup
app.use(morgan('dev')); // Logs incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: process.env.SESSION || 'yourSecretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
    }),
    cookie: {
      secure: false, // Set to `true` if using HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "'unsafe-inline'", "blob:"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "img-src": [
        "'self'",
        "data:",
        "https://static.vecteezy.com",
        "https://eclubs.ir",
        "https://i.pinimg.com",
        "https://cdn.futura-sciences.com",
        "https://img.freepik.com",
      ],
      "connect-src": ["'self'"],
    },
  })
);

// Example handler to catch the violations:
app.post('/csp-violation-report-endpoint', express.json(), (req, res) => {
  console.log('CSP Violation:', req.body);
  res.status(204).end(); // Return a no-content response
});

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' blob:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self';"
  );
  next();
});


// Serve the favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware to make `user` available in all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' blob:; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src https://fonts.gstatic.com; " +
    "img-src 'self' data:; " +
    "connect-src 'self';"
  );
  next();
});


// Password prompt middleware for admin
const passwordPromptMiddleware = (req, res, next) => {
  const password = process.env.ADMIN_PASSWORD || 'defaultPassword';
  if (!req.session.isAdmin) {
    res.render('passwordPrompt');
  } else {
    next();
  }
};

// Routes
app.get('/', async (req, res) => {
  try {
    const images = [
      'https://static.vecteezy.com/system/resources/previews/025/481/738/large_2x/bull-with-background-of-uptrend-stock-market-concept-of-bullish-market-ai-generated-free-photo.jpeg',
      'https://eclubs.ir/wp-content/uploads/2021/03/trade2.jpg',
      'https://i.pinimg.com/originals/31/fb/7b/31fb7b6c808cb6d714a0e303c5a4119b.jpg',
      'https://cdn.futura-sciences.com/sources/images/cours%20trading.jpeg',
      'https://img.freepik.com/premium-photo/investment-trading-background-with-bar-charts_1200-1408.jpg?w=2000',
    ];

    // Fetch all messages from the database
    const messages = await Message.find().sort({ createdAt: -1 });

    // Pass the messages and images to the view
    res.render('index', { images, messages, moment });
  } catch (error) {
    console.error('Error rendering index:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});

app.post('/admin', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('passwordPrompt', { error: 'Incorrect password. Please try again.' });
  }
});

app.get('/admin', passwordPromptMiddleware, async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    const transactions = await Transaction.find(); // Fetch all transactions
    const messages = await Message.find().sort({ createdAt: -1 }); // Fetch all messages

    // Pass users, transactions, and messages to the admin view
    res.render('admin', { users, transactions, messages });
  } catch (err) {
    console.error('Error rendering admin page:', err);
    res.status(500).render('error', { message: 'Error rendering admin page' });
  }
});

// Handle message submission
app.post('/send-message', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message cannot be empty!' });
    }

    // Save the message to the database
    await Message.create({ content: message });

    res.redirect('/admin'); 
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Route to delete a message
app.delete('/delete-message/:id', async (req, res) => {
  try {
    const messageId = req.params.id;

    // Delete the message from the database
    const result = await Message.findByIdAndDelete(messageId);

    if (!result) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Other routes (e.g., login, signup, transactions, etc.)
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', userController.signup);
app.post('/login', userController.login);

app.get('/forgot-password', (req, res) => {
  res.render('forgot-password', { successMessage: null }); // Pass successMessage as null initially
});

app.post('/forgot-password', userController.forgotPassword);

app.get('/logout', (req, res, next) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});
// Transaction Page (Displays user-specific transaction data)
app.get('/transaction', isAuthenticated, (req, res) => {
  const userEmail = req.session.userEmail;
  const userName = req.session.userName;

  const plan = req.query.plan || 'standard';
  let amount = 0;

  switch (plan) {
    case "standard":
      amount = 1251;
      break;
    case "premium":
      amount = 3200;
      break;
    default:
      amount = 1251;
      break;
  }

  res.render('transaction', {
    email: userEmail,
    userName: userName,
    plan: plan,
    amount: amount
  });
});

app.post('/admin/accept-transaction/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    console.log(`Processing transaction ID: ${transactionId}`);

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      console.log(`Transaction not found for ID: ${transactionId}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status === 'accepted') {
      return res.json({ message: 'Transaction is already accepted' });
    }

    transaction.status = 'accepted';
    const startDate = new Date();
    let endDate;
    let plan = transaction.plan || 'unknown';

    if (transaction.amount === 1251 || transaction.plan === 'standard') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
      plan = 'standard';
    } else if (transaction.amount === 3200 || transaction.plan === 'premium') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 90);
      plan = 'premium';
    } else {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30);
    }

    console.log(`Assigned Plan: ${plan}, Start Date: ${startDate}, End Date: ${endDate}`);

    const acceptedTransaction = await AcceptedTransaction.create({
      email: transaction.email,
      name: transaction.name,
      amount: transaction.amount,
      plan: plan,
      start_date: startDate,
      end_date: endDate,
      status: 'accepted',
      transaction_date: new Date(),
      transaction_id: transactionId
    });

    transaction.end_date = endDate;
    await transaction.save();

    const daysLeft = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));

    console.log(`Transaction Accepted! Plan: ${plan}, Days Left: ${daysLeft}`);

    return res.json({
      message: 'Transaction accepted and saved successfully!',
      daysLeft,
      endDate
    });

  } catch (error) {
    console.error('Error in accept-transaction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

cron.schedule('0 0 * * *', async () => {
  try {
    console.log('Running daily transaction status update job...');
    const now = new Date();

    const expiredTransactions = await Transaction.find({
      status: 'accepted',
      end_date: { $lte: now }
    });

    for (const transaction of expiredTransactions) {
      transaction.status = 'inactive';
      await transaction.save();
      console.log(`Transaction ${transaction.id} expired and set to inactive.`);
    }

    console.log('Transaction status update job completed.');
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

app.get('/admin/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.aggregate([
      {
        $lookup: {
          from: 'acceptedtransactions',
          localField: 'email',
          foreignField: 'email',
          as: 'accepted_transactions'
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    res.render('admin', { transactions });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/admin/reject-transaction/:id', async (req, res) => {
  const transactionId = req.params.id;

  try {
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }

    await AcceptedTransaction.deleteOne({ transaction_id: transactionId });
    await Transaction.deleteOne({ _id: transactionId });

    res.json({ success: true, message: 'Transaction rejected and deleted' });
  } catch (err) {
    console.error('Error rejecting transaction:', err);
    res.status(500).json({ success: false, message: 'Error rejecting transaction' });
  }
});

// Add new route for deleting transactions
app.delete('/admin/delete-transaction/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    console.log(`Attempting to delete transaction ID: ${transactionId}`);

    // First find the transaction to verify it exists
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      console.log(`Transaction not found for ID: ${transactionId}`);
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Delete from AcceptedTransaction collection
    const acceptedDeleteResult = await AcceptedTransaction.deleteMany({
      transaction_id: transactionId
    });
    console.log(`Deleted ${acceptedDeleteResult.deletedCount} accepted transactions`);

    // Delete from Transaction collection
    const transactionDeleteResult = await Transaction.deleteOne({ _id: transactionId });
    console.log(`Deleted ${transactionDeleteResult.deletedCount} transactions`);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
      deletedCount: {
        transactions: transactionDeleteResult.deletedCount,
        acceptedTransactions: acceptedDeleteResult.deletedCount
      }
    });

  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ success: false, message: 'Error deleting transaction' });
  }
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
    console.error('User session not found. Redirecting to login.');
    return res.redirect('/login');
  }

  try {
    const userEmail = req.session.user.email;

    if (!userEmail) {
      console.error('User email not found in session.');
      return res.status(400).render('error', { message: 'User email is missing in session.' });
    }

    // Fetch transactions for the logged-in user
    const rows = await AcceptedTransaction.find({ email: userEmail });

    if (!rows || rows.length === 0) {
      console.log('No transactions found for user:', userEmail);
    }

    // Map through transactions to calculate progress data
    const transactions = rows.map(transaction => {
      let startDate = new Date(transaction.start_date);
      let endDate = new Date(transaction.end_date);
      let currentDate = new Date();

      // Calculate total days of the plan
      let totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      // Calculate days passed
      let daysPassed = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));

      // Handle edge cases where the dates might be invalid
      if (isNaN(startDate) || isNaN(endDate)) totalDays = 0;
      if (daysPassed > totalDays) daysPassed = totalDays;

      // Calculate progress percentage (0 - 100%)
      let progressPercentage = totalDays > 0 ? Math.min(100, (daysPassed / totalDays) * 100) : 0;

      // Determine if the plan is expired
      let planExpired = currentDate.toDateString() === endDate.toDateString() || currentDate > endDate;

      return {
        ...transaction.toObject(), // If using mongoose, toObject() will convert the transaction to a plain object
        totalDays,
        daysPassed,
        progressPercentage,
        planExpired
      };
    });

    // Render the dashboard view and pass user and transactions data to the template
    res.render('Dashboard', { user: req.session.user, transactions });
  } catch (err) {
    console.error('Error fetching dashboard data:', err.message);
    console.error(err.stack); // Log the full stack trace for debugging
    res.status(500).render('error', { message: 'Error fetching dashboard data' });
  }
});

app.post('/save-transaction', async (req, res) => {
  try {
    const { user_email, user_name, plan, amount, status, userId, transaction_date } = req.body;

    if (!user_email || !user_name || !plan || !amount || !status || !userId || !transaction_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    const startDate = new Date(transaction_date);
    if (isNaN(startDate)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction date.' });
    }

    let finalEndDate;
    if (amount === '1251') {
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 30);
    } else if (amount === '3200') {
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 90);
    } else if (amount === 'premium') {
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 60);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid plan provided.' });
    }

    const transaction = await Transaction.create({
      email: user_email,
      name: user_name,
      plan: plan,
      amount: amount,
      status: status,
      transaction_date: startDate,
      end_date: finalEndDate
    });

    return res.status(200).json({ success: true, transaction: transaction });

  } catch (error) {
    console.error('Error saving transaction:', error);
    return res.status(500).json({ success: false, message: 'Error saving transaction.' });
  }
});

// Route to render the login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Route to render the signup page
app.get('/signup', (req, res) => {
  res.render('signup');
});

// Handle POST requests for signup and login via userController
app.post('/signup', userController.signup);
app.post('/login', userController.login);

// Forgot password route
// app.get('/forgot-password', (req, res) => {
//   res.render('forgot-password', { successMessage: null }); // Pass successMessage as null initially
// });

app.post('/forgot-password', userController.forgotPassword);

// Logout route
app.get('/logout', (req, res, next) => {
  if (req.session.user) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});



// Reset Password Route (when user clicks on the reset link)
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    console.log("Received token:", token);

    // Check if the token exists and is not expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Invalid or expired token");
      return res.status(400).render("error", { message: "Invalid or expired token." });
    }

    console.log("User found:", user);

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.status(200).render("success", { message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).render("error", { message: "Internal server error." });
  }
});

app.get('/admin/export-excel', async (req, res) => {
  try {
      const users = await User.find();
      const transactions = await Transaction.find();

      const workbook = new ExcelJS.Workbook();

      // ===== Users Sheet =====
      const usersSheet = workbook.addWorksheet('Users');
      usersSheet.columns = [
          { header: 'ID', key: '_id', width: 30 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Email', key: 'email', width: 30 }
      ];
      users.forEach(user => usersSheet.addRow(user));

      // ===== Transactions Sheet =====
      const transactionsSheet = workbook.addWorksheet('Transactions');
      transactionsSheet.columns = [
          { header: 'ID', key: '_id', width: 30 },
          { header: 'Name', key: 'name', width: 20 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Plan', key: 'plan', width: 20 },
          { header: 'Amount', key: 'amount', width: 15 },
          { header: 'Status', key: 'status', width: 15 },
          { header: 'Transaction Date', key: 'transaction_date', width: 25 },
          { header: 'End Date', key: 'end_date', width: 25 }
      ];

      transactions.forEach(txn => {
          transactionsSheet.addRow({
              _id: txn._id,
              name: txn.name,
              email: txn.email,
              plan: txn.plan,
              amount: txn.amount,
              status: txn.status,
              transaction_date: txn.transaction_date ? new Date(txn.transaction_date).toLocaleString() : '',
              end_date: txn.end_date ? new Date(txn.end_date).toLocaleString() : 'N/A'
          });
      });

      // Export as Excel
      const fileName = `All_Data_${Date.now()}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

      await workbook.xlsx.write(res);
      res.end();
  } catch (error) {
      console.error("Excel Export Error:", error);
      res.status(500).send("Error exporting Excel file.");
  }
});

//
app.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).send("Invalid or expired token.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.send("✅ Password has been reset successfully. You can now log in.");
  } catch (err) {
    console.error("Error during password reset:", err);
    res.status(500).send("Server error.");
  }
});

app.post("/send-reset-link", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.render("forgot-password", { successMessage: null, errorMessage: "User not found." });
    }

    // Generate token and set expiration
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset link via email
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;
    console.log("Reset link:", resetLink);

    const mailOptions = {
      from: `"StockTrade Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "🔐 Reset Your Password",
      html: `
        <p>Hello ${user.name || "Trader"},</p>
        <p>You requested a password reset. Click the link below to reset it:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link is valid for 1 hour. If you didn't request this, please ignore it.</p>
      `,
    };

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail(mailOptions);

    // Render the page with a success message
    res.render("forgot-password", { successMessage: `A reset link has been sent to ${email}.`, errorMessage: null });
  } catch (err) {
    console.error("Error sending reset link:", err);
    res.render("forgot-password", { successMessage: null, errorMessage: "An error occurred. Please try again." });
  }
});




// Display the reset password form
app.get("/reset-password", async (req, res) => {
  const { token } = req.query;

  try {
    console.log("Received token:", token);

    if (!token) {
      console.log("No token provided");
      return res.status(400).render("error", { message: "Invalid reset link." });
    }

    // Check if the token exists and is not expired
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
      console.log("Invalid or expired token");
      return res.status(400).render("error", { message: "Reset token is invalid or has expired." });
    }

    console.log("User found:", user);
    console.log("Token expiry:", user.resetTokenExpiration);

    // Render the reset password form with the token
    res.render("reset-password", { token });
  } catch (error) {
    console.error("Error in GET /reset-password:", error);
    res.status(500).render("error", { message: "Internal server error." });
  }
});



app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Basic security headers
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "style-src": ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      "font-src": ["https://fonts.gstatic.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
    },
  })
);



// Global Error Handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

