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
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        // Redirect to login page after successful registration
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during signup' });
    }
};

// Login logic
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

        // Redirect to homepage or user dashboard after successful login
        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { message: 'Server error during login' });
    }
};

module.exports = { signup, login };
