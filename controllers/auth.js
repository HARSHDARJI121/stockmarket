module.exports = function isAuthenticated(req, res, next) {
    if (req.session.user) {
      return next(); // Proceed if authenticated
    } else {
      res.redirect('/login'); // Redirect to login if not authenticated
    }
  };
  