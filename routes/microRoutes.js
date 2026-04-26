// microRoutes.js
const r1 = require('express').Router();
r1.get('/', (req, res) => res.render('pages/micro', { title: 'Micro-Learning — KnowVerse', layout: 'partials/layout' }));
module.exports = r1;
