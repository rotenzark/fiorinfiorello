/* Fiorin Fiorello — main.js */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- INTRO ---------------- */
  var intro = document.getElementById('intro');
  if (intro) {
    if (reduce) { intro.classList.add('is-done'); }
    else {
      var kill = function () { intro.classList.add('is-done'); };
      setTimeout(kill, 1900);
      intro.addEventListener('click', kill);
      window.addEventListener('scroll', kill, { once: true, passive: true });
      setTimeout(function () { if (intro.parentNode) intro.setAttribute('aria-hidden', 'true'); }, 2700);
    }
  }

  /* ---------------- HEADER on scroll ---------------- */
  var head = document.getElementById('head');
  var onScroll = function () {
    if (head) head.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------------- MOBILE MENU ---------------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  var lastFocus = null;
  function openMenu() {
    nav.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    lastFocus = document.activeElement;
    var first = nav.querySelector('a');
    if (first) first.focus();
    document.addEventListener('keydown', escClose);
  }
  function closeMenu() {
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', escClose);
    if (lastFocus) burger.focus();
  }
  function escClose(e) { if (e.key === 'Escape') closeMenu(); }
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 960 && nav.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------------- REVEAL (IO + watchdog) ---------------- */
  var reveals = document.querySelectorAll('.reveal');
  function showAll() { reveals.forEach(function (el) { el.classList.add('is-visible'); }); }
  if (reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    // watchdog: se l'IO non scatta entro 1.5s, mostra tutto
    setTimeout(function () {
      var any = document.querySelector('.reveal.is-visible');
      if (!any) showAll();
    }, 1500);
  }

  /* ---------------- STAGIONE CORRENTE ---------------- */
  (function () {
    var m = new Date().getMonth() + 1; // 1-12
    var now = 'inverno';
    if (m >= 3 && m <= 5) now = 'primavera';
    else if (m >= 6 && m <= 8) now = 'estate';
    else if (m >= 9 && m <= 11) now = 'autunno';
    var el = document.querySelector('.season[data-season="' + now + '"]');
    if (el) el.classList.add('is-now');
  })();

  /* ---------------- ORARI DINAMICI (Europe/Rome) ---------------- */
  (function () {
    var hoursEl = document.getElementById('hours');
    var statusEl = document.getElementById('status');
    if (!hoursEl) return;
    // giorno + ora correnti a Roma
    var parts, day, hour, min;
    try {
      var fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
      parts = fmt.formatToParts(new Date());
      var wd = parts.find(function (p) { return p.type === 'weekday'; }).value;
      hour = parseInt(parts.find(function (p) { return p.type === 'hour'; }).value, 10);
      min = parseInt(parts.find(function (p) { return p.type === 'minute'; }).value, 10);
      var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
      day = map[wd];
    } catch (e) {
      var d = new Date(); day = d.getDay(); hour = d.getHours(); min = d.getMinutes();
    }
    // evidenzia oggi
    var todayLi = hoursEl.querySelector('li[data-day="' + day + '"]');
    if (todayLi) todayLi.classList.add('is-today');

    // orari: Lun-Sab 9-19, Dom chiuso
    var OPEN = 9, CLOSE = 19;
    var openToday = (day >= 1 && day <= 6);
    var mins = hour * 60 + min;
    var dict = { open: { it: 'Aperto ora', en: 'Open now' }, closes: { it: 'chiude alle 19', en: 'closes at 7pm' },
      opensAt: { it: 'apre alle 9', en: 'opens at 9am' }, closed: { it: 'Chiuso', en: 'Closed' } };
    var dayNamesIt = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
    var dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    function nextOpenDay(fromDay) { var d = fromDay; for (var i = 0; i < 7; i++) { d = (d + 1) % 7; if (d >= 1 && d <= 6) return d; } return 1; }

    function render(lang) {
      var isOpen = openToday && mins >= OPEN * 60 && mins < CLOSE * 60;
      var html;
      if (isOpen) {
        html = '<span class="open">● ' + dict.open[lang] + '</span> · ' + dict.closes[lang];
      } else {
        var nd, when;
        if (openToday && mins < OPEN * 60) { when = (lang === 'it' ? 'apre oggi alle 9' : 'opens today at 9am'); }
        else {
          nd = nextOpenDay(day);
          var name = (lang === 'it' ? dayNamesIt[nd] : dayNamesEn[nd]);
          when = (lang === 'it' ? 'apre ' + name + ' alle 9' : 'opens ' + name + ' at 9am');
        }
        html = '<span class="closed">● ' + dict.closed[lang] + '</span> · ' + when;
      }
      if (statusEl) statusEl.innerHTML = html;
    }
    render.current = render;
    window.__renderHours = render;
    render(document.documentElement.lang === 'en' ? 'en' : 'it');
  })();

  /* ---------------- LIGHTBOX ---------------- */
  (function () {
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var lbClose = document.getElementById('lbClose');
    if (!lb) return;
    var opener = null;
    function open(src, alt) {
      lbImg.src = src; lbImg.alt = alt || '';
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      lbClose.focus();
    }
    function close() {
      lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
      lbImg.src = ''; document.body.style.overflow = '';
      if (opener) opener.focus();
    }
    document.querySelectorAll('.shot').forEach(function (btn) {
      btn.addEventListener('click', function () {
        opener = btn;
        var img = btn.querySelector('img');
        open(btn.getAttribute('data-full'), img ? img.alt : '');
      });
    });
    lbClose.addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  })();

  /* ---------------- i18n IT/EN ---------------- */
  var EN = {
    'intro.sub': 'the four seasons, in bloom',
    'nav.about': 'The florist', 'nav.seasons': 'The seasons', 'nav.work': 'Creations', 'nav.occasions': 'Occasions', 'nav.where': 'Find us',
    'cta.order': 'Order',
    'hero.eyebrow': 'Floral boutique · Porta Vigentina, Milan', 'hero.t1': 'The seasons', 'hero.t2': 'in bloom',
    'hero.lead': 'Flowers, arrangements and settings that change with nature. Full of poetry, one of a kind.',
    'hero.cta1': 'Discover the seasons', 'hero.cta2': 'Order a flower',
    'cards.1t': 'Bouquets & Arrangements', 'cards.2t': 'Events & Settings',
    'about.eyebrow': 'The florist', 'about.t1': "I'm", 'about.t2': 'Elisabetta',
    'about.p1': 'My boutique, full of poetry and love, was born from the wish to work with flowers. My creations, one of a kind, are elegant and refined — the result of carefully chosen pairings.',
    'about.p2': 'Creative and passionate about my work, I make arrangements that stand out for their originality and stay in the memory of those who trust me.',
    'seasons.eyebrow': 'Our guiding thread', 'seasons.t1': 'The four', 'seasons.t2': 'seasons',
    'seasons.lead': 'Every season brings its own flowers, colours and character. The boutique follows them, one after another.',
    'season.now': 'This season', 'season.spring': 'Spring', 'season.spring.d': "Nature awakens: tulips, ranunculus and the first scents. A time of new beginnings.",
    'season.summer': 'Summer', 'season.summer.d': 'A burst of intense colours and scents. Bouquets full of light, like the longest days.',
    'season.autumn': 'Autumn', 'season.autumn.d': 'Warm, slightly wistful colours: amber, rust, foliage. Beauty that slows down.',
    'season.winter': 'Winter', 'season.winter.d': 'Brightened by holiday lights: fir, red berries and festive arrangements.',
    'occ.eyebrow': 'For every occasion', 'occ.t1': 'A flower for', 'occ.t2': 'every moment',
    'occ.n1': 'Bouquets', 'occ.n2': 'Birthdays', 'occ.n3': 'Graduations', 'occ.n4': 'Weddings', 'occ.n5': 'Events', 'occ.n6': 'Décor',
    'occ.i1': 'for a thought, a dedication, an “I love you”', 'occ.i2': 'bespoke arrangements to celebrate',
    'occ.i3': 'the right flower for a big milestone', 'occ.i4': 'elegant settings for your day',
    'occ.i5': 'floral décor for spaces and parties', 'occ.i6': 'plants and arrangements for home and shop',
    'gal.eyebrow': 'Our', 'gal.t1': 'Favourite', 'gal.t2': 'creations',
    'award.kicker': 'FuoriOrticola 2025 · Historic Shops', 'award.quote': 'Where time has stopped, but beauty keeps blooming',
    'award.note': 'The citation that named Fiorin Fiorello among the most beautiful shopfronts in Milan.',
    'rev.eyebrow': 'What clients say', 'rev.t1': 'Those who', 'rev.t2': 'chose us', 'rev.lead': 'Real reviews from Google.',
    'rev.q1': 'Kind, courteous staff who create elegant, striking arrangements. We will surely come back. Thank you!!',
    'rev.q2': 'Beautiful arrangements, kindness and professionalism — highly recommended.',
    'rev.q3': 'The owner Elisabetta, super kind and helpful.',
    'rev.q4': 'Great ideas for every need: birthdays, graduations, events.',
    'rev.q5': 'Roberto is an artist and the best florist around.',
    'contact.eyebrow': 'Order', 'contact.t1': 'You dream,', 'contact.t2': 'we create it',
    'contact.lead': "Tell us the occasion — we'll find the right flower. Home delivery in Milan.",
    'contact.call': 'Call 02 4547 0471', 'contact.ig': 'Message us on Instagram',
    'contact.mini': 'Or drop by the boutique at Corso di Porta Vigentina 31.',
    'where.eyebrow': 'Where we are', 'where.t1': 'In', 'where.t2': 'Porta Vigentina',
    'day.mon': 'Monday', 'day.tue': 'Tuesday', 'day.wed': 'Wednesday', 'day.thu': 'Thursday', 'day.fri': 'Friday', 'day.sat': 'Saturday', 'day.sun': 'Sunday', 'closed': 'Closed',
    'faq.eyebrow': 'Questions', 'faq.t1': 'Good to', 'faq.t2': 'know',
    'faq.q1': 'Do you deliver in Milan?', 'faq.a1': 'Yes, we deliver bouquets and arrangements across Milan. Contact us to arrange area and time.',
    'faq.q2': 'Do you create settings for weddings and events?', 'faq.a2': 'Yes, we create bespoke settings for weddings, events and special occasions, cared for down to the last detail.',
    'faq.q3': 'How can I order an arrangement?', 'faq.a3': 'You can call us, message us on Instagram @fiorinfiorello_milano, or visit the boutique at Corso di Porta Vigentina 31.',
    'faq.q4': 'Do the arrangements change with the season?', 'faq.a4': "Yes. We take inspiration from the flowers of the moment: each season brings different colours and scents.",
    'foot.tag': 'Floral boutique · Porta Vigentina, Milan', 'foot.demo': 'Demo website by Bespoke Studio',
    'ab.call': 'Call', 'ab.where': 'Find us', 'ab.ig': 'Instagram'
  };

  var i18nNodes = document.querySelectorAll('[data-i18n]');
  i18nNodes.forEach(function (el) { el.dataset.it = el.textContent; });

  function setLang(lang) {
    document.documentElement.lang = lang;
    i18nNodes.forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (lang === 'en' && EN[key] != null) el.textContent = EN[key];
      else el.textContent = el.dataset.it;
    });
    document.querySelectorAll('.lang__btn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (window.__renderHours) window.__renderHours(lang);
    try { localStorage.setItem('ff-lang', lang); } catch (e) {}
  }
  document.querySelectorAll('.lang__btn').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });
  var saved;
  try { saved = localStorage.getItem('ff-lang'); } catch (e) {}
  if (saved === 'en') setLang('en');

  /* ---------------- YEAR ---------------- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
