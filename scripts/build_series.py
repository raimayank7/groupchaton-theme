# Builds the chapter lists the theme uses for Prev / Next and the chapter drawer.
#   data/series/<id>.json : every chapter of one book, in reading order
#   data/series.json      : one line per book (title, cover, chapter count, newest chapter)
# Reads the public Blogger feed (GitHub Actions does this every few hours), or a Blogger
# backup file:  python scripts/build_series.py --backup path/to/feed.atom
# Designed & Developed by Nivesh Sahayak (https://www.niveshsahayak.in/). All rights reserved: see LICENSE.
import argparse, json, os, re, sys, urllib.request, xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.environ.get('SITE_URL', 'https://www.groupchaton.com')


def from_feed():
    """Every live post from the public JSON feed: (path, title, published)."""
    # Blogger sometimes sends fewer than max-results per page, so page on until the total is reached
    posts, start, total = [], 1, None
    while total is None or start <= total:
        url = f'{SITE}/feeds/posts/summary?alt=json&max-results=150&start-index={start}'
        req = urllib.request.Request(url, headers={'User-Agent': 'groupchaton-theme build'})
        with urllib.request.urlopen(req, timeout=60) as r:
            feed = json.load(r)['feed']
        total = int(feed['openSearch$totalResults']['$t'])
        entries = feed.get('entry', [])
        if not entries:
            break
        for e in entries:
            link = next((l['href'] for l in e['link'] if l['rel'] == 'alternate'), '')
            path = re.sub(r'^https?://[^/]+', '', link)
            posts.append((path, e['title']['$t'], e['published']['$t']))
        start += len(entries)
    return posts


def from_backup(file):
    ns = {'a': 'http://www.w3.org/2005/Atom', 'b': 'http://schemas.google.com/blogger/2018'}
    posts = []
    for e in ET.parse(file).getroot().findall('a:entry', ns):
        if e.findtext('b:type', namespaces=ns) != 'POST' or e.findtext('b:status', namespaces=ns) != 'LIVE':
            continue
        posts.append((e.findtext('b:filename', namespaces=ns), e.findtext('a:title', namespaces=ns) or '',
                      e.findtext('a:published', namespaces=ns) or ''))
    return posts


def order_key(path, title, published):
    # chapters by the number in the title, then side stories ("...ss12.html") by the URL number
    ss = re.search(r'ss(\d+)(?:_\d+)?\.html$', path)
    if ss:
        return (1, int(ss.group(1)), published)
    m = re.match(r'\s*Chapter\s+(\d+)', title, re.I) or re.search(r'(\d+)(?:_\d+)?\.html$', path)
    return (0, int(m.group(1)) if m else 10**6, published)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--backup', help='Blogger backup feed.atom instead of the live feed')
    args = ap.parse_args()

    config = json.load(open(os.path.join(ROOT, 'data', 'series-config.json'), encoding='utf-8'))['series']
    posts = from_backup(args.backup) if args.backup else from_feed()
    if len(posts) < 100:
        sys.exit(f'Only {len(posts)} posts came back from the feed; keeping the old lists.')

    out_dir = os.path.join(ROOT, 'data', 'series')
    os.makedirs(out_dir, exist_ok=True)
    index = []
    for s in config:
        rx = re.compile(s['match'])
        items = sorted((p for p in posts if rx.match(p[0])), key=lambda p: order_key(*p))
        chapters = [[p[0], re.sub(r'\s+', ' ', p[1]).strip(), p[2][:10]] for p in items]
        with open(os.path.join(out_dir, s['id'] + '.json'), 'w', encoding='utf-8') as f:
            json.dump({'id': s['id'], 'count': len(chapters), 'chapters': chapters}, f,
                      ensure_ascii=False, separators=(',', ':'))
        # newest = latest date; on the same day, the one further along in the book
        newest = max(enumerate(chapters), key=lambda ic: (ic[1][2], ic[0]))[1] if chapters else None
        index.append({k: s[k] for k in ('id', 'short', 'title', 'part', 'index', 'match', 'cover', 'alt', 'genres')}
                     | {'count': len(chapters), 'newest': newest})
        print(f"{s['id']:5} {len(chapters):5} chapters")

    index.sort(key=lambda s: (s['newest'] or ['', '', ''])[2], reverse=True)
    with open(os.path.join(ROOT, 'data', 'series.json'), 'w', encoding='utf-8') as f:
        json.dump({'series': index}, f, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
