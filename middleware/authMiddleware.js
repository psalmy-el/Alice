// middleware/authMiddleware.js
exports.isAuthenticated = (req, res, next) => {

    if (req.session.adminId) {
      return next();
    }
    
    req.flash('error', 'Please login to access this page');
    res.redirect('/login');
  };
  
  exports.isGuest = (req, res, next) => {
    if (!req.session.adminId) {
      return next();
    }
    
    res.redirect('/dashboard');
  };