const { Comment, Post, Bookmark, QuizSubmission, Progress } = require('../models/index');
const { validateComment } = require('../validators');

// ── COMMENT CONTROLLER ────────────────────────────────────────────────────────

exports.createComment = async (req, res) => {
  const { valid, messages } = validateComment(req.body);
  if (!valid) return res.json({ ok: false, message: messages[0] });

  try {
    const { postId, body, parentId } = req.body;
    let depth = 0;

    if (parentId) {
      const parent = await Comment.findById(parentId);
      if (!parent) return res.json({ ok: false, message: 'Parent not found.' });
      depth = (parent.depth || 0) + 1;
      if (depth > 5) return res.json({ ok: false, message: 'Max reply depth reached.' });
    }

    const comment = await Comment.create({
      post:     postId,
      author:   req.user._id,
      body,
      parentId: parentId || null,
      depth,
    });
    await comment.populate('author', 'username xp level');
    await req.user.addXP(5);

    res.json({ ok: true, comment });
  } catch (err) {
    res.json({ ok: false, message: 'Server error.' });
  }
};

exports.upvoteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ ok: false });
    const uid     = req.user._id;
    const upvoted = comment.upvotes.includes(uid);
    if (upvoted) comment.upvotes.pull(uid);
    else         comment.upvotes.push(uid);
    await comment.save();
    res.json({ ok: true, upvoted: !upvoted, count: comment.upvotes.length });
  } catch (err) { res.json({ ok: false }); }
};

exports.markBest = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate('post');
    if (!comment) return res.json({ ok: false });
    if (comment.post.author.toString() !== req.user._id.toString())
      return res.json({ ok: false, message: 'Only post author can mark best answer.' });

    await Comment.updateMany({ post: comment.post._id }, { bestAnswer: false });
    comment.bestAnswer = true;
    await comment.save();
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.json({ ok: false });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.json({ ok: false });
    comment.deleted = true;
    comment.body    = '[deleted]';
    await comment.save();
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
};

// ── BOOKMARK CONTROLLER ───────────────────────────────────────────────────────

exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('post', 'title tags difficulty author readTime createdAt')
      .sort({ createdAt: -1 });

    const grouped = {};
    bookmarks.forEach(b => {
      if (!grouped[b.folder]) grouped[b.folder] = [];
      grouped[b.folder].push(b);
    });

    res.render('pages/bookmarks', {
      title:     'Bookmarks — KnowVerse',
      bookmarks,
      grouped,
      folders:   req.user.bookmarkFolders,
      layout:    'partials/layout',
    });
  } catch (err) {
    req.flash('error_msg', 'Failed to load bookmarks.');
    res.redirect('/feed');
  }
};

exports.addBookmark = async (req, res) => {
  try {
    const { postId, folder = 'General', notes = '' } = req.body;
    await Bookmark.findOneAndUpdate(
      { user: req.user._id, post: postId },
      { folder, notes },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
};

exports.removeBookmark = async (req, res) => {
  try {
    await Bookmark.findOneAndDelete({ user: req.user._id, post: req.params.postId });
    res.json({ ok: true });
  } catch (err) { res.json({ ok: false }); }
};

// ── QUIZ CONTROLLER ───────────────────────────────────────────────────────────

exports.submitQuiz = async (req, res) => {
  try {
    const { postId, answers } = req.body;   // answers: array of numbers
    const post = await Post.findById(postId);
    if (!post || !post.quiz?.length) return res.json({ ok: false, message: 'No quiz found.' });

    const parsedAnswers = (Array.isArray(answers) ? answers : [answers]).map(Number);
    let correct = 0;
    const results = post.quiz.map((q, i) => {
      const isCorrect = parsedAnswers[i] === q.correctIndex;
      if (isCorrect) correct++;
      return { isCorrect, correctIndex: q.correctIndex, explanation: q.explanation };
    });

    const score    = Math.round((correct / post.quiz.length) * 100);
    const passed   = score >= 60;
    const xpEarned = passed ? Math.max(10, Math.round(score / 10) * 5) : 5;

    const attemptNum = await QuizSubmission.countDocuments({ user: req.user._id, post: postId }) + 1;
    await QuizSubmission.create({ user: req.user._id, post: postId, answers: parsedAnswers, score, passed, xpEarned, attemptNum });
    await req.user.addXP(xpEarned);

    // Update progress per tag
    for (const tag of post.tags) {
      const prog = await Progress.findOneAndUpdate(
        { user: req.user._id, tag },
        { $addToSet: { postsRead: postId }, $inc: { quizzesDone: 1 }, lastActivity: Date.now() },
        { upsert: true, new: true }
      );
      prog.percentage = Math.min(100, prog.postsRead.length * 10);
      await prog.save();
    }

    res.json({ ok: true, score, passed, xpEarned, correct, total: post.quiz.length, results });
  } catch (err) {
    console.error(err);
    res.json({ ok: false, message: 'Server error.' });
  }
};

// ── DASHBOARD CONTROLLER ──────────────────────────────────────────────────────

exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    const [userPosts, quizHistory, progress] = await Promise.all([
      Post.find({ author: userId, published: true }).sort({ createdAt: -1 }).limit(8).lean(),
      QuizSubmission.find({ user: userId }).populate('post', 'title tags').sort({ createdAt: -1 }).limit(20).lean(),
      Progress.find({ user: userId }).lean(),
    ]);

    const avgScore   = quizHistory.length
      ? Math.round(quizHistory.reduce((a, q) => a + q.score, 0) / quizHistory.length) : 0;
    const totalLikes = userPosts.reduce((a, p) => a + (p.likes?.length || 0), 0);
    const totalViews = userPosts.reduce((a, p) => a + (p.views || 0), 0);

    // Weekly activity (last 7 days)
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d    = new Date(); d.setDate(d.getDate() - i);
      const key  = d.toISOString().slice(0, 10);
      const day  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
      const subs = quizHistory.filter(q => q.createdAt?.toISOString?.()?.slice(0, 10) === key);
      weekly.push({ day, count: subs.length, avg: subs.length ? Math.round(subs.reduce((a,s) => a+s.score,0)/subs.length) : 0 });
    }

    res.render('pages/dashboard', {
      title:      'Dashboard — KnowVerse',
      posts:      userPosts,
      quizHistory,
      progress,
      avgScore,
      totalLikes,
      totalViews,
      weekly:     JSON.stringify(weekly),
      layout:     'partials/layout',
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load dashboard.');
    res.redirect('/feed');
  }
};
