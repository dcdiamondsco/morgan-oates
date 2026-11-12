// Downloads every photograph listed in docs/asset-manifest.json (plus the logo) from the existing
// morganoates.co site into assets/images/. Run on a machine with normal internet access:
//   node scripts/fetch-assets.mjs        then       node build.mjs
// Re-runnable: files that already exist are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/asset-manifest.json'), 'utf8'));
const jobs = m.images.map((i) => ({ url: i.source, file: i.local }));
jobs.push({ url: 'https://morganoates.co/dist/images/logo-web.png', file: 'assets/images/logo-web.png' });
let ok = 0, skip = 0, fail = [];
const queue = [...jobs];
async function worker() {
  while (queue.length) {
    const j = queue.shift(), dest = path.join(ROOT, j.file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) { skip++; continue; }
    try {
      const r = await fetch(j.url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); ok++;
    } catch (e) { fail.push(`${j.url} (${e.message})`); }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
console.log(`downloaded ${ok}, already present ${skip}, failed ${fail.length}`);
if (fail.length) { console.log(fail.join('\n')); process.exitCode = 1; }
