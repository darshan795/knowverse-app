const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const bookmarkFolderSchema = new mongoose.Schema({
  name:  { type: String, required: true },
  color: { type: String, default: '#7c6af7' },
  icon:  { type: String, default: '📁' },
}, { _id: true });

const userSchema = new mongoose.Schema({
  username:        { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:        { type: String, required: true, minlength: 6 },
  bio:             { type: String, maxlength: 200, default: '' },
  role:            { type: String, enum: ['learner', 'author', 'admin'], default: 'learner' },

  // Gamification
  xp:              { type: Number, default: 0 },
  level:           { type: Number, default: 1 },
  streak:          { type: Number, default: 0 },
  lastActive:      { type: Date,   default: Date.now },
  badges:          [{ type: String }],

  // Learning prefs
  topicsFollowed:  [{ type: String }],
  bookmarkFolders: { type: [bookmarkFolderSchema], default: () => ([
    { name: 'General',        color: '#7c6af7', icon: '📁' },
    { name: 'Interview Prep', color: '#f87171', icon: '🎯' },
    { name: 'Revision',       color: '#fbbf24', icon: '📝' },
    { name: 'Important',      color: '#06d6a0', icon: '⭐' },
  ]) },

  // Social
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('levelLabel').get(function () {
  if (this.xp < 500)  return 'Beginner';
  if (this.xp < 1500) return 'Explorer';
  if (this.xp < 3000) return 'Practitioner';
  if (this.xp < 6000) return 'Expert';
  return 'Master';
});

userSchema.virtual('xpInLevel').get(function () {
  return this.xp % 500;
});

userSchema.virtual('xpPercent').get(function () {
  return Math.min(100, Math.round((this.xp % 500) / 500 * 100));
});

// ── Hooks ─────────────────────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.addXP = async function (amount) {
  this.xp    += amount;
  this.level  = Math.floor(this.xp / 500) + 1;
  return this.save();
};

userSchema.methods.updateStreak = async function () {
  const now     = new Date();
  const last    = new Date(this.lastActive);
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
  if      (diffDays === 1)  this.streak += 1;
  else if (diffDays > 1)    this.streak  = 1;
  this.lastActive = now;
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
