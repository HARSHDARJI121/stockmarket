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

        // Find the user by email to store their data in the session
        const [newUserRows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);

        // Save user info in session
        req.session.user = {
            id: newUserRows[0].id,
            email: newUserRows[0].email,
            name: newUserRows[0].name,
        };

        // Redirect to homepage or login page after successful signup
        res.redirect('/login');
    } catch (err) {
        console.error('Error during signup:', err);
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
}


// const admin =  async (req, res) => {
//     try {
//         // Query the users table
//         const [rows] = await db.query('SELECT * FROM users');
        
//         // Log the rows to see if we are getting data from the DB
//         console.log(rows);

//         // If data exists, render the admin page with the users data
//         if (rows && rows.length > 0) {
//             res.render('admin', { users: rows });
//         } else {
//             res.send('No users found');
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// };


//are tera table kha hai ye bata mysql ka 

module.exports = { signup, login , forgotPassword };
