/* URL Shortener — TinyURL API. The API key lives in the site's theme (window.GCO.tinyurlKey), not in this
   public file. Links made here are kept in the reader's own browser history list.
   Designed & Developed by Nivesh Sahayak. See LICENSE. */
GCOTools.register('shorten', function (spot, T) {
  var h = T.h, status = T.status(), C = window.GCO || {};
  var long = h('input', { type: 'url', placeholder: 'Paste a long link, e.g. https://…', 'aria-label': 'Long link' });
  var alias = h('input', { type: 'text', placeholder: 'optional, e.g. my-novel', maxlength: '30' });
  var go = T.button('Shorten link', { primary: true, onclick: run });
  var result = h('div', { 'class': 'tresults', hidden: true });
  var hist = h('div', { 'class': 'tresults-grid' });
  var histBox = h('div', { hidden: true }, [h('h3', { text: 'Your recent links (saved in this browser only)' }), hist]);
  spot.appendChild(T.card([T.field('Long link', long), T.field('Custom ending (optional)', alias, 'tinyurl.com/your-word, if it is free. Letters, numbers and dashes.'),
    T.row([go]), status.el, result, histBox]));
  long.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
  drawHistory();

  function valid(u) { try { var x = new URL(u); return /^https?:$/.test(x.protocol) && /\./.test(x.hostname); } catch (e) { return false; } }
  function run() {
    var u = long.value.trim();
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    if (!valid(u)) return status.error('That doesn’t look like a web link. It should start with https://');
    if (!C.tinyurlKey) return status.error('The shortener is not set up yet. Please try again later.');
    var a = alias.value.trim();
    if (a && !/^[A-Za-z0-9-]{5,30}$/.test(a)) return status.error('The custom ending needs 5–30 letters, numbers or dashes.');
    go.disabled = true; status.info('Shortening…');
    fetch('https://api.tinyurl.com/create', {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + C.tinyurlKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(a ? { url: u, domain: 'tinyurl.com', alias: a } : { url: u, domain: 'tinyurl.com' })
    }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); }).then(function (r) {
      if (!r.ok || !r.j.data) throw new Error((r.j.errors && r.j.errors[0]) || 'TinyURL could not shorten this link. Try again in a minute.');
      var short = r.j.data.tiny_url;
      show(short, u);
      var list = T.store.get('short-links', []);
      list.unshift({ s: short, l: u, t: Date.now() });
      T.store.set('short-links', list.slice(0, 20));
      drawHistory(); status.ok('Done!'); long.value = ''; alias.value = '';
    }).catch(status.error).then(function () { go.disabled = false; });
  }
  function row(s, l) {
    var copy = T.button('Copy', { small: true, primary: true, onclick: function () { T.copy(s, copy); } });
    return h('div', { 'class': 'tresult' }, [h('span', { 'class': 'tresult-ic', text: '🔗' }),
      h('span', { 'class': 'tresult-name' }, [h('b', {}, [h('a', { href: s, target: '_blank', rel: 'noopener', text: s.replace(/^https?:\/\//, '') })]), h('small', { text: l })]), copy]);
  }
  function show(s, l) { result.hidden = false; result.innerHTML = ''; result.appendChild(row(s, l)); }
  function drawHistory() {
    var list = T.store.get('short-links', []);
    hist.innerHTML = ''; histBox.hidden = !list.length;
    list.forEach(function (x) { hist.appendChild(row(x.s, x.l)); });
    if (list.length) hist.appendChild(T.button('Clear this list', { small: true, onclick: function () { T.store.set('short-links', []); drawHistory(); } }));
  }
});
