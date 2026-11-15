<div align="center">

# 🏡 Hodi site

**The public website of [Hodi](https://github.com/leclaudeur/hodi), at [get-hodi.com](https://get-hodi.com).**<br>
What Hodi does, live demos of the real app, the legal pages, and the way in: create a household or join the waiting list.

[![CI](https://github.com/leclaudeur/hodi-site/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/leclaudeur/hodi-site/actions/workflows/ci.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![Patreon](https://img.shields.io/badge/Patreon-Le%20Claudeur-F96854?logo=patreon&logoColor=white)](https://www.patreon.com/cw/LeClaudeur)

[**Quick start**](#quick-start) · [**How it works**](#how-it-works) · [**Deploying**](#deploying) · [**Rules**](#rules) · [**Sponsor**](#sponsor)

</div>

## Intro

The site is static pages, served by nginx beside Hodi. Its forms talk to the [Village](https://github.com/leclaudeur/hodi-plugin-village)
plugin, through the site's own address: the app itself lives at `app.get-hodi.com`.

- ⚡ Fast - _every page is written at build time by [Astro](https://astro.build), in French and in English_
- 🎬 Real demos - _the app's own screens, recorded, playing in the page_
- ✍️ Sign-up on the site - _the e-mail code, the password and the household, step by step_
- ⚖️ Legal pages - _legal notice, privacy and terms, each at its own address_

## Quick start

You need **Node.js 24** or later.

```bash
npm ci
npm run dev    # → http://localhost:4321/
```

The forms need Hodi with Village behind `/api/public/plugins/village/`. Without it, the page shows « Se connecter » only.

## How it works

```text
src/
  pages/            one file per address: /, /en, /legal, /privacy, /terms and their English twins
  layouts/Page.astro  the <head> of every page: title, description, canonical and hreflang links
  lib/render.ts     writes the landing's markup for one address: its language, questions and legal text
  landing/          the landing itself: markup.html, landing.css, en.json and the scripts of each part
  landing/join/     « Rejoindre »: the sign-up steps and the waiting list
  scripts/main.ts   the one script of the page
public/landing/     the demos: the app's screens and the files they need
nginx/              the server's configuration, Hodi's address filled in at start
```

French is the reference. The English page is the French markup with each text swapped for its line in
[`src/landing/en.json`](src/landing/en.json), at build time.

The site sends only Village's public routes on to Hodi. For the browser, they share the site's address, so there is
no CORS, and Hodi counts each visitor by the address the reverse proxy gives.

```text
visitor ─▶ reverse proxy ─▶ site (nginx) ─▶ /api/public/plugins/village/… ─▶ Hodi
                                         └▶ everything else: the static pages
```

## Deploying

There is no release: what is on `main` is online.\
Each merge builds the image `ghcr.io/leclaudeur/hodi-site`, which Portainer runs beside Hodi.

1. **Make the image public**: after the first build, in the package's _Package settings_.
2. **Add the service**: paste [compose.yml](compose.yml)'s `site` into Hodi's stack, on the same network as Hodi.
3. **Point Hodi's address**: `HODI_URL` is Hodi's service name and port on that network (`http://app:3000` by default).
4. **Point the domains**: in the reverse proxy, send `get-hodi.com` to `SITE_PORT` and `app.get-hodi.com` to Hodi, with HTTPS.
5. **Tell Village**: in Hodi, _Serveur › Village › Inscriptions › Adresse du site_ is `https://get-hodi.com`. The links in e-mails lead there.

After each merge, open the stack and click **Pull and redeploy**.

> [!IMPORTANT]
> The reverse proxy must add the visitor's address in `X-Forwarded-For`, and reach the site from a private address:
> Hodi limits each visitor's tries by that address.

## Rules

- **The look is Hodi's**: its tokens, its fonts and its components. Never hard-code a colour.
- **French first**: a new text in `markup.html` gets its English line in `en.json` in the same pull request.
- **Real demos only**: a demo is a recording of the app, never a drawing of it.
- **Speed and SEO are part of the work**: Lighthouse stays at 99 or more for performance, 100 for SEO.

Every pull request runs `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` and `npm test`.

## Sponsor

Hodi is free and open source, with no ads and nothing to pay.\
If it is useful to you, you can support its work on Patreon.

[![Support Hodi on Patreon](https://img.shields.io/badge/Support%20Hodi-Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/cw/LeClaudeur)

## License

Copyright © 2026 Le Claudeur.

This website is free software under the [GNU Affero General Public License v3.0](LICENSE).
