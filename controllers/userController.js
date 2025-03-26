const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Assuming the User model is in the 'models' folder
const { body, validationResult } = require('express-validator'); // To validate inputs

// Secret key for signing the JWT (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'yourSecretKey'; // Store securely in production

// Signup validation middleware
const validateSignup = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/\d/)
        .withMessage('Password must contain a number')
        .matches(/[A-Za-z]/)
        .withMessage('Password must contain at least one letter')
];

// Signup logic
const signup = async (req, res) => {
    try {
        console.log('Signup route hit'); // Debug statement
        console.log('Request Body:', req.body); // Log incoming data

        // Run validation checks
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).render('signup', { errors: errors.array() });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            console.log('Missing required fields');
            return res.status(400).render('signup', { error: 'All fields are required' });
        }

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`Email already registered: ${email}`);
            return res.status(400).render('signup', { error: 'Email is already registered' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('Password hashed successfully');

        // Create new user instance
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        // Save user to the database
        const savedUser = await user.save();
        console.log('User saved successfully:', savedUser);

        // Create a JWT token for the user
        const token = jwt.sign({ userId: savedUser._id }, JWT_SECRET, { expiresIn: '1h' });
        console.log('JWT token created:', token);

        // Store token in cookies
        res.cookie('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

        console.log('Signup successful, redirecting to login');
        res.redirect('/login');
    } catch (error) {
        console.error('Error during signup:', error);
        return res.status(500).render('signup', { error: 'Server Error. Please try again later.' });
    }
};

// Login logic with JWT token
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).render('login', { error: 'User not found' });
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).render('login', { error: 'Incorrect password' });
        }

        // Store user data in session
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name,
        };

        // Redirect to dashboard or home page
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during login' });
    }
};

// Forgot Password logic
const forgotPassword = async (req, res) => {
    const { email, pass } = req.body;

    try {
        // Step 1: Check if the email exists in the database
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).render('forgot-password', { error: 'Email not found' });
        }

        // Step 2: Hash the new password
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Step 3: Update the password in the database
        user.password = hashedPassword;
        await user.save();

        // Step 4: Redirect the user to the login page with a success message
        res.redirect('/login'); // Password updated, redirect to login page

    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during password reset' });
    }
};

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Expecting token in 'Authorization: Bearer <token>'

    if (!token) {
        return res.status(403).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = decoded; // Add decoded user information to the request object
        next(); // Proceed to the next middleware/route handler
    });
};

// User Dashboard logic (This assumes user is logged in and token is verified)
const getDashboard = async (req, res) => {
    const userId = req.user ? req.user.id : null; // The user info is now in req.user after verifying the token

    if (!userId) {
        return res.status(401).render('login', { error: 'Please login to access your dashboard' });
    }

    try {
        // Fetch user info from the database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        // Render the dashboard with user data
        res.render('dashboard', {
            name: user.name,
            email: user.email
        });
    } catch (err) {
        console.error('Error fetching user data:', err);
        return res.status(500).render('error', { message: 'Database error' });
    }
};

// Logout logic (Optional since JWT is stateless, but you might want to handle token invalidation)
const logout = (req, res) => {
    // Since JWT is stateless, no session to destroy, just inform the client to remove the token
    res.json({ message: 'Logged out successfully' });
};

// Save Transaction logic (assuming you're storing transaction information)
const saveTransaction = async (req, res) => {
    try {
        const { email, name, plan, amount, status, user_id } = req.body; // Extract required fields

        // Ensure all required fields are provided
        if (!email || !name || !plan || !amount || !status || !user_id) {
            return res.status(400).send('Missing required fields');
        }

        // Insert the transaction into the database
        const transaction = new Transaction({
            email,
            name,
            plan,
            amount,
            status,
            user_id,  // Pass user_id here
        });
        await transaction.save();

        // Return success response
        res.status(201).json({
            message: 'Transaction saved successfully!',
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).send('Server error');
    }
};

// Export the functions properly
module.exports = { signup, login, forgotPassword, getDashboard, logout, saveTransaction, verifyToken };




