const Joi = require('joi');

// ── Auth validators ───────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required()
    .messages({ 'string.alphanum': 'Username can only contain letters and numbers.' }),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required()
    .messages({ 'string.min': 'Password must be at least 6 characters.' }),
  confirm:  Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match.' }),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

// ── Post validator ────────────────────────────────────────────────────────────
const postSchema = Joi.object({
  title:        Joi.string().min(5).max(150).required(),
  body:         Joi.string().min(20).required(),
  eli5Body:     Joi.string().allow('').optional(),
  codeSnippet:  Joi.string().allow('').optional(),
  codeLanguage: Joi.string().valid('javascript','typescript','python','css','html','bash','sql','java','go','rust').default('javascript'),
  tags:         Joi.alternatives().try(
    Joi.array().items(Joi.string()),
    Joi.string()
  ).optional(),
  difficulty:   Joi.string().valid('beginner','intermediate','advanced').default('beginner'),
  readTime:     Joi.number().min(1).max(60).default(5),
  // Quiz questions (repeating fields from form)
  'quiz_question[]':     Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
  'quiz_options[][]':    Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
  'quiz_correct[]':      Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
  'quiz_explanation[]':  Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
});

// ── Comment validator ─────────────────────────────────────────────────────────
const commentSchema = Joi.object({
  body:     Joi.string().min(1).max(2000).required()
    .messages({ 'string.min': 'Comment cannot be empty.' }),
  parentId: Joi.string().allow('', null).optional(),
  postId:   Joi.string().required(),
});

// ── Profile update ────────────────────────────────────────────────────────────
const profileSchema = Joi.object({
  username:       Joi.string().alphanum().min(3).max(30).optional(),
  bio:            Joi.string().max(200).allow('').optional(),
  topicsFollowed: Joi.alternatives().try(Joi.array(), Joi.string()).optional(),
});

// ── Validation helper ─────────────────────────────────────────────────────────
const validate = (schema) => (data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: false });
  if (error) {
    const messages = error.details.map(d => d.message);
    return { valid: false, messages, value: null };
  }
  return { valid: true, messages: [], value };
};

module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin:    validate(loginSchema),
  validatePost:     validate(postSchema),
  validateComment:  validate(commentSchema),
  validateProfile:  validate(profileSchema),
};
