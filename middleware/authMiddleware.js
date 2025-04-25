// middleware/authMiddleware.js
exports.isAuthenticated = (req, res, next) => {

  console.log('Auth check - Session ID:', req.session.id);
  console.log('Auth check - Admin ID:', req.session.adminId);

    if (req.session.adminId) {
      console.log('User authenticated, proceeding to route');
      return next();
    }
    
    console.log('User not authenticated, redirecting to login');
    req.flash('error', 'Please login to access this page');
    res.redirect('/login');
  };
  
  exports.isGuest = (req, res, next) => {
    if (!req.session.adminId) {
      return next();
    }
    
    res.redirect('/dashboard');
  };