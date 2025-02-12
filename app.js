const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const userController = require('./controllers/userController'); // Import the user controller

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logs incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files (CSS, JS, images)

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Directory for EJS views

// Define routes
app.get('/login', (req, res) => {
    res.render('login'); // Render login page
});

app.get('/signup', (req, res) => {
    res.render('signup'); // Render signup page
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
        res.render('index', { images });  // Render homepage with images
    } catch (error) {
        console.error('Error rendering index:', error);
        res.status(500).render('error', { message: 'Internal Server Error' });
    }
});

// Route for transaction page (dynamic pricing based on plan)
app.get('/transaction', (req, res) => {
    const plan = req.query.plan || 'standard';  // Default to 'standard' if no plan is passed
    let amount = 0;

    if (plan === "standard") {
        amount = 1251;
    } else if (plan === "premium") {
        amount = 3200;
    }

    res.render('transaction', { plan, amount }); // Render the transaction page with plan details
});

// Handle POST requests for signup and login via userController
// Ensure these functions exist in your userController file
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

app.get('/logout', (req, res, next) => {
    if (userController.logout) {
        userController.logout(req, res, next); // Call logout function
    } else {
        next(new Error('Logout handler is missing in the userController.'));
    }
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
