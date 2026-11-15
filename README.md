<div align="center">

# 🏡 Hodi site

**The public website of [Hodi](https://github.com/leclaudeur/hodi), at [get-hodi.com](https://get-hodi.com).**<br>
What Hodi does, live demos, the legal pages and the way in.

[![CI](https://github.com/leclaudeur/hodi-site/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/leclaudeur/hodi-site/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Patreon](https://img.shields.io/badge/Patreon-Le%20Claudeur-F96854?logo=patreon&logoColor=white)](https://www.patreon.com/cw/LeClaudeur)

[**Quick start**](#quick-start) · [**How it works**](#how-it-works) · [**Deploying**](#deploying) · [**Rules**](#rules) · [**Sponsor**](#sponsor)

</div>

## Intro

The site is static pages, served by nginx beside Hodi.\
Its forms talk to the [Village](https://github.com/leclaudeur/hodi-plugin-village) plugin through the site's own address.\
The app itself lives at `app.get-hodi.com`.

- ⚡ Fast - _every page is built ahead by [Astro](https://astro.build)_
- 🌍 Two languages - _French and English_
- 🎬 Real demos - _the app's own screens, recorded_
- ✍️ Sign-up on the site - _the e-mail code, the password, the household_
- ⚖️ Legal pages - _legal notice, privacy and terms_

## Quick start

You need **Node.js 24** or later.

```bash
npm ci
npm run dev    # → http://localhost:4321/
```

The forms need Hodi with Village behind `/api/public/plugins/village/`.\
Without it, the page shows only the sign-in link.

## How it works

```text
src/pages/      one file per address
src/landing/    the landing: markup, styles, scripts
public/landing/ the demos
nginx/          the server's configuration
```

French is the reference.\
At build time, the English page swaps each text for its line in [`src/landing/en.json`](src/landing/en.json).

The site sends only Village's public routes on to Hodi:

```text
visitor ─▶ site ─▶ /api/public/plugins/village/… ─▶ Hodi
                └▶ anything else: a static page
```

For the browser, both share one address, so there is no CORS.

## Deploying

There is no release: what is on `main` is online.\
Each merge builds the image `ghcr.io/leclaudeur/hodi-site`, which Portainer runs beside Hodi.

1. **Make the image public**: in the package's _Package settings_, after the first build.
2. **Add the service**: paste [compose.yml](compose.yml)'s `site` into Hodi's stack.
3. **Point to Hodi**: `HODI_URL` is Hodi's address on that network (`http://app:3000`).
4. **Point the domains**: `get-hodi.com` to `SITE_PORT`, `app.get-hodi.com` to Hodi.
5. **Tell Village**: set _Server › Village › Sign-ups › Site address_ to `https://get-hodi.com`.

After each merge, open the stack and click **Pull and redeploy**.

> [!IMPORTANT]
> The reverse proxy must send the visitor's address in `X-Forwarded-For`.\
> Hodi limits each visitor's tries by that address.

## Rules

- **The look is Hodi's**: its tokens, fonts and components, never a hard-coded colour.
- **French first**: each new text gets its English line in `en.json`.
- **Real demos only**: a recording of the app, never a drawing.
- **Fast and found**: Lighthouse 99+ for performance, 100 for SEO.

Every pull request runs the typecheck, the lint, Prettier, the build and the tests.

## Sponsor

Hodi is free and open source, with no ads and nothing to pay.\
If it is useful to you, you can support its work on Patreon.

[![Support Hodi on Patreon](https://img.shields.io/badge/Support%20Hodi-Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/cw/LeClaudeur)

## License

Copyright © 2026 Le Claudeur.

This website is free software under the [GNU Affero General Public License v3.0](LICENSE).
