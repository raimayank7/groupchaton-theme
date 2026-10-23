/* GroupChatOn — reader-first theme script
   Designed & Developed by Nivesh Sahayak (https://www.niveshsahayak.in/). All rights reserved: see LICENSE.
   What it does:
   - Reader settings (theme, font, size, spacing, width), saved in this browser
   - Chapter pages: tidies the old post markup, Prev / Next, chapter list, progress, resume, ad slots
   - Series pages: cover, Start / Continue, searchable chapter list
   - Home: Continue reading + novel covers
   Chapter lists come from data/series/*.json on GitHub, plus Blogger's own feed for brand-new chapters. */
(function () {
  'use strict';

  var C = window.GCO || {};
  var BASE = C.base || '';
  var doc = document, html = doc.documentElement, body = doc.body;
  var PATH = location.pathname.replace(/\/+$/, '') || '/';

  /* ---------- small helpers ---------- */
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function el(tag, attrs, kids) {
    var n = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return n;
  }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  function icon(d) { return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + d + '</svg>'; }
  var ICON = {
    left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    aa: '<path d="M3 19 8 5l5 14M4.8 14h6.4"/><path d="M15 12.5c.6-1 1.6-1.5 2.8-1.5 1.8 0 3.2 1 3.2 3v5h-2.2"/><path d="M21 15.5c-.9-.4-1.8-.5-2.7-.5-1.5 0-2.8.7-2.8 2.1 0 1.2 1 1.9 2.2 1.9 1.6 0 2.6-1 3.3-2"/>'
  };
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function getJSON(url, cacheKey, maxAgeMin) {
    if (cacheKey) {
      try {
        var c = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
        if (c && Date.now() - c.t < maxAgeMin * 60000) return Promise.resolve(c.d);
      } catch (e) {}
    }
    return fetch(url, { credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (d) {
      if (cacheKey) try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
      return d;
    });
  }
  var toastTimer;
  function toast(msg, action, ms) {
    var t = $('#toast');
    if (!t) return;
    t.innerHTML = '';
    t.appendChild(el('span', { text: msg }));
    if (action) t.appendChild(el('button', { type: 'button', text: action.label, onclick: function () { hide(); action.run(); } }));
    t.appendChild(el('button', { type: 'button', 'class': 'toast-x', 'aria-label': 'Close', html: icon(ICON.x), onclick: hide }));
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hide, ms || 4000);
    function hide() { t.classList.remove('is-on'); }
  }

  /* ======================================================================
     Reader settings
     ====================================================================== */
  var DEFAULTS = { theme: 'auto', font: 'serif', size: 19, lh: 1.8, width: 'm', align: 'left', swipe: false };
  var WIDTHS = { s: '600px', m: '700px', l: '820px' };
  var settings = Object.assign({}, DEFAULTS, store.get('gco-reader', {}));
  var darkMQ = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;

  function applySettings() {
    var t = settings.theme;
    if (t === 'auto') t = darkMQ && darkMQ.matches ? 'dark' : 'light';
    html.setAttribute('data-theme', t);
    html.setAttribute('data-font', settings.font);
    html.setAttribute('data-align', settings.align);
    html.style.setProperty('--rd-size', settings.size + 'px');
    html.style.setProperty('--rd-lh', settings.lh);
    html.style.setProperty('--rd-measure', WIDTHS[settings.width] || WIDTHS.m);
    if (settings.font === 'readable' && !$('#font-readable')) {
      doc.head.appendChild(el('link', { id: 'font-readable', rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap' }));
    }
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', getComputedStyle(body).backgroundColor);
    fitRail();
  }
  // the side ad shows only if it fits in the margin beside the text (300px ad + 48px gap on each side)
  function fitRail() {
    var measure = parseInt(WIDTHS[settings.width] || WIDTHS.m, 10);
    html.classList.toggle('rail-fits', window.innerWidth >= measure + 2 * (300 + 48) + 40);
  }
  window.addEventListener('resize', fitRail);
  function saveSettings() { store.set('gco-reader', settings); applySettings(); syncSettingsUI(); }
  if (darkMQ && darkMQ.addEventListener) darkMQ.addEventListener('change', function () { if (settings.theme === 'auto') applySettings(); });
  applySettings();

  /* quick light/dark button in the header */
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var now = html.getAttribute('data-theme');
      settings.theme = now === 'dark' || now === 'black' ? 'light' : 'dark';
      saveSettings();
    });
  });

  /* ---------- sheets (settings panel, chapter list) ---------- */
  var backdrop = el('div', { 'class': 'sheet-backdrop', onclick: closeSheets });
  body.appendChild(backdrop);
  function makeSheet(id, title) {
    var s = el('section', { 'class': 'sheet', id: id, role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1' }, [
      el('div', { 'class': 'sheet-head' }, [
        el('h2', { text: title }),
        el('button', { type: 'button', 'class': 'icon-btn', 'aria-label': 'Close', html: icon(ICON.x), onclick: closeSheets })
      ]),
      el('div', { 'class': 'sheet-body' })
    ]);
    body.appendChild(s);
    return s;
  }
  var lastFocus;
  function openSheet(s) {
    closeSheets();
    lastFocus = doc.activeElement;
    s.classList.add('is-open');
    backdrop.classList.add('is-open');
    s.focus();
  }
  function closeSheets() {
    var open = $$('.sheet.is-open');
    open.forEach(function (s) { s.classList.remove('is-open'); });
    backdrop.classList.remove('is-open');
    if (open.length && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheets(); });

  var settingsSheet;
  function seg(key, options) {
    return el('div', { 'class': 'seg', role: 'group' }, options.map(function (o) {
      return el('button', { type: 'button', 'data-set': key, 'data-val': String(o[0]), text: o[1],
        onclick: function () { settings[key] = typeof DEFAULTS[key] === 'number' ? Number(o[0]) : o[0]; saveSettings(); } });
    }));
  }
  function buildSettings() {
    settingsSheet = makeSheet('reader-settings', 'Reading settings');
    var b = $('.sheet-body', settingsSheet);
    var sizeOut = el('output', { id: 'set-size' });
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Theme' }),
      el('div', { 'class': 'swatches', role: 'group' }, [['light', 'Light'], ['sepia', 'Sepia'], ['dark', 'Dark'], ['black', 'Black']].map(function (o) {
        return el('button', { type: 'button', 'class': 'sw-' + o[0], 'data-set': 'theme', 'data-val': o[0], text: o[1],
          onclick: function () { settings.theme = o[0]; saveSettings(); } });
      }))]));
    b.appendChild(el('label', { 'class': 'switch' }, [el('span', { text: 'Match my device (light / dark)' }),
      el('input', { type: 'checkbox', id: 'set-auto', onchange: function (e) {
        settings.theme = e.target.checked ? 'auto' : (html.getAttribute('data-theme') || 'light'); saveSettings(); } })]));
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Font' }),
      seg('font', [['serif', 'Book'], ['sans', 'Clean'], ['readable', 'Easy-read']])]));
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Text size' }),
      el('div', { 'class': 'stepper' }, [
        el('button', { type: 'button', 'aria-label': 'Smaller text', text: 'A−', onclick: function () { settings.size = Math.max(14, settings.size - 1); saveSettings(); } }),
        sizeOut,
        el('button', { type: 'button', 'aria-label': 'Bigger text', text: 'A+', onclick: function () { settings.size = Math.min(30, settings.size + 1); saveSettings(); } })
      ])]));
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Line spacing' }),
      seg('lh', [[1.55, 'Compact'], [1.8, 'Normal'], [2.05, 'Relaxed']])]));
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Page width' }),
      seg('width', [['s', 'Narrow'], ['m', 'Medium'], ['l', 'Wide']])]));
    b.appendChild(el('div', { 'class': 'set-row' }, [el('span', { text: 'Text alignment' }),
      seg('align', [['left', 'Left'], ['justify', 'Justified']])]));
    b.appendChild(el('label', { 'class': 'switch' }, [el('span', { text: 'Swipe left / right to change chapter' }),
      el('input', { type: 'checkbox', id: 'set-swipe', onchange: function (e) { settings.swipe = e.target.checked; saveSettings(); } })]));
    b.appendChild(el('button', { type: 'button', 'class': 'btn set-reset', text: 'Reset to default',
      onclick: function () { settings = Object.assign({}, DEFAULTS); saveSettings(); } }));
    syncSettingsUI();
  }
  function syncSettingsUI() {
    if (!settingsSheet) return;
    $$('[data-set]', settingsSheet).forEach(function (btn) {
      var k = btn.getAttribute('data-set');
      var cur = k === 'theme' ? html.getAttribute('data-theme') : String(settings[k]);
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-val') === cur));
    });
    $('#set-size').textContent = settings.size + ' px';
    $('#set-auto').checked = settings.theme === 'auto';
    $('#set-swipe').checked = !!settings.swipe;
  }
  $$('[data-open-settings]').forEach(function (b) {
    b.addEventListener('click', function () { if (!settingsSheet) buildSettings(); openSheet(settingsSheet); });
  });

  /* ---------- header: menu + hide while reading ---------- */
  var header = $('.site-header'), nav = $('#nav'), menuBtn = $('#menuToggle');
  if (menuBtn && nav) menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (header && !(nav && nav.classList.contains('is-open'))) {
      if (y > lastY + 6 && y > 240) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 120) header.classList.remove('is-hidden');
    }
    lastY = y;
  }, { passive: true });

  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ======================================================================
     Series data
     ====================================================================== */
  function loadSeriesIndex() {
    return getJSON(BASE + 'data/series.json', 'gco-series-index', 30).then(function (d) {
      return (d.series || []).map(function (s) { s.rx = new RegExp(s.match); return s; });
    });
  }
  function orderKey(path, title) {
    var ss = path.match(/ss(\d+)(?:_\d+)?\.html$/);
    if (ss) return [1, +ss[1]];
    var m = title.match(/^\s*Chapter\s+(\d+)/i) || path.match(/(\d+)(?:_\d+)?\.html$/);
    return [0, m ? +m[1] : 1e6];
  }
  function cmpKey(a, b) { return a[0] - b[0] || a[1] - b[1]; }
  var recentPromise;
  function recentPosts() {
    // Blogger's own feed: catches chapters posted after GitHub last rebuilt the lists
    if (!recentPromise) recentPromise = getJSON('/feeds/posts/summary?alt=json&max-results=25', 'gco-recent', 5)
      .then(function (d) {
        return ((d.feed && d.feed.entry) || []).map(function (e) {
          var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
          return [link ? link.href.replace(/^https?:\/\/[^/]+/, '') : '', e.title.$t, (e.published.$t || '').slice(0, 10)];
        });
      }).catch(function () { return []; });
    return recentPromise;
  }
  function loadChapters(s) {
    var listP = getJSON(BASE + 'data/series/' + s.id + '.json', 'gco-series-' + s.id, 30)
      .then(function (d) { return d.chapters || []; }).catch(function () { return []; });
    return Promise.all([listP, recentPosts()]).then(function (r) {
      var list = r[0].slice(), have = {};
      list.forEach(function (c) { have[c[0]] = 1; });
      var added = r[1].filter(function (c) { return s.rx.test(c[0]) && !have[c[0]]; });
      if (added.length) {
        list = list.concat(added);
        list.sort(function (a, b) { return cmpKey(orderKey(a[0], a[1]), orderKey(b[0], b[1])); });
      }
      return list;
    });
  }
  function seriesName(s) { return s.title + (s.part ? ' · ' + s.part : ''); }

  /* reading history (this browser only) */
  var HIST = 'gco-history', POS = 'gco-pos';
  function readSet(sid) { return store.get('gco-read-' + sid, []); }
  function markRead(sid, path) {
    var r = readSet(sid);
    if (r.indexOf(path) < 0) { r.push(path); if (r.length > 3000) r = r.slice(-3000); store.set('gco-read-' + sid, r); }
  }

  /* ======================================================================
     Chapter list (used in the drawer and on series pages)
     ====================================================================== */
  function chapterList(s, list, currentPath, opts) {
    opts = opts || {};
    var read = readSet(s.id), readMap = {}, posMap = store.get(POS, {});
    read.forEach(function (p) { readMap[p] = 1; });
    var wrap = el('div', { 'class': 'toc' });
    var input = el('input', { type: 'search', placeholder: 'Find a chapter: number or name', 'aria-label': 'Find a chapter' });
    var orderBtn = el('button', { type: 'button', 'class': 'btn btn-sm', text: 'Newest' });
    var ranges = el('div', { 'class': 'toc-ranges', role: 'group', 'aria-label': 'Chapter ranges' });
    var ul = el('ol', { 'class': 'toc-list' });
    wrap.appendChild(el('div', { 'class': 'toc-head' }, [el('div', { 'class': 'toc-tools' }, [input, orderBtn]), ranges]));
    wrap.appendChild(ul);

    var STEP = 100, newestFirst = false;
    var cur = Math.max(0, list.findIndex(function (c) { return c[0] === currentPath; }));
    var page = Math.floor(cur / STEP);
    function rangeLabel(i) {
      var a = i * STEP, b = Math.min(list.length, a + STEP) - 1;
      return (a + 1) + '–' + (b + 1);
    }
    function drawRanges() {
      ranges.innerHTML = '';
      var n = Math.ceil(list.length / STEP);
      if (n < 2) { ranges.hidden = true; return; }
      for (var i = 0; i < n; i++) (function (i) {
        ranges.appendChild(el('button', { type: 'button', 'aria-pressed': String(i === page), text: rangeLabel(i),
          onclick: function () { page = i; input.value = ''; draw(); } }));
      })(i);
    }
    function row(c, i) {
      var li = el('li', { 'class': (readMap[c[0]] ? 'is-read ' : '') + (c[0] === currentPath ? 'is-current' : '') });
      li.appendChild(el('a', { href: c[0] + (opts.resume && posMap[c[0]] ? '#continue' : '') }, [
        el('span', { 'class': 'n', text: String(i + 1) }), el('span', { 'class': 't', text: c[1] })]));
      return li;
    }
    function draw() {
      var q = input.value.trim().toLowerCase(), items = [];
      ul.innerHTML = '';
      if (q) {
        var num = /^\d+$/.test(q) ? +q : null;
        list.forEach(function (c, i) {
          var t = c[1].toLowerCase();
          if (num !== null ? (i + 1 === num || new RegExp('\\b' + q + '\\b').test(t)) : t.indexOf(q) >= 0) items.push([c, i]);
        });
        items = items.slice(0, 200);
        ranges.hidden = true;
      } else {
        drawRanges();
        for (var i = page * STEP; i < Math.min(list.length, page * STEP + STEP); i++) items.push([list[i], i]);
      }
      if (newestFirst) items.reverse();
      if (!items.length) ul.appendChild(el('li', { 'class': 'toc-empty', text: 'No chapter matches “' + input.value + '”.' }));
      var frag = doc.createDocumentFragment();
      items.forEach(function (x) { frag.appendChild(row(x[0], x[1])); });
      ul.appendChild(frag);
      orderBtn.textContent = newestFirst ? 'Oldest first' : 'Newest first';
    }
    input.addEventListener('input', draw);
    orderBtn.addEventListener('click', function () {
      newestFirst = !newestFirst;
      if (!input.value && newestFirst && page === 0 && cur === 0) page = Math.ceil(list.length / STEP) - 1;
      draw();
    });
    draw();
    wrap.scrollToCurrent = function () {
      var c = $('.is-current', ul);
      if (c) c.scrollIntoView({ block: 'center' });
    };
    return wrap;
  }

  /* ======================================================================
     Ads: slots are filled only when they come near the screen
     ====================================================================== */
  var A = C.ads || {};
  var adObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { adObserver.unobserve(e.target); fillAd(e.target); } });
  }, { rootMargin: '600px 0px' }) : null;
  function adSlot(kind, slotId) {
    if (!C.adClient || !slotId) return null;
    var d = el('div', { 'class': 'ad-slot ' + kind, 'data-slot': slotId, 'data-kind': kind });
    if (adObserver) adObserver.observe(d); else setTimeout(function () { fillAd(d); }, 0);
    return d;
  }
  function fillAd(d) {
    var ins = el('ins', { 'class': 'adsbygoogle', 'data-ad-client': C.adClient, 'data-ad-slot': d.getAttribute('data-slot') });
    var kind = d.getAttribute('data-kind');
    if (kind === 'in-article') { ins.setAttribute('data-ad-layout', 'in-article'); ins.setAttribute('data-ad-format', 'fluid'); ins.style.textAlign = 'center'; }
    else if (kind === 'multiplex') ins.setAttribute('data-ad-format', 'autorelaxed');
    else ins.setAttribute('data-ad-format', kind === 'rail' ? 'vertical' : 'auto');
    // the slot itself is full width on phones, so the ad must not stretch beyond it
    if (kind !== 'in-article' && kind !== 'multiplex') ins.setAttribute('data-full-width-responsive', 'false');
    ins.style.display = 'block';
    d.appendChild(ins);
    // collapse the slot when Google has no ad for it (older browsers lack CSS :has)
    if (window.MutationObserver) new MutationObserver(function (m, o) {
      var st = ins.getAttribute('data-ad-status');
      if (st === 'unfilled') { d.classList.add('is-empty'); o.disconnect(); }
      else if (st === 'filled') o.disconnect();
    }).observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }
  // a bottom anchor ad (AdSense Auto ads) adds .has-anchor so nothing important hides under it
  if (C.adClient) {
    var anchorChecks = 0, anchorTimer = setInterval(function () {
      var a = doc.querySelector('ins.adsbygoogle[data-anchor-status="displayed"], ins.adsbygoogle[data-anchor-shown="true"]');
      html.classList.toggle('has-anchor', !!(a && a.getBoundingClientRect().top > window.innerHeight / 2));
      if (++anchorChecks > 40) clearInterval(anchorTimer);
    }, 1500);
  }

  /* ======================================================================
     "Report a mistake" and "Request a novel" popups.
     They send through Blogger's own contact form (hidden on every page), so messages
     reach your email exactly like the Contact page. No contact form → links open the Contact page.
     ====================================================================== */
  var CF = {
    name: $('.contact-form-name'), email: $('.contact-form-email'), msg: $('.contact-form-email-message'),
    send: $('.contact-form-button-submit'), ok: $('.contact-form-success-message'), err: $('.contact-form-error-message')
  };
  var hasCF = !!(CF.email && CF.msg && CF.send && CF.ok && CF.err);
  var chapterInfo = null;       // set on chapter pages: { novel, title, url }
  var fbSheet = null, fbBusy = false;
  var REPORT_KINDS = ['Typo', 'Wrong name or word', 'Missing or repeated text', 'Other'];

  function field(label, input, hint) {
    return el('label', { 'class': 'fb-field' }, [el('span', { text: label }), input, hint ? el('small', { text: hint }) : null]);
  }
  function openFeedback(mode, quote) {
    if (!hasCF) { location.href = '/p/contact-us.html'; return; }
    if (!fbSheet) fbSheet = makeSheet('feedback', '');
    var report = mode === 'report';
    $('.sheet-head h2', fbSheet).textContent = report ? 'Report a mistake' : 'Request a novel';
    fbSheet.setAttribute('aria-label', report ? 'Report a mistake' : 'Request a novel');
    var b = $('.sheet-body', fbSheet);
    b.innerHTML = '';
    var me = store.get('gco-contact', {});
    var form = el('form', { 'class': 'fb-form', novalidate: 'novalidate' });
    var f = {};

    if (report) {
      if (chapterInfo) {
        form.appendChild(el('p', { 'class': 'fb-where' }, [el('b', { text: chapterInfo.title }), el('span', { text: chapterInfo.novel })]));
      } else {
        f.where = el('input', { type: 'text', placeholder: 'Novel and chapter, or paste the link' });
        form.appendChild(field('Which chapter?', f.where));
      }
      var kinds = el('div', { 'class': 'fb-kinds', role: 'radiogroup', 'aria-label': 'What kind of mistake?' });
      REPORT_KINDS.forEach(function (k, i) {
        kinds.appendChild(el('label', {}, [el('input', { type: 'radio', name: 'kind', value: k, checked: i === 0 ? 'checked' : null }), el('span', { text: k })]));
      });
      form.appendChild(kinds);
      f.quote = el('textarea', { rows: '3', maxlength: '800', placeholder: 'Copy the sentence with the mistake' });
      f.quote.value = quote || '';
      form.appendChild(field('Text from the chapter', f.quote, quote ? 'Filled in from the text you selected.' : 'Tip: select text in the chapter to fill this in.'));
      f.fix = el('textarea', { rows: '3', maxlength: '800', placeholder: 'How it should read, or what is wrong' });
      form.appendChild(field('What should it say?', f.fix));
    } else {
      f.novel = el('input', { type: 'text', maxlength: '200', placeholder: 'e.g. Omniscient Reader', required: 'required' });
      form.appendChild(field('Novel name', f.novel));
      f.link = el('input', { type: 'text', maxlength: '300', placeholder: 'Korean title, other names or a link' });
      form.appendChild(field('Other names or link (optional)', f.link));
      f.note = el('textarea', { rows: '3', maxlength: '800', placeholder: 'Why should we pick it up?' });
      form.appendChild(field('Anything else? (optional)', f.note));
    }
    f.name = el('input', { type: 'text', maxlength: '80', autocomplete: 'name' });
    f.name.value = me.name || '';
    f.email = el('input', { type: 'email', maxlength: '120', autocomplete: 'email', required: 'required' });
    f.email.value = me.email || '';
    form.appendChild(el('div', { 'class': 'fb-row' }, [field('Your name (optional)', f.name), field('Your email', f.email)]));
    form.appendChild(el('p', { 'class': 'fb-note', text: 'We only use your email to reply to you.' }));
    var btn = el('button', { type: 'submit', 'class': 'btn btn-primary fb-send', text: report ? 'Send report' : 'Send request' });
    var status = el('p', { 'class': 'fb-status', role: 'status', 'aria-live': 'polite' });
    form.appendChild(btn);
    form.appendChild(status);
    b.appendChild(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (fbBusy) return;
      function fail(msg, input) { status.className = 'fb-status is-error'; status.textContent = msg; if (input) input.focus(); }
      var lines;
      if (report) {
        var where = chapterInfo ? chapterInfo.novel + ' · ' + chapterInfo.title + '\n' + chapterInfo.url : f.where.value.trim();
        if (!where) return fail('Tell us which chapter.', f.where);
        if (!f.quote.value.trim() && !f.fix.value.trim()) return fail('Add the text with the mistake or what it should say.', f.quote);
        var kind = ($('input[name="kind"]:checked', form) || {}).value || 'Other';
        lines = ['[Report] ' + kind, 'Where: ' + where, '', 'Text: ' + (f.quote.value.trim() || '-'), '', 'Should be: ' + (f.fix.value.trim() || '-')];
      } else {
        if (!f.novel.value.trim()) return fail('Add the novel’s name.', f.novel);
        lines = ['[Novel request] ' + f.novel.value.trim(), 'Other names / link: ' + (f.link.value.trim() || '-'), '', 'Note: ' + (f.note.value.trim() || '-')];
      }
      var email = f.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Add a valid email so we can reply.', f.email);
      store.set('gco-contact', { name: f.name.value.trim(), email: email });

      // hand the message to Blogger's contact form and wait for its answer
      fbBusy = true;
      btn.disabled = true;
      status.className = 'fb-status';
      status.textContent = 'Sending…';
      if (CF.name) CF.name.value = f.name.value.trim();
      CF.email.value = email;
      CF.msg.value = lines.join('\n');
      CF.ok.textContent = '';
      CF.err.textContent = '';
      var started = Date.now();
      var timer = setInterval(function () {
        var ok = CF.ok.textContent.trim(), err = CF.err.textContent.trim();
        if (ok) {
          done();
          status.className = 'fb-status is-ok';
          status.textContent = report ? 'Thanks! We’ll fix it soon.' : 'Thanks! Your request is in.';
          if (f.quote) f.quote.value = '';
          if (f.fix) f.fix.value = '';
          setTimeout(closeSheets, 1800);
        } else if (err) {
          done();
          fail(err);
        } else if (Date.now() - started > 15000) {
          done();
          status.className = 'fb-status is-error';
          status.innerHTML = 'Couldn’t send just now. Please use the <a href="/p/contact-us.html">Contact page</a>.';
        }
      }, 300);
      function done() { clearInterval(timer); fbBusy = false; btn.disabled = false; }
      CF.send.click();
    });

    openSheet(fbSheet);
    var first = report ? (f.where || (quote ? f.fix : f.quote)) : f.novel;
    setTimeout(function () { first.focus(); }, 260);
  }
  doc.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-feedback]');
    if (!t || !hasCF) return;
    e.preventDefault();
    if (nav) nav.classList.remove('is-open');
    openFeedback(t.getAttribute('data-feedback'));
  });

  /* select text in a chapter → "Report typo" button */
  function selectionReporter(content) {
    if (!hasCF) return;
    var pick = el('button', { type: 'button', 'class': 'sel-report', hidden: 'hidden', html: icon('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>') + '<span>Report typo</span>' });
    body.appendChild(pick);
    var picked = '', t;
    // keep the selection when the button is pressed
    pick.addEventListener('mousedown', function (e) { e.preventDefault(); });
    pick.addEventListener('click', function () {
      var q = picked;
      pick.hidden = true;
      try { window.getSelection().removeAllRanges(); } catch (err) {}
      openFeedback('report', q);
    });
    doc.addEventListener('selectionchange', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var sel = window.getSelection(), text = sel ? String(sel).replace(/\s+/g, ' ').trim() : '';
        var inside = sel && sel.rangeCount && content.contains(sel.getRangeAt(0).commonAncestorContainer);
        if (inside && text.length > 1 && text.length <= 800 && !$('.sheet.is-open')) { picked = text; pick.hidden = false; }
        else if (!text) pick.hidden = true;
      }, 180);
    });
  }

  /* ======================================================================
     Page types
     ====================================================================== */
  var article = $('article.post');
  var postBody = article && $('.post-body', article);

  /* ---------- what the Blogger template leaves to this script (see the note in theme.xml) ---------- */
  // comments box on posts: same Disqus thread ids as the old theme (post url + post id)
  if (article && postBody && body.classList.contains('is-post') && C.disqus) {
    article.appendChild(el('div', { 'class': 'comments', id: 'comments', 'data-id': (postBody.id || '').replace('post-body-', ''),
      'data-url': location.origin + PATH }, [
      el('button', { type: 'button', 'class': 'btn', 'data-load-comments': '1', text: '💬 Show comments' }),
      el('div', { id: 'disqus_thread' })]));
    setupComments();
  }
  // label and search pages: title from the address
  var listTitle = $('.list-title');
  if (listTitle && body.classList.contains('is-list')) {
    var labelM = PATH.match(/^\/search\/label\/(.+)$/), q = new URLSearchParams(location.search).get('q');
    listTitle.textContent = labelM ? decodeURIComponent(labelM[1]).replace(/\+/g, ' ') : q ? 'Results for “' + q + '”' : 'All chapters';
    listTitle.hidden = false;
  }
  // list thumbnails from each post's featured image, cropped to a book-cover shape
  $$('.post-row[data-img]').forEach(function (row) {
    var src = row.getAttribute('data-img')
      .replace(/\/(s|w)\d+[^/]*\/(?=[^/]+$)/, '/w208-h288-p-k-no-nu/')
      .replace(/=(s|w)\d+[^/]*$/, '=w208-h288-p-k-no-nu');
    row.insertBefore(el('img', { 'class': 'thumb', src: src, alt: '', loading: 'lazy', width: '104', height: '144' }), row.firstChild);
  });

  loadSeriesIndex().then(function (series) {
    var match = null, isIndex = false;
    series.forEach(function (s) {
      if (PATH === s.index) { match = s; isIndex = true; }
      else if (!match && s.rx.test(PATH)) match = s;
    });
    if (postBody && match && isIndex) seriesPage(match);
    else if (postBody && match && body.classList.contains('is-post')) chapterPage(match);
    if (body.classList.contains('is-home')) homePage(series);
    tagPostRows(series);
  }).catch(function (e) {
    if (window.console) console.warn('GroupChatOn: series list not loaded', e);
  });

  if (body.classList.contains('is-page')) {
    var end = adSlot('ad-end', A.end);
    if (end && article) article.appendChild(end);
    if (/\/p\/contact/.test(PATH)) body.classList.add('is-contact');
  }

  /* ---------- tidy the old chapter markup ---------- */
  function cleanPostBody(root) {
    // orThemes shortcodes like ([fullHeader][background:...]) are plain text in the post
    var walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), node, hits = [];
    while ((node = walker.nextNode())) if (node.nodeValue.indexOf('([') >= 0) hits.push(node);
    hits.forEach(function (n) { n.nodeValue = n.nodeValue.replace(/\(\[[\s\S]*?\]\)/g, ''); });
    // Blogger's automatic Google-search links on names send readers away mid-chapter
    $$('a[href*="google.com/search"][href*="bbid="]', root).forEach(function (a) {
      var f = doc.createDocumentFragment();
      while (a.firstChild) f.appendChild(a.firstChild);
      a.parentNode.replaceChild(f, a);
    });
  }
  function words(n) { var t = (n.textContent || '').trim(); return t ? t.split(/\s+/).length : 0; }

  function buildCredits(content) {
    var ps = $$(':scope > p', content), start = -1;
    for (var i = Math.max(0, ps.length - 14); i < ps.length; i++) {
      var t = ps[i].textContent.trim();
      if (/^(\*\s*){3}$/.test(t) || /^if you find any (errors|mistakes)/i.test(t) || /^\[?\s*(author|translator|proofreader|editor)\s*[–—:-]/i.test(t)) { start = i; break; }
    }
    if (start < 0) return null;
    var dl = el('dl'), thanks = [];
    ps.slice(start).forEach(function (p) {
      var t = p.textContent.replace(/\s+/g, ' ').trim();
      var m = t.match(/^\[?\s*(Author|Translator|Proofreader|Editor|Original)\s*[–—:-]\s*([\s\S]+?)\s*\]?$/i);
      if (m) {
        var dd = el('dd');
        var a = $('a', p);
        if (a && a.textContent.trim() && /facebook|instagram|x\.com|twitter/.test(a.href)) {
          dd.appendChild(doc.createTextNode(m[2].replace(a.textContent.trim(), '').replace(/,\s*$/, '').trim()));
          if (dd.textContent) dd.appendChild(doc.createTextNode(' '));
          dd.appendChild(el('a', { href: a.href, rel: 'noopener', target: '_blank', text: a.textContent.trim() }));
        } else dd.textContent = m[2];
        dl.appendChild(el('dt', { text: m[1] }));
        dl.appendChild(dd);
      } else if (t && !/^(\*\s*){3}$/.test(t)) thanks.push(t);
      p.parentNode.removeChild(p);
    });
    var card = el('aside', { 'class': 'credits', 'aria-label': 'Credits' });
    if (thanks.length) card.appendChild(el('p', { 'class': 'credits-thanks', text: thanks.join(' ') }));
    if (dl.children.length) card.appendChild(dl);
    return card;
  }

  /* ---------- chapter page ---------- */
  function chapterPage(s) {
    body.classList.add('is-chapter');
    cleanPostBody(postBody);
    $$(':scope > .button-container, :scope > .separator', postBody).forEach(function (n) { n.parentNode.removeChild(n); });
    var content = $(':scope > .custom-post', postBody) || postBody;
    $$(':scope > p', content).forEach(function (p) {
      if (/^(\*\s*){3}$|^\*{3}$/.test(p.textContent.trim())) p.classList.add('scene-break');
    });
    var credits = buildCredits(content);
    var total = words(content);
    chapterInfo = { novel: seriesName(s), title: $('.post-title', article).textContent.trim(), url: location.origin + PATH };
    selectionReporter(content);

    // series link above the title
    var crumb = $('.crumb', article);
    if (crumb) {
      crumb.innerHTML = '';
      crumb.appendChild(el('a', { href: '/', text: 'Home' }));
      crumb.appendChild(el('span', { 'aria-hidden': 'true', text: '›' }));
      crumb.appendChild(el('a', { 'class': 'series-link', href: s.index, text: seriesName(s) }));
    }
    var meta = $('.post-meta', article);
    var timeLeft = el('span', { 'class': 'time-left', text: Math.max(1, Math.round(total / 230)) + ' min read' });
    if (meta) meta.appendChild(timeLeft);   // the date is put in front once the chapter list is in

    // top nav (filled once the chapter list is in)
    var topNav = el('nav', { 'class': 'chap-nav-top', 'aria-label': 'Chapter navigation' });
    meta ? meta.parentNode.insertBefore(topNav, meta.nextSibling) : article.insertBefore(topNav, postBody);
    var topAd = adSlot('ad-top', A.top);
    if (topAd) article.insertBefore(topAd, postBody);

    // in-article ads at paragraph breaks, roughly every C.adEveryWords words
    var every = C.adEveryWords || 900, maxIn = C.adMaxInArticle || 3, count = 0, seen = 0;
    if (A.inArticle && total > every * 1.3) {
      $$(':scope > p', content).some(function (p) {
        seen += words(p);
        if (seen >= every * (count + 1) && total - seen > 350) {
          var slot = adSlot('in-article', A.inArticle);
          if (slot) { p.parentNode.insertBefore(slot, p.nextSibling); count++; }
        }
        return count >= maxIn;
      });
    }

    // end of chapter: ad, credits, then the big Next button (kept apart so nobody taps the ad by mistake)
    var endAd = adSlot('ad-end', A.end);
    if (endAd) postBody.appendChild(endAd);
    if (credits) postBody.appendChild(credits);
    var endNav = el('section', { 'class': 'chap-end', 'aria-label': 'Next chapter' });
    postBody.parentNode.insertBefore(endNav, postBody.nextSibling);

    // desktop rail
    var rail = $('.rail-inner');
    var railAd = rail && adSlot('rail', A.rail);
    if (railAd) rail.appendChild(railAd);

    // below the comments box (made earlier, Disqus loads only when asked)
    var multi = adSlot('multiplex', A.multiplex);
    var comments = $('.comments', article.parentNode);
    if (multi) (comments || endNav).parentNode.insertBefore(multi, (comments || endNav).nextSibling);

    // progress bar + time left + saving position
    var bar = $('.read-progress span');
    var lastSave = 0, progress = 0;
    function measure() {
      var r = content.getBoundingClientRect();
      var h = Math.max(1, r.height);
      progress = Math.min(1, Math.max(0, (window.innerHeight - r.top) / h));
      return progress;
    }
    function onScroll() {
      var p = measure();
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      var left = Math.round(total * (1 - p) / 230);
      timeLeft.textContent = p > 0.02 ? (left < 1 ? 'Almost done' : left + ' min left') : Math.max(1, Math.round(total / 230)) + ' min read';
      if (Date.now() - lastSave > 1500) { lastSave = Date.now(); save(); }
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); }
    }, { passive: true });
    window.addEventListener('pagehide', save);
    doc.addEventListener('visibilitychange', function () { if (doc.visibilityState === 'hidden') save(); });

    var chapterIndex = -1, chapterCount = 0;
    function save() {
      var pos = store.get(POS, {});
      if (progress > 0.03 && progress < 0.97) pos[PATH] = +progress.toFixed(3); else delete pos[PATH];
      var keys = Object.keys(pos);
      if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(function (k) { delete pos[k]; });
      store.set(POS, pos);
      var h = store.get(HIST, {});
      h[s.id] = { u: PATH, t: $('.post-title', article).textContent.trim(), i: chapterIndex, n: chapterCount, p: +progress.toFixed(3), ts: Date.now() };
      store.set(HIST, h);
      if (progress > 0.9) markRead(s.id, PATH);
    }

    // resume where the reader stopped
    var savedPos = store.get(POS, {})[PATH];
    function jumpTo(p) {
      var r = content.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height * p - window.innerHeight * 0.85, behavior: 'auto' });
    }
    if (savedPos) {
      if (location.hash === '#continue') {
        requestAnimationFrame(function () { jumpTo(savedPos); });
        history.replaceState(null, '', location.pathname + location.search);
      } else toast('Pick up where you left off?', { label: 'Resume', run: function () { jumpTo(savedPos); } }, 7000);
    }

    // chapter list → Prev / Next / drawer
    loadChapters(s).then(function (list) {
      chapterCount = list.length;
      chapterIndex = list.findIndex(function (c) { return c[0] === PATH; });
      if (chapterIndex < 0) {
        // a chapter newer than both lists: place it by its number
        var key = orderKey(PATH, $('.post-title', article).textContent);
        chapterIndex = list.findIndex(function (c) { return cmpKey(orderKey(c[0], c[1]), key) > 0; });
        if (chapterIndex < 0) chapterIndex = list.length;
        list.splice(chapterIndex, 0, [PATH, $('.post-title', article).textContent.trim(), '']);
        chapterCount = list.length;
      }
      var prev = list[chapterIndex - 1], next = list[chapterIndex + 1];
      drawNav(s, list, prev, next);
      var day = list[chapterIndex][2];
      if (meta && day) {
        meta.insertBefore(el('span', { 'class': 'dot', text: '·' }), meta.firstChild);
        meta.insertBefore(el('time', { 'class': 'published', datetime: day, text: fmtDate(day) }), meta.firstChild);
      }
      save();
    });

    function drawNav(s, list, prev, next) {
      function navBtn(c, label, dir) {
        return el('a', { 'class': 'btn btn-sm', href: c ? c[0] : '#', 'aria-disabled': c ? null : 'true', rel: dir,
          html: (dir === 'prev' ? icon(ICON.left) : '') + '<span>' + label + '</span>' + (dir === 'next' ? icon(ICON.right) : '') });
      }
      topNav.innerHTML = '';
      topNav.appendChild(navBtn(prev, 'Prev', 'prev'));
      topNav.appendChild(el('button', { type: 'button', 'class': 'btn btn-sm', 'data-open-chapters': '1', html: icon(ICON.list) + '<span>Chapters</span>' }));
      topNav.appendChild(navBtn(next, 'Next', 'next'));

      endNav.innerHTML = '';
      if (next) {
        endNav.appendChild(el('a', { 'class': 'chap-end-next', href: next[0], rel: 'next' }, [
          el('span', {}, [el('small', { text: 'Next chapter' }), doc.createTextNode(next[1])]),
          el('span', { html: icon(ICON.right) })]));
      } else {
        endNav.appendChild(el('div', { 'class': 'caught-up', html: '<b>You’re all caught up!</b>New chapters of ' +
          seriesName(s).replace(/</g, '&lt;') + ' are posted regularly. Check back soon.' }));
      }
      endNav.appendChild(el('div', { 'class': 'chap-end-row' }, [
        navBtn(prev, 'Previous', 'prev'),
        el('a', { 'class': 'btn btn-sm', href: s.index, html: icon(ICON.list) + '<span>All chapters</span>' })]));
      endNav.appendChild(el('a', { 'class': 'text-btn', href: '/p/contact-us.html', 'data-feedback': 'report',
        text: 'Spotted a typo or mistake? Tell us' }));

      // header buttons, keyboard, swipe, prefetch
      $$('[data-chap-prev]').forEach(function (b) { b.hidden = !prev; if (prev) b.href = prev[0]; });
      $$('[data-chap-next]').forEach(function (b) { b.hidden = !next; if (next) b.href = next[0]; });
      if (next) doc.head.appendChild(el('link', { rel: 'prefetch', href: next[0] }));

      var drawer;
      $$('[data-open-chapters]').forEach(function (b) {
        b.addEventListener('click', function () {
          if (!drawer) {
            drawer = makeSheet('chapter-drawer', seriesName(s));
            $('.sheet-body', drawer).appendChild(chapterList(s, list, PATH));
          }
          openSheet(drawer);
          var t = $('.toc', drawer);
          if (t && t.scrollToCurrent) t.scrollToCurrent();
        });
      });

      doc.addEventListener('keydown', function (e) {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || $('.sheet.is-open')) return;
        var tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
        if (e.key === 'ArrowLeft' && prev) location.href = prev[0];
        if (e.key === 'ArrowRight' && next) location.href = next[0];
      });
      var sx, sy, st;
      doc.addEventListener('touchstart', function (e) {
        if (e.touches.length !== 1) return;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
      }, { passive: true });
      doc.addEventListener('touchend', function (e) {
        if (!settings.swipe || sx === undefined || $('.sheet.is-open')) return;
        var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
        if (Date.now() - st < 600 && Math.abs(dx) > 90 && Math.abs(dy) < 45 && !String(window.getSelection())) {
          var target = dx < 0 ? next : prev;
          if (target) location.href = target[0];
        }
        sx = undefined;
      }, { passive: true });
    }
    onScroll();
  }

  /* ---------- comments: Disqus on tap, same thread ids as the old theme ---------- */
  function setupComments() {
    var box = $('.comments');
    if (!box || !C.disqus) return;
    var btn = $('[data-load-comments]', box);
    if (!btn) return;
    btn.addEventListener('click', function () {
      btn.hidden = true;
      var url = box.getAttribute('data-url'), id = box.getAttribute('data-id');
      window.disqus_config = function () { this.page.url = url; this.page.identifier = id; };
      var sc = doc.createElement('script');
      sc.src = 'https://' + C.disqus + '.disqus.com/embed.js';
      sc.setAttribute('data-timestamp', String(+new Date()));
      doc.body.appendChild(sc);
    });
  }

  /* ---------- series index post ---------- */
  function seriesPage(s) {
    body.classList.add('is-series');
    cleanPostBody(postBody);
    // the old Table of Content scripts are replaced by the list below
    $$('.stylish-header1, .custom-tab-container, #arcTitleDescription', postBody).forEach(function (n) { n.remove(); });
    $$(':scope > h3[align="center"], :scope > body > h3', postBody).forEach(function (n) { n.remove(); });
    var hist = store.get(HIST, {})[s.id];
    var hero = el('div', { 'class': 'series-hero' });
    hero.appendChild(el('img', { src: s.cover, alt: '', loading: 'eager', width: '400', height: '600' }));
    var info = el('div');
    if (s.alt) info.appendChild(el('p', { 'class': 'alt', text: 'Also known as: ' + s.alt }));
    var genres = el('div', { 'class': 'genres' });
    (s.genres || []).forEach(function (g) { genres.appendChild(el('span', { 'class': 'chip', text: g })); });
    info.appendChild(genres);
    var stats = el('div', { 'class': 'stats' });
    info.appendChild(stats);
    var actions = el('div', { 'class': 'actions' });
    info.appendChild(actions);
    hero.appendChild(info);
    var meta = $('.post-meta', article);
    article.insertBefore(hero, meta ? meta.nextSibling : postBody);
    if (meta) meta.hidden = true;

    var tocBox = el('section', { 'class': 'series-toc', id: 'chapters' }, [el('h2', { text: 'Chapters' })]);
    postBody.appendChild(tocBox);
    var mid = adSlot('in-article', A.inArticle);
    if (mid) postBody.insertBefore(mid, tocBox);

    loadChapters(s).then(function (list) {
      if (!list.length) return;
      var newest = list.reduce(function (a, c) { return c[2] > a[2] ? c : a; }, list[0]);
      stats.innerHTML = '';
      stats.appendChild(el('span', { text: list.length + ' chapters' }));
      if (newest[2]) stats.appendChild(el('span', { text: 'Updated ' + fmtDate(newest[2]) }));
      actions.innerHTML = '';
      if (hist && hist.u) {
        actions.appendChild(el('a', { 'class': 'btn btn-primary', href: hist.u + (hist.p > 0.03 && hist.p < 0.97 ? '#continue' : ''),
          text: 'Continue: ' + hist.t.replace(/[:–—-].*$/, '').trim() }));
        actions.appendChild(el('a', { 'class': 'btn', href: list[0][0], text: 'Start over' }));
      } else {
        actions.appendChild(el('a', { 'class': 'btn btn-primary', href: list[0][0], text: 'Start reading' }));
      }
      actions.appendChild(el('a', { 'class': 'btn', href: list[list.length - 1][0], text: 'Latest chapter' }));
      tocBox.appendChild(chapterList(s, list, hist ? hist.u : '', { resume: true }));
    });
  }

  /* ---------- home page ---------- */
  function homePage(series) {
    var grid = $('#series-grid');
    if (grid) {
      grid.innerHTML = '';
      series.forEach(function (s) {
        var fresh = s.newest && (Date.now() - new Date(s.newest[2] + 'T12:00:00')) < 7 * 864e5;
        grid.appendChild(el('a', { 'class': 'series-card', href: s.index }, [
          el('div', { 'class': 'cover' }, [el('img', { src: s.cover, alt: '', loading: 'lazy', width: '400', height: '600' }),
            fresh ? el('span', { 'class': 'badge', text: 'NEW' }) : null]),
          el('b', { text: s.title + (s.part ? ' (' + s.part + ')' : '') }),
          el('small', { text: s.count + ' chapters' + (s.newest ? ' · ' + fmtDate(s.newest[2]) : '') })]));
      });
    }
    var hist = store.get(HIST, {}), ids = Object.keys(hist).sort(function (a, b) { return hist[b].ts - hist[a].ts; });
    var box = $('#continue'), cg = $('#continue-grid');
    if (box && cg && ids.length) {
      ids.slice(0, 6).forEach(function (id) {
        var h = hist[id], s = series.filter(function (x) { return x.id === id; })[0];
        if (!s || !h.u) return;
        var pct = h.n ? Math.round(((h.i + (h.p || 0)) / h.n) * 100) : 0;
        cg.appendChild(el('a', { 'class': 'continue-card', href: h.u + (h.p > 0.03 && h.p < 0.97 ? '#continue' : '') }, [
          el('img', { src: s.cover, alt: '', loading: 'lazy', width: '56', height: '80' }),
          el('div', { style: 'flex:1;min-width:0' }, [
            el('b', { text: s.title + (s.part ? ' (' + s.part + ')' : '') }),
            el('small', { text: h.t }),
            el('div', { 'class': 'bar', 'aria-hidden': 'true' }, [el('span', { style: 'width:' + Math.min(100, pct) + '%' })])])]));
      });
      box.hidden = !cg.children.length;
    }
    var homeAd = adSlot('ad-end', A.home);
    var slot = $('#home-ad');
    if (homeAd && slot) slot.appendChild(homeAd);
  }

  /* ---------- post lists: show which novel each chapter belongs to ---------- */
  function tagPostRows(series) {
    var rows = $$('.post-row'), need = {};
    if (!rows.length) return;
    rows.forEach(function (row) {
      var a = $('h3 a', row), m = $('.row-meta', row);
      if (!a || !m) return;
      var p = a.getAttribute('href').replace(/^https?:\/\/[^/]+/, '');
      row.setAttribute('data-path', p);
      var s = series.filter(function (x) { return x.rx.test(p); })[0];
      if (s) { m.appendChild(el('span', { 'class': 'series-tag', text: s.title + (s.part ? ' (' + s.part + ')' : '') })); need[s.id] = s; }
    });
    // dates: newest posts from Blogger's feed, the rest from the chapter lists
    function addDates(list) {
      var map = {};
      list.forEach(function (c) { map[c[0]] = c[2]; });
      rows.forEach(function (row) {
        var d = map[row.getAttribute('data-path')], m = $('.row-meta', row);
        if (d && m && !$('time', m)) m.appendChild(el('time', { datetime: d, text: fmtDate(d) }));
      });
    }
    recentPosts().then(addDates);
    Object.keys(need).forEach(function (id) { loadChapters(need[id]).then(addDates); });
  }

  /* ---------- ad-blocker note: small and easy to close ---------- */
  window.addEventListener('load', function () {
    if (!C.adClient) return;
    setTimeout(function () {
      var ok = window.adsbygoogle && window.adsbygoogle.loaded;
      if (ok) return;
      html.classList.add('no-ads');   // ads blocked: close up the empty ad boxes
      if (Date.now() < store.get('gco-adnote', 0)) return;
      var bar = el('div', { 'class': 'notice-bar', role: 'note' }, [
        el('p', { text: C.adblockText || 'We keep ads light so reading stays comfortable. Please allow ads on GroupChatOn: they keep new chapters coming.' }),
        el('button', { type: 'button', 'class': 'icon-btn', 'aria-label': 'Close', html: icon(ICON.x), onclick: function () {
          store.set('gco-adnote', Date.now() + 7 * 864e5); bar.remove(); } })]);
      header && header.parentNode.insertBefore(bar, header.nextSibling);
    }, 3500);
  });
})();
