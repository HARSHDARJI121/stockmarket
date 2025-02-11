const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Signup logic
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length > 0) {
            return res.status(400).send('User already exists');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user into the database
        await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        res.status(200).send('User registered successfully!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// Login logic
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(400).send('User not found');
        }

        // Compare password with the hashed password
        const isMatch = await bcrypt.compare(password, rows[0].password);

        if (!isMatch) {
            return res.status(400).send('Incorrect password');
        }

        res.status(200).send('Login successful');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

module.exports = { signup, login };
