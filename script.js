/* ── Film-grain texture ──────────────────────────────────
   Generates a 220×220 noise canvas once and tiles it as a
   fixed overlay. Static (non-animated) keeps CPU cost near zero.
─────────────────────────────────────────────────────────── */
(function initGrain() {
  const SIZE = 220;
  const offscreen = document.createElement('canvas');
  offscreen.width = offscreen.height = SIZE;
  const ctx = offscreen.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);

  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i]     = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }

  ctx.putImageData(img, 0, 0);
  document.getElementById('grain').style.backgroundImage =
    `url(${offscreen.toDataURL('image/png')})`;
})();


/* ── Hero intro sequence ─────────────────────────────────
   1. Words of welcome text fade + rise in, staggered.
   2. Name fades + rises in after a beat.
   3. Scroll cue appears once name settles.
─────────────────────────────────────────────────────────── */
(function heroSequence() {
  const welcomeEl = document.getElementById('welcomeText');
  const nameEl    = document.getElementById('heroName');
  const cueEl     = document.getElementById('scrollCue');

  const PHRASE    = "Welcome to Michael's website";
  const WORD_GAP  = 120; // ms between each word
  const START     = 250; // initial delay before first word

  // Build a <span class="word"> per word
  PHRASE.split(' ').forEach((word, i, arr) => {
    const span = document.createElement('span');
    span.className   = 'word';
    span.textContent = i < arr.length - 1 ? word + ' ' : word;
    welcomeEl.appendChild(span);
  });

  const spans    = welcomeEl.querySelectorAll('.word');
  const wordsEnd = START + spans.length * WORD_GAP;

  // Stagger each word in
  spans.forEach((span, i) => {
    setTimeout(() => span.classList.add('in'), START + i * WORD_GAP);
  });

  // Name appears after words settle
  setTimeout(() => nameEl.classList.add('in'), wordsEnd + 420);

  // Scroll cue after name finishes its transition (~900ms)
  setTimeout(() => cueEl.classList.add('in'), wordsEnd + 420 + 900);
})();


/* ── Nav: glass backdrop on scroll ───────────────────────── */
(function navScroll() {
  const nav = document.getElementById('nav');

  function update() {
    nav.classList.toggle('scrolled', window.scrollY > 36);
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();


/* ── Scroll-reveal ───────────────────────────────────────
   Adds .revealed to elements with .reveal once they enter
   the viewport. Siblings in the same section are staggered.
─────────────────────────────────────────────────────────── */
(function scrollReveal() {
  const reveals = document.querySelectorAll('.reveal');

  // Stagger siblings inside each section
  document.querySelectorAll('.section').forEach(section => {
    section.querySelectorAll('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${i * 75}ms`;
    });
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -48px 0px' }
  );

  reveals.forEach(el => observer.observe(el));
})();
