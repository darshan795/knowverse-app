const router = require('express').Router();
const ctrl   = require('../controllers/postController');
const { ensureAuth } = require('../middleware/auth');

router.get('/create',       ensureAuth, ctrl.getCreate);
router.post('/',            ensureAuth, ctrl.createPost);
router.get('/:id',          ctrl.getPost);
router.post('/:id/like',    ensureAuth, ctrl.toggleLike);
router.post('/:id/save',    ensureAuth, ctrl.toggleSave);
router.delete('/:id',       ensureAuth, ctrl.deletePost);

module.exports = router;
