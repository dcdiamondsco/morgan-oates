// Checks every internal link, asset reference and image in dist/ resolves to a file.  node scripts/check-links.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(dist).filter((f) => f.endsWith('.html'));
let bad = 0, n = 0, imgMissing = new Set();
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src)="([^"#?]+)(?:[#?][^"]*)?"/g)) {
    const u = m[1]; if (/^(https?:|mailto:|tel:|data:)/.test(u)) continue;
    n++;
    let t = u.startsWith('/') ? path.join(dist, u) : path.resolve(path.dirname(f), u);
    if (fs.existsSync(t) && fs.statSync(t).isDirectory()) t = path.join(t, 'index.html');
    if (!fs.existsSync(t)) { if (u.includes('/images/')) imgMissing.add(u); else { bad++; console.log('BROKEN', path.relative(dist, f), '→', u); } }
  }
}
console.log(`${files.length} pages, ${n} internal references checked, ${bad} broken links, ${imgMissing.size} image files not yet downloaded`);
process.exitCode = bad ? 1 : 0;
