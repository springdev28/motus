# Motus

Motus is a creator platform for showcasing work, discovering independent voices,
and sharing interactive visual stories. Its Studio brings artwork and motion
comics to life with visual composition and editable animation blocks.

The Hostinger application is available at
[firebrick-lark-503190.hostingersite.com](https://firebrick-lark-503190.hostingersite.com).

## Simple comic archive (2026-09-09)

The home route and `/basic` now open a simpler comic archive: upload PNG, JPG,
or WebP pages, add optional image layers, select one of seven motion presets
(or None), set click/appearance triggers and timing, and preview the result.
Comic details include title, creator, summary, tags, language, rating, and status.
The reader keeps vertical scroll, single pages, two-page spreads, left-to-right
or right-to-left reading, page turns/slide/instant transitions, original image
proportions, custom page backgrounds, and the existing appearance settings.
Motion can be switched off and respects the device's reduced-motion preference.

Draft changes save automatically after a short pause. **Save draft** saves immediately; **Add to archive** places the work on your browser bookshelf. Undo and redo recover edits, and pages can be dropped onto the canvas.
The separate `motus-basic-v1` IndexedDB database does not touch original Studio
projects, uploads, or editions. **Download** exports a `.motus-basic.json` file;
**Import comic file** validates it and adds a separate copy. The archive is local
to this browser, not a public hosting or account service. Imports support up to
100 pages, 30 image layers per page, and 80 MB per comic file. There are no ads,
payments, or monetization flows in this version.

The previous application routes are preserved as source in
`preserved/original-routes/`, outside the active app. The old `/original`,
`/studio`, `/discover`, `/creator/*`, and `/read/*` URLs are not exposed by the
simple app. Original editor components, assets, and saved browser data remain
intact. The source snapshot at
`preserved/motus-before-simple-2026-09-09.tar.gz` also contains the application
and configuration as they were before the simpler version was introduced.
Shared assets and dependencies remain in place; the snapshot is not a full
media or dependency backup.

## Web application

This repository root is the deployable Vinext, React, and Vite application.
HTML is generated from route components at build time, so the project does not
maintain a hand-written `index.html` file.

Primary routes:

- `app/page.tsx` | simple comic archive
- `app/basic/page.tsx` | alternate entry to the simple archive
- `preserved/original-routes/` | original route source, not web routes

## Run locally

```bash
npm install
npm run dev
```

## Validate a release

```bash
npm run format
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

## Planning

- [MVP delivery plan](docs/MVP_PLAN.md)

## Hosting and appearance

`npm run build` creates the Node deployment in `dist`; `npm start` serves it
with `hostinger-server.mjs` using the hosting provider's `PORT`. The build
restores any omitted AI model files from the checked-in manifests and verifies
their sizes and SHA-256 hashes. Upload application source to the existing
Hostinger application, excluding generated output, dependencies, ignored files,
and the large model binaries restored during the build. The separate
`build:worker` script retains the earlier Sites/Cloudflare deployment option.

Use Hostinger's **Other / Node.js** application type, Node 22, build script
`build`, output directory `dist`, and entry file `hostinger-server.mjs`.
Automatic Vite detection must be overridden because Motus requires a running
server. The Node build does not depend on `.openai/hosting.json`.
The Express dependency and conventional `server.js` entry also allow Hostinger's
archive detector to choose its Node server runtime instead of static Vite hosting;
Vinext continues to handle the application requests.

Settings offers **Light**, **Dark**, and **Use device setting** throughout the
platform. Light is the default; the saved preference is applied before first
paint and stays consistent between routes. Automatic color changes only occur
when device appearance is explicitly selected. Preferences are browser-local.

The interface combines an archive's detailed metadata, tags, and summaries with
a reading shelf. Discovery offers Gallery and Archive layouts with original
Motus styling; covers will come from creators rather than generated samples.

## Creator discovery and sharing

Motus connects creation with showcasing work: the home page links to Studio,
creator discovery, a personal Following feed, and reader editions. Discovery
supports language, format, status, rating, genre, origin, community, and sorting;
its filters persist in the URL. Following a creator includes their works in the
home and discovery feeds. Studio offers 52 language choices, including multiple
languages and work without dialogue.

Use **Share & promote** on a catalog work or creator profile to copy its link
and an editable promotion caption. On a browser-saved edition, the same action
downloads a `.motus-reader.json` file containing only the published snapshot.
Recipients open that file at `/read/import`; their Studio draft stays intact.
The import validates the existing project schema, accepts files up to 5 MB,
requires an explicit replacement step for newer revisions, and refuses to
replace a saved edition with the same or an older revision.

The public catalog starts empty: fictional creators, works, communities, counts,
and cover illustrations have been removed. Studio starts with a blank project.
Exact untouched copies of the retired demo and the known browser-test edition
are removed from browser storage; edited drafts and uploaded editions are kept.
Legacy project examples exist only as test fixtures and are excluded from deployment.

Current platform boundaries: public registration is not implemented; follows,
reading progress, drafts, and up to 12 reader editions are stored in the browser.
This is not an authenticated public publishing service. Files can be shared
between devices; browser edition URLs alone cannot. Site access settings still
apply to catalog/profile links and the import page. Shared files contain artwork
and motion data and are readable by anyone who receives them.
