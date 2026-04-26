// Protect routes — redirect to login if not authenticated
const ensureAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error_msg', 'Please sign in to access that page.');
  res.redirect('/auth/login');
};

// Guest-only routes — redirect to feed if already logged in
const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  res.redirect('/feed');
};

// Role-based access
const ensureRole = (...roles) => (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Please sign in.');
    return res.redirect('/auth/login');
  }
  if (!roles.includes(req.user.role)) {
    req.flash('error_msg', 'You do not have permission for that action.');
    return res.redirect('back');
  }
  next();
};

module.exports = { ensureAuth, ensureGuest, ensureRole };
