const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // Assuming db is configured to use MySQL (or any other DB you are using)

// Secret key for signing the JWT
const JWT_SECRET = 'yourSecretKey'; // Store this securely (e.g., in an environment variable)

// Signup logic (only requires name, email, password)
const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body; // Extract fields from the request

        // Validate required fields (name, email, password)
        if (!name || !email || !password) {
            return res.status(400).render('signup', { error: 'Name, email, and password are required' });
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user record into the database (without 'plan' field)
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, hashedPassword]
        );

        // Redirect to login page after successful signup
        res.redirect('/login');
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).render('signup', { error: 'Server Error' });
    }
};

// Login logic with JWT token
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).render('login', { error: 'User not found' });
        }

        // Compare the entered password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, rows[0].password);

        if (!isMatch) {
            return res.status(400).render('login', { error: 'Incorrect password' });
        }

        // Store user data in session
        req.session.user = {
            id: rows[0].id,
            email: rows[0].email,
            name: rows[0].name,
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
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(400).render('forgot-password', { error: 'Email not found' });
        }

        // Step 2: Hash the new password
        const hashedPassword = await bcrypt.hash(pass, 10);

        // Step 3: Update the password in the database
        await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

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
        const [rows] = await db.execute('SELECT * FROM users WHERE id = ?', [userId]);

        if (rows.length === 0) {
            return res.status(404).render('error', { message: 'User not found' });
        }

        const user = rows[0];

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
        const transaction = await Transaction.create({
            email,
            name,
            plan,
            amount,
            status,
            user_id,  // Pass user_id here
        });

        // Return success response
        res.status(201).json({
            message: 'Transaction saved successfully!',
            transactionId: transaction.id
        });
    } catch (error) {
        console.error('Error saving transaction:', error);
        res.status(500).send('Server error');
    }
};

// Export the functions properly
module.exports = { signup, login, forgotPassword, getDashboard, logout, saveTransaction, verifyToken };
