// Tiny static server for dist/ (no dependencies): node scripts/serve.mjs  → http://localhost:4173
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
http.createServer((req, res) => {
  let p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(root)) { res.writeHead(403).end(); return; }
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) { res.writeHead(404, { 'Content-Type': types['.html'] }).end(fs.readFileSync(path.join(root, '404.html'))); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' }).end(fs.readFileSync(p));
}).listen(4173, () => console.log('http://localhost:4173'));
