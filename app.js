const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const userController = require('./controllers/userController'); // Import the user controller
const nodemailer = require('nodemailer'); // Email sender for password reset link
// const crypto = require('crypto'); // For generating reset tokens
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logs incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)

app.use(session({
    secret: 'pippip-1340',  // Secret key for encrypting session data
    resave: false,              // Don't resave sessions if no changes
    saveUninitialized: true,    // Save sessions even if they are not modified
    cookie: { secure: false }   // For HTTP, set secure to false; for HTTPS, set it to true
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
  app.get('/admin', async (req, res) => {
    try {
        // Using async/await for promise-based query execution
        const [results] = await db.query('SELECT * FROM users');
        
        const users = results; // List of all users
        
        // Calculate remaining days for each user
        users.forEach(user => {
            const subscriptionStartDate = new Date(user.subscription_start_date);
            const currentDate = new Date();
            const daysPassed = Math.floor((currentDate - subscriptionStartDate) / (1000 * 60 * 60 * 24)); // days passed since subscription
            const remainingDays = user.plan_duration - daysPassed; // plan duration should be stored in the user table
            
            // Add remainingDays to each user object
            user.remainingDays = remainingDays > 0 ? remainingDays : 0;
        });

        // Render the admin view with the users
        res.render('admin', { users: users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Server Error');
    }
});

// Route to render the homepage with dynamic images
app.get('/', (req, res) => {
    try {
        const images = [
            'https://static.vecteezy.com/system/resources/previews/025/481/738/large_2x/bull-with-background-of-uptrend-stock-market-concept-of-bullish-market-ai-generated-free-photo.jpeg',
            'https://eclubs.ir/wp-content/uploads/2021/03/trade2.jpg',
            'https://i.pinimg.com/originals/31/fb/7b/31fb7b6c808cb6d714a0e303c5a4119b.jpg',
            'https://cdn.futura-sciences.com/sources/images/cours%20trading.jpeg',
            'https://img.freepik.com/premium-photo/investment-trading-background-with-bar-charts_1200-1408.jpg?w=2000',
        ];
        
        res.render('index', { images });  // Pass images to the view
    } catch (error) {
        console.error('Error rendering index:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
});
app.get('/dashboard',(req,res) =>{
    res.render('Dashboard')
})

app.get('/admin',(req,res) =>{
    res.render('admin')
})

// Route for transaction page (dynamic pricing based on plan)
app.get('/transaction', (req, res) => {
    // Check if the user is logged in (session check)
    if (!req.session.userName) {
        return res.render('transaction');  // Redirect to login if the user is not logged in
    }

    // Retrieve user data from session
    const userName = req.session.userName;

    // Retrieve plan from query string (defaults to 'standard' if not provided)
    const plan = req.query.plan || 'standard';

    // Set amount based on the selected plan
    let amount = 0;
    if (plan === "standard") {
        amount = 1251;
    } else if (plan === "premium") {
        amount = 3200;
    }

    // Render the transaction page with user name, selected plan, and amount
    res.render('transaction', { userName, plan, amount });
});


// Route to render the login page
app.get('/login', (req, res) => {
    res.render('login'); // Render login page
});

// Route to render the signup page
app.get('/signup', (req, res) => {
    res.render('signup'); // Render signup page
});

// Handle POST requests for signup and login via userController
app.post('/signup', (req, res, next) => {
    if (userController.signup) {
        userController.signup(req, res, next); // Call signup function
    } else {
        next(new Error('Signup handler is missing in the userController.'));
    }
});

app.post('/login', (req, res, next) => {
    if (userController.login) {
        userController.login(req, res, next);  // Call login function
    } else {
        next(new Error('Login handler is missing in the userController.'));
    }
});


// Route to fetch all users for the admin dashboard

app.post('/forgot-password', userController.forgotPassword);

// app.get('/admin', userController.admin);

// Forgot password route: renders forgot password page
app.get('/forgot-password', (req, res) => {
    res.render('forgot-password'); // Render forgot password page
});
// Admin route to fetch all users
// Route to render the admin dashboard with all users
app.get('/admin', (req, res) => {
    // Query to fetch all users from the database
    db.query('SELECT * FROM users', (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).send('Server Error');
      }
  
      const users = results; // List of all users
  
      // Calculate remaining days for each user
      users.forEach(user => {
        const subscriptionStartDate = new Date(user.subscription_start_date);
        const currentDate = new Date();
        const daysPassed = Math.floor((currentDate - subscriptionStartDate) / (1000 * 60 * 60 * 24)); // days passed since subscription
        const remainingDays = user.plan_duration - daysPassed; // plan duration should be stored in the user table
  
        // Add remainingDays to each user object
        user.remainingDays = remainingDays > 0 ? remainingDays : 0;
      });
  
      // Make sure users is passed correctly to the template
      res.render('admin', { users: users });
    });
  });


// Logout route: logs the user out and redirects to the home page
app.get('/logout', (req, res, next) => {
    if (req.session.user) {
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.redirect('/'); // Redirect to the home page after logout
        });
    } else {
        res.redirect('/'); // If user is not logged in, just redirect to home
    }
});

// In-memory "database" for storing notifications
let notifications = [];

// Route to handle the user clicking the WhatsApp button
app.post('/notify-admin', (req, res) => {
    const { userName, plan } = req.body;
    
    if (userName && plan) {
        // Save the notification to an array (could be a database in a real application)
        notifications.push({
            userName,
            plan,
            status: 'pending',
        });
        
        // Respond with success
        return res.status(200).json({ success: true });
    }

    // Invalid request
    return res.status(400).json({ success: false, message: 'Invalid request' });
});

// Admin Page Route
app.get('/admin', (req, res) => {
    res.send(`
        <html>
            <head><title>Admin Panel</title></head>
            <body>
                <h1>Admin Notifications</h1>
                <ul>
                    ${notifications.map((notification, index) => `
                        <li>
                            ${notification.userName} (${notification.plan})
                            <button onclick="acceptRequest(${index})">Accept</button>
                            <button onclick="rejectRequest(${index})">Reject</button>
                        </li>
                    `).join('')}
                </ul>
                <script>
                    function acceptRequest(index) {
                        fetch('/accept-request', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ index, action: 'accept' })
                        }).then(response => location.reload());
                    }

                    function rejectRequest(index) {
                        fetch('/reject-request', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({ index, action: 'reject' })
                        }).then(response => location.reload());
                    }
                </script>
            </body>
        </html>
    `);
});

// Accept Request Endpoint
app.post('/accept-request', (req, res) => {
    const { index, action } = req.body;
    
    if (notifications[index]) {
        notifications[index].status = action;
        return res.status(200).json({ success: true });
    }
    
    return res.status(400).json({ success: false, message: 'Request not found' });
});

// Reject Request Endpoint
app.post('/reject-request', (req, res) => {
    const { index, action } = req.body;
    
    if (notifications[index]) {
        notifications[index].status = action;
        return res.status(200).json({ success: true });
    }

    return res.status(400).json({ success: false, message: 'Request not found' });
});


// Global Error Handler for unexpected errors
app.use((err, req, res, next) => {
    console.error('Unexpected Error:', err);
    res.status(500).render('error', { message: 'Something went wrong!' }); // Render a generic error page
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
