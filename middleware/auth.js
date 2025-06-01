/**
 * Authentication middleware for protecting routes
 */

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.isAdmin) {
    return next();
  }
  
  // Store the original URL they were trying to access
  req.session.returnTo = req.originalUrl;
  
  // Redirect to login page
  res.redirect('/admin/login');
};

// Middleware to check if user is already logged in
const isNotAuthenticated = (req, res, next) => {
  if (req.session.user && req.session.isAdmin) {
    return res.redirect('/admin/dashboard');
  }
  next();
};

module.exports = {
  isAuthenticated,
  isNotAuthenticated
};
