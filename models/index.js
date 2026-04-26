const mongoose = require('mongoose');

// ── Post ──────────────────────────────────────────────────────────────────────
const quizQuestionSchema = new mongoose.Schema({
  question:     { type: String, required: true },
  options:      [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation:  { type: String, default: '' },
}, { _id: true });

const postSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true, maxlength: 150 },
  body:         { type: String, required: true },
  eli5Body:     { type: String, default: '' },
  codeSnippet:  { type: String, default: '' },
  codeLanguage: { type: String, default: 'javascript' },
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tags:         [{ type: String, lowercase: true, trim: true }],
  difficulty:   { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
  readTime:     { type: Number, default: 5 },
  likes:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  saves:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views:        { type: Number, default: 0 },
  quiz:         [quizQuestionSchema],
  published:    { type: Boolean, default: true },
  featured:     { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

postSchema.virtual('likeCount').get(function () { return this.likes.length; });
postSchema.virtual('saveCount').get(function () { return this.saves.length; });
postSchema.index({ title: 'text', body: 'text', tags: 'text' });
postSchema.index({ tags: 1, difficulty: 1, createdAt: -1 });

// ── Comment ───────────────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema({
  post:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body:       { type: String, required: true, maxlength: 2000 },
  parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  depth:      { type: Number, default: 0, max: 5 },
  upvotes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  bestAnswer: { type: Boolean, default: false },
  edited:     { type: Boolean, default: false },
  deleted:    { type: Boolean, default: false },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

commentSchema.virtual('upvoteCount').get(function () { return this.upvotes.length; });
commentSchema.index({ post: 1, parentId: 1, createdAt: 1 });

// ── Bookmark ──────────────────────────────────────────────────────────────────
const bookmarkSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post:   { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  folder: { type: String, default: 'General' },
  notes:  { type: String, default: '', maxlength: 500 },
}, { timestamps: true });
bookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

// ── Quiz Submission ───────────────────────────────────────────────────────────
const quizSubmissionSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post:       { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  answers:    [{ type: Number }],
  score:      { type: Number },
  passed:     { type: Boolean },
  xpEarned:   { type: Number, default: 0 },
  attemptNum: { type: Number, default: 1 },
}, { timestamps: true });
quizSubmissionSchema.index({ user: 1, post: 1 });

// ── Progress ──────────────────────────────────────────────────────────────────
const progressSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tag:          { type: String, required: true, lowercase: true },
  postsRead:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  quizzesDone:  { type: Number, default: 0 },
  avgScore:     { type: Number, default: 0 },
  percentage:   { type: Number, default: 0 },
  lastActivity: { type: Date,   default: Date.now },
}, { timestamps: true });
progressSchema.index({ user: 1, tag: 1 }, { unique: true });

module.exports = {
  Post:             mongoose.model('Post',             postSchema),
  Comment:          mongoose.model('Comment',          commentSchema),
  Bookmark:         mongoose.model('Bookmark',         bookmarkSchema),
  QuizSubmission:   mongoose.model('QuizSubmission',   quizSubmissionSchema),
  Progress:         mongoose.model('Progress',         progressSchema),
};
