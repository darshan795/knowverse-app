// bookmarkRoutes.js
const r1 = require('express').Router();
const mc = require('../controllers/mainController');
const { ensureAuth } = require('../middleware/auth');
r1.get('/',              ensureAuth, mc.getBookmarks);
r1.post('/',             ensureAuth, mc.addBookmark);
r1.delete('/:postId',    ensureAuth, mc.removeBookmark);
module.exports = r1;
