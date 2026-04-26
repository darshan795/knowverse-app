// commentRoutes.js
const r1   = require('express').Router();
const mc   = require('../controllers/mainController');
const { ensureAuth } = require('../middleware/auth');
r1.post('/',             ensureAuth, mc.createComment);
r1.post('/:id/upvote',   ensureAuth, mc.upvoteComment);
r1.post('/:id/best',     ensureAuth, mc.markBest);
r1.delete('/:id',        ensureAuth, mc.deleteComment);
module.exports = r1;
