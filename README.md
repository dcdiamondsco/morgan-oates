# Morgan Oates website

Static, dependency-free site generator (Node 18+). Output is plain HTML/CSS with a few lines of JavaScript, so pages are fast and fully indexable. Chosen because it needs no installs, builds in about a second, and anyone can edit the content in JSON files.

## Commands
| Command | What it does |
|---|---|
| `node scripts/fetch-assets.mjs` | Downloads every photograph and the logo from the existing site into `assets/images/` (needs internet) |
| `node build.mjs` | Builds `dist/` (preview: `noindex`, root-relative links, local images) |
| `LINKS=files node build.mjs` | Same, with relative links ending `index.html`; works on GitHub Pages sub-paths and from a file |
| `LAUNCH=1 node build.mjs` | Indexable build (real robots.txt, no noindex). **Only when the owner approves launch** |
| `node scripts/check-links.mjs` | Checks every internal link and image reference in `dist/` |
| `node scripts/serve.mjs` | Serves `dist/` at http://localhost:4173 |

Pushing to `main` runs `.github/workflows/preview.yml`, which fetches the photos, builds the noindex preview and publishes it to GitHub Pages (repo Settings → Pages → Source: GitHub Actions).

## Editing content (all in `content/`)
- **Projects** `projects.json`: one object per garden. `images` is a space-separated list of file names (without `.jpg`) from `assets/images/projects/<slug>/`; the width and height are read from the `-900x600` suffix. `credits` and `facts` are `[label, value]` pairs: add only what is verified. `hero` is the opening image, `cover` an optional different image for cards. `related` is the slug of another project. The gallery layout is automatic: portraits pair up, landscapes alternate left and right, panoramas run full width.
- **New project:** add the images to `assets/images/projects/<new-slug>/`, add an object to `projects.json`, rebuild. The page, index card and sitemap entry appear automatically.
- **Team** `team.json`; **services** `services.json` (page copy, steps, maintenance schedule); **journal** `journal.json` (keep the original `date`; one paragraph per array item; a string starting `LIST:` with `|` separators makes a bullet list); **site-wide details** `site.json` (email, phone, form endpoint, Vimeo id).
- **Redirects** `content/_redirects` (Netlify/Cloudflare format; translate for other hosts).
- **Style** `assets/css/site.css`; **behaviour** `assets/js/site.js`.

## Contact form
Static sites cannot send mail. Set `formEndpoint` in `content/site.json` to a form service URL (for example Formspree). Until then the form validates, says plainly that nothing has been sent, and offers a ready-filled email link plus the email address and phone number. It only reports success when the endpoint answers OK. No credentials are in the front end.

## Launch checklist
1. Owner answers the questions in `docs/HANDOVER.md` and approves copy and image use.
2. Replace the draft Privacy and Terms text; set `formEndpoint`.
3. `LAUNCH=1 node build.mjs`, deploy `dist/` (not before explicit approval), then point the domain.
4. Submit `sitemap.xml` in Search Console and check the redirects.
