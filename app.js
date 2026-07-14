/* Eclipr — shared motion + interaction layer.
   Fully guarded: the page works with no JS, no GSAP, no Lenis, and honours prefers-reduced-motion.
   GSAP 3.12.5 + ScrollTrigger + Lenis are loaded via CDN before this file. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasG = !!(window.gsap && window.ScrollTrigger);

  /* ---------------- Loader ---------------- */
  var loader = doc.querySelector('.loader'), bar = doc.querySelector('.ldr-bar i');
  function hideLoader() {
    if (!loader || loader.dataset.gone) return;
    loader.dataset.gone = '1';
    loader.style.transition = 'opacity .6s ease';
    loader.style.opacity = '0';
    setTimeout(function () { loader.style.display = 'none'; if (hasG && window.ScrollTrigger) ScrollTrigger.refresh(); }, 640);
  }
  if (bar && bar.animate) bar.animate([{ width: '0%' }, { width: '100%' }], { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' });
  else if (bar) bar.style.width = '100%';
  doc.addEventListener('DOMContentLoaded', function () { setTimeout(hideLoader, 700); }); // cap LCP impact
  window.addEventListener('load', function () { setTimeout(hideLoader, 180); });
  setTimeout(hideLoader, 2400); // safety net

  /* ---------------- Ambient texture: film grain (site-wide) + aurora mesh (empty heroes) ---------------- */
  doc.body.insertAdjacentHTML('beforeend', '<div class="grain" aria-hidden="true"></div>');
  doc.querySelectorAll('header.hero').forEach(function (h) {
    if (!h.querySelector('.glow')) { h.classList.add('hero--rich'); h.insertAdjacentHTML('afterbegin', '<div class="aurora" aria-hidden="true"></div>'); }
  });

  /* ---------------- Scroll progress bar ---------------- */
  var prog = doc.createElement('div');
  prog.className = 'scroll-prog'; prog.setAttribute('aria-hidden', 'true');
  doc.body.appendChild(prog);
  function updateProg() {
    var h = root.scrollHeight - root.clientHeight;
    var p = h > 0 ? (root.scrollTop || doc.body.scrollTop) / h : 0;
    prog.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p)) + ')';
  }

  /* ---------------- Nav scroll state (shrink + hide on scroll-down) ---------------- */
  var nav = doc.querySelector('nav'), lastY = 0, navHidden = false;
  function updateNav() {
    var y = root.scrollTop || doc.body.scrollTop || window.pageYOffset || 0;
    if (nav) {
      nav.classList.toggle('scrolled', y > 30);
      if (!reduce) {
        if (y > lastY && y > 240 && !navHidden) { nav.classList.add('nav-hide'); navHidden = true; }
        else if (y < lastY && navHidden) { nav.classList.remove('nav-hide'); navHidden = false; }
      }
    }
    lastY = y;
  }
  window.addEventListener('scroll', function () { updateProg(); updateNav(); }, { passive: true });
  updateProg(); updateNav();

  /* ---------------- Custom cursor (desktop, subtle) ---------------- */
  if (fine && !reduce) {
    var ring = doc.createElement('div'); ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(ring);
    var cx = 0, cy = 0, rx = 0, ry = 0, active = false;
    window.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; if (!active) { active = true; ring.style.opacity = '1'; } }, { passive: true });
    (function loop() { rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)'; requestAnimationFrame(loop); })();
    var hoverSel = 'a,button,.btn,.reel,.clip,.card,.ccard,summary,input,select,textarea';
    doc.addEventListener('mouseover', function (e) { if (e.target.closest(hoverSel)) ring.classList.add('cursor-lg'); });
    doc.addEventListener('mouseout', function (e) { if (e.target.closest(hoverSel)) ring.classList.remove('cursor-lg'); });
    window.addEventListener('mouseleave', function () { ring.style.opacity = '0'; active = false; });
  }

  /* ---------------- Smooth in-page anchors (native fallback if no Lenis) ---------------- */
  var lenis = null;

  /* ---------------- Word-split for headline reveals (no CLS, no extra libs) ---------------- */
  function splitWords(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    var nodes = Array.prototype.slice.call(el.childNodes), out = [];
    nodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (tok) {
          if (tok.trim() === '') { out.push(doc.createTextNode(tok)); return; }
          var w = doc.createElement('span'); w.className = 'w';
          var i = doc.createElement('span'); i.className = 'wi'; i.textContent = tok;
          w.appendChild(i); out.push(w);
        });
      } else { out.push(n); } // keep <br>, <span class="prism-text"> etc. intact
    });
    el.textContent = ''; out.forEach(function (n) { el.appendChild(n); });
    return el.querySelectorAll('.wi');
  }

  /* ---------------- Everything motion-related boots here ---------------- */
  function boot() {
    // Reveal everything immediately if we can't / shouldn't animate.
    if (reduce || !hasG) return;

    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Lenis smooth scroll
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
      function raf(t) { lenis.raf(t); requestAnimationFrame(raf); } requestAnimationFrame(raf);
      lenis.on('scroll', ScrollTrigger.update);
      // smooth anchor jumps
      doc.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href'); if (id.length < 2) return;
          var t = doc.querySelector(id); if (!t) return;
          e.preventDefault(); lenis.scrollTo(t, { offset: -90, duration: 1.1 });
        });
      });
    }

    // Scroll-driven background wash (keeps the atmospheric shift)
    var bg = doc.querySelector('.scrollbg');
    if (bg) gsap.to(bg, {
      keyframes: { backgroundColor: ['#0A0D18', '#0C1122', '#0A0D18'], easeEach: 'none' },
      ease: 'none', scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true }
    });

    // Headline reveals — word mask+rise for plain headings; safe block-rise for headings with nested markup (prism-text / <br>)
    doc.querySelectorAll('h1.hero-h, h2.big, .reveal-h').forEach(function (h) {
      var hasEl = Array.prototype.some.call(h.children, function (c) { return c.tagName !== 'BR'; });
      if (hasEl) {
        gsap.set(h, { y: 26, opacity: 0 });
        gsap.to(h, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
        return;
      }
      var words = splitWords(h); if (!words || !words.length) return;
      gsap.set(words, { yPercent: 118 });
      gsap.to(words, { yPercent: 0, duration: 0.9, ease: 'power4.out', stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });

    // Batched fade/rise for generic .reveal blocks (skip headings, handled above)
    var revs = Array.prototype.filter.call(doc.querySelectorAll('.reveal'), function (el) {
      return !el.matches('h1.hero-h, h2.big') && !el.closest('.loader');
    });
    gsap.set(revs, { y: 30, opacity: 0 });
    ScrollTrigger.batch(revs, {
      start: 'top 90%', once: true,
      onEnter: function (els) { gsap.to(els, { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.09, overwrite: true }); }
    });

    // Parallax — gradient glows drift, media images scale/drift for depth
    doc.querySelectorAll('.glow').forEach(function (g) {
      gsap.to(g, { yPercent: 26, ease: 'none', scrollTrigger: { trigger: g.closest('header,section') || g, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    doc.querySelectorAll('.reel img, .clip img, .vframe img').forEach(function (im) {
      gsap.fromTo(im, { yPercent: -8, scale: 1.12 }, { yPercent: 8, scale: 1.12, ease: 'none', scrollTrigger: { trigger: im.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Magnetic primary buttons (desktop only)
    if (fine) doc.querySelectorAll('.btn').forEach(function (b) {
      var qx = gsap.quickTo(b, 'x', { duration: 0.4, ease: 'power3' });
      var qy = gsap.quickTo(b, 'y', { duration: 0.4, ease: 'power3' });
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); qx((e.clientX - (r.left + r.width / 2)) * 0.4); qy((e.clientY - (r.top + r.height / 2)) * 0.5); });
      b.addEventListener('mouseleave', function () { qx(0); qy(0); });
    });

    // Animated number counters — opt-in via data-count="1234" (suffix/prefix via data-*)
    doc.querySelectorAll('[data-count]').forEach(function (el) {
      var end = parseFloat(el.getAttribute('data-count')) || 0;
      var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
      var o = { v: 0 };
      gsap.to(o, {
        v: end, duration: 1.6, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        onUpdate: function () { el.textContent = pre + Math.round(o.v).toLocaleString('en-IN') + suf; }
      });
    });

    ScrollTrigger.refresh();
  }

  if (doc.readyState !== 'loading') boot();
  else doc.addEventListener('DOMContentLoaded', boot);
})();
