const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Signup logic
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the user already exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            return res.status(400).render('signup', { error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        const [result] = await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        // Now that the user is registered, we can log them in by saving their session
        // Find the user by email to store their data in the session
        const [newUserRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        // Save user info in session
        req.session.user = {
            id: newUserRows[0].id,
            email: newUserRows[0].email,
            name: newUserRows[0].name,
            // Add other user info to session as needed
        };

        // Redirect to homepage or dashboard after successful signup
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during signup' });
    }
};

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

        // Save user info in the session after successful login
        req.session.user = {
            id: rows[0].id,
            email: rows[0].email,
            // Add any other user details you want to store in session
        };

        // Redirect to homepage or user dashboard after successful login
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during login' });
    }
};


module.exports = { signup, login };
