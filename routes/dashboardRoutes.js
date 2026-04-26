// dashboardRoutes.js
const r1 = require('express').Router();
const { ensureAuth } = require('../middleware/auth');
const mc = require('../controllers/mainController');
r1.get('/', ensureAuth, mc.getDashboard);
module.exports = r1;
