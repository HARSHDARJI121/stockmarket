const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const morgan = require('morgan'); // Logger for better debugging
const userController = require('./controllers/userController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(morgan('dev')); // Logs incoming requests
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes for user authentication
app.post('/signup', userController.signup);
app.post('/login', userController.login);

// Route for rendering the index page with images
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

// Route for transaction page
app.get('/transaction', (req, res) => {
    const plan = req.query.plan;
    let amount = 0;

    if (plan === "standard") {
        amount = 1251;
    } else if (plan === "premium") {
        amount = 3200;
    }

    res.render("transaction", { plan, amount });
});

// Routes for rendering login and signup pages
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

// 404 Error Handling (Render an EJS page instead of plain text)
app.use((req, res) => {
    res.status(404).render('404', { message: 'Page Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unexpected Error:', err);
    res.status(500).render('error', { message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
