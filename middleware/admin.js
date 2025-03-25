const User = require('../models/User');

// Admin middleware to protect admin routes
const isAdmin = async (req, res, next) => {
    try {
        if (!req.session || !req.session.user) {
            console.log('No session or user found');
            return res.redirect('/login');
        }

        // Fetch fresh user data from database
        const user = await User.findById(req.session.user.id);
        if (!user) {
            console.log('User not found in database');
            return res.redirect('/login');
        }

        if (user.role !== 'admin') {
            console.log('User is not admin:', user.email);
            return res.redirect('/login');
        }

        // Add user to request for later use
        req.user = user;
        next();
    } catch (error) {
        console.error('Error in admin middleware:', error);
        res.redirect('/login');
    }
};

module.exports = isAdmin; 