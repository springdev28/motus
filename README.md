# Motus

Motus is a web application for creating, animating, publishing, discovering,
and reading motion comics. The Studio combines Canva-style visual composition
with Scratch-style editable animation blocks.

The private hosted prototype is available at
[motus-studio.baharyuksel0403.chatgpt.site](https://motus-studio.baharyuksel0403.chatgpt.site).

## Web application

This repository root is the deployable Vinext, React, and Vite application.
HTML is generated from route components at build time, so the project does not
maintain a hand-written `index.html` file.

Primary routes:

- `app/page.tsx` — creator home
- `app/studio/page.tsx` — visual Studio and block editor
- `app/discover/page.tsx` — discovery catalog
- `app/read/[slug]/page.tsx` — reader
- `app/creator/[handle]/page.tsx` — creator profiles

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

## Hostinger deployment

The repository is intentionally detected as an Express/Node application by
Hostinger even though Vinext owns request rendering. `server.js` is the
conventional platform entry point and delegates to `hostinger-server.mjs`,
which starts the Vinext production server on `0.0.0.0` using `PORT` (3000 by
default). Keep the `express` dependency and both entry files in place; removing
them makes Hostinger auto-detect the repository as a static Vite site, which
cannot serve this server-rendered build.

## Planning

- [MVP delivery plan](docs/MVP_PLAN.md)

The deployed prototype currently uses owner-only access. Do not change its
Sites access policy without explicit authorization.
