const passport                = require('passport');
const User                    = require('../models/User');
const { validateRegister }    = require('../validators');

// GET /auth/login
exports.getLogin = (req, res) => {
  res.render('pages/login', { title: 'Sign In — KnowVerse', layout: 'partials/layout' });
};

// POST /auth/login
exports.postLogin = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/feed',
    failureRedirect: '/auth/login',
    failureFlash:    true,
  })(req, res, next);
};

// GET /auth/register
exports.getRegister = (req, res) => {
  res.render('pages/register', { title: 'Join KnowVerse — Free', layout: 'partials/layout' });
};

// POST /auth/register
exports.postRegister = async (req, res) => {
  const { valid, messages, value } = validateRegister(req.body);

  if (!valid) {
    req.flash('error_msg', messages[0]);
    return res.redirect('/auth/register');
  }

  try {
    const exists = await User.findOne({
      $or: [{ email: value.email }, { username: value.username }],
    });
    if (exists) {
      req.flash('error_msg', 'Email or username is already taken.');
      return res.redirect('/auth/register');
    }

    await User.create({
      username: value.username,
      email:    value.email,
      password: value.password,
    });

    req.flash('success_msg', 'Account created! Please sign in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Something went wrong. Please try again.');
    res.redirect('/auth/register');
  }
};

// GET /auth/logout
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash('success_msg', 'You have been signed out.');
    res.redirect('/');
  });
};
