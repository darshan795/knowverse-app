require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const User     = require('../models/User');
const { Post } = require('../models/index');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Clearing old data…');
  await User.deleteMany({});
  await Post.deleteMany({});

  const hash = await bcrypt.hash('password123', 12);

  const users = await User.insertMany([
    { username:'arjun_dev',   email:'arjun@test.com',  password:hash, bio:'Full-stack dev. JS evangelist.',  xp:2340, level:5, streak:7,  topicsFollowed:['javascript','react','dsa'] },
    { username:'priya_codes', email:'priya@test.com',  password:hash, bio:'DSA enthusiast. CS grad.',        xp:1200, level:3, streak:4,  topicsFollowed:['dsa','python'] },
    { username:'sam_react',   email:'sam@test.com',    password:hash, bio:'React dev. TypeScript all the way.',xp:3400, level:7,streak:14, topicsFollowed:['react','typescript','nodejs'] },
  ]);

  const [arjun, priya, sam] = users;

  await Post.insertMany([
    {
      title:'Understanding JavaScript Closures — The Complete Guide',
      body:`## What is a Closure?\n\nA closure is a function that retains access to its outer (enclosing) lexical scope, even when executed outside that scope.\n\nClosures are the foundation of:\n- Module patterns\n- Data privacy\n- Currying and partial application\n- Event handlers that remember state`,
      eli5Body:`Imagine you have a lunchbox. You put a sandwich inside at home. Even when you take it to school, the sandwich is still inside. A closure is like that — the function "carries" the variables from where it was created, no matter where it runs.`,
      codeSnippet:`function makeCounter() {\n  let count = 0;\n  return {\n    increment: () => ++count,\n    value: () => count,\n  };\n}\n\nconst counter = makeCounter();\nconsole.log(counter.increment()); // 1\nconsole.log(counter.value());     // 1`,
      codeLanguage:'javascript', author:arjun._id, tags:['javascript','closures','functions'],
      difficulty:'beginner', readTime:6, views:1840, featured:true,
      quiz:[
        { question:"What does a closure 'close over'?", options:['The DOM tree','Outer scope variables','Global variables only','The event loop'], correctIndex:1, explanation:'A closure captures variables from its enclosing lexical scope.' },
        { question:'Which creates a closure?', options:['const x = 5','function f(){ return function g(){} }','let arr = []','if(true){}'], correctIndex:1, explanation:'Returning a function from another function creates a closure — g closes over f\'s scope.' },
      ],
    },
    {
      title:'Binary Search — Why O(log n) Matters in Interviews',
      body:`## The Core Idea\n\nBinary search eliminates half the search space on each iteration. Instead of scanning every element O(n), you always look at the middle.\n\n## The Two-Pointer Template\n\nMost binary search problems follow this exact pattern:\n\n1. Set lo = 0, hi = arr.length - 1\n2. While lo <= hi, compute mid\n3. Compare and narrow the range`,
      eli5Body:`Imagine looking for "M" in a dictionary. Instead of starting from "A", you open the middle. If you land on "S", you know "M" comes before — throw away the second half. Keep halving. That's binary search!`,
      codeSnippet:`function binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    arr[mid] < target ? lo = mid + 1 : hi = mid - 1;\n  }\n  return -1;\n}`,
      codeLanguage:'javascript', author:priya._id, tags:['dsa','binary-search','algorithms'],
      difficulty:'intermediate', readTime:8, views:1100,
      quiz:[
        { question:'Time complexity of binary search?', options:['O(n)','O(n²)','O(log n)','O(1)'], correctIndex:2, explanation:'Binary search halves the search space each iteration, giving O(log n).' },
        { question:'Binary search requires the array to be:', options:['Shuffled','Sorted','All positive numbers','No duplicates'], correctIndex:1, explanation:'The array must be sorted so we can reliably eliminate half the elements each step.' },
      ],
    },
    {
      title:'useCallback vs useMemo — When to Actually Use Them',
      body:`## The Problem with Premature Optimization\n\nEven experienced React devs misuse these hooks. Adding useMemo and useCallback everywhere doesn't make your app faster — it often makes it slower.\n\n## useCallback\nMemoizes a function reference. Use when:\n1. Passing to a React.memo-wrapped child\n2. The function is a useEffect dependency\n\n## useMemo\nMemoizes a computed value. Use when:\n1. The computation is expensive (sorting huge arrays)\n2. Referential equality matters for child props`,
      eli5Body:`useMemo is like pre-making a complicated sandwich and storing the result so you don't have to remake it every time. useCallback is like saving your phone number so you don't rewrite it from scratch every time someone asks.`,
      codeSnippet:`// Only memoize expensive computations\nconst sorted = useMemo(() => {\n  return hugeArray.sort((a, b) => a.score - b.score);\n}, [hugeArray]);\n\n// Only memoize if passed to React.memo child\nconst handleClick = useCallback(() => {\n  doSomething(id);\n}, [id]);`,
      codeLanguage:'javascript', author:sam._id, tags:['react','hooks','performance','frontend'],
      difficulty:'advanced', readTime:7, views:3200, featured:true,
      quiz:[
        { question:'When should you use useMemo?', options:['Always for every computed value','Only for expensive calculations or referential equality','Never — it hurts performance','Only in class components'], correctIndex:1, explanation:'useMemo has overhead itself — only use when computation is genuinely expensive or reference equality matters.' },
      ],
    },
    {
      title:'Node.js Event Loop — The Secret Behind Non-Blocking I/O',
      body:`## Why Node.js is Fast\n\nNode.js uses a single-threaded event loop to handle thousands of concurrent connections without blocking. Most I/O operations are offloaded to the OS.\n\n## The Loop Phases\n1. Timers — setTimeout / setInterval\n2. Pending callbacks — I/O from prev tick\n3. Poll — retrieves new I/O events\n4. Check — setImmediate\n5. Close callbacks — cleanup`,
      eli5Body:`Node.js is like an efficient waiter. Instead of standing at one table waiting for people to decide, it takes your order, gives it to the kitchen, then serves other tables. When the food is ready, it gets notified and brings it to you.`,
      codeSnippet:`console.log('1');\nsetTimeout(() => console.log('2'), 0);\nPromise.resolve().then(() => console.log('3'));\nconsole.log('4');\n// Output: 1, 4, 3, 2\n// Microtasks run before the next event loop tick!`,
      codeLanguage:'javascript', author:arjun._id, tags:['nodejs','javascript','backend','async'],
      difficulty:'intermediate', readTime:10, views:2100,
      quiz:[
        { question:'Which runs first after synchronous code?', options:['setTimeout callback','setInterval callback','Promise .then (microtask)','setImmediate'], correctIndex:2, explanation:'Microtasks (Promise callbacks) always run before the next event loop phase, before macrotasks like setTimeout.' },
      ],
    },
    {
      title:'CSS Grid vs Flexbox — A Decision Framework',
      body:`## The Simple Rule\n- Flexbox = one dimension (row OR column)\n- Grid = two dimensions (rows AND columns)\n\n## When to Use Flexbox\n- Navigation bars\n- Centering elements\n- Distributing space in a single row\n\n## When to Use Grid\n- Page-level layouts\n- Card grids with equal-height rows\n- Complex overlapping designs`,
      eli5Body:`Flexbox is like arranging books on a single shelf — all in a line. Grid is like a bookcase with many shelves AND columns — you can place each book exactly where you want in the whole bookcase.`,
      codeSnippet:`/* Grid: responsive card layout */\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));\n  gap: 1.5rem;\n}\n\n/* Flexbox: centered nav */\n.nav {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}`,
      codeLanguage:'css', author:sam._id, tags:['css','flexbox','grid','frontend'],
      difficulty:'beginner', readTime:5, views:890,
      quiz:[
        { question:'Which property is Grid-only?', options:['display: flex','align-items','grid-template-columns','justify-content'], correctIndex:2, explanation:'grid-template-columns is a CSS Grid property. The others exist in both Grid and Flexbox.' },
      ],
    },
  ]);

  console.log('✅ Seed complete! 3 users, 5 posts');
  console.log('📧 arjun@test.com / password123');
  console.log('📧 priya@test.com / password123');
  console.log('📧 sam@test.com   / password123');
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
