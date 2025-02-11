const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const userController = require('./controllers/userController');
const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes for user authentication
app.post('/signup', userController.signup);  // For Signup
app.post('/login', userController.login);    // For Login

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Route for rendering the index page with images
app.get('/', (req, res) => {
    const images = [
        { url: '/images/image1.jpg', alt: 'Image 1' },
        { url: '/images/image2.jpg', alt: 'Image 2' },
        { url: '/images/image3.jpg', alt: 'Image 3' },
        { url: '/images/image4.jpg', alt: 'Image 4' },
        { url: '/images/image5.jpg', alt: 'Image 5' },
    ];
    res.render('index', { images });
});

// Routes for rendering other pages
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
