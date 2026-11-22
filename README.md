# Fit Health Distribution

Website and admin for Fit Health Distribution: vending machines first, with fitness supplements and drinks alongside them.

This repository starts with the design system. The storefront and the admin get built on top of it.

## What the site will do

- **Storefront.** Clients browse the catalog and press "I'm interested" on what they want, then send a request through the contact form. Online ordering with payment comes later.
- **Admin.** The owner signs in to:
  - add, hide and remove products;
  - edit every piece of text on the storefront (headlines, button labels, contact copy) and restore the original wording;
  - read client inquiries, which only admins can see;
  - watch business figures, client retention first.

## What is here

```
design-system/
  README.md              the brand book: voice, color, type, spacing, icons, logo
  surfaces.md            how the storefront and the admin are put together
  site-copy.md           every piece of storefront text, with its key and original wording
  site-copy.json         the same list as data, to seed the content store
  tokens.json            the design tokens (source of truth)
  tokens.css             the tokens as CSS custom properties, light and dark (generated)
  fonts/                 Big Shoulders, Archivo and Chivo Mono, variable woff2
  assets/Logos/          placeholder wordmark and FHD monogram, SVG
  assets/Icons/          67 Phosphor Bold glyphs, SVG
  components/src/        React components in TypeScript
  components/bundle.css  component styles
  components/bundle.js   the components as one script for plain HTML pages (generated)
  components/index.d.ts  component types (generated)
  components/<Name>/     README.md with usage rules, preview.html with an example
  scripts/               build, icon and contrast-check scripts
  licenses/              font and icon licenses
```

## Use it

Load the two stylesheets once, tokens first:

```html
<link rel="stylesheet" href="design-system/tokens.css">
<link rel="stylesheet" href="design-system/components/bundle.css">
```

Pages are light by default. Put `data-theme="dark"` on any element to turn that region near-black; the nav bar, the hero, the footer and the admin sidebar do this themselves.

In a React app, import the components from their source:

```tsx
import { Button, ProductCard, StatCard } from './design-system/components/src';
```

`components/src/index.ts` starts with `'use client'`, so in the Next.js App Router the components can be imported from server components as they are.

Each `components/<Name>/preview.html` expects `tokens.css`, `bundle.css`, React 18 and `bundle.js` to be loaded already; it is the example the design system page in Claude renders. Read it for usage, or open the design system in Claude to see it live.

## Change it

```sh
cd design-system
npm install
npm run build   # tokens.css, site-copy.md, components/bundle.js, components/index.d.ts
npm run check   # contrast audit of every text and edge pair, in both themes
```

Edit `tokens.json`, `site-copy.json`, `components/src/*.tsx` or `components/bundle.css`, then run the build. `tokens.css`, `site-copy.md`, `bundle.js` and `index.d.ts` are generated: do not edit them by hand.

To add an icon, add its Phosphor name to `scripts/icons.mjs` and run `npm run icons`, then `npm run build`.

## The design system in Claude

The same system is kept as a design system in Claude, named Fit Health Distribution, where every component has a live preview in light and dark. This folder is its code copy. After changing files here, sync that design system from this repository so the two stay in step.

## Licenses

Big Shoulders, Archivo and Chivo Mono are under the SIL Open Font License 1.1. Phosphor Icons are under the MIT license. The texts are in `design-system/licenses/`.

## Develop

Needs Node 22+, Docker and the Supabase CLI.

```sh
npm install
npm run db:start      # local Supabase on ports 553xx; copy API_URL, PUBLISHABLE_KEY and SECRET_KEY from `supabase status -o env` into .env.local
npm run db:reset      # applies supabase/migrations, loads supabase/seed.sql and the copy slots
npm run dev
```

- `npm run db:test` runs the database tests in `supabase/tests` (access rules and the draft/publish lifecycle).
- `npm run verify` type-checks, lints and builds. Run it, and `npm run db:test`, before every commit.
- `npm run db:sync-copy` loads new slots from `design-system/site-copy.json`. Add `-- --linked` for the hosted project.
- Environment variables are listed in `.env.example`. Real values live in `.env.local` and are never committed.

### How content is published

Visitors read only published tables (`live_copy`, `live_faqs`) and visible products. The owner edits drafts in `site_content` and `faqs`, which visitors cannot read. `publish_site()` copies every saved draft live in one transaction, so the copy and the FAQ change together, and the storefront cache is expired by tag.
