const router = require('express').Router();
const mc     = require('../controllers/mainController');
const pc     = require('../controllers/postController');
const { ensureAuth } = require('../middleware/auth');

// Quiz submit (JSON API used by inline quiz JS)
router.post('/quiz',                    ensureAuth, mc.submitQuiz);

// Like / save (JSON API used by card JS)
router.post('/posts/:id/like',          ensureAuth, pc.toggleLike);
router.post('/posts/:id/save',          ensureAuth, pc.toggleSave);

// Comments (JSON)
router.post('/comments',                ensureAuth, mc.createComment);
router.post('/comments/:id/upvote',     ensureAuth, mc.upvoteComment);
router.post('/comments/:id/best',       ensureAuth, mc.markBest);
router.delete('/comments/:id',          ensureAuth, mc.deleteComment);

// Bookmarks (JSON)
router.post('/bookmarks',               ensureAuth, mc.addBookmark);
router.delete('/bookmarks/:postId',     ensureAuth, mc.removeBookmark);

module.exports = router;
