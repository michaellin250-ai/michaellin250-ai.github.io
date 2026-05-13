/* ── World map (Stats for Nerds) ─────────────────────────
   Uses D3 v7 + TopoJSON loaded via CDN <script> tags above.
   Countries are keyed by ISO 3166-1 numeric codes.
─────────────────────────────────────────────────────────── */
(function initWorldMap() {
  // ISO 3166-1 numeric codes for every country visited
  const VISITED = new Set([
    840, // United States
    124, // Canada
    484, // Mexico
    392, // Japan
    410, // South Korea
    158, // Taiwan
    250, // France
    826, // United Kingdom
    276, // Germany
    380, // Italy
    756, // Switzerland
    344, // Hong Kong SAR
    702, // Singapore
    704, // Vietnam
    764, // Thailand
  ]);

  // Human-readable names for the tooltip
  const NAMES = {
    840: 'United States', 124: 'Canada', 484: 'Mexico',
    392: 'Japan', 410: 'South Korea', 158: 'Taiwan',
    250: 'France', 826: 'United Kingdom', 276: 'Germany',
    380: 'Italy', 756: 'Switzerland', 344: 'Hong Kong',
    702: 'Singapore', 704: 'Vietnam', 764: 'Thailand',
  };

  const container = document.getElementById('mapContainer');
  const svgEl     = document.getElementById('worldMap');
  if (!container || !svgEl) return;

  // Tooltip DOM node
  const tooltip = document.createElement('div');
  tooltip.className = 'map-tooltip';
  document.body.appendChild(tooltip);

  let worldData = null; // cache the fetch

  async function render() {
    const W = container.clientWidth;
    const H = Math.round(W * 0.50);

    // Clear any previous drawing
    d3.select(svgEl).selectAll('*').remove();

    const svg = d3.select(svgEl)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('width', W)
      .attr('height', H);

    // Fetch once, cache
    if (!worldData) {
      worldData = await d3.json(
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
      );
    }

    const countries = topojson.feature(worldData, worldData.objects.countries);
    const borders   = topojson.mesh(worldData, worldData.objects.countries,
                                    (a, b) => a !== b);

    const projection = d3.geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' });
    const path       = d3.geoPath().projection(projection);

    // Ocean fill
    svg.append('path')
      .datum({ type: 'Sphere' })
      .attr('d', path)
      .attr('fill', '#0E0E0E');

    // Country fills
    svg.selectAll('.country')
      .data(countries.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', path)
      .attr('fill', d => VISITED.has(+d.id) ? '#C9A252' : '#1C1A17')
      .attr('stroke', 'none')
      // Tooltip only for visited
      .on('mousemove', function(event, d) {
        const id = +d.id;
        if (!VISITED.has(id)) return;
        tooltip.textContent = NAMES[id] || id;
        tooltip.classList.add('visible');
        tooltip.style.left = (event.clientX + 14) + 'px';
        tooltip.style.top  = (event.clientY - 28) + 'px';
      })
      .on('mouseleave', function(event, d) {
        if (!VISITED.has(+d.id)) return;
        tooltip.classList.remove('visible');
      });

    // Subtle country borders
    svg.append('path')
      .datum(borders)
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#0A0A0A')
      .attr('stroke-width', 0.4);
  }

  // Wait for D3/TopoJSON to load, then render
  window.addEventListener('load', render);

  // Redraw on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(render, 180);
  });
})();


/* ── Film-grain texture ──────────────────────────────────
   Generates a 220×220 noise canvas once and tiles it as a
   fixed overlay. Static keeps CPU near zero.
─────────────────────────────────────────────────────────── */
(function initGrain() {
  const SIZE = 220;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i+1] = img.data[i+2] = v;
    img.data[i+3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const grain = document.getElementById('grain');
  grain.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
})();


/* ── Page load: fade in sidebar + main ──────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('sidebar').classList.add('loaded');
  document.querySelector('.main-content').classList.add('loaded');
});


/* ── Intro text animation ────────────────────────────────
   "Welcome to Michael's website" words stagger in,
   then the name and subtitle fade up.
─────────────────────────────────────────────────────────── */
(function introAnimation() {
  const welcomeEl = document.getElementById('introWelcome');
  const nameEl    = document.getElementById('introName');
  const subEl     = document.getElementById('introSub');

  const PHRASE   = "Hi, I'm Michael —";
  const WORD_GAP = 110; // ms per word
  const START    = 400; // initial delay

  // Build word spans
  PHRASE.split(' ').forEach((word, i, arr) => {
    const span = document.createElement('span');
    span.className   = 'word';
    span.textContent = i < arr.length - 1 ? word + ' ' : word;
    welcomeEl.appendChild(span);
  });

  const spans    = welcomeEl.querySelectorAll('.word');
  const wordsEnd = START + spans.length * WORD_GAP;

  // Stagger words in
  spans.forEach((span, i) => {
    setTimeout(() => span.classList.add('in'), START + i * WORD_GAP);
  });

  // Name rises after words settle
  setTimeout(() => nameEl.classList.add('in'), wordsEnd + 350);

  // Subtitle fades after name
  setTimeout(() => subEl.classList.add('in'), wordsEnd + 700);
})();


/* ── Active nav link on scroll ───────────────────────────
   Uses IntersectionObserver to highlight the sidebar link
   matching the section currently in view.
─────────────────────────────────────────────────────────── */
(function activeNav() {
  const sections  = document.querySelectorAll('.content-section[id]');
  const navLinks  = document.querySelectorAll('.sidebar-nav .nav-link, .drawer-nav .nav-link');

  function setActive(id) {
    navLinks.forEach(link => {
      const isActive = link.getAttribute('data-section') === id;
      link.classList.toggle('active', isActive);
    });
  }

  // Track which section is most visible
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, {
    threshold: 0.25,
    rootMargin: '-10% 0px -50% 0px'
  });

  sections.forEach(s => observer.observe(s));
})();


/* ── Mobile drawer ───────────────────────────────────────
   Injects a top nav bar + slide-in drawer for small screens.
─────────────────────────────────────────────────────────── */
(function mobileNav() {
  // Build top bar
  const bar = document.createElement('div');
  bar.className = 'mobile-nav-bar';
  bar.innerHTML = `
    <span class="mobile-nav-name">Michael Lin</span>
    <button class="mobile-menu-btn" aria-label="Open menu" id="menuBtn">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           stroke-width="1.6" stroke-linecap="round">
        <line x1="3" y1="7"  x2="21" y2="7"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="17" x2="21" y2="17"/>
      </svg>
    </button>
  `;
  document.body.prepend(bar);

  // Build drawer
  const drawer = document.createElement('div');
  drawer.className = 'mobile-drawer';
  drawer.id = 'mobileDrawer';
  drawer.innerHTML = `
    <div class="mobile-drawer-backdrop" id="drawerBackdrop"></div>
    <div class="mobile-drawer-panel">
      <div style="font-family:var(--font-display);font-size:1.2rem;color:var(--text-primary);">Michael Lin</div>
      <nav class="drawer-nav">
        <a href="#about"     class="nav-link" data-section="about">About</a>
        <a href="#education" class="nav-link" data-section="education">Education</a>
        <a href="#projects"  class="nav-link" data-section="projects">Projects</a>
        <a href="#skills"    class="nav-link" data-section="skills">Skills</a>
        <a href="#contact"   class="nav-link" data-section="contact">Contact</a>
        <a href="#stats"     class="nav-link" data-section="stats">Stats</a>
      </nav>
      <div style="display:flex;gap:20px;padding-top:12px;border-top:1px solid var(--border);">
        <a href="mailto:mlin36@uw.edu" class="social-link" aria-label="Email">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
          </svg>
        </a>
        <a href="https://github.com/michaellin250-ai" class="social-link" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/in/michael-lin07/" class="social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  // Toggle open/close
  const menuBtn = document.getElementById('menuBtn');
  const backdrop = document.getElementById('drawerBackdrop');

  function openDrawer()  { drawer.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeDrawer() { drawer.classList.remove('open'); document.body.style.overflow = ''; }

  menuBtn.addEventListener('click', openDrawer);
  backdrop.addEventListener('click', closeDrawer);

  // Close on nav link click
  drawer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
})();
