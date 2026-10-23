# GroupChatOn theme

A reader-first Blogger theme for web-novel sites. Blogger keeps the domain, posts, comments and AdSense; this repo serves the design, the reader script and the chapter lists through GitHub Pages.

## What's here

| Path | What it is |
|---|---|
| `blogger/theme.template.xml` | The Blogger theme with placeholders (`YOUR-GITHUB-USER`, `ca-pub-0000…`, ad unit ids, socials). |
| `assets/gco.css` | All styles: four reading themes (light, sepia, dark, black), reader settings, layout. |
| `assets/gco.js` | Reader settings, Prev / Next, chapter list, progress and resume, ad slots, series and home pages. |
| `assets/brand/` | Logo and favicons. |
| `data/series-config.json` | One entry per book: title, cover, index page and the chapter URL pattern. |
| `data/series/*.json`, `data/series.json` | Chapter lists, built by `scripts/build_series.py`. Don't edit by hand. |
| `.github/workflows/build-series.yml` | Rebuilds the chapter lists every 3 hours and publishes to GitHub Pages. |

## Adding a new novel

1. Post an index page for it on Blogger (cover image + summary), and give its chapters a fixed URL pattern, e.g. `/2026/03/abc12.html`.
2. Add an entry to `data/series-config.json` with `match` set to that pattern.
3. Commit. The workflow builds its chapter list within a few minutes.

## Chapter order

Chapters are sorted by the number in the title (`Chapter 12 …`). Side stories (URLs containing `ss<number>`) come after the main chapters, in URL order. Brand-new chapters also appear straight away: the script checks Blogger's feed for the 25 newest posts.

## Licence

Proprietary. See [LICENSE](LICENSE). Designed &amp; Developed by [Nivesh Sahayak](https://www.niveshsahayak.in/).
