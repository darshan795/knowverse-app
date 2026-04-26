# KnowVerse v2 — EJS + Passport + Joi + Mongoose

A full-stack interactive learning platform built with server-side rendering.
No React. No Tailwind. Pure HTML, CSS, vanilla JS on the frontend — EJS templates on the backend.

---

## Tech Stack

| Layer        | Technology                                      |
|--------------|-------------------------------------------------|
| Server       | Node.js + Express.js                            |
| Templates    | EJS + express-ejs-layouts                       |
| Auth         | Passport.js (LocalStrategy) + express-session   |
| Validation   | Joi                                             |
| Database     | MongoDB + Mongoose                              |
| Styling      | Pure CSS (dark glassmorphism, CSS variables)    |
| Frontend     | Vanilla JS (no frameworks)                      |
| Charts       | Chart.js (CDN)                                  |

---

## Features

- Landing page with scroll animations, parallax, marquee, counter
- User registration + login with Passport LocalStrategy
- Joi validation on all forms (register, login, post, comment)
- Infinite-scroll-style feed with tag + difficulty filtering
- Post detail with ELI5 toggle, syntax-highlighted code block
- Threaded comment system (5 levels deep) with upvotes + best answer
- Quiz system with countdown timer, score ring, XP rewards
- Bookmark dashboard with folder organisation
- User dashboard with Chart.js weekly activity graph
- Topic roadmap pages (JavaScript, React, DSA, Node.js)
- Micro-learning flashcard mode with drag/swipe support
- Create post editor with 3 tabs (Content / Quiz / Preview)
- XP + levels + streaks + leaderboard
- Flash messages, custom cursor, scroll progress bar

---

## Project Structure

```
knowverse-ejs/
├── server.js                    Express entry point
├── .env.example                 Environment variable template
│
├── config/
│   ├── passport.js              Passport LocalStrategy
│   └── seed.js                  Sample data seeder
│
├── models/
│   ├── User.js                  User schema (XP, streak, bookmarks)
│   └── index.js                 Post, Comment, Bookmark, QuizSubmission, Progress
│
├── validators/
│   └── index.js                 Joi schemas for all forms
│
├── middleware/
│   └── auth.js                  ensureAuth, ensureGuest, ensureRole
│
├── controllers/
│   ├── authController.js        register, login, logout
│   ├── postController.js        feed, CRUD, like, save
│   └── mainController.js        comments, bookmarks, quiz, dashboard
│
├── routes/
│   ├── indexRoutes.js           / and /feed
│   ├── authRoutes.js            /auth/*
│   ├── postRoutes.js            /posts/*
│   ├── commentRoutes.js         /comments/*
│   ├── bookmarkRoutes.js        /bookmarks/*
│   ├── dashboardRoutes.js       /dashboard
│   ├── topicRoutes.js           /topics/:tag
│   ├── microRoutes.js           /micro
│   └── apiRoutes.js             /api/* (JSON endpoints for JS)
│
├── views/
│   ├── partials/
│   │   ├── layout.ejs           Main HTML shell (nav, flash, footer)
│   │   ├── post-card.ejs        Reusable post card component
│   │   └── comment-node.ejs     Recursive comment tree
│   └── pages/
│       ├── landing.ejs          Homepage / marketing page
│       ├── feed.ejs             Post feed with sidebar
│       ├── post.ejs             Full post detail + quiz + comments
│       ├── login.ejs            Login form
│       ├── register.ejs         Register form
│       ├── dashboard.ejs        Stats + charts
│       ├── bookmarks.ejs        Bookmarks by folder
│       ├── topic.ejs            Roadmap + filtered posts
│       ├── micro.ejs            Flashcard swipe mode
│       ├── create-post.ejs      Post editor + quiz builder
│       ├── 404.ejs              Not found page
│       └── error.ejs            Server error page
│
└── public/
    ├── css/
    │   └── style.css            Full dark glassmorphism stylesheet
    └── js/
        └── main.js              Cursor, scroll, like/save, quiz, comments, micro
```

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or provide an Atlas URI)

### 2. Install
```bash
cd knowverse-ejs
cp .env.example .env
# Edit .env — set MONGO_URI and SESSION_SECRET
npm install
```

### 3. Seed the database
```bash
npm run seed
```
Creates 3 users and 5 sample posts with quizzes.

### 4. Start
```bash
npm run dev        # development (nodemon)
npm start          # production
```

Open **http://localhost:3000**

---

## Login Credentials (after seeding)

| Email             | Password    | Profile         |
|-------------------|-------------|-----------------|
| arjun@test.com    | password123 | Level 5, 2340XP |
| priya@test.com    | password123 | Level 3, 1200XP |
| sam@test.com      | password123 | Level 7, 3400XP |

---

## Environment Variables

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/knowverse
SESSION_SECRET=change_this_to_a_long_random_string
NODE_ENV=development
```

---

## API Endpoints (JSON)

These are called by the frontend JavaScript for interactive features:

```
POST   /api/posts/:id/like          Toggle like on a post
POST   /api/posts/:id/save          Toggle save on a post
POST   /api/quiz                    Submit quiz answers → returns score + XP
POST   /api/comments                Create a comment or reply
POST   /api/comments/:id/upvote     Toggle upvote on a comment
POST   /api/comments/:id/best       Mark comment as best answer
DELETE /api/comments/:id            Soft-delete a comment
POST   /api/bookmarks               Save a post to a folder
DELETE /api/bookmarks/:postId       Remove a bookmark
```

All JSON endpoints require a logged-in session (Passport). They return `{ ok: true, ... }` on success.

---

## Page Routes

```
GET  /                     Landing page (redirects to /feed if logged in)
GET  /feed                 Post feed (filterable by tag, difficulty, search)
GET  /posts/:id            Post detail page
GET  /posts/create         Post editor (auth required)
POST /posts                Create post (auth required)
GET  /topics/:tag          Topic roadmap page
GET  /micro                Micro-learning flashcards
GET  /bookmarks            Bookmark dashboard (auth required)
GET  /dashboard            User dashboard (auth required)
GET  /auth/login           Login page
POST /auth/login           Authenticate with Passport
GET  /auth/register        Register page
POST /auth/register        Create account (Joi-validated)
GET  /auth/logout          Logout and redirect to home
```

---

## How Validation Works (Joi)

Every form submission runs through a Joi schema before hitting the database:

```js
// validators/index.js
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirm:  Joi.string().valid(Joi.ref('password')).required()
    .messages({ 'any.only': 'Passwords do not match.' }),
});
```

If validation fails, the error is flashed to the user and they're redirected back to the form.

---

## How Auth Works (Passport)

1. User submits login form → `POST /auth/login`
2. Passport LocalStrategy checks email + bcrypt password
3. On success → `req.user` is set, session is persisted in MongoDB via `connect-mongo`
4. `ensureAuth` middleware guards all protected routes
5. `res.locals.user` is set globally so every EJS template can access `user`

---

## Design System

All CSS uses custom properties from `:root`:

```css
--bg:      #0d0f17    /* page background */
--surface: #141726    /* nav, inputs */
--card:    #1a1d2e    /* cards */
--accent:  #7c6af7    /* primary purple */
--accent2: #06d6a0    /* secondary green */
--danger:  #f87171    /* red */
--warn:    #fbbf24    /* yellow */
--text:    #e2e4f0    /* primary text */
--muted:   #6b7280    /* secondary text */
```

Fonts: DM Sans (body) + Syne (display headings) + JetBrains Mono (code)
