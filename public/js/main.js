/* ── Cursor ── */
(function () {//animation to cursor using   ring 
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursor-ring');
  if (!cursor) return;
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  (function animate() {
    cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
    rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(animate);
  })();
})();

/* ── Scroll progress ── */
(function () {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });
})();

/* ── Sticky nav ── */
(function () {
  const nav = document.getElementById('main-nav');
  if (!nav || !nav.classList.contains('nav-transparent')) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 70) {
      nav.classList.remove('nav-transparent');
      nav.classList.add('nav-solid');
    } else {
      nav.classList.remove('nav-solid');
      nav.classList.add('nav-transparent');
    }
  }, { passive: true });
})();

/* ── User dropdown ── */
(function () {
  const btn  = document.getElementById('user-menu-btn');
  const drop = document.getElementById('user-dropdown');
  if (!btn || !drop) return;
  btn.addEventListener('click', e => { e.stopPropagation(); drop.classList.toggle('open'); });
  document.addEventListener('click', () => drop.classList.remove('open'));
})();

/* ── Flash auto-dismiss ── */
(function () {
  const flash = document.getElementById('flash-msg');
  if (flash) setTimeout(() => flash.remove(), 4000);
})();

/* ── Reveal on scroll ── */
(function () {
  const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
  if (!els.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* ── Counter animation (landing) ── */
(function () {
  const counts = document.querySelectorAll('.count');
  if (!counts.length) return;
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = +el.dataset.target, dur = 1600, start = performance.now();
      (function upd(now) {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
        if (p < 1) requestAnimationFrame(upd);
      })(start);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counts.forEach(c => obs.observe(c));
})();

/* ── Landing hero parallax ── */
(function () {
  const title = document.querySelector('.hero-title');
  const sub   = document.querySelector('.hero-sub');
  const card  = document.querySelector('.hero-card');
  if (!title) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y >= window.innerHeight) return;
    if (title) { title.style.transform = 'translateY(' + (y * 0.2) + 'px)'; title.style.opacity = 1 - y / (window.innerHeight * 0.75); }
    if (sub)   { sub.style.transform   = 'translateY(' + (y * 0.12) + 'px)'; sub.style.opacity   = 1 - y / (window.innerHeight * 0.65); }
    if (card)  { card.style.opacity    = 1 - y / (window.innerHeight * 0.8); }
  }, { passive: true });
})();

/* ── Orb mouse tracking ── */
(function () {
  const orbs = document.querySelectorAll('.orb');
  if (!orbs.length) return;
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 24;
    const y = (e.clientY / window.innerHeight - 0.5) * 24;
    orbs.forEach((o, i) => {
      const f = (i + 1) * 0.35;
      o.style.transform = 'translate(' + (x * f) + 'px, ' + (y * f) + 'px)';
    });
  });
})();

/* ── 3D card tilt ── */
(function () {
  document.querySelectorAll('.feat-card, .test-card, .step-box').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = 'perspective(700px) rotateX(' + (-y * 5) + 'deg) rotateY(' + (x * 5) + 'deg) translateY(-4px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform .5s cubic-bezier(.16,1,.3,1)';
      card.style.transform  = '';
      setTimeout(() => card.style.transition = '', 500);
    });
  });
})();

/* ── Smooth anchor scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ─────────────────────────────────────────────────────────────────────────
   KEY FIX: apiFetch always sends session cookie with every request
   This is why save/like/bookmark was failing — session was not being sent
────────────────────────────────────────────────────────────────────────── */
function apiFetch(url, options) {
  const defaults = {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }
  };
  return fetch(url, Object.assign({}, defaults, options, {
    headers: Object.assign({}, defaults.headers, (options && options.headers) || {})
  }));
}

/* ── Like toggle ── */
window.toggleLike = async function (btn) {
  if (btn.dataset.guest) {
    showToast('Sign in to like posts!', 'error');
    window.location = '/auth/login';
    return;
  }

  const postId  = btn.dataset.post;
  const countEl = btn.querySelector('.like-count');
  const isLiked = btn.classList.contains('liked');

  // Optimistic update — change UI immediately before server responds
  btn.classList.toggle('liked');
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', !isLiked ? 'currentColor' : 'none');

  try {
    const res  = await apiFetch('/api/posts/' + postId + '/like', { method: 'POST' });
    const data = await res.json();

    if (data.ok) {
      if (countEl) countEl.textContent = data.likeCount;
    } else {
      // Server rejected — revert UI
      btn.classList.toggle('liked');
      if (svg) svg.setAttribute('fill', isLiked ? 'currentColor' : 'none');
      showToast('Please sign in first', 'error');
    }
  } catch (e) {
    // Network error — revert UI
    btn.classList.toggle('liked');
    if (svg) svg.setAttribute('fill', isLiked ? 'currentColor' : 'none');
    showToast('Something went wrong', 'error');
  }
};

/* ── Save toggle ── */
window.toggleSave = async function (btn) {
  if (btn.dataset.guest) {
    showToast('Sign in to save posts!', 'error');
    window.location = '/auth/login';
    return;
  }

  const postId  = btn.dataset.post;
  const isSaved = btn.classList.contains('saved');

  // Optimistic update
  btn.classList.toggle('saved');
  const svg = btn.querySelector('svg');
  if (svg) svg.setAttribute('fill', !isSaved ? 'currentColor' : 'none');

  try {
    const res  = await apiFetch('/api/posts/' + postId + '/save', { method: 'POST' });
    const data = await res.json();

    if (data.ok) {
      showToast(data.saved ? '🔖 Saved to bookmarks!' : 'Removed from bookmarks', 'success');
    } else {
      // Revert
      btn.classList.toggle('saved');
      if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
      showToast('Please sign in first', 'error');
    }
  } catch (e) {
    // Revert
    btn.classList.toggle('saved');
    if (svg) svg.setAttribute('fill', isSaved ? 'currentColor' : 'none');
    showToast('Something went wrong', 'error');
  }
};

/* ── Quiz teaser (feed cards) ── */
window.openQuizTeaser = function (btn, postId) {
  const box = document.getElementById('quiz-teaser-' + postId);
  if (!box) return;
  if (box.style.display === 'none') {
    box.style.display = 'block';
    btn.style.display = 'none';
  }
};

document.addEventListener('click', function (e) {
  const btn = e.target.closest('.qt-opt');
  if (!btn) return;
  const postId  = btn.dataset.post;
  const correct = parseInt(btn.dataset.correct);
  const idx     = parseInt(btn.dataset.idx);

  document.querySelectorAll('[data-post="' + postId + '"].qt-opt').forEach(b => {
    const i = parseInt(b.dataset.idx);
    b.classList.remove('opt-correct', 'opt-wrong');
    if (i === correct)  b.classList.add('opt-correct');
    else if (i === idx) b.classList.add('opt-wrong');
    b.disabled = true;
  });

  const expl = document.getElementById('expl-' + postId + '-0');
  if (expl) expl.style.display = 'block';
});

/* ── ELI5 toggle ── */
window.switchMode = function (mode) {
  const normal = document.getElementById('body-normal');
  const eli5   = document.getElementById('body-eli5');
  const btnN   = document.getElementById('btn-normal');
  const btnE   = document.getElementById('btn-eli5');
  if (!normal) return;
  if (mode === 'normal') {
    normal.style.display = 'block';
    if (eli5) eli5.style.display = 'none';
    if (btnN) btnN.classList.add('active');
    if (btnE) btnE.classList.remove('active');
  } else {
    if (eli5) eli5.style.display = 'block';
    normal.style.display = 'none';
    if (btnE) btnE.classList.add('active');
    if (btnN) btnN.classList.remove('active');
  }
};

/* ── Copy code ── */
window.copyCode = function (btn) {
  const pre = btn.closest('.code-block-wrap').querySelector('.code-block');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => btn.textContent = 'Copy', 2000);
  });
};

/* ── Comment system ── */
window.postComment = async function (postId, parentId, boxId) {
  const isReply  = !!parentId;
  const textarea = isReply
    ? document.getElementById('reply-text-' + boxId)
    : document.getElementById('new-comment-body');
  if (!textarea || !textarea.value.trim()) return;

  try {
    const res  = await apiFetch('/api/comments', {
      method: 'POST',
      body: JSON.stringify({ postId, body: textarea.value, parentId: parentId || null }),
    });
    const data = await res.json();
    if (data.ok) {
      showToast('Comment posted! +5 XP 🎉', 'success');
      textarea.value = '';
      location.reload();
    } else {
      showToast(data.message || 'Failed to post comment', 'error');
    }
  } catch (e) {
    showToast('Something went wrong', 'error');
  }
};

window.toggleReplyBox = function (commentId) {
  const box = document.getElementById('reply-box-' + commentId);
  if (!box) return;
  box.style.display = box.style.display === 'none' ? 'block' : 'none';
  if (box.style.display === 'block') {
    const ta = document.getElementById('reply-text-' + commentId);
    if (ta) ta.focus();
  }
};

window.upvoteComment = async function (btn) {
  if (btn.dataset.guest) { showToast('Sign in to upvote!', 'error'); return; }
  const id = btn.dataset.id;
  try {
    const res  = await apiFetch('/api/comments/' + id + '/upvote', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      btn.classList.toggle('upvoted', data.upvoted);
      const cnt = btn.querySelector('.upvote-count');
      if (cnt) cnt.textContent = data.count;
    }
  } catch (e) {}
};

window.markBest = async function (btn) {
  const id = btn.dataset.id;
  try {
    const res  = await apiFetch('/api/comments/' + id + '/best', { method: 'POST' });
    const data = await res.json();
    if (data.ok) {
      showToast('Marked as best answer! +25 XP', 'success');
      location.reload();
    } else {
      showToast(data.message || 'Error', 'error');
    }
  } catch (e) {}
};

window.deleteComment = async function (btn) {
  if (!confirm('Delete this comment?')) return;
  const id = btn.dataset.id;
  try {
    const res  = await apiFetch('/api/comments/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      const node = document.getElementById('comment-' + id);
      if (node) {
        const txt = node.querySelector('.comment-text');
        if (txt) { txt.textContent = '[deleted]'; txt.classList.add('deleted'); }
        btn.remove();
      }
    }
  } catch (e) {}
};

/* ── Bookmarks ── */
window.removeBookmark = async function (btn, postId) {
  try {
    const res  = await apiFetch('/api/bookmarks/' + postId, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      const card = btn.closest('.bm-card');
      if (card) card.remove();
      showToast('Bookmark removed', 'success');
    }
  } catch (e) {}
};

window.filterFolder = function (btn, folder) {
  document.querySelectorAll('.folder-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.bm-card').forEach(card => {
    card.style.display = folder === 'all' || card.dataset.folder === folder ? '' : 'none';
  });
};

/* ── Create post: tab switcher ── */
window.switchTab = function (btn, tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  btn.classList.add('active');
  document.getElementById('tab-' + tab).style.display = 'flex';
  if (tab === 'preview') updatePreview();
};

window.updatePreview = function () {
  const title = document.querySelector('input[name="title"]');
  const body  = document.querySelector('textarea[name="body"]');
  const pt    = document.getElementById('prev-title');
  const pb    = document.getElementById('prev-body');
  if (pt && title) pt.textContent = title.value || 'Your title here';
  if (pb && body)  pb.innerHTML   = (body.value || 'Start typing…').replace(/\n/g, '<br>');
};

/* ── Quiz builder ── */
let qCount = 1;
window.addQuestion = function () {
  const container = document.getElementById('quiz-questions-builder');
  if (!container) return;
  const idx   = qCount++;
  const block = document.createElement('div');
  block.className = 'quiz-q-block';
  block.id = 'qq-block-' + idx;
  let opts = '';
  for (let i = 0; i < 4; i++) {
    opts += '<div class="quiz-opt-row">' +
      '<label class="correct-radio"><input type="radio" name="quiz_correct[]" value="' + i + '"/><span class="radio-dot"></span></label>' +
      '<input type="text" name="quiz_options[][]" class="kv-input" placeholder="Option ' + String.fromCharCode(65 + i) + '"/>' +
      '</div>';
  }
  block.innerHTML =
    '<div class="qq-block-header">' +
      '<span class="qq-label">Question ' + (idx + 1) + '</span>' +
      '<button type="button" class="btn-ghost btn-xs" onclick="removeQuestion(' + idx + ')">Remove</button>' +
    '</div>' +
    '<input type="text" name="quiz_question[]" class="kv-input mb-8" placeholder="Your question…"/>' +
    '<div class="quiz-opts-builder">' + opts + '</div>' +
    '<p class="form-hint">Click circle to mark correct answer</p>' +
    '<input type="text" name="quiz_explanation[]" class="kv-input mt-8" placeholder="Explanation…"/>';
  container.appendChild(block);
};

window.removeQuestion = function (idx) {
  const block = document.getElementById('qq-block-' + idx);
  if (block) block.remove();
};

/* ── Micro-learning ── */
(function () {
  const cards = [
    { tag: 'JavaScript', concept: 'Closure',         body: 'A function that retains access to its outer scope even after the outer function returns. Enables data privacy and state management.', color: '#7c6af7' },
    { tag: 'JavaScript', concept: 'Event Loop',      body: 'JS is single-threaded. The event loop processes the call stack first, then microtasks, then macrotasks like setTimeout.', color: '#06d6a0' },
    { tag: 'DSA',        concept: 'O(log n)',         body: 'Algorithms that halve the problem space each step. Binary search on 1M elements takes only ~20 operations.', color: '#fbbf24' },
    { tag: 'React',      concept: 'Reconciliation',  body: 'React diffs the new virtual DOM against the previous one and only updates the DOM nodes that actually changed.', color: '#f87171' },
    { tag: 'CSS',        concept: 'Specificity',     body: 'Inline > ID > Class > Element. The algorithm browsers use to decide which CSS rule wins. Use BEM to keep it flat.', color: '#06d6a0' },
    { tag: 'NodeJS',     concept: 'Event Emitter',   body: "Node's EventEmitter lets objects emit named events and attach callbacks — the core of streams and HTTP.", color: '#7c6af7' },
    { tag: 'DSA',        concept: 'Dynamic Prog.',   body: 'Break problems into overlapping subproblems and memoize results. If f(n) = f(n-1) + f(n-2), DP applies.', color: '#f87171' },
    { tag: 'JavaScript', concept: 'Prototype Chain', body: 'Every JS object has [[Prototype]]. Property lookups walk up the chain until found or null is reached.', color: '#fbbf24' },
  ];

  const mcCard = document.getElementById('micro-card');
  if (!mcCard) return;

  let index = 0, flipped = false, seen = new Set();
  let startX = 0, dragging = false;

  function render() {
    const c = cards[index];
    document.getElementById('mc-tag').textContent      = '#' + c.tag;
    document.getElementById('mc-counter').textContent  = (index + 1) + ' / ' + cards.length;
    document.getElementById('mc-concept').textContent  = c.concept;
    document.getElementById('mc-body').textContent     = c.body;
    document.getElementById('mc-front').style.display  = flipped ? 'none' : 'flex';
    document.getElementById('mc-back').style.display   = flipped ? 'flex' : 'none';
    document.getElementById('btn-flip').textContent    = flipped ? 'Hide' : 'Flip card';
    document.getElementById('total-count').textContent = cards.length;
    document.getElementById('seen-count').textContent  = seen.size;
    document.getElementById('micro-prog-fill').style.width = (seen.size / cards.length * 100) + '%';

    const dotsEl = document.getElementById('micro-dots');
    dotsEl.innerHTML = '';
    cards.forEach(function (_, i) {
      const d = document.createElement('button');
      d.className = 'micro-dot' + (i === index ? ' active' : seen.has(i) ? ' seen' : '');
      d.onclick   = function () { window.microGo(i - index); };
      dotsEl.appendChild(d);
    });

    mcCard.style.borderColor = c.color + '55';
    mcCard.style.background  = 'linear-gradient(135deg, ' + c.color + '10, var(--card))';
  }

  window.microGo = function (dir) {
    seen.add(index);
    flipped = false;
    index   = (index + dir + cards.length) % cards.length;
    render();
  };

  window.microFlip = function () {
    flipped = !flipped;
    render();
  };

  mcCard.addEventListener('click', function () { window.microFlip(); });

  mcCard.addEventListener('mousedown', function (e) { startX = e.clientX; dragging = true; });
  window.addEventListener('mouseup', function (e) {
    if (!dragging) return;
    dragging = false;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 60) { window.microGo(diff < 0 ? 1 : -1); mcCard.style.transform = ''; }
  });
  window.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    const diff = e.clientX - startX;
    mcCard.style.transform = 'translateX(' + (diff * 0.3) + 'px) rotate(' + (diff * 0.03) + 'deg)';
  });

  mcCard.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
  mcCard.addEventListener('touchend', function (e) {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) window.microGo(diff < 0 ? 1 : -1);
    mcCard.style.transform = '';
  });

  render();
})();

/* ── Toast helper ── */
window.showToast = function (msg, type) {
  const t = document.createElement('div');
  t.className = 'flash flash-' + (type === 'error' ? 'error' : 'success');
  t.style.cssText = 'position:fixed;top:70px;right:24px;z-index:9000;padding:14px 20px;border-radius:12px;font-size:14px;display:flex;align-items:center;gap:10px;min-width:260px;animation:slideIn .3s ease';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function () { t.remove(); }, 3500);
};
