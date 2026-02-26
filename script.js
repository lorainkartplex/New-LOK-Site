/* ============================================================
   LORAIN OHIO KARTPLEX — script.js
   ============================================================ */

(function () {
  'use strict';

  /* ---- Sticky header on scroll ---- */
  const header = document.getElementById('header');
  function updateHeader() {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  /* ---- Mobile hamburger menu ---- */
  const hamburger = document.getElementById('hamburger');
  const mainNav   = document.getElementById('main-nav');

  hamburger.addEventListener('click', function () {
    const isOpen = mainNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) {
      document.querySelectorAll('.nav-dropdown').forEach(function (d) {
        d.classList.remove('open');
      });
    }
  });

  // Close nav when a link is clicked
  mainNav.querySelectorAll('.nav-link').forEach(function (link) {
    // Skip dropdown parent links on mobile — handled separately
    if (link.closest('.nav-dropdown')) return;
    link.addEventListener('click', function () {
      mainNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close nav when a submenu link is clicked
  mainNav.querySelectorAll('.nav-submenu-link').forEach(function (link) {
    link.addEventListener('click', function () {
      mainNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Mobile dropdown toggle
  var isMobile = function () { return window.innerWidth <= 768; };
  document.querySelectorAll('.nav-dropdown > .nav-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (!isMobile()) return; // Desktop uses CSS :hover
      var parent = link.closest('.nav-dropdown');
      if (!parent.classList.contains('open')) {
        // First tap: open submenu, don't navigate
        e.preventDefault();
        // Close any other open dropdowns
        document.querySelectorAll('.nav-dropdown.open').forEach(function (d) {
          if (d !== parent) d.classList.remove('open');
        });
        parent.classList.add('open');
      } else {
        // Second tap: close submenu and navigate
        parent.classList.remove('open');
      }
    });
  });

  // Close nav on outside click
  document.addEventListener('click', function (e) {
    if (!header.contains(e.target) && mainNav.classList.contains('open')) {
      mainNav.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ---- Active nav link on scroll ---- */
  const sections  = document.querySelectorAll('section[id], div[id]');
  const navLinks  = document.querySelectorAll('.nav-link[href^="#"]');
  const navHeight = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--nav-h'), 10) || 70;

  function updateActiveLink() {
    let current = '';
    sections.forEach(function (sec) {
      if (window.scrollY >= sec.offsetTop - navHeight - 40) {
        current = sec.getAttribute('id');
      }
    });
    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  /* ---- Scroll-reveal animation ---- */
  const revealEls = document.querySelectorAll(
    '.about-grid, .track-card, .class-card, ' +
    '.facility-item, .stat, .format-step, ' +
    '.feature-card, .timeline-item, .highlight-card, .event-type-card, .content-grid, .event-card'
  );

  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    if (i % 3 === 1) el.classList.add('reveal-delay-1');
    if (i % 3 === 2) el.classList.add('reveal-delay-2');
  });

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  revealEls.forEach(function (el) { observer.observe(el); });

  /* ---- Animated number counter for stats bar ---- */
  const statNums = document.querySelectorAll('.stat-num');

  function animateCounter(el) {
    const rawText  = el.textContent;
    const small    = el.querySelector('small');
    const smallTxt = small ? small.textContent : '';
    const numStr   = rawText.replace(smallTxt, '').trim();
    const target   = parseFloat(numStr);
    const isFloat  = numStr.includes('.');
    const duration = 1200;
    const start    = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current  = target * ease;
      const display  = isFloat ? current.toFixed(2) : Math.round(current).toString();

      if (small) {
        el.textContent = display;
        el.appendChild(small);
      } else {
        el.textContent = display;
      }

      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const statsBar = document.querySelector('.stats-bar');
  const statsObserver = new IntersectionObserver(
    function (entries) {
      if (entries[0].isIntersecting) {
        statNums.forEach(animateCounter);
        statsObserver.disconnect();
      }
    },
    { threshold: 0.5 }
  );
  if (statsBar) statsObserver.observe(statsBar);

  /* ---- Contact form (Formspree) ---- */
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');

  // Replace YOUR_FORM_ID with your Formspree form ID from formspree.io
  var FORMSPREE_ENDPOINT = 'https://formspree.io/f/xbdaavda';

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var required = contactForm.querySelectorAll('[required]');
      var valid = true;

      required.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e8000d';
          valid = false;
        }
      });

      if (!valid) return;

      var submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      var data = new FormData(contactForm);

      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            formSuccess.style.display = 'block';
            contactForm.reset();
            setTimeout(function () { formSuccess.style.display = 'none'; }, 5000);
          } else {
            return res.json().then(function (json) {
              throw new Error(json.errors ? json.errors.map(function (e) { return e.message; }).join(', ') : 'Submission failed');
            });
          }
        })
        .catch(function (err) {
          console.error('Form error:', err);
          formSuccess.style.color = '#e8000d';
          formSuccess.textContent = 'Something went wrong. Please email us directly at info@lorainkartplex.com';
          formSuccess.style.display = 'block';
        })
        .finally(function () {
          submitBtn.textContent = 'Send Message';
          submitBtn.disabled = false;
        });
    });

    contactForm.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.addEventListener('input', function () {
        field.style.borderColor = '';
      });
    });
  }

  /* ---- 3D drag-to-rotate track image ---- */
  (function () {
    var card = document.getElementById('track3d');
    if (!card) return;

    var hint = card.parentElement.querySelector('.track-3d-hint');

    // Current rotation state
    var rotX = 20;
    var rotY = -10;

    // Velocity for inertia
    var velX = 0;
    var velY = 0;

    var dragging   = false;
    var lastX      = 0;
    var lastY      = 0;
    var rafId      = null;

    function applyTransform() {
      card.style.transform = 'rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg)';
    }

    function inertiaLoop() {
      if (!dragging && (Math.abs(velX) > 0.05 || Math.abs(velY) > 0.05)) {
        rotY += velX;
        rotX -= velY;
        rotX = Math.max(-75, Math.min(75, rotX)); // clamp vertical tilt
        velX *= 0.93;
        velY *= 0.93;
        applyTransform();
        rafId = requestAnimationFrame(inertiaLoop);
      }
    }

    function onStart(clientX, clientY) {
      dragging = true;
      lastX = clientX;
      lastY = clientY;
      velX = 0;
      velY = 0;
      card.classList.add('is-dragging');
      if (hint) hint.classList.add('hidden');
      cancelAnimationFrame(rafId);
    }

    function onMove(clientX, clientY) {
      if (!dragging) return;
      var dx = clientX - lastX;
      var dy = clientY - lastY;
      velX = dx * 0.35;
      velY = dy * 0.35;
      rotY += velX;
      rotX -= velY;
      rotX = Math.max(-75, Math.min(75, rotX));
      lastX = clientX;
      lastY = clientY;
      applyTransform();
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      card.classList.remove('is-dragging');
      rafId = requestAnimationFrame(inertiaLoop);
    }

    // Mouse
    card.addEventListener('mousedown', function (e) {
      e.preventDefault();
      onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function (e) { onMove(e.clientX, e.clientY); });
    window.addEventListener('mouseup', onEnd);

    // Touch
    card.addEventListener('touchstart', function (e) {
      e.preventDefault();
      onStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchmove', function (e) {
      if (dragging) e.preventDefault();
      onMove(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    window.addEventListener('touchend', onEnd);

    // Set initial position
    applyTransform();
  }());

  /* ---- Smooth scroll for logo click ---- */
  document.querySelector('.logo').addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#home' || href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // On sub-pages (href="index.html"), let normal navigation happen
  });

  /* ---- Keyboard accessibility for hamburger ---- */
  hamburger.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      hamburger.click();
    }
  });

  /* ---- Back to top button ---- */
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---- Photo lightbox ---- */
  var lightbox    = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var photoItems  = document.querySelectorAll('.photo-item');
  var currentIdx  = 0;

  if (lightbox && lightboxImg) {
    function getPhotoSrc(idx) {
      return photoItems[idx].querySelector('img:first-child').src;
    }

    function openLightbox(idx) {
      currentIdx = idx;
      lightboxImg.src = getPhotoSrc(idx);
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function showPrev() {
      currentIdx = (currentIdx - 1 + photoItems.length) % photoItems.length;
      lightboxImg.src = getPhotoSrc(currentIdx);
    }

    function showNext() {
      currentIdx = (currentIdx + 1) % photoItems.length;
      lightboxImg.src = getPhotoSrc(currentIdx);
    }

    photoItems.forEach(function (item, i) {
      item.addEventListener('click', function () { openLightbox(i); });
    });

    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', showPrev);
    document.getElementById('lightboxNext').addEventListener('click', showNext);

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });
  } // end lightbox guard

  /* ---- Tab switching (class tabs + membership tabs) ---- */
  function setupTabs(tabSelector, panelPrefix) {
    var tabs = document.querySelectorAll(tabSelector);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll(panelPrefix).forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        var panel = document.getElementById('tab-' + tab.getAttribute('data-tab'));
        if (panel) panel.classList.add('active');
      });
    });
  }
  setupTabs('.class-tab', '.class-tab-panel');
  setupTabs('.mem-tab', '.mem-tab-panel');

  /* ---- Video gallery view more/less toggle ---- */
  var videoToggle = document.getElementById('videoToggle');
  var videoGrid = document.querySelector('.video-grid');

  if (videoToggle && videoGrid) {
    videoToggle.addEventListener('click', function () {
      var expanded = videoGrid.classList.toggle('expanded');
      videoToggle.querySelector('.video-toggle-text').textContent = expanded ? 'View Less' : 'View More';
    });
  }

  /* ---- Photo gallery view more/less toggle ---- */
  var photoToggle = document.getElementById('photoToggle');
  var photoGrid = document.querySelector('.photo-grid');

  if (photoToggle && photoGrid) {
    photoToggle.addEventListener('click', function () {
      var expanded = photoGrid.classList.toggle('expanded');
      photoToggle.querySelector('.photo-toggle-text').textContent = expanded ? 'View Less' : 'View More';
    });
  }

  /* ---- Schedule view more/less toggle ---- */
  var scheduleToggle = document.getElementById('scheduleToggle');
  var scheduleTable = document.querySelector('.schedule-table');

  var scheduleNote = document.querySelector('.schedule-note-hidden');

  if (scheduleToggle && scheduleTable) {
    scheduleToggle.addEventListener('click', function () {
      var expanded = scheduleTable.classList.toggle('expanded');
      scheduleToggle.classList.toggle('expanded', expanded);
      if (scheduleNote) scheduleNote.classList.toggle('visible', expanded);
      scheduleToggle.querySelector('.schedule-toggle-text').textContent = expanded ? 'View Less' : 'View Full Schedule';
    });
  }

  /* ---- Theme toggle (light/dark mode) ---- */
  var STORAGE_KEY = 'kartplex-theme';
  var themeToggle = document.getElementById('theme-toggle');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem(STORAGE_KEY, 'light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem(STORAGE_KEY, 'dark');
      }
    });
  }

  /* ---- Kart Finder Tool ---- */
  var finderEl = document.getElementById('kartFinder');
  if (finderEl) {
    var currentStep = 1;
    var totalSteps = 4;
    var selections = {};

    var steps = finderEl.querySelectorAll('.finder-step');
    var progressSteps = finderEl.querySelectorAll('.finder-progress-step');
    var resultsEl = document.getElementById('finderResults');
    var backBtn = document.getElementById('finderBack');
    var restartBtn = document.getElementById('finderRestart');

    // All BRKC race classes
    var allClasses = [
      // 4-Stroke — Tillotson (recommended first)
      { name: 'Piston Kup/T4 Bambino', age: '5-7', ageMin: 5, ageMax: 7, weight: '150lbs', tire: 'Maxxis T4 Bambino', engine: 'Tillotson T4', type: '4-stroke' },
      { name: 'Tillotson T4 MINI', age: '8-12', ageMin: 8, ageMax: 12, weight: '245lbs', tire: 'Maxxis T4', engine: 'Tillotson T4', type: '4-stroke' },
      { name: 'Tillotson T4 Junior', age: '12-15', ageMin: 12, ageMax: 15, weight: '320lbs', tire: 'Maxxis T4', engine: 'Tillotson T4', type: '4-stroke' },
      { name: 'Tillotson T4 Senior', age: '15+', ageMin: 15, ageMax: 99, weight: '360lbs', tire: 'Maxxis T4', engine: 'Tillotson T4', type: '4-stroke' },
      { name: 'Tillotson T4 380', age: '32+', ageMin: 32, ageMax: 99, weight: '385lbs', tire: 'Maxxis T4', engine: 'Tillotson T4', type: '4-stroke' },
      // 4-Stroke — Briggs 206
      { name: '206 MINI/Cadet', age: '8-12', ageMin: 8, ageMax: 12, weight: '245lbs', tire: 'MG RED', engine: 'Briggs 206', type: '4-stroke' },
      { name: '206 Junior', age: '12-15', ageMin: 12, ageMax: 15, weight: '320lbs', tire: 'MG RED', engine: 'Briggs 206', type: '4-stroke' },
      { name: '206 Senior', age: '15+', ageMin: 15, ageMax: 99, weight: '360lbs', tire: 'MG RED', engine: 'Briggs 206', type: '4-stroke' },
      { name: '206 390', age: '32+', ageMin: 32, ageMax: 99, weight: '385lbs', tire: 'MG RED', engine: 'Briggs 206', type: '4-stroke' },
      // 2-Stroke — Rotax
      { name: 'Rotax MICRO Max', age: '8-12', ageMin: 8, ageMax: 12, weight: '230lbs', tire: 'MG RED', engine: 'Rotax', type: '2-stroke' },
      { name: 'Rotax MINI Max', age: '10-13', ageMin: 10, ageMax: 13, weight: '265lbs', tire: 'MG RED', engine: 'Rotax', type: '2-stroke' },
      { name: 'Rotax Junior Max', age: '12-15', ageMin: 12, ageMax: 15, weight: '320lbs', tire: 'MG RED', engine: 'Rotax', type: '2-stroke' },
      { name: 'Rotax Senior Max', age: '15+', ageMin: 15, ageMax: 99, weight: '360lbs', tire: 'MG RED', engine: 'Rotax', type: '2-stroke' },
      { name: 'Rotax Masters', age: '32+', ageMin: 32, ageMax: 99, weight: '385lbs', tire: 'MG RED', engine: 'Rotax', type: '2-stroke' },
      // 2-Stroke — IAME
      { name: 'IAME Swift MINI', age: '8-12', ageMin: 8, ageMax: 12, weight: '245lbs', tire: 'MG RED', engine: 'IAME', type: '2-stroke' },
      { name: 'IAME KA Junior', age: '12-15', ageMin: 12, ageMax: 15, weight: '320lbs', tire: 'MG RED', engine: 'IAME', type: '2-stroke' },
      { name: 'IAME KA Senior', age: '15+', ageMin: 15, ageMax: 99, weight: '360lbs', tire: 'MG RED', engine: 'IAME', type: '2-stroke' },
      { name: 'IAME KA Master', age: '32+', ageMin: 32, ageMax: 99, weight: '385lbs', tire: 'MG RED', engine: 'IAME', type: '2-stroke' },
      { name: 'Shifter', age: '15+', ageMin: 15, ageMax: 99, weight: '395lbs', tire: 'MG RED', engine: 'IAME', type: '2-stroke' }
    ];

    // Chassis brand data
    var chassisBrands = {
      'Tillotson':      { desc: 'Affordable complete packages, great starter kart', tier: ['entry', 'mid'] },
      'DAP Kart':       { desc: 'Entry-level, good value for new racers', tier: ['entry'] },
      'CRG':            { desc: 'Versatile brand with options at every level', tier: ['entry', 'mid', 'premium'] },
      'CompKart':       { desc: 'Competitive value, solid mid-range performance', tier: ['mid'] },
      'Birel / Freeline': { desc: 'Premium engineering, proven performance', tier: ['mid', 'premium'] },
      'Kart Republic':  { desc: 'Top-tier competition chassis, elite level', tier: ['mid', 'premium'] },
      'FA Alonso Kart': { desc: 'Fernando Alonso\'s brand, prestige racing', tier: ['premium'] }
    };

    function showStep(step) {
      steps.forEach(function (s) { s.classList.remove('active'); });
      progressSteps.forEach(function (p, i) {
        p.classList.remove('active');
        p.classList.remove('done');
        if (i + 1 < step) p.classList.add('done');
        if (i + 1 === step) p.classList.add('active');
      });
      var target = finderEl.querySelector('.finder-step[data-step="' + step + '"]');
      if (target) target.classList.add('active');
      backBtn.style.display = step > 1 ? 'flex' : 'none';
      resultsEl.style.display = 'none';
    }

    function getAgeRange(val) {
      if (val === '5-7') return { min: 5, max: 7 };
      if (val === '8-12') return { min: 8, max: 12 };
      if (val === '12-15') return { min: 12, max: 15 };
      if (val === '15+') return { min: 15, max: 31 };
      if (val === '32+') return { min: 32, max: 99 };
      return { min: 0, max: 99 };
    }

    function getRecommendedChassis() {
      var exp = selections.experience;
      var budget = selections.budget;
      var results = [];

      // Map experience to budget tiers
      var tiers = [];
      if (budget === 'entry') tiers = ['entry'];
      else if (budget === 'mid') tiers = ['mid'];
      else if (budget === 'premium') tiers = ['premium'];
      else tiers = ['entry', 'mid', 'premium']; // flexible

      // Adjust based on experience
      if (exp === 'brand-new' || exp === 'rental') {
        if (budget === 'flexible') tiers = ['entry', 'mid'];
      } else if (exp === 'experienced') {
        if (budget === 'flexible') tiers = ['mid', 'premium'];
      }

      Object.keys(chassisBrands).forEach(function (name) {
        var brand = chassisBrands[name];
        var match = brand.tier.some(function (t) { return tiers.indexOf(t) !== -1; });
        if (match) {
          results.push({ name: name, desc: brand.desc });
        }
      });
      return results;
    }

    function getRecommendedEngines() {
      var enginePref = selections.engine;
      var exp = selections.experience;
      var engines = [];

      if (enginePref === '4-stroke' || enginePref === 'not-sure') {
        engines.push({
          name: 'Tillotson T4',
          desc: 'Our recommended 4-stroke platform. Affordable, reliable, and growing fast with its own dedicated class structure from Bambino to Masters. Complete kart packages available — the easiest way to get on the grid.'
        });
        engines.push({
          name: 'Briggs 206',
          desc: 'A popular 4-stroke spec engine class. Everyone runs equal equipment so the focus is on driver skill. Very affordable to maintain.'
        });
      }
      if (enginePref === '2-stroke' || enginePref === 'not-sure') {
        engines.push({
          name: 'Rotax',
          desc: 'World-renowned 2-stroke platform with a full class ladder from Micro to Masters. Higher speeds and the gateway to international competition.'
        });
        engines.push({
          name: 'IAME',
          desc: 'Top-tier 2-stroke engines used in national and international competition. High performance with excellent support and parts availability.'
        });
      }

      // Add recommendation note
      if (enginePref === 'not-sure') {
        if (exp === 'brand-new' || exp === 'rental') {
          engines.unshift({
            name: 'Our Recommendation: Start with 4-Stroke',
            desc: 'For newer drivers, we recommend starting with a 4-stroke engine — especially the Tillotson T4. Complete kart packages make it easy to get started, maintenance costs are low, and the racing is competitive. You can always move to 2-stroke later.',
            highlight: true
          });
        }
      }

      return engines;
    }

    function getMatchingClasses() {
      var ageRange = getAgeRange(selections.age);
      var enginePref = selections.engine;

      return allClasses.filter(function (c) {
        // Age filter: class must overlap with selected age range
        var ageMatch = c.ageMin <= ageRange.max && c.ageMax >= ageRange.min;
        // Engine filter
        var engineMatch = true;
        if (enginePref === '4-stroke') engineMatch = c.type === '4-stroke';
        else if (enginePref === '2-stroke') engineMatch = c.type === '2-stroke';
        return ageMatch && engineMatch;
      });
    }

    function showResults() {
      currentStep = 0;
      steps.forEach(function (s) { s.classList.remove('active'); });
      progressSteps.forEach(function (p) { p.classList.add('done'); p.classList.remove('active'); });
      backBtn.style.display = 'none';

      // Chassis
      var chassis = getRecommendedChassis();
      var chassisHTML = '';
      chassis.forEach(function (c) {
        chassisHTML += '<div class="finder-chassis-card"><div class="finder-chassis-name">' + c.name + '</div><div class="finder-chassis-desc">' + c.desc + '</div></div>';
      });
      document.getElementById('chassisResults').innerHTML = chassisHTML;

      // Engines
      var engines = getRecommendedEngines();
      var engineHTML = '<div class="finder-engines-list">';
      engines.forEach(function (e) {
        var cls = e.highlight ? ' style="border-color:var(--red);background:rgba(232,0,13,0.04)"' : '';
        engineHTML += '<div class="finder-engine-card"' + cls + '><div class="finder-engine-name">' + e.name + '</div><div class="finder-engine-desc">' + e.desc + '</div></div>';
      });
      engineHTML += '</div>';
      document.getElementById('engineResults').innerHTML = engineHTML;

      // Classes
      var classes = getMatchingClasses();
      var classHTML = '<div class="finder-class-row header"><span>Class</span><span>Age</span><span>Weight</span><span>Tire</span></div>';
      if (classes.length === 0) {
        classHTML += '<div class="finder-class-row"><span style="grid-column:1/-1;text-align:center;color:var(--text-muted)">No matching classes found for this combination. Contact us for guidance.</span></div>';
      } else {
        classes.forEach(function (c) {
          classHTML += '<div class="finder-class-row"><span class="class-name">' + c.name + ' <span class="finder-class-engine">(' + c.engine + ')</span></span><span>' + c.age + '</span><span>' + c.weight + '</span><span>' + c.tire + '</span></div>';
        });
      }
      document.getElementById('classResults').innerHTML = classHTML;

      resultsEl.style.display = 'block';
      // Scroll to results
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function resetFinder() {
      currentStep = 1;
      selections = {};
      resultsEl.style.display = 'none';
      showStep(1);
      finderEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Option click handlers
    finderEl.querySelectorAll('.finder-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var step = parseInt(opt.closest('.finder-step').getAttribute('data-step'));
        var value = opt.getAttribute('data-value');

        if (step === 1) selections.age = value;
        else if (step === 2) selections.experience = value;
        else if (step === 3) selections.engine = value;
        else if (step === 4) selections.budget = value;

        if (step < totalSteps) {
          currentStep = step + 1;
          showStep(currentStep);
        } else {
          showResults();
        }
      });
    });

    // Back button
    backBtn.addEventListener('click', function () {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      }
    });

    // Restart button
    restartBtn.addEventListener('click', resetFinder);
  }

  /* ===========================================================
     EMAIL SIGNUP TOOL
     =========================================================== */
  var signupTool = document.getElementById('signupTool');
  if (signupTool) {
    var SIGNUP_ENDPOINT = 'https://formspree.io/f/mpqjkply';
    var signupStep = 1;
    var selectedInterests = [];
    var selectedSources = [];
    var autoResetTimer = null;

    var steps = signupTool.querySelectorAll('.signup-step');
    var progressSteps = signupTool.querySelectorAll('.signup-progress-step');
    var nextBtn = document.getElementById('signupNext');
    var nextBtn2 = document.getElementById('signupNext2');
    var backBtn1 = document.getElementById('signupBackToStep1');
    var backBtn2 = document.getElementById('signupBack');
    var submitBtn = document.getElementById('signupSubmit');
    var againBtn = document.getElementById('signupAgain');
    var thankYou = document.getElementById('signupThankYou');
    var errorEl = document.getElementById('signupError');
    var interestErrorEl = document.getElementById('signupInterestError');
    var sourceErrorEl = document.getElementById('signupSourceError');
    var interestBtns = signupTool.querySelectorAll('[data-interest]');
    var sourceBtns = signupTool.querySelectorAll('[data-source]');

    var firstNameInput = document.getElementById('signupFirstName');
    var lastNameInput = document.getElementById('signupLastName');
    var emailInput = document.getElementById('signupEmail');

    function showSignupStep(step) {
      steps.forEach(function (s) { s.classList.remove('active'); });
      var target = signupTool.querySelector('.signup-step[data-step="' + step + '"]');
      if (target) target.classList.add('active');

      progressSteps.forEach(function (ps) {
        var s = parseInt(ps.getAttribute('data-step'));
        ps.classList.remove('active', 'done');
        if (s === step) ps.classList.add('active');
        else if (s < step) ps.classList.add('done');
      });

      // Scroll to top of signup card so options are visible
      signupTool.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateContactInfo() {
      var firstName = firstNameInput.value.trim();
      var lastName = lastNameInput.value.trim();
      var email = emailInput.value.trim();
      var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      firstNameInput.classList.remove('error');
      lastNameInput.classList.remove('error');
      emailInput.classList.remove('error');

      if (!firstName) {
        firstNameInput.classList.add('error');
        errorEl.textContent = 'Please enter your first name.';
        errorEl.style.display = 'block';
        firstNameInput.focus();
        return false;
      }
      if (!lastName) {
        lastNameInput.classList.add('error');
        errorEl.textContent = 'Please enter your last name.';
        errorEl.style.display = 'block';
        lastNameInput.focus();
        return false;
      }
      if (!email || !emailRegex.test(email)) {
        emailInput.classList.add('error');
        errorEl.textContent = 'Please enter a valid email address.';
        errorEl.style.display = 'block';
        emailInput.focus();
        return false;
      }

      errorEl.style.display = 'none';
      return true;
    }

    // Interest toggle (step 1)
    interestBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('selected');
        var interest = btn.getAttribute('data-interest');
        var idx = selectedInterests.indexOf(interest);
        if (idx > -1) { selectedInterests.splice(idx, 1); }
        else { selectedInterests.push(interest); }
        interestErrorEl.style.display = 'none';
      });
    });

    // Source toggle (step 2)
    sourceBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.classList.toggle('selected');
        var source = btn.getAttribute('data-source');
        var idx = selectedSources.indexOf(source);
        if (idx > -1) { selectedSources.splice(idx, 1); }
        else { selectedSources.push(source); }
        sourceErrorEl.style.display = 'none';
      });
    });

    // Step 1 → Step 2
    nextBtn.addEventListener('click', function () {
      if (selectedInterests.length === 0) {
        interestErrorEl.textContent = 'Please select at least one interest.';
        interestErrorEl.style.display = 'block';
        return;
      }
      signupStep = 2;
      showSignupStep(2);
    });

    // Step 2 → Step 1 (back)
    backBtn1.addEventListener('click', function () {
      signupStep = 1;
      showSignupStep(1);
    });

    // Step 2 → Step 3
    nextBtn2.addEventListener('click', function () {
      if (selectedSources.length === 0) {
        sourceErrorEl.textContent = 'Please select at least one option.';
        sourceErrorEl.style.display = 'block';
        return;
      }
      signupStep = 3;
      showSignupStep(3);
      firstNameInput.focus();
    });

    // Step 3 → Step 2 (back)
    backBtn2.addEventListener('click', function () {
      signupStep = 2;
      showSignupStep(2);
    });

    // Submit (step 3: validate contact info then submit)
    submitBtn.addEventListener('click', function () {
      if (!validateContactInfo()) return;

      submitBtn.textContent = 'Submitting\u2026';
      submitBtn.disabled = true;

      var data = {
        firstName: firstNameInput.value.trim(),
        lastName: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        interests: selectedInterests.join(', '),
        heardAboutUs: selectedSources.join(', ')
      };

      fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (res.ok) {
          showThankYou(data.firstName);
        } else {
          errorEl.textContent = 'Something went wrong. Please try again.';
          errorEl.style.display = 'block';
          submitBtn.textContent = 'Sign Me Up';
          submitBtn.disabled = false;
        }
      }).catch(function () {
        errorEl.textContent = 'Network error. Please try again.';
        errorEl.style.display = 'block';
        submitBtn.textContent = 'Sign Me Up';
        submitBtn.disabled = false;
      });
    });

    function showThankYou(name) {
      steps.forEach(function (s) { s.classList.remove('active'); });
      signupTool.querySelector('.signup-progress').style.display = 'none';
      thankYou.style.display = 'block';
      document.getElementById('signupThankName').textContent = name;

      // Auto-reset countdown
      var countdown = 8;
      var countdownEl = document.getElementById('signupCountdown');
      countdownEl.textContent = countdown;
      autoResetTimer = setInterval(function () {
        countdown--;
        countdownEl.textContent = countdown;
        if (countdown <= 0) {
          resetSignup();
        }
      }, 1000);
    }

    function resetSignup() {
      if (autoResetTimer) { clearInterval(autoResetTimer); autoResetTimer = null; }
      signupStep = 1;
      selectedInterests = [];
      selectedSources = [];
      firstNameInput.value = '';
      lastNameInput.value = '';
      emailInput.value = '';
      firstNameInput.classList.remove('error');
      lastNameInput.classList.remove('error');
      emailInput.classList.remove('error');
      errorEl.style.display = 'none';
      interestErrorEl.style.display = 'none';
      sourceErrorEl.style.display = 'none';
      submitBtn.textContent = 'Sign Me Up';
      submitBtn.disabled = false;
      interestBtns.forEach(function (btn) { btn.classList.remove('selected'); });
      sourceBtns.forEach(function (btn) { btn.classList.remove('selected'); });
      thankYou.style.display = 'none';
      signupTool.querySelector('.signup-progress').style.display = 'flex';
      showSignupStep(1);
    }

    // Sign Up Another button
    againBtn.addEventListener('click', resetSignup);

    // Allow Enter key to submit from step 3
    [firstNameInput, lastNameInput, emailInput].forEach(function (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitBtn.click();
        }
      });
    });
  }

  /* ---- Pre-registration form (homepage) ---- */
  var preregForm = document.getElementById('prereg-form');
  var preregSuccess = document.getElementById('prereg-success');

  if (preregForm) {
    preregForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var emailField = preregForm.querySelector('input[type="email"]');
      var email = emailField.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailField.style.borderColor = '#e8000d';
        return;
      }
      var submitBtn = preregForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Submitting…';
      submitBtn.disabled = true;

      fetch('https://formspree.io/f/mpqjkply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email: email, interests: 'Pre-Registration' })
      }).then(function (res) {
        if (res.ok) {
          if (preregSuccess) preregSuccess.style.display = 'block';
          preregForm.reset();
          setTimeout(function () {
            if (preregSuccess) preregSuccess.style.display = 'none';
          }, 5000);
        } else {
          throw new Error('Submission failed');
        }
      }).catch(function () {
        emailField.style.borderColor = '#e8000d';
      }).finally(function () {
        submitBtn.textContent = 'Pre-Register';
        submitBtn.disabled = false;
      });
    });
    preregForm.querySelector('input').addEventListener('input', function () {
      this.style.borderColor = '';
    });
  }

  /* ---- Event Inquiry form (group events page) ---- */
  var eventForm = document.getElementById('event-form');
  var eventSuccess = document.getElementById('event-success');

  if (eventForm) {
    eventForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = eventForm.querySelectorAll('[required]');
      var valid = true;
      required.forEach(function (field) {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e8000d';
          valid = false;
        }
      });
      if (!valid) return;

      var submitBtn = eventForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'Sending…';
      submitBtn.disabled = true;

      var data = new FormData(eventForm);
      fetch('https://formspree.io/f/xbdaavda', {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      }).then(function (res) {
        if (res.ok) {
          if (eventSuccess) eventSuccess.style.display = 'block';
          eventForm.reset();
          setTimeout(function () {
            if (eventSuccess) eventSuccess.style.display = 'none';
          }, 5000);
        } else {
          throw new Error('Submission failed');
        }
      }).catch(function () {
        if (eventSuccess) {
          eventSuccess.style.color = '#e8000d';
          eventSuccess.textContent = 'Something went wrong. Please email us directly at info@lorainkartplex.com';
          eventSuccess.style.display = 'block';
        }
      }).finally(function () {
        submitBtn.textContent = 'Send Inquiry';
        submitBtn.disabled = false;
      });
    });

    eventForm.querySelectorAll('input, textarea, select').forEach(function (field) {
      field.addEventListener('input', function () {
        field.style.borderColor = '';
      });
    });
  }

  /* ---- Events page: Entity filter tabs ---- */
  var eventsGrid = document.getElementById('events-grid');
  var eventsEmpty = document.getElementById('events-empty');

  if (eventsGrid) {
    var filterBtns = document.querySelectorAll('.events-filter-btn');
    var monthBtns = document.querySelectorAll('.events-month-btn');
    var eventCards = eventsGrid.querySelectorAll('.event-card');
    var activeEntity = 'all';
    var activeMonth = 'all';

    function applyFilters() {
      var visibleCount = 0;
      eventCards.forEach(function (card) {
        var entityMatch = activeEntity === 'all' || card.getAttribute('data-entity') === activeEntity;
        var cardDate = card.getAttribute('data-date') || '';
        var cardMonth = cardDate.length >= 7 ? cardDate.substring(5, 7) : '';
        var monthMatch = activeMonth === 'all' || cardMonth === activeMonth;
        if (entityMatch && monthMatch) {
          card.style.display = '';
          visibleCount++;
        } else {
          card.style.display = 'none';
        }
      });
      if (eventsEmpty) {
        eventsEmpty.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    }

    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeEntity = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        applyFilters();
      });
    });

    monthBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeMonth = btn.getAttribute('data-month');
        monthBtns.forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        applyFilters();
      });
    });
  }

})();
