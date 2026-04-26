require('dotenv').config();
const express        = require('express');
const mongoose       = require('mongoose');
const session        = require('express-session');
const MongoStore     = require('connect-mongo');
const flash          = require('connect-flash');
const passport       = require('passport');
const morgan         = require('morgan');
const helmet         = require('helmet');
const methodOverride = require('method-override');
const ejsLayouts     = require('express-ejs-layouts');
const path           = require('path');

const app = express();

// ── Passport config ──────────────────────────────────────────────────────────
require('./config/passport')(passport);

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'partials/layout');

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Security & parsing ────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// ── Sessions ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,   // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
}));

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Flash messages ────────────────────────────────────────────────────────────
app.use(flash());

// ── Global template locals ────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.locals.user          = req.user || null;
  res.locals.success_msg   = req.flash('success_msg');
  res.locals.error_msg     = req.flash('error_msg');
  res.locals.error         = req.flash('error');
  res.locals.currentPath   = req.path;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/',           require('./routes/indexRoutes'));
app.use('/auth',       require('./routes/authRoutes'));
app.use('/posts',      require('./routes/postRoutes'));
app.use('/comments',   require('./routes/commentRoutes'));
app.use('/bookmarks',  require('./routes/bookmarkRoutes'));
app.use('/dashboard',  require('./routes/dashboardRoutes'));
app.use('/topics',     require('./routes/topicRoutes'));
app.use('/micro',      require('./routes/microRoutes'));
app.use('/api',        require('./routes/apiRoutes'));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('pages/404', { title: 'Page Not Found', layout: 'partials/layout' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
    layout: 'partials/layout',
  });
});

// ── Database + start ──────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀  KnowVerse running → http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌  MongoDB error:', err.message); process.exit(1); });
