// const User = require('../models/User');

// // Protect routes - check if user is authenticated
// const protect = (req, res, next) => {
//   if (req.session.user) {
//     next();
//   } else {
//     res.status(401).json({ message: 'Not authenticated' });
//   }
// };

// // Grant access to specific roles
// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Role ${req.user.role} is not authorized to access this route`
//       });
//     }
//     next();
//   };
// };

// // Check subscription status
// const checkSubscription = async (req, res, next) => {
//   try {
//     if (!req.user.hasActiveSubscription()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Please subscribe to access this feature'
//       });
//     }
//     next();
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: 'Error checking subscription status',
//       error: error.message
//     });
//   }
// };

// // Middleware to check if user is authenticated
// const isAuthenticated = async (req, res, next) => {
//     try {
//         // Check if user session exists
//         if (!req.session.user) {
//             return res.redirect('/auth/login');
//         }

//         // Verify user still exists in database
//         const user = await User.findById(req.session.user._id);
//         if (!user) {
//             req.session.destroy();
//             return res.redirect('/auth/login');
//         }

//         next();
//     } catch (error) {
//         console.error('Authentication error:', error);
//         res.redirect('/auth/login');
//     }
// };

// // Middleware to check if user is admin
// const isAdmin = async (req, res, next) => {
//     try {
//         if (!req.session.user || req.session.user.role !== 'admin') {
//             return res.redirect('/dashboard');
//         }
//         next();
//     } catch (error) {
//         console.error('Admin check error:', error);
//         res.redirect('/dashboard');
//     }
// };

// // Export all middleware functions
// module.exports = {
//   protect,
//   authorize,
//   checkSubscription,
//   isAuthenticated,
//   isAdmin
// }; 