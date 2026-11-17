// Morgan Oates – static site generator. Zero dependencies (Node 18+).
//   node build.mjs                 → dist/ (preview: noindex, local images)
//   IMAGE_MODE=remote node build.mjs   → hotlinks originals on morganoates.co (REVIEW ONLY)
//   LINKS=files node build.mjs     → relative links ending in index.html (opens from file://)
//   LAUNCH=1 node build.mjs        → indexable build (only when the owner approves launch)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(ROOT, process.env.OUT || 'dist');
const IMAGE_MODE = process.env.IMAGE_MODE || 'local';
const LINKS = process.env.LINKS || 'clean';
const LAUNCH = process.env.LAUNCH === '1';
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));

const site = read('site.json');
const team = read('team.json');
const projects = read('projects.json');
const journal = read('journal.json').sort((a, b) => b.date.localeCompare(a.date));
const svc = read('services.json');
const SRC = 'https://morganoates.co/thumbs/';
const YEAR = new Date().getFullYear();

/* ---------- helpers ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const proj = Object.fromEntries(projects.map((p) => [p.slug, p]));
let CUR = ''; // path of the page being rendered ('' = home)

const rel = (to) => '../'.repeat(CUR.split('/').filter(Boolean).length) + to;
const LOCAL_ONLY = new Set(['privacy', 'terms', 'contact', 'projects', 'west-london-landscape-gardeners', 'before-and-after']);
const href = (to) => (to && !LOCAL_ONLY.has(to) ? 'https://morganoates.co/' + to : LINKS === 'files' ? rel(to ? to + '/index.html' : 'index.html') : '/' + to);
const asset = (to) => (LINKS === 'files' ? rel(to) : '/' + to);

const BUILD_V = Date.now().toString(36);
const dims = (key) => { const m = key.match(/-(\d+)x(\d+)(?:-q\d+)?$/); return m ? { w: +m[1], h: +m[2] } : { w: 0, h: 0 }; };
const imgSrc = (key) => (IMAGE_MODE === 'remote' ? `${SRC}${key}.jpg` : asset(`images/${key}.jpg`));
const pimg = (slug, name) => `projects/${slug}/${name}`;
const logoSrc = asset('assets/photos/logo-659x239.png');

// logo dimensions read from the PNG header if the file has been fetched (avoids stretching)
const logoDims = ' width="659" height="239"';

const manifest = new Map(); // key -> {key,w,h,source,used}
function pic(key, { alt = '', sizes = '100vw', cls = '', eager = false, style = '' } = {}) {
  const { w, h } = dims(key);
  if (key.startsWith('photos/')) return `<img${cls ? ` class="${cls}"` : ''} src="${asset('assets/' + key + '.jpg')}" width="${w}" height="${h}" alt="${esc(alt)}" sizes="${sizes}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}${style ? ` style="${style}"` : ''}>`;
  manifest.set(key, { key, width: w, height: h, source: `${SRC}${key}.jpg`, local: `assets/images/${key}.jpg` });
  return `<img${cls ? ` class="${cls}"` : ''} src="${imgSrc(key)}" width="${w}" height="${h}" alt="${esc(alt)}" sizes="${sizes}" ${eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"'}${style ? ` style="${style}"` : ''}>`;
}
const tel = `tel:${site.phoneTel}`;
const mail = `mailto:${site.email}`;
const dateFmt = (d) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const para = (arr) => arr.map((t) => `<p>${esc(t)}</p>`).join('');

/* ---------- layout ---------- */
const NAV = () => `
<nav class="nav" id="site-nav" aria-label="Main">
  <ul class="nav__list">
    <li><a class="nav__transformations" href="${href('before-and-after')}"${CUR === 'before-and-after' ? ' aria-current="page"' : ''}>Transformations</a></li>
    <li><a class="nav__gallery" href="${href('projects')}"${CUR === 'projects' ? ' aria-current="page"' : ''}>Gallery</a></li>
    <li><a class="nav__team" href="${href('west-london-landscape-gardeners')}"${CUR === 'west-london-landscape-gardeners' ? ' aria-current="page"' : ''}>The Team</a></li>
    <li><a class="nav__contact" href="${href('contact')}"${CUR === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
  </ul>
</nav>`;

function layout({ title, desc, path: p, body, ogImage, ld, dark = false, noindex = false, compact = false, bare = false }) {
  CUR = p;
  const canon = `${site.canonicalOrigin}/${p}`;
  const robots = !LAUNCH || noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  const og = ogImage ? `${site.canonicalOrigin}/images/${ogImage}.jpg` : '';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
${robots}
<link rel="canonical" href="${canon.replace(/\/$/, '')}">
<meta property="og:site_name" content="${esc(site.legalName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${canon.replace(/\/$/, '')}">
<meta property="og:locale" content="en_GB">
${og ? `<meta property="og:image" content="${og}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
${dark ? '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">' : '<meta name="theme-color" content="#f1ede4">'}
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231f3d2f'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='17' text-anchor='middle' fill='%23f1ede4'%3EMO%3C/text%3E%3C/svg%3E">
<script>document.documentElement.classList.add('js')</script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&family=Pinyon+Script&display=swap">
<link rel="stylesheet" href="${asset('assets/css/site.css')}?v=${BUILD_V}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head>
<body>
<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><filter id="ink-brown" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .43  0 0 0 0 .26  0 0 0 0 .15  -1.3 -1.3 -1.3 0 2.6"/></filter><filter id="ink-white" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1.3 -1.3 -1.3 0 2.6"/></filter></defs></svg>
<a class="skip" href="#main">Skip to content</a>
<header class="header${dark ? ' header--over' : ''}"${bare ? ' hidden' : ''}>
  <div class="header__in">
    <a class="logo logo--text" href="${href('')}" aria-label="Morgan Oates, home"><span class="wordmark">Morgan Oates<small>Garden design &amp; landscape</small></span></a>
    
    <button class="menu-btn" type="button" aria-controls="site-nav" aria-expanded="false"><span class="menu-btn__t">Menu</span></button>
    ${NAV()}
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
${true ? `<footer class="footer footer--compact"><div class="wrap footer__row"><p class="fc-a">${esc(site.legalName)} · <span class="fc-long">Registered in England and Wales</span><span class="fc-short">Reg. England &amp; Wales</span> No. ${site.companyNumber} ·</p><p class="fc-b">${esc(site.address)} · <a href="${tel}">${site.phoneDisplay}</a></p><ul class="accred" aria-label="Accreditations and memberships"><li><img src="${asset('assets/photos/bali-accredited.png') + '?v=' + BUILD_V}" width="308" height="160" alt="British Association of Landscape Industries (BALI), accredited" loading="lazy" decoding="async"></li><li><img src="${asset('assets/photos/apl.png') + '?v=' + BUILD_V}" width="133" height="200" alt="Association of Professional Landscapers (APL)" loading="lazy" decoding="async"></li></ul><ul class="footer__legal"><li><a href="${href('privacy')}">Privacy</a></li><li><a href="${href('terms')}">Terms</a></li></ul></div></footer>` : `<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <img class="footer__logo" src="${asset('assets/photos/logo-659x239.png')}"${logoDims} height="40" alt="Morgan Oates" loading="lazy">
      <p>Garden design, landscaping and maintenance across the Cotswolds.</p>
      <address class="footer__addr">${esc(site.address)}</address>
    </div>
    <div>
      <h2 class="footer__h">Services</h2>
      <ul>${Object.values(svc.pages).map((s) => `<li><a href="${href(s.path)}">${esc(s.title)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="footer__h">The studio</h2>
      <ul>
        <li><a href="${href('projects')}">Gardens</a></li>
        <li><a href="${href('west-london-landscape-gardeners')}">The Team</a></li>
        <li><a href="${href('before-and-after')}">Before and after</a></li>
        <li><a href="${href('blog')}">Journal</a></li>
        <li><a href="${href('contact')}">Contact</a></li>
      </ul>
    </div>
    <div>
      <h2 class="footer__h">Contact</h2>
      <ul>
        <li><a href="${mail}">${site.email}</a></li>
        <li><a href="${tel}">${site.phoneDisplay}</a></li>
        ${site.social.map((s) => `<li><a href="${s.url}" rel="noopener">${esc(s.label)}</a></li>`).join('')}
      </ul>
    </div>
  </div>
  <div class="wrap footer__base">
    <p>© ${YEAR} ${esc(site.legalName)} · Registered in England and Wales No. ${site.companyNumber} · Registered office: ${esc(site.registeredOffice)}</p>
    <ul class="footer__legal"><li><a href="${href('privacy')}">Privacy</a></li><li><a href="${href('terms')}">Terms</a></li></ul>
  </div>
</footer>`}
<script src="${asset('assets/js/site.js')}?v=${BUILD_V}" defer></script>
</body>
</html>`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([l, t], i) => `<li>${t != null ? `<a href="${href(t)}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`}</li>`).join('')}</ol></nav>`;

const cta = (head = 'Tell us about your garden.') => `
<section class="close" aria-labelledby="close-h">
  <div class="wrap close__in">
    <div>
      <p class="kicker kicker--light">Enquiries</p>
      <h2 id="close-h" class="close__h">${head}</h2>
      <p class="close__p">Whether you have a plot to design, a plan to build or a garden to keep, a short note about the place is a good start.</p>
    </div>
    <div class="close__side">
      <a class="btn btn--light" href="${href('contact')}">Discuss your garden</a>
      <p><a href="${mail}">${site.email}</a><br><a href="${tel}">${site.phoneDisplay}</a></p>
    </div>
  </div>
</section>`;

/* ---------- project gallery sequence ---------- */
function sequence(p) {
  const files = p.images.split(/\s+/).filter(Boolean);
  const total = files.length;
  const items = files.map((f, i) => ({ f, i, ...dims(f) }));
  const out = [];
  let k = 0, lc = 0;
  const fig = (it, extra = '') => {
    const key = pimg(p.slug, it.f);
    const portrait = it.h > it.w * 1.1;
    return `<figure class="seq__fig${portrait ? ' is-portrait' : ''} reveal ${extra}" style="--w:${it.w}">${pic(key, { alt: `${p.title}: view ${it.i + 1} of ${total}`, sizes: '(min-width: 900px) 50vw, 100vw' })}<figcaption><span>Plate ${String(it.i + 1).padStart(2, '0')}</span></figcaption></figure>`;
  };
  while (k < items.length) {
    const it = items[k], nx = items[k + 1];
    const portrait = (x) => x && x.h > x.w * 1.1;
    if (it.w / it.h > 2.5) { out.push(`<div class="seq__row seq__row--wide">${fig(it)}</div>`); k++; continue; }
    if (portrait(it) && portrait(nx)) { out.push(`<div class="seq__row seq__row--pair">${fig(it)}${fig(nx)}</div>`); k += 2; continue; }
    if (!portrait(it)) {
      lc++;
      if (lc % 3 === 0 && nx && !portrait(nx) && nx.w / nx.h <= 2.5) { out.push(`<div class="seq__row seq__row--pair seq__row--landscape">${fig(it)}${fig(nx)}</div>`); k += 2; lc++; continue; }
      out.push(`<div class="seq__row seq__row--${lc % 2 ? 'left' : 'right'}">${fig(it)}</div>`); k++; continue;
    }
    out.push(`<div class="seq__row seq__row--${lc % 2 ? 'left' : 'right'}">${fig(it)}</div>`); k++;
  }
  return out.join('\n');
}

/* ---------- pages ---------- */
const pages = []; // {path, html}
const add = (p, html) => pages.push({ path: p, html });

// HOME: a quiet stage of slowly moving grasses, few words
function grass() {
  let a = 20261113;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const layers = [
    { n: 70, hmin: 180, hmax: 330, fill: '#a9824f', op: 0.5, dur: [11, 16], amp: [1.2, 2.4] },
    { n: 85, hmin: 230, hmax: 420, fill: '#c4a063', op: 0.75, dur: [9, 14], amp: [1.6, 3.2] },
    { n: 60, hmin: 280, hmax: 500, fill: '#dcc088', op: 0.9, dur: [8, 12], amp: [2, 4] }
  ];
  const f = (x) => Math.round(x * 10) / 10;
  return layers.map((L) => {
    let blades = '';
    for (let i = 0; i < L.n; i++) {
      const x = rnd() * 1640 - 20, h = L.hmin + rnd() * (L.hmax - L.hmin), lean = (rnd() - 0.5) * 120, w = 3 + rnd() * 4;
      const d = `M${f(x)} 620Q${f(x + lean * 0.25)} ${f(620 - h * 0.55)} ${f(x + lean)} ${f(620 - h)}Q${f(x + lean * 0.25 + w)} ${f(620 - h * 0.5)} ${f(x + w)} 620Z`;
      const dur = L.dur[0] + rnd() * (L.dur[1] - L.dur[0]), amp = L.amp[0] + rnd() * (L.amp[1] - L.amp[0]);
      blades += `<path d="${d}" style="--a:${f(amp)}deg;animation-duration:${f(dur)}s;animation-delay:-${f(rnd() * dur)}s;transform-origin:${f(x + w / 2)}px 620px"/>`;
    }
    return `<g fill="${L.fill}" fill-opacity="${L.op}">${blades}</g>`;
  }).join('');
}
function wall() {
  let a = 77031;
  const rnd = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const tones = ['#cbbd9f', '#b8a888', '#a99a7b', '#d6cab0', '#bfae8c', '#c9b48f'];
  let s = '';
  const rows = [132, 158, 184, 210];
  rows.forEach((y, r) => {
    let x = -40 - rnd() * 60;
    while (x < 1640) {
      const w = 70 + rnd() * 90, h = 24 + rnd() * 3;
      s += `<rect x="${(x + 1.5).toFixed(1)}" y="${y + 1.5}" width="${(w - 3).toFixed(1)}" height="${h - 3}" rx="5" fill="${tones[Math.floor(rnd() * tones.length)]}" stroke="#8a7a5e" stroke-opacity=".45" stroke-width="1.2"/>`;
      x += w;
    }
  });
  const pot = (x, y, w, h) => {
    const t = w * 0.78;
    return `<g><path d="M${x} ${y + 14}L${x + (w - t) / 2} ${y + h}H${x + (w + t) / 2}L${x + w} ${y + 14}Z" fill="url(#terra)"/><rect x="${x - 4}" y="${y}" width="${w + 8}" height="16" rx="4" fill="#b5613a"/><rect x="${x - 4}" y="${y}" width="${w + 8}" height="5" rx="2.5" fill="#c97a4f" opacity=".7"/></g>`;
  };
  const tuft = (cx, y, n) => { let g = ''; for (let i = 0; i < n; i++) { const lean = (rnd() - 0.5) * 70, h = 50 + rnd() * 60, d = `M${cx + i * 4 - n * 2} ${y}Q${cx + lean * 0.3} ${y - h * 0.6} ${cx + lean} ${y - h}Q${cx + lean * 0.3 + 3} ${y - h * 0.5} ${cx + i * 4 - n * 2 + 4} ${y}Z`; g += `<path d="${d}" style="--a:${(2 + rnd() * 3).toFixed(1)}deg;animation-duration:${(7 + rnd() * 5).toFixed(1)}s;animation-delay:-${(rnd() * 8).toFixed(1)}s;transform-origin:${cx}px ${y}px"/>`; } return `<g fill="#c9a96b" fill-opacity=".9">${g}</g>`; };
  return `<defs><linearGradient id="terra" x1="0" x2="1"><stop offset="0" stop-color="#c0693f"/><stop offset=".55" stop-color="#a95430"/><stop offset="1" stop-color="#8d4326"/></linearGradient></defs>${tuft(1325, 130, 9)}${pot(1280, 62, 90, 70)}${pot(1420, 86, 62, 46)}${tuft(1451, 90, 6)}${s}`;
}
{
  const hasVideo = fs.existsSync(path.join(ROOT, 'assets/video/hero.mp4'));
  const poster = fs.existsSync(path.join(ROOT, 'assets/video/hero-poster.jpg')) ? ` poster="${asset('assets/video/hero-poster.jpg')}"` : '';
  const words = `
  <div class="wrap stage__in">
    <h1 id="hero-h" class="stage__h"><span class="stage__kicker">Multi-award-winning garden design<br class="kbr"> &amp; landscaping<br class="kbr2"> <span class="kdot" aria-hidden="true">&middot; </span>in Cheltenham &amp; the Cotswolds</span><span class="stage__hl">Gardens that belong<br><em>in the landscape.</em></span></h1>
    <p class="stage__sub">A family team from Cheltenham. We design, build and maintain gardens across the Cotswolds. From dry stone walls to outdoor kitchens, we weave new spaces into their beautiful surroundings.</p>
    <p class="stage__cta"><a class="stage__link" href="${href('projects')}">See our work</a><a class="stage__link" href="${href('contact')}">Discuss your garden</a></p>
  </div>`;
  const slides = [
    { f: 'wheat-sunrise-1600x900.jpg', b: 0.62, w: 1600, h: 900, alt: 'Sunrise over a wheat field in warm golden light', pos: '50% 60%' },
    { f: 'cotswolds-1-900x600.jpg', b: 0.74, w: 900, h: 600, alt: 'A Cotswold stone cottage garden with a brick path running between planted borders' },
    { f: 'wheat-field-1600x2133.jpg', b: 0.68, w: 1600, h: 2133, alt: 'Ripe wheat in a field at golden hour', pos: '50% 37%' },
    { f: 'wheat-sunny-1600x2240.jpg', b: 0.72, w: 1600, h: 2240, alt: 'Wheat ears in warm afternoon sunshine', pos: '50% 62%' },
    { f: 'cotswolds-2-900x600.jpg', b: 0.78, w: 900, h: 600, alt: 'Stone steps beside a Cotswold stone wall, with a white lily in the planting' },
    { f: 'wheat-cloudy-1600x2400.jpg', b: 0.72, w: 1600, h: 2400, alt: 'A wheat field under a soft cloudy sky', pos: '50% 47%' },
    { f: 'cotswolds-3-900x600.jpg', b: 1, w: 900, h: 600, alt: 'Wide stone steps and a dry-stone retaining wall above a paved terrace', pos: '50% 50%' },
  ];
  var SLIDES_SHARED = slides;
  const hasPhotos = fs.existsSync(path.join(ROOT, 'assets/photos/cotswolds-1-900x600.jpg'));
  const body = hasVideo ? `
<section class="stage stage--video" aria-labelledby="hero-h">
  <video class="stage__video" autoplay muted loop playsinline preload="metadata"${poster} aria-hidden="true" tabindex="-1"><source src="${asset('assets/video/hero.mp4')}" type="video/mp4"></video>
  <div class="stage__veil"></div>${words}
</section>` : hasPhotos ? `
<section class="stage stage--video stage--photo" aria-labelledby="hero-h">
  ${slides.map((s, i) => `<img class="stage__slide${s.f.includes('sunrise') ? ' stage__slide--sun' : ''}" style="--i:${i};--b:${s.b || 1}${s.pos ? ';object-position:' + s.pos : ''}" src="${asset('assets/photos/' + s.f)}" width="${s.w}" height="${s.h}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="${esc(s.alt || '')}">`).join('\n  ')}
  <div class="stage__veil"></div>${words}
</section>` : `
<section class="stage" aria-labelledby="hero-h">${words}
  <svg class="stage__grass" viewBox="0 0 1600 620" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">${grass()}</svg>
  <svg class="stage__wall" viewBox="0 0 1600 236" preserveAspectRatio="xMaxYMax slice" aria-hidden="true" focusable="false">${wall()}</svg>
</section>`;
  add('', layout({
    title: 'Garden Designers & Landscapers in Cheltenham and the Cotswolds | Morgan Oates',
    desc: 'Morgan Oates is a family team of garden designers and landscapers in Cheltenham, designing, building and maintaining gardens across the Cotswolds. Call 07827 321373.',
    path: '', body, ogImage: null, compact: true, dark: true,
    ld: { '@context': 'https://schema.org', '@type': ['LocalBusiness', 'LandscapingBusiness'], name: site.name, legalName: site.legalName, url: site.canonicalOrigin, logo: `${site.canonicalOrigin}/assets/photos/logo-659x239.png`, email: site.email, telephone: site.phoneTel, description: 'Family garden designers and landscapers in Cheltenham, serving the Cotswolds.', address: { '@type': 'PostalAddress', streetAddress: 'London Rd, Charlton Kings', addressLocality: 'Cheltenham', postalCode: 'GL54 4HG', addressCountry: 'GB' }, hasMap: site.mapUrl, identifier: site.companyNumber, areaServed: ['Cheltenham', 'The Cotswolds'], sameAs: site.social.map((s) => s.url), founder: [{ '@type': 'Person', name: 'Daniel Morgan Oates' }] }
  }));
}


function photoStage(words, labelId) {
  return `
<section class="stage stage--video stage--photo" aria-labelledby="${labelId}">
  ${SLIDES_SHARED.map((s, i) => `<img class="stage__slide${s.f.includes('sunrise') ? ' stage__slide--sun' : ''}" style="--i:${i};--b:${s.b || 1}${s.pos ? ';object-position:' + s.pos : ''}" src="${asset('assets/photos/' + s.f)}" width="${s.w}" height="${s.h}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="${esc(s.alt || '')}">`).join('\n  ')}
  <div class="stage__veil"></div>${words}
</section>`;
}

// SERVICES
function relatedBlock() {
  return `<section class="rel" aria-labelledby="rel-h"><div class="wrap"><h2 id="rel-h" class="rel__h">See the gardens</h2><p><a class="btn" href="${href('projects')}">Gardens and projects</a></p></div></section>`;
}
function serviceBody(s) {
  const secs = s.sections.map((sec) => {
    let inner = '';
    if (sec.p) inner += para(sec.p);
    if (sec.steps) inner += `<ol class="steps">${sec.steps.map(([t, d], i) => `<li><span class="steps__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></li>`).join('')}</ol>`;
    if (sec.schedule) inner += `<div class="sched">${svc.schedule.map(([f, items]) => `<div><h3>${f}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div><p class="note">An example only. Tasks vary with the season and the garden, and are agreed with you.</p>`;
    return `<section class="prose__sec"><h2>${esc(sec.h)}</h2><div>${inner}</div></section>`;
  }).join('');
  const also = s.also ? `<section class="prose__sec"><h2>Specialist work</h2><div><ul class="linklist">${s.also.map((a) => `<li><a href="${href(svc.pages[a].path)}">${esc(svc.pages[a].title)}</a></li>`).join('')}</ul></div></section>` : '';
  const jr = s.journal ? (() => { const a = journal.find((j) => j.slug === s.journal); return `<p class="note">From our journal (${dateFmt(a.date)}): <a href="${href('blog/' + a.slug)}">${esc(a.title)}</a></p>`; })() : '';
  return `
<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Services', svc.overview.path], [s.title, null]])}
  <p class="kicker">${esc(s.kicker)}</p><h1>${esc(s.title)}</h1><p class="lede">${esc(s.lede)}</p></div></section>
<div class="wrap"><figure class="phead__fig ${s.imagePortrait ? 'phead__fig--portrait' : ''} reveal" style="--w:${dims(s.image).w}">${pic(s.image, { alt: s.imageAlt, eager: true, sizes: '(min-width: 900px) 70vw, 100vw' })}<figcaption>${esc(s.caption)}</figcaption></figure></div>
<div class="wrap prose">${secs}${also}${jr}</div>
${relatedBlock(s.related)}${cta()}`;
}
for (const s of Object.values(svc.pages)) {
  CUR = s.path;
  add(s.path, layout({ title: s.metaTitle, desc: s.metaDescription, path: s.path, body: serviceBody(s), ogImage: s.image }));
}
{
  const o = svc.overview;
  const tiles = Object.values(svc.pages).map((s, i) => `<li class="ov__item"><a href="${href(s.path)}"><span class="ov__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span class="ov__t">${esc(s.title)}</span><span class="ov__d">${esc(s.lede)}</span></a></li>`).join('');
  add(o.path, layout({
    title: o.metaTitle, desc: o.metaDescription, path: o.path, ogImage: o.image,
    body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Services', null]])}<p class="kicker">Services</p><h1>Design, build and care</h1><p class="lede">${esc(o.lede)}</p></div></section>
<div class="wrap"><figure class="phead__fig reveal" style="--w:900">${pic(o.image, { alt: o.imageAlt, eager: true, sizes: '(min-width: 900px) 70vw, 100vw' })}</figure></div>
<div class="wrap"><ul class="ov">${tiles}</ul></div>${cta()}`
  }));
}

// GALLERY — full-screen cross-fade slideshow
{
  const gallery = [
    ['photos/gallery-01-sculpture-garden-1032x1280', 'A clipped garden with a circular stone sculpture, lawn and flowering alliums'],
    ['photos/gallery-02-terrace-1032x1280', 'A contemporary garden terrace with outdoor seating, planting and a curved floor lamp'],
    ['photos/gallery-04-treehouse-courtyard-1032x1280', 'A timber treehouse above a cobbled courtyard with an outdoor kitchen and planting'],
    ['photos/gallery-03-lavender-border-1206x1280', 'A lawn edged with lavender, roses and flowering borders beside a mature garden wall'],
    ['photos/g-green-brown-2-900x600', 'A sheltered garden dining terrace framed by layered green planting and warm timber'],
    ['photos/gallery-06-sauna-water-feature-1032x1280', 'An illuminated timber garden sauna beside a contemporary water feature and planted terrace'],
    ['photos/g-main-green-3-829x551', 'A formal front garden with clipped hedging, lawn and generous planting'],
    ['photos/g-green-2-900x599', 'A green garden with a striped lawn, mature trees and layered borders']
  ];
  const slides = gallery.map(([key, alt], i) => `<figure class="gfade__slide${i === 0 ? ' is-active' : ''}" data-gallery-slide aria-hidden="${i === 0 ? 'false' : 'true'}">${pic(key, { alt, sizes: '100vw', cls: 'gfade__img', eager: i === 0 })}</figure>`).join('');
  const dots = gallery.map(([, alt], i) => `<button class="gfade__dot${i === 0 ? ' is-active' : ''}" type="button" data-gallery-go="${i}" aria-label="Show image ${i + 1}: ${esc(alt)}" aria-current="${i === 0 ? 'true' : 'false'}"></button>`).join('');
  add('projects', layout({
    title: 'Gallery | Morgan Oates, Cheltenham and the Cotswolds', path: 'projects',
    desc: 'A full-screen gallery of gardens designed, built and cared for by Morgan Oates in Cheltenham and the Cotswolds.',
    dark: true, compact: true,
    body: `<section class="gfade" data-gallery aria-roledescription="carousel" aria-labelledby="gallery-h">
      <h1 id="gallery-h" class="vh">Gallery</h1>
      <div class="gfade__slides">${slides}</div>
      <div class="gfade__veil" aria-hidden="true"></div>
      <div class="gfade__controls">
        <button class="gfade__arrow gfade__prev" type="button" data-gallery-prev aria-label="Previous image"><span aria-hidden="true">←</span></button>
        <div class="gfade__dots" aria-label="Choose an image">${dots}</div>
        <p class="gfade__count" aria-live="polite"><span data-gallery-current>1</span> / ${gallery.length}</p>
        <button class="gfade__pause" type="button" data-gallery-pause aria-pressed="false">Pause</button>
        <button class="gfade__arrow gfade__next" type="button" data-gallery-next aria-label="Next image"><span aria-hidden="true">→</span></button>
      </div>
    </section>`
  }));
}
projects.length = 0;
for (const k of Object.keys(proj)) delete proj[k];

// ABOUT
function bgStage() {
  return `<div class="stage stage--video stage--photo stage--bgfix" aria-hidden="true">
  ${SLIDES_SHARED.map((s, i) => `<img class="stage__slide${s.f.includes('sunrise') ? ' stage__slide--sun' : ''}" style="--i:${i};--b:${s.b || 1}${s.pos ? ';object-position:' + s.pos : ''}" src="${asset('assets/photos/' + s.f)}" width="${s.w}" height="${s.h}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} alt="">`).join('\n  ')}
  <div class="stage__veil"></div>
</div>`;
}
CUR = 'west-london-landscape-gardeners';
add('west-london-landscape-gardeners', layout({
  title: 'The Team | Morgan Oates, garden designers and landscapers in Cheltenham and the Cotswolds', path: 'west-london-landscape-gardeners', dark: true, ogImage: team[0].image,
  desc: 'Garden designers and landscapers in Cheltenham and the Cotswolds: garden design, dry stone walls, patios, driveways, ponds, water features, garden rooms, pergolas, outdoor kitchens, planting, lighting, irrigation and garden maintenance. Meet Dan, Ania and the team.',
  body: bgStage() + `
<div class="about">
 <section class="wrap about__in about__intro apanel" aria-labelledby="about-h">
  <h1 id="about-h" class="about__h">We design, build and look after your garden with care</h1>
  <p class="about__lede">Morgan Oates is a garden design and landscaping company based in Cheltenham, working across the Cotswolds. We design and build gardens, from dry stone walls, patios and driveways to ponds, water features, garden rooms, pergolas, outdoor kitchens, planting, lighting and irrigation, and we look after them with garden maintenance and lawn care.</p>
 </section>
 <div class="wrap about__in about__team">
  ${team.map((m) => `<article class="apanel apanel--m" aria-labelledby="m-${esc(m.name.split(' ')[0].toLowerCase())}">
   <figure class="apanel__ph"><img src="${asset(m.local)}" width="${m.w}" height="${m.h}" alt="${esc(m.alt)}" loading="lazy" decoding="async"></figure>
   <div class="apanel__t"><h2 id="m-${esc(m.name.split(' ')[0].toLowerCase())}" class="apanel__h">${esc(m.name)}</h2><p class="about__k">${esc(m.role)}</p>${para(m.bio)}${m.quote ? `<blockquote class="apanel__q"><p>${esc(m.quote.text)}</p><footer>${esc(m.quote.by)}</footer></blockquote>` : ''}</div>
  </article>`).join('')}
 </div>
 <div class="wrap about__in about__more">
  <section class="apanel" aria-labelledby="crew-h"><h2 id="crew-h" class="apanel__h">The crew</h2><p>The team on site are particularly friendly, experienced and professional. Dan oversees health and safety, keeps sites tidy and keeps noise down. Project management is about regular communication: if something comes up, you hear about it from us.</p></section>
 </div>
 <div class="wrap about__in about__cta"><a class="about__btn" href="${href('contact')}">Discuss your garden</a></div>
</div>`
}));

// BEFORE AND AFTER
CUR = 'before-and-after';
const BA = [
  { id: 'woodmancote', tb: 'Builders<br class="ba__br"> rubble', ta: 'Limestone courtyard', title: 'Builders rubble to Limestone courtyard', cap: 'A building site becomes a finished stone-paved courtyard.', w: 1200, h: 900,
    before: 'assets/photos/ba-woodmancote-before-1200x900', after: 'assets/photos/ba-woodmancote-after-1200x900',
    bAlt: 'Woodmancote before: a bare, rubble-strewn courtyard in front of stone buildings with boarded-up openings',
    aAlt: 'Woodmancote after: a finished paved courtyard in front of the stone buildings, with glazed doors and planting' },
  { id: 'london', start: 80, tb: 'Rotting<br class="ba__br"> timber', ta: 'Barrel sauna sanctuary', title: 'Rotting timber to barrel sauna sanctuary', cap: 'A tired, shaded garden becomes a planted deck and seating area.', w: 960, h: 1200,
    before: 'assets/photos/ba-london-before-960x1200', after: 'assets/photos/ba-london-after-960x1200',
    bAlt: 'London garden before: dark worn decking, a small shed and a barbecue under a bare, leaf-covered garden',
    aAlt: 'London garden after: new timber decking and paving, planted borders, garden chairs and a barrel sauna' },
  { id: 'lawn', tb: 'Muddy puddles', ta: 'Fresh lawn', title: 'Muddy puddles to fresh lawn', cap: '', w: 1200, h: 900,
    before: 'assets/photos/ba-lawn-before-1200x900', after: 'assets/photos/ba-lawn-after-1200x900',
    bAlt: 'Before: bare, churned-up muddy ground with puddles',
    aAlt: 'After: a newly laid striped lawn with a greenhouse and a row of young trees behind' }
];
const baImg = (src, w, h, alt, cls) => `<img class="${cls}" src="${asset(src + '.jpg')}" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async" draggable="false">`;
add('before-and-after', layout({
  title: 'Before and after | Garden transformations | Morgan Oates', path: 'before-and-after', dark: true,
  desc: 'Drag to compare before and after photographs of garden and landscaping projects by Morgan Oates, from Woodmancote in the Cotswolds to a London garden.',
  body: bgStage() + `<section class="phead phead--ba"><div class="wrap"><h1 class="vh">Before and after</h1></div></section>
<div class="wrap ba">${BA.map((p) => `<section class="ba__item" aria-labelledby="ba-${p.id}">
  <div class="ba__cmp" style="--r:${p.w}/${p.h};--p:${p.start || 90}%">
    ${baImg(p.before, p.w, p.h, p.bAlt, 'ba__img ba__img--b')}
    ${baImg(p.after, p.w, p.h, p.aAlt, 'ba__img ba__img--a')}
    <span class="ba__tag ba__tag--b" aria-hidden="true">Before</span><span class="ba__tag ba__tag--a" aria-hidden="true">After</span>
    <span class="ba__bar" aria-hidden="true"><span class="ba__knob"></span></span><span class="ba__hint" aria-hidden="true"><span class="ba__hint-t">Drag me</span><svg viewBox="0 0 60 44" width="60" height="44"><path d="M8 3C2 20 14 38 46 37" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M39 31l8 6-9 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <input class="ba__range" type="range" min="0" max="100" value="${p.start || 90}" aria-label="Compare before and after: ${esc(p.title)}">
  </div>
  <h2 id="ba-${p.id}" class="ba__h"><span class="ba__l">${p.tb.includes("<br") ? p.tb : esc(p.tb)}</span><span class="vh"> to </span><span class="ba__r">${esc(p.ta)}</span></h2>
</section>`).join('')}</div>${cta()}`
}));

// JOURNAL
add('blog', layout({
  title: 'Journal | Morgan Oates', path: 'blog', desc: 'Notes on garden design and gardening from the Morgan Oates archive, with original publication dates.',
  body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Journal', null]])}<p class="kicker">Journal</p><h1>Journal</h1><p class="lede">Notes on design, planting and garden care, kept as a dated archive. Gardening advice here was written between 2014 and 2019 and has not been updated; treat it as background, not current guidance.</p></div></section>
<div class="wrap"><ol class="jl">${journal.map((a) => `<li class="jl__i"><time datetime="${a.date}">${dateFmt(a.date)}</time><div><h2><a href="${href('blog/' + a.slug)}">${esc(a.title)}</a></h2><p>${esc(a.excerpt)}</p></div></li>`).join('')}</ol></div>${cta()}`
}));
journal.forEach((a) => {
  const body = a.body.map((t) => t.startsWith('LIST:') ? `<ul>${t.slice(5).split('|').map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : `<p>${esc(t)}</p>`).join('');
  const sib = journal.find((j) => j.slug === a.related);
  const r = a.related && (proj[a.related] ? `<p class="note">See the garden: <a href="${href('projects/' + a.related)}">${esc(proj[a.related].title)}</a></p>` : sib ? `<p class="note">Also in this series: <a href="${href('blog/' + sib.slug)}">${esc(sib.title)}</a></p>` : `<p class="note">Related: <a href="${href(a.related)}">${esc(svc.pages.design.title)}</a></p>`);
  add(`blog/${a.slug}`, layout({
    title: `${a.title} | Morgan Oates Journal`, desc: a.excerpt, path: `blog/${a.slug}`,
    ld: { '@context': 'https://schema.org', '@type': 'Article', headline: a.title, datePublished: a.date, author: { '@type': 'Organization', name: site.legalName }, publisher: { '@type': 'Organization', name: site.legalName } },
    body: `<article><section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Journal', 'blog'], [a.title, null]])}<p class="kicker">Archive · <time datetime="${a.date}">${dateFmt(a.date)}</time></p><h1>${esc(a.title)}</h1></div></section>
<div class="wrap art"><div class="art__body">${body}${r || ''}</div><aside class="art__aside"><p><strong>From the archive.</strong> First published on ${dateFmt(a.date)} and not updated since. Please treat any advice as background and check current guidance before acting on it.</p></aside></div></article>${cta()}`
  }));
});

// CONTACT
CUR = 'contact';
add('contact', layout({
  title: 'Contact | Morgan Oates, garden designers and landscapers in Cheltenham and the Cotswolds', path: 'contact', dark: true, compact: true,
  desc: 'Contact Morgan Oates about garden design, landscaping or garden maintenance in Cheltenham and the Cotswolds: email info@morganoates.co or call 07827 321373.',
  body: photoStage(`
  <div class="wrap stage__in stage__in--form">
   <div class="cgrid">
    <form class="cform" id="enquiry" method="post" novalidate ${site.formEndpoint ? `action="${esc(site.formEndpoint)}"` : ''} data-endpoint="${esc(site.formEndpoint)}" data-email="${site.email}" data-phone="${site.phoneDisplay}" aria-labelledby="contact-h">
      <h1 id="contact-h" class="cform__h">Discuss your garden</h1>
      <div class="cfield"><label for="f-phone">Phone number <span aria-hidden="true">*</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" required aria-describedby="e-phone"><p class="field__e" id="e-phone" hidden></p></div>
      <div class="cfield"><label for="f-email">Email <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><p class="field__e" id="e-email" hidden></p></div>
      <div class="cfield"><label for="f-msg">What are you looking to have done? <span aria-hidden="true">*</span></label><textarea id="f-msg" name="message" rows="4" required aria-describedby="e-msg"></textarea><p class="field__e" id="e-msg" hidden></p></div>
      <div class="cfield cfile"><input id="f-img" class="cfile__in" name="images" type="file" accept="image/*" multiple aria-describedby="h-img e-img"><div class="cfile__row"><label for="f-img" class="cform__b2 cfile__b"><span class="cfile__t">Upload image</span><small class="cfile__list" id="h-img">Optional</small></label><span class="cfile__hint">Helps us understand the space.</span></div><p class="field__e" id="e-img" hidden></p></div>
      <div class="cfield vh" aria-hidden="true"><label for="f-web">Leave this empty</label><input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <button class="cform__btn" type="submit">Send enquiry</button>
      <div class="form__status cform__status" role="status" aria-live="polite" id="form-status" tabindex="-1"></div>
      <p class="cform__alt">We use your details only to reply. <a href="${href('privacy')}">Privacy</a></p>
      <noscript><p class="cform__alt">This form needs JavaScript. Please email <a href="${mail}">${site.email}</a> or call <a href="${tel}">${site.phoneDisplay}</a>.</p></noscript>
    </form>
    <aside class="cdiscuss" aria-labelledby="disc-h">
      <h2 id="disc-h" class="cdiscuss__h">Prefer to discuss it now?</h2>
      <p class="cform__or"><a class="cform__b2" href="${tel}" aria-label="Call us on ${site.phoneDisplay}">Call us</a><a class="cform__b2" href="${mail}" aria-label="Email us at ${site.email}">Email us</a><a class="cform__b2 cform__b2--wa" href="https://wa.me/${site.phoneTel.replace(/\D/g, '')}" rel="noopener" aria-label="Message us on WhatsApp">WhatsApp</a></p>
    </aside>
   </div>
  </div>`, 'contact-h')
}));

// LEGAL (drafts needing owner review)
add('privacy', layout({
  title: 'Privacy | Morgan Oates', path: 'privacy', desc: 'How this website handles your information.', noindex: false,
  body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Privacy', null]])}<h1>Privacy</h1><p class="lede">A plain description of what this website does with your information.</p></div></section>
<div class="wrap prose"><section class="prose__sec"><h2>Who we are</h2><div><p>This website is run by ${esc(site.legalName)}. You can contact us at <a href="${mail}">${site.email}</a> or on <a href="${tel}">${site.phoneDisplay}</a>.</p></div></section>
<section class="prose__sec"><h2>Enquiries</h2><div><p>If you send an enquiry through the form, or email or call us, we use your details to reply and to discuss your project.</p></div></section>
<section class="prose__sec"><h2>Cookies and third parties</h2><div><p>This website does not use analytics or advertising cookies. The film on the home page is hosted by Vimeo and is loaded only if you choose to play it; Vimeo then handles your data under its own policy.</p></div></section>
<section class="prose__sec"><h2>Your rights</h2><div><p>You can ask us to tell you what we hold about you, to correct it, or to delete it, by emailing us.</p></div></section>
<p class="note">Draft prepared for ${esc(site.legalName)} to review before launch. It describes only what this website does, and is not legal advice.</p></div>`
}));
add('terms', layout({
  title: 'Terms | Morgan Oates', path: 'terms', desc: 'Terms and conditions for Morgan Oates Ltd.',
  body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Terms', null]])}<h1>Terms and conditions</h1><p class="lede">Terms depend on the kind of work and on whether you are a business or a private customer.</p></div></section>
<div class="wrap prose"><section class="prose__sec"><h2>Before you commission work</h2><div><p>Please email <a href="${mail}">${site.email}</a> and ask for the terms that apply to your project before work is agreed.</p></div></section>
<p class="note">The previous website listed separate business-to-business and business-to-customer terms without publishing the text. The owner needs to supply them for this page.</p></div>`
}));

// 404
add('404-page', layout({
  title: 'Page not found | Morgan Oates', path: '404-page', desc: 'That page could not be found.', noindex: true,
  body: `<section class="phead"><div class="wrap"><p class="kicker">404</p><h1>That page isn’t here</h1><p class="lede">It may have moved. These are good places to start.</p>
<ul class="linklist"><li><a href="${href('projects')}">Gardens and projects</a></li><li><a href="${href(svc.overview.path)}">Services</a></li><li><a href="${href('blog')}">Journal</a></li><li><a href="${href('contact')}">Contact</a></li><li><a href="${href('')}">Home</a></li></ul></div></section>`
}));

/* ---------- write ---------- */
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of pages) {
  if (p.path === '404-page') { fs.writeFileSync(path.join(OUT, '404.html'), p.html); continue; }
  const dir = path.join(OUT, p.path);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), p.html);
}
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
if (fs.existsSync(path.join(ROOT, 'assets/images'))) fs.cpSync(path.join(ROOT, 'assets/images'), path.join(OUT, 'images'), { recursive: true });
fs.rmSync(path.join(OUT, 'assets/images'), { recursive: true, force: true });

const live = pages.filter((p) => p.path !== '404-page');
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n`.replace('sitemap.org/schemas', 'sitemaps.org/schemas') + live.map((p) => `  <url><loc>${site.canonicalOrigin}/${p.path}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), LAUNCH ? `User-agent: *\nAllow: /\nSitemap: ${site.canonicalOrigin}/sitemap.xml\n` : `# PREVIEW BUILD: keep out of search results\nUser-agent: *\nDisallow: /\n`);
fs.writeFileSync(path.join(OUT, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n${LAUNCH ? '' : '  X-Robots-Tag: noindex, nofollow\n'}/images/*\n  Cache-Control: public, max-age=31536000, immutable\n/assets/*\n  Cache-Control: public, max-age=3600\n`);
fs.writeFileSync(path.join(OUT, '_redirects'), fs.readFileSync(path.join(ROOT, 'content/_redirects'), 'utf8'));
fs.writeFileSync(path.join(ROOT, 'docs/asset-manifest.json'), JSON.stringify({ note: 'Every photograph used by the site. Source files are on morganoates.co (maximum width available there: 900px; homepage slideshow images up to 1400px). Permission to reuse must be confirmed by the owner.', images: [...manifest.values()].sort((a, b) => a.key.localeCompare(b.key)) }, null, 1));
console.log(`built ${pages.length} pages, ${manifest.size} images → ${OUT} (images:${IMAGE_MODE}, links:${LINKS}, ${LAUNCH ? 'LAUNCH' : 'noindex preview'})`);
