const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const { Sequelize, DataTypes } = require('sequelize'); // Sequelize for DB handling
const userController = require('./controllers/userController'); // Import the user controller
const isAuthenticated = require('./controllers/auth'); // Authentication check
const cron = require('node-cron');
const AcceptedTransaction = require('./models/AcceptedTransaction');


const app = express();
const PORT = process.env.PORT || 3000;

// Configure Sequelize for MySQL connection
const sequelize = new Sequelize('stocktrade', 'root', 'Harsh@5489', {
  host: 'localhost',
  dialect: 'mysql',
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

// Define the Transaction model
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plan: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
  },
  transaction_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'Transactions',
});


// Define the Transaction model





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
<<<<<<< HEAD
app.post('/admin/accept-transaction/:userId', async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
      return res.status(400).json({ message: 'Invalid User ID' });
  }

  try {
      // Assuming you're updating a transaction by userId
      const transaction = await Transaction.findOne({ where: { id: userId } });

      if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' });
      }

      // Handle the update or action for the accepted transaction
      transaction.status = 'accepted';
      await transaction.save();

      return res.json({ message: 'Transaction accepted successfully' });
  } catch (error) {
      console.error('Error accepting transaction:', error);
      return res.status(500).json({ message: 'Error accepting transaction' });
  }
});



// Reject the transaction (delete the record)
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
=======
>>>>>>> backend


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

app.post('/admin/accept-transaction/:id', async (req, res) => {
  try {
      const transactionId = req.params.id;  // Get the transaction ID from the URL

      // Find the transaction in the Transactions table using the provided transactionId
      const transaction = await Transaction.findByPk(transactionId);

      // If no transaction is found, send a 404 response
      if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' });
      }

      // Update the status of the transaction to 'accepted'
      transaction.status = 'accepted';
      await transaction.save();  // Save the updated status in the Transactions table

      // Create a new record in the AcceptedTransactions table with the transaction details
      await AcceptedTransaction.create({
          email: transaction.email,
          name: transaction.name,
          plan: transaction.plan,
          amount: transaction.amount,
          status: 'accepted',  // We use 'accepted' because it's the final status
          transaction_date: new Date(),  // Current timestamp for the accepted transaction
      });

      // Send a success response back to the client
      res.json({ message: 'Transaction accepted and saved to AcceptedTransactions' });
  } catch (error) {
      // Log any errors and return a 500 status code with an error message
      console.error('Error accepting transaction:', error);
      res.status(500).json({ message: 'Error accepting transaction' });
  }
});


// Reject transaction route
app.post('/admin/reject-transaction/:id', async (req, res) => {
  try {
      const transactionId = req.params.id;

      // Find the transaction that needs to be rejected
      const transaction = await Transaction.findByPk(transactionId);

      if (!transaction) {
          return res.status(404).json({ message: 'Transaction not found' });
      }

      // Delete the rejected transaction from Transactions table
      await transaction.destroy();

      res.json({ message: 'Transaction rejected and deleted from Transactions' });
  } catch (error) {
      console.error('Error rejecting transaction:', error);
      res.status(500).json({ message: 'Error rejecting transaction' });
  }
});


// Route to save transaction in the database
app.post('/save-transaction', async (req, res) => {
  try {
      const { user_email, user_name, plan, amount, status, userId, transaction_date } = req.body;

      // Check if all necessary data is provided
      if (!user_email || !user_name || !plan || !amount || !status || !userId || !transaction_date) {
          return res.status(400).json({ success: false, message: 'Missing required fields.' });
      }

      // Create a new transaction record in the database
      const transaction = await Transaction.create({
          email: user_email,
          name: user_name,
          plan: plan,
          amount: amount,
          status: status,
          transaction_date: transaction_date, // Save the transaction date
      });

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