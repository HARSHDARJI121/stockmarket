const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const { Sequelize, DataTypes } = require('sequelize'); // Sequelize for DB handling
const userController = require('./controllers/userController'); // Import the user controller
const isAuthenticated = require('./controllers/auth'); // Authentication check
const cron = require('node-cron');
const AcceptedTransaction = require('./models/acceptedTransaction');
const db = require('./config/db');  
require('dotenv').config();


const app = express();
const PORT = 4000;

// Configure Sequelize for MySQL connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  port: process.env.DB_PORT,
  logging: false,  // Optional: Enable to see SQL queries
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connection successful!');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });



  
const User = sequelize.define('User', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,  // Ensures no duplicate emails
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'basic',  // Set default plan value
  },
});

const Transaction = sequelize.define('Transaction', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  plan: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  amount: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  status: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  transaction_date: {
    type: Sequelize.DATE,
    allowNull: false,
  },
  end_date: {
    type: Sequelize.DATE, // Make sure the type is Date or DATETIME
    allowNull: true,
  },
});




// Sync the database (create table if it doesn't exist)
sequelize.sync({ force: false }) // false will preserve existing data, true will drop and recreate tables
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Error syncing database:', err));


// Middleware setup
app.use(morgan('dev')); // Logs incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)
app.use(session({
  secret: 'pippip-1340',  // Secret key for encrypting session data
  resave: false,          // Don't resave sessions if no changes
  saveUninitialized: true, // Save sessions even if they are not modified
  cookie: { secure: false } // For HTTP, set secure to false; for HTTPS, set it to true
}));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Directory for EJS views

// Middleware to make `user` available in all views if the user is logged in
app.use((req, res, next) => {
  res.locals.user = req.session.user || null; // Makes `user` available in all views
  next();
});

// Routes
app.get('/', (req, res) => {
  try {
    const images = [
      'https://static.vecteezy.com/system/resources/previews/025/481/738/large_2x/bull-with-background-of-uptrend-stock-market-concept-of-bullish-market-ai-generated-free-photo.jpeg',
      'https://eclubs.ir/wp-content/uploads/2021/03/trade2.jpg',
      'https://i.pinimg.com/originals/31/fb/7b/31fb7b6c808cb6d714a0e303c5a4119b.jpg',
      'https://cdn.futura-sciences.com/sources/images/cours%20trading.jpeg',
      'https://img.freepik.com/premium-photo/investment-trading-background-with-bar-charts_1200-1408.jpg?w=2000',
    ];

    res.render('index', { images });
  } catch (error) {
    console.error('Error rendering index:', error);
    res.status(500).render('error', { message: 'Internal Server Error' });
  }
});

// Admin Page Route (Displays list of users and their subscription status)
app.get('/admin', async (req, res) => {
  try {
    // Fetch users from the database
    const users = await sequelize.query('SELECT * FROM users', { type: sequelize.QueryTypes.SELECT });

    // Fetch transactions from the database
    const transactions = await sequelize.query('SELECT * FROM Transactions', { type: sequelize.QueryTypes.SELECT });

    // Calculate remaining days for each user
    users.forEach(user => {
      const subscriptionStartDate = new Date(user.subscription_start_date); // Make sure subscription_start_date exists
      const currentDate = new Date();
      const daysPassed = Math.floor((currentDate - subscriptionStartDate) / (1000 * 60 * 60 * 24));
      const remainingDays = user.plan_duration - daysPassed;

      user.remainingDays = remainingDays > 0 ? remainingDays : 0;
    });

    // Render the 'admin' template with both users and transactions data
    res.render('admin', { users, transactions });
  } catch (err) {
    console.error('Error fetching users and transactions:', err);
    res.status(500).send('Server Error');
  }
});
// Accept the transaction (promote user to premium)
// Example route to accept a transaction by user ID



app.post('/signup', (req, res, next) => {
  if (userController.signup) {
    userController.signup(req, res, next);
  } else {
    next(new Error('Signup handler is missing in the userController.'));
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
      amount = 1251; // Default amount if the plan is unrecognized
      break;
  }

  res.render('transaction', {
    email: userEmail,
    userName: userName,
    plan: plan,
    amount: amount
  });
});

const standard = "standard";
const premium = "premium";



app.post('/admin/accept-transaction/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    console.log(`Processing transaction ID: ${transactionId}`);

    // Find the transaction in the Transactions table
    const transaction = await Transaction.findByPk(transactionId);

    if (!transaction) {
      console.log(`Transaction not found for ID: ${transactionId}`);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // If transaction is already accepted, return
    if (transaction.status === 'accepted') {
      return res.json({ message: 'Transaction is already accepted' });
    }

    // Update transaction status
    transaction.status = 'accepted';

    // Set start_date to current date
    let startDate = new Date();
    let endDate;
    let plan = transaction.plan || 'unknown'; // Default to 'unknown' if plan is not set

    // Determine plan and set end date
    if (transaction.amount === 1251 || transaction.plan === 'standard') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30); // 30-day validity
      plan = 'standard';
    } else if (transaction.amount === 3200 || transaction.plan === 'premium') {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 90); // 90-day validity
      plan = 'premium';
    } else {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 30); // Default 30-day plan
    }

    console.log(`Assigned Plan: ${plan}, Start Date: ${startDate}, End Date: ${endDate}`);

    // Store transaction in AcceptedTransactions table
    const acceptedTransaction = await AcceptedTransaction.create({
      email: transaction.email,
      name: transaction.name,
      amount: transaction.amount,
      plan: plan,
      start_date: startDate,
      end_date: endDate,
      status: 'accepted',
      transaction_date: new Date(),
      transaction_id: transactionId // Link transaction ID
    });

    // ✅ Automatically update end_date in the Transactions table
    transaction.end_date = endDate;
    await transaction.save();

    // Calculate remaining days
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


// 🔹 **Cron job to update expired transactions every day at midnight**
cron.schedule('0 0 * * *', async () => { 
  try {
    console.log('Running daily transaction status update job...');
    const now = new Date();

    // Find transactions that are active and expired
    const expiredTransactions = await Transaction.findAll({
      where: {
        status: 'accepted',
        end_date: { [Op.lte]: now } // end_date <= today
      }
    });

    // Update expired transactions
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
      const transactions = await db.query(`
          SELECT t.*, at.end_date 
          FROM transactions t
          LEFT JOIN accepted_transactions at ON t.email = at.email
          ORDER BY t.createdAt DESC
      `);

      res.render('admin', { transactions });
  } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Internal server error" });
  }
});





app.post('/admin/reject-transaction/:id', async (req, res) => {
  const transactionId = req.params.id;
  
  try {
    // Find the transaction by ID
    const transaction = await Transaction.findOne({ where: { id: transactionId } });

    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }

    // Delete the transaction record
    await Transaction.destroy({ where: { id: transactionId } });

    res.json({ success: true, message: 'Transaction rejected and deleted' });
  } catch (err) {
    console.error('Error rejecting transaction:', err);
    res.status(500).json({ success: false, message: 'Error rejecting transaction' });
  }
});

// Dashboard Route
app.get('/dashboard', async (req, res) => {
  if (!req.session.user) {
      return res.redirect('/login');  // Redirect if the user is not logged in
  }

  try {
      // Ensure you are using the correct table 'AcceptedTransactions'
      const [rows] = await db.execute(
          'SELECT * FROM AcceptedTransactions WHERE email = ?',
          [req.session.user.email]  // Use the logged-in user's email to fetch their transactions
      );

      // Check if the user has any accepted transactions
      if (rows.length === 0) {
          console.log('No transactions found for user:', req.session.user.email);
      }

      // Render dashboard.ejs and pass the user's data and transactions
      res.render('dashboard', { user: req.session.user, transactions: rows });
  } catch (err) {
      console.error('Error fetching dashboard data:', err);
      res.status(500).render('error', { message: 'Error fetching dashboard data' });
  }
});



app.post('/save-transaction', async (req, res) => {
  try {
    const { user_email, user_name, plan, amount, status, userId, transaction_date } = req.body;

    // Check if all necessary data is provided
    if (!user_email || !user_name || !plan || !amount || !status || !userId || !transaction_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields.' });
    }

    // Convert transaction_date string to Date object (make sure the date format is correct)
    const startDate = new Date(transaction_date);
    
    // Validate the startDate, ensure it's a valid date
    if (isNaN(startDate)) {
      return res.status(400).json({ success: false, message: 'Invalid transaction date.' });
    }

    let finalEndDate;

    // Calculate the end_date based on the selected plan
    if (amount === '1251') {
      // For plan 1251, set the end date to 30 days from the transaction date
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 30);
    } else if (amount === '3200') {
      // For plan 3200, set the end date to 90 days from the transaction date
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 90);
    } else if (amount === 'premium') {
      // For 'premium' plan, set the end date to 60 days from the transaction date
      finalEndDate = new Date(startDate);
      finalEndDate.setDate(startDate.getDate() + 60);
    } else {
      // Handle invalid plan case
      return res.status(400).json({ success: false, message: 'Invalid plan provided.' });
    }

    // Ensure finalEndDate is valid
    if (isNaN(finalEndDate)) {
      return res.status(400).json({ success: false, message: 'Error calculating end date.' });
    }

    // Create a new transaction record in the database
    const transaction = await Transaction.create({
      email: user_email,
      name: user_name,
      plan: plan,
      amount: amount,
      status: status,
      transaction_date: startDate, // Save the transaction date
      end_date: finalEndDate // Save the calculated end date
    });

    // Check if there is an accepted transaction and update the end date accordingly
    const acceptedTransaction = await AcceptedTransaction.findOne({
      where: { email: user_email }
    });

    if (acceptedTransaction && acceptedTransaction.end_date) {
      // Update the end_date of the current transaction if there's an accepted transaction
      await Transaction.update(
        { end_date: acceptedTransaction.end_date },
        { where: { email: user_email } }
      );
    }

    // Return success response
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