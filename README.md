# Motus Studio web app

This directory is the Motus Studio web application deployed to OpenAI Sites.
It uses Vinext, React, and Vite, so HTML is generated from route components at
build time rather than maintained in a hand-written `index.html` file.

## Route entry points

- `app/page.tsx` — Home
- `app/studio/page.tsx` — visual Studio and block editor
- `app/discover/page.tsx` — discovery catalog
- `app/read/[slug]/page.tsx` — reader

## Run locally

```bash
npm install
npm run dev
```

## Validate a release

```bash
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

The deployed app currently uses private access. Do not change the Sites access
policy or publish the parent GitHub repository without explicit authorization.
