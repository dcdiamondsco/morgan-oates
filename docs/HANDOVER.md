# Morgan Oates: handover (review build)

**Status: a complete review build, not launched.** The live morganoates.co is untouched. Every page is `noindex` until built with `LAUNCH=1`.

## Creative direction
An independent landscape studio presented as an architectural magazine. Limestone paper, botanical green, charcoal and a clay accent taken from the photographs; one editorial serif and one plain sans (system fonts, so no third-party font requests). The signature idea is the **wide view and the close detail**: pairs of plates captioned "Wide view" and "Close detail", fine rules, small-caps plate captions, and every project laid out as a numbered sequence of plates. Images are never stretched past about 1.2× their real size, so the layout leans on composition, not scale.

## What is built (46 pages)
Home; Services overview; Garden design; Landscaping; Irrigation and water features; Garden lighting; Living walls; Maintenance; Projects index; 15 project pages from one template; About/team; Journal index and all 16 articles with original dates; Contact (accessible form); Privacy and Terms (drafts); 404; sitemap.xml, robots.txt, _headers, _redirects.

## Needs configuration or decisions
- **Photographs:** run `node scripts/fetch-assets.mjs` (or push, and the GitHub workflow does it). The old site serves a **maximum of 900px wide** (home slideshow up to 1400px), which is adequate for the layouts but soft on large retina screens. **Original high-resolution files are needed from the owner/photographers** for the hero, selected gardens and Oasis of Peace in particular.
- **Contact form** has no sending service yet (see README). Until set, it tells visitors nothing was sent and offers email/phone.
- **Privacy and Terms** pages are drafts. The old site listed two sets of terms (business and consumer) but published no text; the owner must supply them.
- **Fonts** are system fonts. A self-hosted licensed serif would lift the typography.
- **Alt text** for gallery plates is generic ("Scarsdale Villas: view 4 of 27"). Descriptive alt text should be written per image.
- **Journal:** articles are edited condensed versions of the originals (the full original text could not be copied from the old site). Every article is marked as an archive item with its date; the plant-disease, nutrient, slug-pellet, box-pest and lime articles need horticultural review before being treated as current.

## Facts and permissions to confirm before launch
1. Daniel Morgan Oates, Director; Anna Pawlowska, Garden Designer: titles and bios correct and approved? Is the portrait file `01-…jpg` Daniel? Permission to use both portraits?
2. **Dated or unverified claims deliberately left out of the site copy:** "award-winning" (company); "gold medal gardens at Chelsea over the last three years" (Daniel; dated); "over ten years" (company); "Moroccan/Mediterranean… couple" brief for Oasis is described as a show-garden concept.
3. **Included, attributed to the old site, needs verification:** Oasis of Peace "Silver Award and People's Choice Award, Gardeners' World Live 2019"; Anna's design "one of five APL Avenue Show Gardens, BBC Gardeners' World Live 2019" (from the 2019 journal article).
4. **Biotecture** "accredited installer" wording was on the old site; the new copy says only "We install Biotecture living walls". Confirm accreditation and wording.
5. **Lighting:** "qualified electricians… certificates supplied". The old page also cited City & Guilds Level 2 and Part P; not repeated. Supplier list kept as Hunza, Collingwood, Louis Poulsen, Oase. The old page also named "John Cullun" (spelling unclear); omitted.
6. **Roles on projects:** only stated where the old site said so. Oasis (design: Anna), Japanese Garden and West London Romantic Garden (designed and built by Morgan Oates), Scarsdale Villas (design Stephen Woodhams, built by Morgan Oates), Oxfordshire, Simorgh, Red House (design Stephen Woodhams; **builder not stated**), Cheltenham (works listed; designer/builder not stated), Central London, Egerton Terrace, Primrose Hill, Herefordshire, Chelsea 2013/2018 (no role stated). Please say who designed and built each so credits can be completed. Project dates are not shown because none were given.
7. **Chelsea 2013:** the show-garden and trade-stand pages used identical file names; I treated them as separate galleries (they show different images). "Award-winning" for the 2013 stand was on the old site and is not repeated.
8. **Photo credits/permission:** only Oasis of Peace credits a photographer (Lilliana Sokolowska). Photographers for all other images are unknown. Sculptor Tom Stogdon and Maker & Wright credits are kept. Confirm permission to use work by Stephen Woodhams's designs and all photographs.
9. **Social links** kept: Facebook and Twitter/X from the old site; the LinkedIn link was a long search-result tracking URL and was dropped. Provide a proper profile URL.
10. **Contact:** info@morganoates.co and 07827 321373 as on the old site. No postal address, opening hours or service-area claim is published or in structured data.
11. Primrose Hill, Egerton Terrace and Chelsea 2018 had no descriptions: pages are deliberately short. Supply a brief and the work done if you want fuller pages.
12. The Vimeo film "Creating an Oasis of Peace": confirm it should stay, and that the Vimeo account allows embedding (uses `dnt=1`; the player loads only after the visitor presses play, and plays on that press).

## URL migration plan
**No existing URL changes**, so no content page needs a permanent redirect. Preserved paths:
`/` · `/london-garden-designers` · `/west-london-landscape-gardeners` · `/london-landscape-gardening` · `/london-landscape-gardening/west-london-landscape-gardening-services` · `/london-landscape-gardening/garden-irrigation` · `/london-landscape-gardening/garden-lighting` · `/london-landscape-gardening/living-walls` · `/london-landscape-gardening/west-london-garden-maintenance` · `/projects` and all 15 `/projects/<slug>` (including `/projects/eastnor`, titled "Herefordshire Country House") · `/blog` and all 16 `/blog/<slug>` · `/contact`.
New: `/privacy`, `/terms`. Convenience redirects in `content/_redirects`: `/index.html`, `/index.php`, `/journal(/*)`, `/profile`, `/about`, `/services`, `/gardens`. Navigation labels differ (Profile → About, Blog → Journal) but the URLs stay. Old social-share images (`…/fb-img.jpg`) are not carried over; new pages use project photographs for sharing once launched.
After launch: submit the sitemap, spot-check every URL above returns 200, confirm the trailing-slash behaviour of the host (canonicals have no trailing slash).

## Tested
**Measured:** 46 pages build; internal link check 0 broken from 1,809 references; all 192 source photo URLs return 200; home page reviewed by eye on desktop (full length) and phone width; at 390px the sampled pages (home, projects index, three project pages, design, maintenance, contact) had no horizontal overflow and no failed images; no lorem ipsum; no duplicate page titles.
**Not yet measured (targets only):** WCAG 2.2 AA conformance, Lighthouse/performance scores, screen-reader and full keyboard testing, form and menu behaviour in a real browser, desktop screenshots of every inner page, other browsers. The code is written to those targets (semantic landmarks, skip link, visible focus, labelled form with live status, reduced-motion support, explicit image dimensions, lazy loading below the fold, hero image prioritised, no animation library) but they have not been audited.
**Design critique, done:** weakest sections were the home Services band (text-only: now photo-led), project galleries (sameness: now paired, offset and panoramic rows) and the opening (white logo box: fixed with a blend mode, reversible). Still weakest: the Process section is text-only by design, and inner pages need a desktop visual pass.

## Deploying
Not done, by instruction. When approved: `LAUNCH=1 node build.mjs` after `fetch-assets`, upload `dist/` to the chosen host, add `_redirects`/`_headers` equivalents, then change DNS.
