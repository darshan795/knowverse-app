const { Post, Comment, Bookmark } = require('../models/index');
const { validatePost }            = require('../validators');

// GET /feed
exports.getFeed = async (req, res) => {
  try {
    const { tags, difficulty, search, page = 1 } = req.query;
    const limit  = 9;
    const skip   = (page - 1) * limit;
    const filter = { published: true };

    if (tags)       filter.tags       = { $in: tags.split(',').map(t => t.trim().toLowerCase()) };
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (search)     filter.$text      = { $search: search };

    const [posts, total] = await Promise.all([
      Post.find(filter).populate('author', 'username xp level').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(filter),
    ]);

    // Attach user interaction flags
    const userId = req.user?._id?.toString();
    const enriched = posts.map(p => ({
      ...p,
      likeCount: p.likes.length,
      saveCount: p.saves.length,
      isLiked:   userId ? p.likes.map(String).includes(userId) : false,
      isSaved:   userId ? p.saves.map(String).includes(userId) : false,
    }));

    res.render('pages/feed', {
      title:      'Home Feed — KnowVerse',
      posts:      enriched,
      pagination: { page: +page, pages: Math.ceil(total / limit), total, hasMore: skip + posts.length < total },
      filters:    { tags, difficulty, search },
      layout:     'partials/layout',
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to load feed.');
    res.redirect('/');
  }
};

// GET /posts/:id
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'username xp level bio').lean();

    if (!post) { req.flash('error_msg', 'Post not found.'); return res.redirect('/feed'); }

    // Fetch threaded comments
    const allComments = await Comment.find({ post: post._id, deleted: false })
      .populate('author', 'username xp level').sort({ createdAt: 1 }).lean();

    // Build comment tree
    const map   = {};
    const roots = [];
    allComments.forEach(c => { c.replies = []; map[c._id] = c; });
    allComments.forEach(c => {
      if (c.parentId && map[c.parentId]) map[c.parentId].replies.push(c);
      else roots.push(c);
    });

    // Bookmarks for this user
    let userBookmark = null;
    if (req.user) {
      userBookmark = await Bookmark.findOne({ user: req.user._id, post: post._id }).lean();
    }

    const userId = req.user?._id?.toString();

    res.render('pages/post', {
      title:       `${post.title} — KnowVerse`,
      post:        {
        ...post,
        likeCount: post.likes.length,
        isLiked:   userId ? post.likes.map(String).includes(userId) : false,
        isSaved:   userId ? post.saves.map(String).includes(userId) : false,
      },
      comments:    roots,
      userBookmark,
      folders:     req.user?.bookmarkFolders || [],
      layout:      'partials/layout',
    });
  } catch (err) {
    console.error(err);
    res.redirect('/feed');
  }
};

// GET /posts/create
exports.getCreate = (req, res) => {
  res.render('pages/create-post', { title: 'Write a Post — KnowVerse', layout: 'partials/layout' });
};

// POST /posts
exports.createPost = async (req, res) => {
  const { valid, messages, value } = validatePost(req.body);
  if (!valid) {
    req.flash('error_msg', messages[0]);
    return res.redirect('/posts/create');
  }

  try {
    // Parse tags
    let tags = value.tags || [];
    if (typeof tags === 'string') tags = tags.split(',').map(t => t.trim()).filter(Boolean);

    // Parse quiz questions from repeating form fields
    const questions  = [].concat(req.body['quiz_question[]']  || []);
    const allOptions = [].concat(req.body['quiz_options[][]'] || []);
    const corrects   = [].concat(req.body['quiz_correct[]']   || []);
    const explains   = [].concat(req.body['quiz_explanation[]'] || []);

    const quiz = questions
      .map((q, i) => ({
        question:     q,
        options:      allOptions.slice(i * 4, i * 4 + 4),
        correctIndex: parseInt(corrects[i]) || 0,
        explanation:  explains[i] || '',
      }))
      .filter(q => q.question.trim() && q.options.length >= 2);

    const post = await Post.create({
      title:        value.title,
      body:         value.body,
      eli5Body:     value.eli5Body || '',
      codeSnippet:  value.codeSnippet || '',
      codeLanguage: value.codeLanguage || 'javascript',
      tags,
      difficulty:   value.difficulty || 'beginner',
      readTime:     value.readTime   || 5,
      quiz,
      author: req.user._id,
    });

    await req.user.addXP(20);
    req.flash('success_msg', 'Post published! +20 XP 🎉');
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Failed to publish post.');
    res.redirect('/posts/create');
  }
};

// POST /posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post   = await Post.findById(req.params.id);
    if (!post) return res.json({ ok: false });
    const uid    = req.user._id;
    const liked  = post.likes.includes(uid);
    if (liked) post.likes.pull(uid);
    else       { post.likes.push(uid); await req.user.addXP(2); }
    await post.save();
    res.json({ ok: true, liked: !liked, likeCount: post.likes.length });
  } catch (err) {
    res.json({ ok: false });
  }
};

// POST /posts/:id/save
exports.toggleSave = async (req, res) => {
  try {
    const post  = await Post.findById(req.params.id);
    if (!post) return res.json({ ok: false });
    const uid   = req.user._id;
    const saved = post.saves.includes(uid);
    if (saved) post.saves.pull(uid);
    else       post.saves.push(uid);
    await post.save();
    res.json({ ok: true, saved: !saved, saveCount: post.saves.length });
  } catch (err) {
    res.json({ ok: false });
  }
};

// DELETE /posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) { req.flash('error_msg', 'Post not found.'); return res.redirect('/feed'); }
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error_msg', 'Not your post.'); return res.redirect('back');
    }
    await post.deleteOne();
    req.flash('success_msg', 'Post deleted.');
    res.redirect('/feed');
  } catch (err) {
    req.flash('error_msg', 'Failed to delete.');
    res.redirect('back');
  }
};
