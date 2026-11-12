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
const href = (to) => (LINKS === 'files' ? rel(to ? to + '/index.html' : 'index.html') : '/' + to);
const asset = (to) => (LINKS === 'files' ? rel(to) : '/' + to);

const dims = (key) => { const m = key.match(/-(\d+)x(\d+)(?:-q\d+)?$/); return m ? { w: +m[1], h: +m[2] } : { w: 0, h: 0 }; };
const imgSrc = (key) => (IMAGE_MODE === 'remote' ? `${SRC}${key}.jpg` : asset(`images/${key}.jpg`));
const pimg = (slug, name) => `projects/${slug}/${name}`;
const logoSrc = IMAGE_MODE === 'remote' ? 'https://morganoates.co/dist/images/logo-web.png' : asset('images/logo-web.png');

// logo dimensions read from the PNG header if the file has been fetched (avoids stretching)
let logoDims = '';
try {
  const b = fs.readFileSync(path.join(ROOT, 'assets/images/logo-web.png'));
  if (b.toString('ascii', 1, 4) === 'PNG') logoDims = ` width="${b.readUInt32BE(16)}" height="${b.readUInt32BE(20)}"`;
} catch {}

const manifest = new Map(); // key -> {key,w,h,source,used}
function pic(key, { alt = '', sizes = '100vw', cls = '', eager = false, style = '' } = {}) {
  const { w, h } = dims(key);
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
    <li><a href="${href('projects')}"${CUR.startsWith('projects') ? ' aria-current="page"' : ''}>Gardens</a></li>
    <li class="nav__has-sub"><a href="${href(svc.overview.path)}"${CUR.startsWith('london-') ? ' aria-current="true"' : ''}>Services</a>
      <ul class="nav__sub" aria-label="Services">
        ${Object.values(svc.pages).map((p) => `<li><a href="${href(p.path)}"${CUR === p.path ? ' aria-current="page"' : ''}>${esc(p.title)}</a></li>`).join('')}
      </ul></li>
    <li><a href="${href('west-london-landscape-gardeners')}"${CUR === 'west-london-landscape-gardeners' ? ' aria-current="page"' : ''}>About</a></li>
    <li><a href="${href('blog')}"${CUR.startsWith('blog') ? ' aria-current="page"' : ''}>Journal</a></li>
    <li><a class="nav__contact" href="${href('contact')}"${CUR === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
  </ul>
</nav>`;

function layout({ title, desc, path: p, body, ogImage, ld, dark = false, noindex = false, compact = false }) {
  CUR = p;
  const canon = `${site.canonicalOrigin}/${p}`;
  const robots = !LAUNCH || noindex ? '<meta name="robots" content="noindex, nofollow">' : '';
  const og = ogImage ? `${site.canonicalOrigin}/images/${ogImage}.jpg` : '';
  return `<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
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
<meta name="theme-color" content="#f1ede4">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231f3d2f'/%3E%3Ctext x='16' y='22' font-family='Georgia,serif' font-size='17' text-anchor='middle' fill='%23f1ede4'%3EMO%3C/text%3E%3C/svg%3E">
<script>document.documentElement.classList.add('js')</script>
<link rel="stylesheet" href="${asset('assets/css/site.css')}">
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="header${dark ? ' header--over' : ''}">
  <div class="header__in">
    <a class="logo" href="${href('')}" aria-label="Morgan Oates, home"><img src="${logoSrc}"${logoDims} height="48" alt="Morgan Oates"></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="site-nav"><span class="menu-btn__t">Menu</span><span class="menu-btn__i" aria-hidden="true"></span></button>
    ${NAV()}
  </div>
</header>
<main id="main" tabindex="-1">
${body}
</main>
${compact ? `<footer class="footer footer--compact"><div class="wrap footer__base footer__base--only"><p>© ${YEAR} ${esc(site.legalName)} · <a href="${mail}">${site.email}</a> · <a href="${tel}">${site.phoneDisplay}</a></p><ul class="footer__legal"><li><a href="${href('privacy')}">Privacy</a></li><li><a href="${href('terms')}">Terms</a></li></ul></div></footer>` : `<footer class="footer">
  <div class="wrap footer__grid">
    <div class="footer__brand">
      <img class="footer__logo" src="${logoSrc}"${logoDims} height="40" alt="Morgan Oates" loading="lazy">
      <p>Garden design, landscaping and maintenance from Chiswick, West London.</p>
    </div>
    <div>
      <h2 class="footer__h">Services</h2>
      <ul>${Object.values(svc.pages).map((s) => `<li><a href="${href(s.path)}">${esc(s.title)}</a></li>`).join('')}</ul>
    </div>
    <div>
      <h2 class="footer__h">The studio</h2>
      <ul>
        <li><a href="${href('projects')}">Gardens</a></li>
        <li><a href="${href('west-london-landscape-gardeners')}">About and team</a></li>
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
    <p>© ${YEAR} ${esc(site.legalName)}</p>
    <ul class="footer__legal"><li><a href="${href('privacy')}">Privacy</a></li><li><a href="${href('terms')}">Terms</a></li></ul>
  </div>
</footer>`}
<script src="${asset('assets/js/site.js')}" defer></script>
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

// HOME: a single full-screen showcase, few words
{
  const hero = 'home/slideshow/7-1400x803-q80';
  const body = `
<section class="stage" aria-labelledby="hero-h">
  ${pic(hero, { alt: 'A long planted border and sand path running through a Morgan Oates garden', eager: true, sizes: '100vw', cls: 'stage__img' })}
  <div class="stage__shade"></div>
  <div class="wrap stage__in">
    <h1 id="hero-h" class="stage__h">Considered gardens.<br><em>Beautifully built.</em></h1>
    <p class="stage__cta"><a class="btn btn--light" href="${href('projects')}">Explore our gardens</a><a class="stage__link" href="${href('contact')}">Discuss your garden</a></p>
  </div>
</section>`;
  add('', layout({
    title: 'Garden designers and landscapers in London | Morgan Oates',
    desc: 'Morgan Oates designs, builds and maintains gardens from Chiswick, West London, across West, Central and South London: town gardens, rooftops and country gardens.',
    path: '', body, ogImage: hero, compact: true,
    ld: { '@context': 'https://schema.org', '@type': 'Organization', name: site.legalName, url: site.canonicalOrigin, logo: `${site.canonicalOrigin}/images/logo-web.png`, email: site.email, telephone: site.phoneTel, description: 'Garden design, landscaping and garden maintenance based in Chiswick, West London.' }
  }));
}

// SERVICES
function relatedBlock(slugs) {
  return `<section class="rel" aria-labelledby="rel-h"><div class="wrap"><h2 id="rel-h" class="rel__h">Related gardens</h2><div class="rel__grid">${slugs.map((s) => { const p = proj[s]; return `<a class="rel__card" href="${href('projects/' + p.slug)}"><figure>${pic(pimg(p.slug, p.cover || p.hero), { alt: p.alt, sizes: '(min-width: 900px) 30vw, 100vw' })}</figure><h3>${esc(p.title)}</h3><p>${esc(p.meta)}</p></a>`; }).join('')}</div></div></section>`;
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

// PROJECTS
{
  const groups = ['Town and city gardens', 'Country gardens', 'Show gardens'];
  const card = (p, i) => `<a class="pi__card ${i === 0 ? 'pi__card--lead' : ''} reveal" href="${href('projects/' + p.slug)}"><figure>${pic(pimg(p.slug, p.cover || p.hero), { alt: p.alt, sizes: i === 0 ? '(min-width: 900px) 60vw, 100vw' : '(min-width: 900px) 30vw, 100vw' })}</figure><h3>${esc(p.title)}</h3><p>${esc(p.meta)}</p></a>`;
  const blocks = groups.map((g) => `<section class="pi__group" aria-labelledby="g-${g[0]}${g.length}"><h2 id="g-${g[0]}${g.length}" class="pi__gh">${g}</h2><div class="pi__grid">${projects.filter((p) => p.group === g).map(card).join('')}</div></section>`).join('');
  add('projects', layout({
    title: 'Gardens and projects | Morgan Oates', path: 'projects', ogImage: pimg('oasis-of-peace', 'cover-900x600'),
    desc: 'Town gardens, country gardens and show gardens by Morgan Oates, with design and build credits stated on every project.',
    body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Gardens', null]])}<p class="kicker">Gardens</p><h1>Gardens and projects</h1><p class="lede">From a basement courtyard to a country house, and from Chelsea stands to a Moroccan-inspired show garden. Each page says what we designed, what we built, and who else was involved.</p></div></section><div class="wrap">${blocks}</div>${cta()}`
  }));
}
projects.forEach((p, idx) => {
  const rel2 = proj[p.related];
  const ldb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', ''], ['Gardens', 'projects'], [p.title, `projects/${p.slug}`]].map(([n, u], i) => ({ '@type': 'ListItem', position: i + 1, name: n, item: `${site.canonicalOrigin}/${u}` })) };
  const facts = p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
  const credits = p.credits.length ? `<section class="proj__credits" aria-labelledby="cr-h"><h2 id="cr-h">Credits</h2><dl>${p.credits.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>` : '';
  const prev = projects[(idx + projects.length - 1) % projects.length], next = projects[(idx + 1) % projects.length];
  add(`projects/${p.slug}`, layout({
    title: `${p.title} | Morgan Oates`, desc: `${p.title}: ${p.summary}`.slice(0, 200), path: `projects/${p.slug}`, ld: ldb, ogImage: pimg(p.slug, p.hero),
    body: `
<section class="phead phead--proj"><div class="wrap">${crumbs([['Home', ''], ['Gardens', 'projects'], [p.title, null]])}
  <p class="kicker">${esc(p.meta)}</p><h1>${esc(p.title)}</h1></div></section>
<div class="wrap"><figure class="proj__hero reveal" style="--w:${dims(p.hero).w}">${pic(pimg(p.slug, p.hero), { alt: p.alt, eager: true, sizes: '(min-width: 900px) 80vw, 100vw' })}</figure></div>
<div class="wrap proj__intro"><div class="proj__text">${para(p.intro)}</div><dl class="proj__facts">${facts}</dl></div>
<div class="wrap seq" aria-label="Photographs of ${esc(p.title)}">${sequence(p)}</div>
<div class="wrap">${credits}</div>
<nav class="wrap pn" aria-label="More gardens"><a class="pn__a" href="${href('projects/' + prev.slug)}"><span>Previous garden</span>${esc(prev.title)}</a><a class="pn__a pn__a--r" href="${href('projects/' + next.slug)}"><span>Next garden</span>${esc(next.title)}</a></nav>
${relatedBlock([p.related])}${cta()}`
  }));
});

// ABOUT
add('west-london-landscape-gardeners', layout({
  title: 'About Morgan Oates and the team | Chiswick, West London', path: 'west-london-landscape-gardeners', ogImage: team[0].image,
  desc: 'Meet Daniel Morgan Oates, Director, Anna Pawlowska, Garden Designer, and the Morgan Oates team: garden design and landscaping from Chiswick.',
  body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['About', null]])}<p class="kicker">About</p><h1>A small studio that designs, builds and looks after gardens</h1><p class="lede">Morgan Oates is a landscape gardening and garden design company based in Chiswick, West London, working across West, Central and South London and further afield on request.</p></div></section>
<div class="wrap team">${team.map((m, i) => `<article class="team__m ${i % 2 ? 'team__m--r' : ''}"><figure class="reveal">${pic(m.image, { alt: m.alt, sizes: '(min-width: 900px) 40vw, 100vw', eager: i === 0 })}</figure><div><p class="kicker">${esc(m.role)}</p><h2>${esc(m.name)}</h2>${para(m.bio)}</div></article>`).join('')}</div>
<section class="wrap prose"><section class="prose__sec"><h2>The crew</h2><div><p>The people on site are friendly, experienced and professional. Site foremen oversee health and safety, keep sites tidy and keep noise down. Project management is about regular communication: if something comes up, you hear about it from us.</p></div></section>
<section class="prose__sec"><h2>Design, build and aftercare</h2><div><p>We take on garden design, the construction of designs by others, and maintenance of established gardens, together or separately. <a href="${href(svc.overview.path)}">See the services</a>, or <a href="${href('contact')}">get in touch</a>.</p></div></section></section>${cta()}`
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
add('contact', layout({
  title: 'Contact | Morgan Oates', path: 'contact', desc: 'Contact Morgan Oates about garden design, landscaping or garden maintenance: email info@morganoates.co or call 07827 321373.',
  body: `<section class="phead"><div class="wrap">${crumbs([['Home', ''], ['Contact', null]])}<p class="kicker">Contact</p><h1>Discuss your garden</h1><p class="lede">Tell us where the garden is and what you would like from it. We will reply to talk it through.</p></div></section>
<div class="wrap contact">
  <div class="contact__side">
    <h2>Direct</h2>
    <p><a class="contact__big" href="${mail}">${site.email}</a><br><a class="contact__big" href="${tel}">${site.phoneDisplay}</a></p>
    <p>Based in Chiswick, West London.</p>
    <p class="note">Messages from the form go to the same inbox as email. We use what you send only to reply to your enquiry. <a href="${href('privacy')}">Privacy</a></p>
  </div>
  <form class="form" id="enquiry" method="post" novalidate ${site.formEndpoint ? `action="${esc(site.formEndpoint)}"` : ''} data-endpoint="${esc(site.formEndpoint)}" data-email="${site.email}" data-phone="${site.phoneDisplay}" aria-labelledby="form-h">
    <h2 id="form-h">Send an enquiry</h2>
    <p class="form__req">Fields marked <span aria-hidden="true">*</span><span class="vh">with an asterisk</span> are required.</p>
    <div class="field"><label for="f-name">Name <span aria-hidden="true">*</span></label><input id="f-name" name="name" type="text" autocomplete="name" required aria-describedby="e-name"><p class="field__e" id="e-name" hidden></p></div>
    <div class="field"><label for="f-email">Email <span aria-hidden="true">*</span></label><input id="f-email" name="email" type="email" autocomplete="email" required aria-describedby="e-email"><p class="field__e" id="e-email" hidden></p></div>
    <div class="field"><label for="f-phone">Phone <span class="opt">(optional)</span></label><input id="f-phone" name="phone" type="tel" autocomplete="tel" aria-describedby="e-phone"><p class="field__e" id="e-phone" hidden></p></div>
    <div class="field"><label for="f-loc">Project location <span aria-hidden="true">*</span></label><input id="f-loc" name="location" type="text" required aria-describedby="h-loc e-loc"><p class="field__h" id="h-loc">Town or postcode area is enough.</p><p class="field__e" id="e-loc" hidden></p></div>
    <div class="field"><label for="f-svc">What are you interested in?</label><select id="f-svc" name="service"><option value="">Not sure yet</option><option>Garden design</option><option>Landscaping (building a garden)</option><option>Irrigation and water features</option><option>Garden lighting</option><option>Living wall</option><option>Garden maintenance</option></select></div>
    <div class="field"><label for="f-msg">About the project <span aria-hidden="true">*</span></label><textarea id="f-msg" name="message" rows="6" required aria-describedby="e-msg"></textarea><p class="field__e" id="e-msg" hidden></p></div>
    <div class="field vh" aria-hidden="true"><label for="f-web">Leave this empty</label><input id="f-web" name="website" type="text" tabindex="-1" autocomplete="off"></div>
    <p class="form__priv">We use your details only to reply to this enquiry. <a href="${href('privacy')}">Read more</a>.</p>
    <button class="btn" type="submit">Send enquiry</button>
    <div class="form__status" role="status" aria-live="polite" id="form-status" tabindex="-1"></div>
    <noscript><p class="note">This form needs JavaScript. Please email <a href="${mail}">${site.email}</a> or call <a href="${tel}">${site.phoneDisplay}</a>.</p></noscript>
  </form>
</div>`
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
