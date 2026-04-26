/**
 * dump-fandom.cjs
 * ----------------
 * Mirrors a Fandom (MediaWiki) wiki "index" page and every article it links to.
 *
 * Why this script exists
 *   HTTrack cannot scrape Fandom because the article body is injected by
 *   client-side JavaScript and lives behind a consent overlay / ad loader
 *   that often refuses to fully initialise in a headless browser. To work
 *   around that we use a hybrid approach:
 *     1. Playwright loads the *index* page (e.g. /wiki/Heroes) so we can
 *        scrape the rendered list of links to individual articles.
 *     2. For each linked article we hit MediaWiki's `?action=parse` API,
 *        which returns the same server-rendered HTML you would normally see
 *        inside `.mw-parser-output` — no JS, no ads, no consent dialog.
 *
 * Usage
 *   node scripts/dump-fandom.cjs [INDEX_URL] [OUT_DIR]
 *
 *   INDEX_URL  Wiki page whose `/wiki/<slug>` links should be mirrored.
 *              Default: https://last-war-survival.fandom.com/wiki/Heroes
 *   OUT_DIR    Folder to write `index.html` and `<Slug>.html` into.
 *              Default: ../mirror/fandom/heroes (resolved from this script)
 *
 * Output
 *   <OUT_DIR>/index.html        Fully rendered index page (from Playwright).
 *   <OUT_DIR>/<Slug>.html       Each linked article, wrapped in a minimal
 *                               standalone HTML document with a `<base>` tag
 *                               so relative URLs in the body still resolve
 *                               back to the live wiki.
 *
 * Requirements
 *   - Node 18+ (uses the global `fetch`).
 *   - Playwright with a Chromium install (`npx playwright install chromium`).
 *
 * Exit codes
 *   0 on success, 1 on a fatal error. Per-article failures are reported on
 *   stderr but do not abort the run.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Configuration & CLI arguments
// ---------------------------------------------------------------------------

const DEFAULT_INDEX_URL = 'https://last-war-survival.fandom.com/wiki/Heroes';
const DEFAULT_OUT_DIR = path.resolve(__dirname, '..', 'mirror', 'fandom', 'heroes');

const indexUrl = process.argv[2] || DEFAULT_INDEX_URL;
const outDir = path.resolve(process.argv[3] || DEFAULT_OUT_DIR);
const userAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// MediaWiki uses namespace prefixes (`Special:`, `File:`, etc.) for non-article
// pages. We never want to mirror those. Anything matching one of these prefixes
// is dropped from the link list.
const SKIP_SLUG_PREFIXES = [
  'Special:',
  'File:',
  'Category:',
  'Help:',
  'Template:',
  'User:',
  'User_talk:',
  'Talk:',
  'Forum:',
  'Map:',
  'Source:',
  'Blog:',
  'MediaWiki:',
];

// Known meta/landing pages that show up on the Heroes index but are not
// individual hero articles. Add to this set if more noise pages appear.
const SKIP_SLUG_EXACT = new Set([
  'Heroes',
  'Main_Page',
  'Last_War:_Survival',
  'Last_War:_Survival_Wiki',
]);

(async () => {
  // -------------------------------------------------------------------------
  // Browser setup
  // -------------------------------------------------------------------------

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    // A realistic desktop UA avoids extra anti-bot heuristics that the default
    // headless UA would trigger.
    userAgent: userAgent,
  });

  // Fandom keeps long-lived connections open for ads, analytics and video, so
  // Playwright's `networkidle` event almost never fires. Blocking the noisy
  // third-party hosts (and heavy media types we don't need for a static dump)
  // drastically speeds the index load up and makes idle reachable.
  const BLOCKED_HOSTS = [
    'googlesyndication.com',
    'doubleclick.net',
    'googletagmanager.com',
    'google-analytics.com',
    'googletagservices.com',
    'adnxs.com',
    'amazon-adsystem.com',
    'taboola.com',
    'outbrain.com',
    'criteo.com',
    'cdn.cookielaw.org',
    'scorecardresearch.com',
    'quantserve.com',
    'facebook.net',
    'facebook.com',
    'fastlyinsights.com',
    'hotjar.com',
    'segment.io',
    'sentry.io',
    'nitropay.com',
    'liadm.com',
    'krxd.net',
    'moatads.com',
    'jwplayer.com',
    'jwpcdn.com',
    'jwpsrv.com',
  ];

  await context.route('**/*', (route) => {
    const req = route.request();
    const type = req.resourceType();
    const reqUrl = req.url();

    // Skip heavy assets we don't need to mirror the page structure.
    if (type === 'media' || type === 'font') {
      return route.abort();
    }
    // Skip blocked hosts requests
    if (BLOCKED_HOSTS.some((host) => reqUrl.includes(host))) {
      return route.abort();
    }
    return route.continue();
  });

  const page = await context.newPage();

  // -------------------------------------------------------------------------
  // Page-fetching helpers
  // -------------------------------------------------------------------------

  /**
   * Loads a wiki page in the real browser and returns the fully rendered HTML.
   * Used for the index page where we need the JS-injected list of links.
   *
   * Notes:
   *   - We wait for `domcontentloaded` instead of `load`/`networkidle` because
   *     Fandom rarely reaches network idle.
   *   - `state: 'attached'` is used (vs. the default `visible`) because the
   *     element is in the DOM well before any consent overlay is dismissed.
   *   - Targeted element class: `.mw-parser-output`
   *
   * @param {string} targetUrl Absolute URL of the wiki page to load.
   * @returns {Promise<string>} Fully serialised page HTML.
   */
  async function fetchRenderedPage(targetUrl) {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('.mw-parser-output', { state: 'attached', timeout: 60000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 10000 });
    } catch {
      // Best-effort only — Fandom often never goes idle.
    }
    return page.content();
  }

  /**
   * Fetches an article body via MediaWiki's `action=parse` API and wraps it
   * in a minimal standalone HTML document.
   *
   * This bypasses Fandom's client-side renderer entirely (which is the bit
   * that frequently times out in headless Chromium) and returns the same
   * server-rendered markup that would normally appear inside
   * `.mw-parser-output`.
   *
   * @param {string} originUrl Any absolute URL on the target wiki — only its
   *                           origin is used to derive `/api.php`.
   * @param {string} slug      The page title in MediaWiki form (e.g. `Kimberly`,
   *                           `Last_War:_Survival`).
   * @returns {Promise<string>} A complete HTML document for the article.
   */
  async function fetchArticleViaApi(originUrl, slug) {
    const apiUrl = new URL('/api.php', originUrl);
    apiUrl.searchParams.set('action', 'parse');
    apiUrl.searchParams.set('page', slug);
    apiUrl.searchParams.set('prop', 'text|displaytitle');
    apiUrl.searchParams.set('formatversion', '2');
    apiUrl.searchParams.set('format', 'json');
    // Follow `#REDIRECT` pages to their target so we get real content.
    apiUrl.searchParams.set('redirects', '1');

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': userAgent,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} for ${apiUrl}`);
    }
    const data = await res.json();
    if (data.error) {
      throw new Error(`MediaWiki API error: ${data.error.code} - ${data.error.info}`);
    }
    const title = data.parse?.displaytitle || data.parse?.title || slug;
    const body = data.parse?.text;
    if (!body) {
      throw new Error('No parse.text in API response');
    }

    // The `<base href>` makes the article's relative links/images resolve
    // back to the live wiki, which is good enough for a read-only mirror.
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <base href="${new URL('/', originUrl).toString()}">
</head>
<body>
${body}
</body>
</html>
`;
  }

  /**
   * Scrapes the currently loaded index page for `/wiki/<slug>` links and
   * returns a deduplicated, filtered list of pages worth mirroring.
   *
   * Filtering rules:
   *   - Only links on the same host as the index page.
   *   - Must start with `/wiki/`.
   *   - Query strings and fragments are stripped before deduping.
   *   - Slugs in `SKIP_SLUG_EXACT` or matching any `SKIP_SLUG_PREFIXES`
   *     entry are dropped (namespaces like `Special:`, meta pages, etc.).
   *
   * @returns {Promise<{slug: string, url: string}[]>}
   */
  async function collectHeroLinks() {
    const indexBase = new URL(indexUrl);
    const rawLinks = await page.$$eval('.mw-parser-output a[href]', (els) =>
      els.map((a) => a.getAttribute('href')).filter(Boolean)
    );

    const seen = new Map();
    for (const href of rawLinks) {
      let absolute;
      try {
        absolute = new URL(href, indexBase);
      } catch {
        // Not a parseable URL — skip.
        continue;
      }
      if (absolute.host !== indexBase.host) continue;
      if (!absolute.pathname.startsWith('/wiki/')) continue;
      if (absolute.search || absolute.hash) {
        // Strip query/hash so `/wiki/Foo?x=1` and `/wiki/Foo#bar` collapse
        // to the same canonical entry.
        absolute.search = '';
        absolute.hash = '';
      }

      const slug = decodeURIComponent(absolute.pathname.slice('/wiki/'.length));
      if (!slug) continue;
      if (SKIP_SLUG_EXACT.has(slug)) continue;
      if (SKIP_SLUG_PREFIXES.some((p) => slug.startsWith(p))) continue;

      if (!seen.has(slug)) {
        seen.set(slug, absolute.toString());
      }
    }
    return [...seen.entries()].map(([slug, url]) => ({ slug, url }));
  }

  /**
   * Builds a filesystem-safe filename for a wiki slug. MediaWiki slugs are
   * already URL path components, so the only character we have to neutralise
   * is the path separator (some titles legitimately contain `/`).
   */
  function safeFilename(slug) {
    return slug.replace(/[\\/]+/g, '_') + '.html';
  }

  // -------------------------------------------------------------------------
  // Image downloading + HTML rewriting
  // -------------------------------------------------------------------------

  // Where local image copies are written, and how the rewritten HTML refers
  // to them (relative to each article file, which sits next to `images/`).
  const IMAGES_DIR = path.join(outDir, 'images');
  const IMAGE_REL_PREFIX = 'images/';

  // Shared across all heroes so the same image is downloaded only once even
  // if it appears on several pages. Maps absolute remote URL -> local
  // basename (within IMAGES_DIR).
  const imageUrlToLocal = new Map();
  // Reserve filenames to avoid collisions when two different remote URLs map
  // to the same basename (e.g. two `Icon.png` files in different folders).
  const usedLocalNames = new Set();

  /**
   * Picks a stable, filesystem-safe local filename for a Fandom CDN image
   * URL. Strips `/revision/...` and query parameters, derives a name from
   * the Fandom-specific path component (e.g. `4/44/Carlie.png` -> `Carlie.png`),
   * and disambiguates collisions by appending a short hash of the full URL.
   */
  function localImageNameFor(remoteUrl) {
    let parsed;
    try {
      parsed = new URL(remoteUrl);
    } catch {
      return null;
    }

    // e.g. /last-war-survival/images/4/44/Carlie.png/revision/latest
    let pathname = parsed.pathname;
    const revIdx = pathname.indexOf('/revision/');
    if (revIdx !== -1) pathname = pathname.slice(0, revIdx);

    const base = decodeURIComponent(pathname.split('/').filter(Boolean).pop() || 'image');
    const safeBase = base.replace(/[^A-Za-z0-9._-]+/g, '_') || 'image';

    if (!usedLocalNames.has(safeBase)) {
      usedLocalNames.add(safeBase);
      return safeBase;
    }

    // Collision: prefix with a short URL hash to keep things deterministic.
    const ext = path.extname(safeBase);
    const stem = ext ? safeBase.slice(0, -ext.length) : safeBase;
    let hash = 0;
    for (const ch of remoteUrl) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
    const suffix = (hash >>> 0).toString(16).slice(0, 8);
    const candidate = `${stem}-${suffix}${ext}`;
    usedLocalNames.add(candidate);
    return candidate;
  }

  /**
   * Downloads a single remote image into IMAGES_DIR. Returns the local
   * basename, or null if the URL can't be turned into one.
   *
   * Deduplicated via `imageUrlToLocal` so each unique URL is fetched once
   * per script run.
   */
  async function downloadImage(remoteUrl) {
    if (imageUrlToLocal.has(remoteUrl)) return imageUrlToLocal.get(remoteUrl);

    const localName = localImageNameFor(remoteUrl);
    if (!localName) return null;

    const localPath = path.join(IMAGES_DIR, localName);
    if (!fs.existsSync(localPath)) {
      try {
        const res = await fetch(remoteUrl, {
          headers: { 'User-Agent': userAgent, Accept: 'image/*,*/*;q=0.8' },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(localPath, buf);
      } catch (err) {
        console.error(`  IMG FAIL ${remoteUrl}: ${err.message}`);
        // Don't cache failures — let a future run try again.
        return null;
      }
    }

    imageUrlToLocal.set(remoteUrl, localName);
    return localName;
  }

  /**
   * Resolves a possibly-relative image URL against the article's origin and
   * returns it as a fully-qualified absolute URL string, or null if it can't
   * be resolved or is a `data:` URI we shouldn't download.
   */
  function absolutizeImageUrl(rawUrl, originUrl) {
    if (!rawUrl) return null;
    const trimmed = rawUrl.trim();
    if (!trimmed || trimmed.startsWith('data:')) return null;
    try {
      return new URL(trimmed, originUrl).toString();
    } catch {
      return null;
    }
  }

  /**
   * Walks every image-bearing attribute in the article HTML, downloads the
   * referenced files, and rewrites the attributes to point at the local
   * copies. Handles:
   *   - `src` (and Fandom's lazy-loaded `data-src`)
   *   - `srcset` / `data-srcset` (comma-separated `URL Wd` descriptors)
   *   - `<source srcset=...>` inside `<picture>`
   *
   * Returns the rewritten HTML.
   */
  async function localiseImages(html, originUrl) {
    // Collect every candidate URL first, deduped, so we can fetch them in
    // parallel and only edit the HTML once.
    const candidates = new Set();

    const SINGLE_ATTR_RE = /\b(?:src|data-src)\s*=\s*"([^"]+)"/gi;
    const SRCSET_ATTR_RE = /\b(?:srcset|data-srcset)\s*=\s*"([^"]+)"/gi;

    for (const m of html.matchAll(SINGLE_ATTR_RE)) {
      const abs = absolutizeImageUrl(m[1], originUrl);
      if (abs) candidates.add(abs);
    }
    for (const m of html.matchAll(SRCSET_ATTR_RE)) {
      // srcset entries are: "<url> [descriptor], <url> [descriptor], ..."
      for (const part of m[1].split(',')) {
        const url = part.trim().split(/\s+/)[0];
        const abs = absolutizeImageUrl(url, originUrl);
        if (abs) candidates.add(abs);
      }
    }

    if (candidates.size === 0) return html;

    fs.mkdirSync(IMAGES_DIR, { recursive: true });

    // Sequential downloads keep us polite toward Fandom's CDN and avoid
    // surprising rate-limit responses; the per-image cost is small.
    const remap = new Map();
    for (const url of candidates) {
      const local = await downloadImage(url);
      if (local) remap.set(url, IMAGE_REL_PREFIX + local);
    }

    if (remap.size === 0) return html;

    // Rewrite attributes using the same regexes. We rebuild srcset entries
    // preserving their descriptors (e.g. ` 2x`, ` 750w`).
    let out = html.replace(SINGLE_ATTR_RE, (full, raw) => {
      const abs = absolutizeImageUrl(raw, originUrl);
      const local = abs && remap.get(abs);
      if (!local) return full;
      // Preserve the original attribute name so `data-src` stays `data-src`.
      const name = full.split('=')[0];
      return `${name}="${local}"`;
    });

    out = out.replace(SRCSET_ATTR_RE, (full, raw) => {
      const name = full.split('=')[0];
      const rebuilt = raw
        .split(',')
        .map((part) => {
          const trimmed = part.trim();
          const [url, ...descriptor] = trimmed.split(/\s+/);
          const abs = absolutizeImageUrl(url, originUrl);
          const local = abs && remap.get(abs);
          const finalUrl = local || url;
          return [finalUrl, ...descriptor].join(' ');
        })
        .join(', ');
      return `${name}="${rebuilt}"`;
    });

    return out;
  }

  // -------------------------------------------------------------------------
  // Main flow: index → link extraction → per-article API dump
  // -------------------------------------------------------------------------

  try {
    fs.mkdirSync(outDir, { recursive: true });

    console.error(`Fetching index: ${indexUrl}`);
    const indexHtml = await fetchRenderedPage(indexUrl);
    fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);

    const heroes = await collectHeroLinks();
    console.error(`Found ${heroes.length} hero pages.`);

    let ok = 0;
    let fail = 0;
    for (const [i, { slug, url }] of heroes.entries()) {
      const outPath = path.join(outDir, safeFilename(slug));
      const label = `[${i + 1}/${heroes.length}] ${slug}`;
      try {
        console.error(`${label} -> ${url} (via API)`);
        let html = await fetchArticleViaApi(url, slug);
        // Localise images so the page stands on its own as a static asset
        // (no live Fandom CDN dependency in production).
        html = await localiseImages(html, url);
        fs.writeFileSync(outPath, html);
        ok++;
      } catch (err) {
        // Per-article failures are non-fatal — keep going so a single
        // bad page doesn't lose the rest of the mirror.
        fail++;
        console.error(`  FAILED ${slug}: ${err.message}`);
      }
    }

    console.error(
      `Done. Saved ${ok} pages to ${outDir} (${fail} failures, ${imageUrlToLocal.size} images cached in ${IMAGES_DIR}).`
    );
  } finally {
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
