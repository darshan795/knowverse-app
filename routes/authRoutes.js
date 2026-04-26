// authRoutes.js
const r1   = require('express').Router();
const ctrl = require('../controllers/authController');
const { ensureGuest } = require('../middleware/auth');
r1.get('/login',     ensureGuest, ctrl.getLogin);
r1.post('/login',    ensureGuest, ctrl.postLogin);
r1.get('/register',  ensureGuest, ctrl.getRegister);
r1.post('/register', ensureGuest, ctrl.postRegister);
r1.get('/logout',    ctrl.logout);
module.exports = r1;
