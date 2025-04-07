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
    res.render('index', { images, messages });
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
  res.render('forgot-password');
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

    // Make sure 'dashboard' view is rendering properly with user data and transactions
    res.render('Dashboard', { user: req.session.user, transactions: rows });
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
app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

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

// Global Error Handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err);
  res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
