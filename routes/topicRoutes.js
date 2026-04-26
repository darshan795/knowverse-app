// topicRoutes.js
const r1   = require('express').Router();
const { Post } = require('../models/index');

const ROADMAPS = {
  javascript: [
    { id:1, title:'Variables & Types',    desc:'let, const, primitives',          level:'beginner' },
    { id:2, title:'Functions & Scope',    desc:'Closures, hoisting, IIFE',         level:'beginner' },
    { id:3, title:'Arrays & Objects',     desc:'Methods, destructuring, spread',   level:'beginner' },
    { id:4, title:'DOM Manipulation',     desc:'Selectors, events, traversal',     level:'intermediate' },
    { id:5, title:'Async JavaScript',     desc:'Callbacks, Promises, async/await', level:'intermediate' },
    { id:6, title:'Event Loop',           desc:'Call stack, microtasks',           level:'intermediate' },
    { id:7, title:'Advanced Patterns',    desc:'Design patterns, FP, Proxy',       level:'advanced' },
  ],
  react: [
    { id:1, title:'JSX & Components',    desc:'Functional components, props',      level:'beginner' },
    { id:2, title:'State & Effects',     desc:'useState, useEffect',               level:'beginner' },
    { id:3, title:'Context API',         desc:'createContext, useContext',          level:'intermediate' },
    { id:4, title:'Performance Hooks',   desc:'useMemo, useCallback',              level:'intermediate' },
    { id:5, title:'State Management',    desc:'Redux Toolkit, Zustand',            level:'advanced' },
  ],
  dsa: [
    { id:1, title:'Arrays & Strings',    desc:'Two pointers, sliding window',     level:'beginner' },
    { id:2, title:'Linked Lists',        desc:'Traversal, reversal, fast/slow',   level:'beginner' },
    { id:3, title:'Binary Search',       desc:'Templates, rotated arrays',        level:'intermediate' },
    { id:4, title:'Trees & BST',         desc:'DFS, BFS, LCA',                    level:'intermediate' },
    { id:5, title:'Graphs',              desc:'Dijkstra, union-find',             level:'intermediate' },
    { id:6, title:'Dynamic Programming', desc:'Memoization, tabulation',          level:'advanced' },
  ],
};

r1.get('/:tag', async (req, res) => {
  const tag     = req.params.tag.toLowerCase();
  const roadmap = ROADMAPS[tag] || [];
  const posts   = await Post.find({ tags: tag, published: true })
    .populate('author','username').sort({ createdAt: -1 }).limit(6).lean();

  const enriched = await Promise.all(roadmap.map(async node => ({
    ...node,
    postCount: await Post.countDocuments({ tags: tag, difficulty: node.level, published: true }),
  })));

  res.render('pages/topic', {
    title:   `#${tag} Roadmap — KnowVerse`,
    tag,
    roadmap: enriched,
    posts,
    userId:  req.user?._id?.toString(),
    layout:  'partials/layout',
  });
});

module.exports = r1;
