// ── indexRoutes.js ────────────────────────────────────────────────────────────
const router = require('express').Router();
module.exports = router;

router.get('/', (req, res) => {
  // if (req.isAuthenticated()) return res.redirect('/feed');
  res.render('pages/landing', { title: 'KnowVerse — Smart Interactive Learning', layout: 'partials/layout' });
});

router.get('/feed', require('../controllers/postController').getFeed);
