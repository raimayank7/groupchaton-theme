/* GroupChatOn — free tools: loader + shared kit
   Designed & Developed by Nivesh Sahayak (https://www.niveshsahayak.in/). All rights reserved: see LICENSE.
   A Blogger page becomes a tool page with:  <div class="gco-page" data-gco-tool="pdf-merge"> ... <div class="gco-tool-mount"></div> ... </div>
   gco.js loads this file; this file loads tools.css and tools/<id>.js, which calls GCOTools.register(). */
(function () {
  'use strict';
  var C = window.GCO || {};
  var BASE = C.base || '';
  var doc = document;
  var T = window.GCOTools = window.GCOTools || {};

  /* ---------- the tool catalogue (hub page, related tools, structured data) ---------- */
  T.list = [
    { id: 'pdf-merge', name: 'Merge PDF', path: '/p/pdf-merge-tool.html', cat: 'PDF', icon: '🧩', desc: 'Join several PDFs into one, in any order.' },
    { id: 'pdf-split', name: 'Split PDF', path: '/p/pdf-splitter-extract-pages.html', cat: 'PDF', icon: '✂️', desc: 'Pull out pages or split every page into its own file.' },
    { id: 'pdf-organize', name: 'PDF Organizer', path: '/p/pdf-organizer.html', cat: 'PDF', icon: '🗂️', desc: 'Rotate, delete and reorder PDF pages.', isNew: true },
    { id: 'pdf-to-image', name: 'PDF to Image', path: '/p/pdf-to-image-converter-tool.html', cat: 'PDF', icon: '🖼️', desc: 'Turn PDF pages into JPG or PNG pictures.' },
    { id: 'pdf-to-text', name: 'PDF to Text', path: '/p/pdf-to-text-converter.html', cat: 'PDF', icon: '📝', desc: 'Copy all the text out of a PDF.' },
    { id: 'image-to-pdf', name: 'Image to PDF', path: '/p/image-to-pdf-converter.html', cat: 'PDF', icon: '📄', desc: 'Make one PDF from your photos or scans.' },
    { id: 'text-to-pdf', name: 'Text to PDF', path: '/p/text-to-pdf-converter.html', cat: 'PDF', icon: '📃', desc: 'Type or paste text and save it as a PDF.' },
    { id: 'html-to-pdf', name: 'HTML to PDF', path: '/p/html-to-pdf-converter.html', cat: 'PDF', icon: '🌐', desc: 'Turn HTML code into a PDF document.' },
    { id: 'image-convert', name: 'Image Converter', path: '/p/advance-image-convertor.html', cat: 'Image', icon: '🔁', desc: 'Convert images to JPG, PNG or WebP in bulk.' },
    { id: 'image-compress', name: 'Image Compressor', path: '/p/image-compressor.html', cat: 'Image', icon: '🗜️', desc: 'Shrink and resize photos without visible loss.', isNew: true },
    { id: 'ocr', name: 'Image to Text (OCR)', path: '/p/image-to-text-ocr-converter.html', cat: 'Image', icon: '🔍', desc: 'Read the text inside photos and screenshots.' },
    { id: 'qr', name: 'QR Code Generator', path: '/p/url-to-qr-code-generator.html', cat: 'Links', icon: '🔳', desc: 'Make a QR code for any link or text.' },
    { id: 'shorten', name: 'URL Shortener', path: '/p/url-shortener.html', cat: 'Links', icon: '🔗', desc: 'Turn long links into short ones.' },
    { id: 'whatsapp-direct', name: 'WhatsApp Direct Message', path: '/p/direct-whatsapp-message-form.html', cat: 'Links', icon: '💬', desc: 'Message a number without saving it.' },
    { id: 'zip', name: 'Zip & Unzip', path: '/p/file-compression.html', cat: 'Files', icon: '📦', desc: 'Pack files into a ZIP, or open a ZIP.' },
    { id: 'tts', name: 'Text to Speech', path: '/p/text-to-speech-tts-converter.html', cat: 'Text & Voice', icon: '🔊', desc: 'Listen to any text read aloud.' },
    { id: 'stt', name: 'Speech to Text', path: '/p/audio-to-text-converter-speech.html', cat: 'Text & Voice', icon: '🎙️', desc: 'Speak and get the words typed for you.' },
    { id: 'word-count', name: 'Word Counter', path: '/p/word-counter.html', cat: 'Text & Voice', icon: '🔢', desc: 'Count words, characters and reading time.', isNew: true },
    { id: 'case', name: 'Case Converter', path: '/p/case-converter.html', cat: 'Text & Voice', icon: '🔠', desc: 'UPPER, lower, Title and Sentence case in one click.', isNew: true },
    { id: 'password', name: 'Password Generator', path: '/p/password-generator.html', cat: 'Security', icon: '🔐', desc: 'Strong random passwords, made on your device.', isNew: true }
  ];
  T.find = function (id) { return T.list.filter(function (t) { return t.id === id; })[0]; };

  /* ---------- libraries (fixed versions) ---------- */
  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/';
  var LIBS = {
    pdflib: [CDN + 'pdf-lib/1.17.1/pdf-lib.min.js', 'PDFLib'],
    pdfjs: [CDN + 'pdf.js/3.11.174/pdf.min.js', 'pdfjsLib'],
    jszip: [CDN + 'jszip/3.10.1/jszip.min.js', 'JSZip'],
    jspdf: [CDN + 'jspdf/2.5.1/jspdf.umd.min.js', 'jspdf'],
    html2canvas: [CDN + 'html2canvas/1.4.1/html2canvas.min.js', 'html2canvas'],
    tesseract: ['https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js', 'Tesseract'],
    qrcode: [CDN + 'qrcode-generator/1.4.4/qrcode.min.js', 'qrcode']
  };
  var loading = {};
  T.loadScript = function (src) {
    if (!loading[src]) loading[src] = new Promise(function (ok, fail) {
      var s = doc.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { ok(); };
      s.onerror = function () { delete loading[src]; fail(new Error('Could not load ' + src.split('/').pop() + '. Check your connection and try again.')); };
      doc.head.appendChild(s);
    });
    return loading[src];
  };
  T.lib = function (name) {
    var l = LIBS[name];
    return T.loadScript(l[0]).then(function () {
      var g = window[l[1]];
      if (name === 'pdfjs' && g && !g.GlobalWorkerOptions.workerSrc) g.GlobalWorkerOptions.workerSrc = CDN + 'pdf.js/3.11.174/pdf.worker.min.js';
      return g;
    });
  };

  /* ---------- small helpers ---------- */
  var h = T.h = function (tag, attrs, kids) {
    var n = doc.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c !== null && c !== undefined && c !== false) n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return n;
  };
  T.bytes = function (n) {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1048576).toFixed(n < 10485760 ? 2 : 1) + ' MB';
  };
  T.baseName = function (name) { return String(name || 'file').replace(/\.[^.]+$/, ''); };
  T.read = function (file, how) {
    return new Promise(function (ok, fail) {
      var r = new FileReader();
      r.onload = function () { ok(r.result); };
      r.onerror = function () { fail(new Error('Could not read ' + file.name)); };
      if (how === 'dataURL') r.readAsDataURL(file); else if (how === 'text') r.readAsText(file); else r.readAsArrayBuffer(file);
    });
  };
  T.download = function (blob, name) {
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name });
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  };
  T.zip = function (items, onProgress) {
    return T.lib('jszip').then(function (JSZip) {
      var z = new JSZip();
      items.forEach(function (it) { z.file(it.name, it.blob); });
      return z.generateAsync({ type: 'blob' }, function (m) { if (onProgress) onProgress(m.percent / 100); });
    });
  };
  T.copy = function (text, btn) {
    var done = function () {
      if (!btn) return;
      var old = btn.textContent; btn.textContent = 'Copied ✓';
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done);
    var ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text;
    doc.body.appendChild(ta); ta.select();
    try { doc.execCommand('copy'); done(); } catch (e) {}
    ta.remove();
    return Promise.resolve();
  };
  T.store = {
    get: function (k, d) { try { var v = localStorage.getItem('gco-tool-' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('gco-tool-' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- building blocks ---------- */
  T.button = function (text, opts) {
    opts = opts || {};
    return h('button', { type: 'button', 'class': 'tbtn' + (opts.primary ? ' tbtn-primary' : '') + (opts.small ? ' tbtn-sm' : ''),
      onclick: opts.onclick, disabled: opts.disabled }, [text]);
  };
  T.field = function (label, input, hint) {
    return h('label', { 'class': 'tfield' }, [h('span', { 'class': 'tfield-label', text: label }), input, hint ? h('small', { text: hint }) : null]);
  };
  T.select = function (options, value) {
    var s = h('select', {}, options.map(function (o) {
      var val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : o;
      return h('option', { value: val, selected: String(val) === String(value) }, [lab]);
    }));
    return s;
  };
  T.seg = function (options, value, onChange) {
    var wrap = h('div', { 'class': 'tseg', role: 'group' });
    function draw() {
      wrap.innerHTML = '';
      options.forEach(function (o) {
        wrap.appendChild(h('button', { type: 'button', 'aria-pressed': String(o[0] === value), text: o[1],
          onclick: function () { value = o[0]; draw(); if (onChange) onChange(value); } }));
      });
    }
    draw();
    wrap.value = function () { return value; };
    return wrap;
  };
  T.row = function (kids, cls) { return h('div', { 'class': 'trow' + (cls ? ' ' + cls : '') }, kids); };

  // drop area: click, drag and drop, or paste (images)
  T.dropzone = function (opts) {
    var input = h('input', { type: 'file', accept: opts.accept || '', multiple: opts.multiple ? true : null, hidden: true });
    if (opts.folder) { input.setAttribute('webkitdirectory', ''); input.setAttribute('directory', ''); }
    var zone = h('div', { 'class': 'tdrop', tabindex: '0', role: 'button', 'aria-label': opts.label }, [
      h('span', { 'class': 'tdrop-ic', 'aria-hidden': 'true', text: opts.icon || '📂' }),
      h('b', { text: opts.label || 'Choose files' }),
      h('small', { text: opts.hint || 'or drag and drop them here' }),
      input]);
    function take(list) {
      var files = Array.prototype.slice.call(list || []);
      if (opts.filter) files = files.filter(opts.filter);
      if (files.length) opts.onFiles(opts.multiple ? files : [files[0]]);
    }
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    input.addEventListener('change', function () { take(input.files); input.value = ''; });
    ['dragenter', 'dragover'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.add('is-over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { zone.addEventListener(ev, function (e) { e.preventDefault(); zone.classList.remove('is-over'); }); });
    zone.addEventListener('drop', function (e) { take(e.dataTransfer.files); });
    if (opts.paste) doc.addEventListener('paste', function (e) {
      var items = (e.clipboardData && e.clipboardData.files) || [];
      if (items.length) take(items);
    });
    return zone;
  };

  // a list of files the user can reorder and remove
  T.fileList = function (onChange) {
    var files = [], ul = h('ol', { 'class': 'tfiles' });
    function draw() {
      ul.innerHTML = '';
      files.forEach(function (f, i) {
        ul.appendChild(h('li', {}, [
          f.thumb ? h('img', { src: f.thumb, alt: '' }) : h('span', { 'class': 'tfiles-ic', text: '📄' }),
          h('span', { 'class': 'tfiles-name' }, [h('b', { text: f.file.name }), h('small', { text: T.bytes(f.file.size) + (f.note ? ' · ' + f.note : '') })]),
          h('span', { 'class': 'tfiles-act' }, [
            h('button', { type: 'button', 'aria-label': 'Move up', disabled: i === 0, text: '↑', onclick: function () { move(i, -1); } }),
            h('button', { type: 'button', 'aria-label': 'Move down', disabled: i === files.length - 1, text: '↓', onclick: function () { move(i, 1); } }),
            h('button', { type: 'button', 'aria-label': 'Remove', text: '✕', onclick: function () { files.splice(i, 1); draw(); } })])]));
      });
      ul.hidden = !files.length;
      if (onChange) onChange(files);
    }
    function move(i, d) { var x = files.splice(i, 1)[0]; files.splice(i + d, 0, x); draw(); }
    return {
      el: ul,
      add: function (list) {
        list.forEach(function (file) {
          var item = { file: file };
          files.push(item);
          if (/^image\//.test(file.type)) { item.thumb = URL.createObjectURL(file); }
        });
        draw();
      },
      files: function () { return files.map(function (f) { return f.file; }); },
      clear: function () { files = []; draw(); },
      draw: draw
    };
  };

  // status line with optional progress bar
  T.status = function () {
    var bar = h('div', { 'class': 'tprogress', hidden: true }, [h('span')]);
    var msg = h('p', { 'class': 'tstatus', role: 'status', 'aria-live': 'polite' });
    var wrap = h('div', { 'class': 'tstatus-wrap' }, [bar, msg]);
    function set(kind, text) { msg.className = 'tstatus' + (kind ? ' is-' + kind : ''); msg.textContent = text || ''; }
    return {
      el: wrap,
      info: function (t) { set('', t); },
      ok: function (t) { bar.hidden = true; set('ok', t); },
      error: function (e) { bar.hidden = true; set('error', (e && e.message) || String(e)); },
      progress: function (p, t) { bar.hidden = false; bar.firstChild.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + '%'; if (t) set('', t); },
      clear: function () { bar.hidden = true; set('', ''); }
    };
  };

  // a box of result files with download buttons (+ "download all as ZIP")
  T.results = function () {
    var box = h('div', { 'class': 'tresults', hidden: true });
    var items = [];
    function draw() {
      box.innerHTML = '';
      box.hidden = !items.length;
      if (!items.length) return;
      var head = h('div', { 'class': 'tresults-head' }, [h('b', { text: items.length === 1 ? 'Your file is ready' : items.length + ' files are ready' })]);
      if (items.length > 1) head.appendChild(T.button('Download all (ZIP)', { primary: true, small: true, onclick: function () {
        T.zip(items).then(function (z) { T.download(z, (box.zipName || 'files') + '.zip'); });
      } }));
      box.appendChild(head);
      var grid = h('div', { 'class': 'tresults-grid' });
      items.forEach(function (it) {
        grid.appendChild(h('div', { 'class': 'tresult' }, [
          it.preview ? h('img', { src: it.preview, alt: it.name, loading: 'lazy' }) : h('span', { 'class': 'tresult-ic', text: it.icon || '📄' }),
          h('span', { 'class': 'tresult-name' }, [h('b', { text: it.name }), h('small', { text: T.bytes(it.blob.size) + (it.note ? ' · ' + it.note : '') })]),
          T.button('Download', { small: true, primary: items.length === 1, onclick: function () { T.download(it.blob, it.name); } })]));
      });
      box.appendChild(grid);
    }
    return {
      el: box,
      set: function (list, zipName) { items = list; box.zipName = zipName; draw(); },
      clear: function () { items = []; draw(); }
    };
  };

  T.card = function (kids) { return h('div', { 'class': 'tool-app' }, kids); };

  /* ---------- PDF helpers ---------- */
  T.openPdf = function (file) {
    return Promise.all([T.lib('pdfjs'), T.read(file)]).then(function (r) {
      return r[0].getDocument({ data: new Uint8Array(r[1]) }).promise;
    }).catch(function (e) {
      if (/password/i.test(e && e.name + e.message)) throw new Error('This PDF is password-protected. Remove the password first.');
      throw e;
    });
  };
  T.renderPage = function (pdf, n, scale) {
    return pdf.getPage(n).then(function (page) {
      var vp = page.getViewport({ scale: scale || 1 });
      var canvas = h('canvas'); canvas.width = Math.ceil(vp.width); canvas.height = Math.ceil(vp.height);
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () { return canvas; });
    });
  };
  T.canvasBlob = function (canvas, type, quality) {
    return new Promise(function (ok) { canvas.toBlob(ok, type || 'image/png', quality); });
  };
  // "1-3, 5, 8-" → [1,2,3,5,8,...,max]
  T.parseRanges = function (text, max) {
    var out = [];
    String(text || '').split(/[,;]+/).forEach(function (part) {
      var m = part.trim().match(/^(\d*)\s*-\s*(\d*)$/), a, b;
      if (m) { a = m[1] ? +m[1] : 1; b = m[2] ? +m[2] : max; }
      else if (/^\d+$/.test(part.trim())) { a = b = +part.trim(); }
      else return;
      for (var i = Math.max(1, a); i <= Math.min(max, b); i++) if (out.indexOf(i) < 0) out.push(i);
    });
    return out;
  };

  /* ---------- loading and mounting ---------- */
  var registry = {};
  T.register = function (id, setup) {
    registry[id] = setup;
    $all('[data-gco-tool="' + id + '"]').forEach(mount);
  };
  function $all(sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); }
  function mount(page) {
    if (page.__mounted) return;
    page.__mounted = true;
    var id = page.getAttribute('data-gco-tool');
    var spot = page.querySelector('.gco-tool-mount') || page.insertBefore(h('div', { 'class': 'gco-tool-mount' }), page.firstChild);
    spot.innerHTML = '';
    try { registry[id](spot, T, page); } catch (e) {
      spot.appendChild(h('p', { 'class': 'tstatus is-error', text: 'This tool could not start: ' + e.message }));
      if (window.console) console.error(e);
    }
    var info = T.find(id);
    if (info) {
      // an ad between the tool and the guide below it (never next to the tool's buttons)
      if (C.adSlot) { var ad = C.adSlot('in-article', (C.ads || {}).inArticle); if (ad) spot.parentNode.insertBefore(ad, spot.nextSibling); }
      related(page, info);
      structured(info);
    }
  }
  function related(page, info) {
    var same = T.list.filter(function (t) { return t.id !== info.id && t.cat === info.cat; });
    var other = T.list.filter(function (t) { return t.id !== info.id && t.cat !== info.cat; });
    var picks = same.concat(other).slice(0, 6);
    page.appendChild(h('section', { 'class': 'trelated' }, [
      h('h2', { text: 'More free tools' }),
      h('div', { 'class': 'thub-grid' }, picks.map(card)),
      h('p', { 'class': 'trelated-all' }, [h('a', { href: '/p/utility-tools.html', text: 'See all ' + T.list.length + ' tools →' })])]));
  }
  function card(t) {
    return h('a', { 'class': 'thub-card', href: t.path }, [
      h('span', { 'class': 'thub-ic', 'aria-hidden': 'true', text: t.icon }),
      h('span', {}, [h('b', {}, [t.name, t.isNew ? h('em', { 'class': 'thub-new', text: 'NEW' }) : null]), h('small', { text: t.desc })])]);
  }
  T.toolCard = card;
  function structured(info) {
    var s = h('script', { type: 'application/ld+json' });
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'WebApplication', name: info.name + ' — GroupChatOn',
      url: location.origin + info.path, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any (runs in your browser)',
      description: info.desc, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } });
    doc.head.appendChild(s);
  }

  // the tools hub page
  T.register('hub', function (spot) {
    var cats = ['All'];
    T.list.forEach(function (t) { if (cats.indexOf(t.cat) < 0) cats.push(t.cat); });
    var q = h('input', { type: 'search', 'class': 'thub-search', placeholder: 'Search ' + T.list.length + ' free tools…', 'aria-label': 'Search tools' });
    var cat = 'All', grid = h('div', { 'class': 'thub-grid' });
    var chips = T.seg(cats.map(function (c) { return [c, c]; }), 'All', function (v) { cat = v; draw(); });
    chips.classList.add('thub-cats');
    function draw() {
      var s = q.value.trim().toLowerCase();
      grid.innerHTML = '';
      var shown = T.list.filter(function (t) {
        return (cat === 'All' || t.cat === cat) && (!s || (t.name + ' ' + t.desc + ' ' + t.cat).toLowerCase().indexOf(s) >= 0);
      });
      shown.forEach(function (t) { grid.appendChild(card(t)); });
      if (!shown.length) grid.appendChild(h('p', { 'class': 'tstatus', text: 'No tool matches “' + q.value + '”.' }));
    }
    q.addEventListener('input', draw);
    spot.appendChild(h('div', { 'class': 'thub' }, [q, chips, grid]));
    draw();
  });

  // load the stylesheet, then each tool's script
  if (!doc.getElementById('gco-tools-css')) doc.head.appendChild(h('link', { id: 'gco-tools-css', rel: 'stylesheet', href: BASE + 'assets/tools/tools.css' }));
  $all('[data-gco-tool]').forEach(function (page) {
    var id = page.getAttribute('data-gco-tool');
    if (registry[id]) return mount(page);
    if (!/^[a-z0-9-]+$/.test(id)) return;
    T.loadScript(BASE + 'assets/tools/' + id + '.js').catch(function (e) {
      var spot = page.querySelector('.gco-tool-mount');
      if (spot) spot.appendChild(h('p', { 'class': 'tstatus is-error', text: e.message }));
    });
  });
})();
