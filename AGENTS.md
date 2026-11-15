# AGENTS.md

Instructions for AI coding agents working on Hodi's public website. Read `README.md` first: it explains the folders,
how a page is written and the deployment.

- The site is static: Astro writes HTML into `dist/`, nginx serves it and sends only Hodi's sign-up routes on to
  Hodi. Add JavaScript only for what HTML and CSS cannot do. No framework in a page.
- The look is Hodi's: its tokens, fonts and components, copied into `src/landing/landing.css`. Never hard-code a colour.
- French is the reference and says « tu ». Every new text of `src/landing/markup.html` gets its English line in
  `src/landing/en.json`; the scripts' texts live in French and English side by side (`src/landing/join/texts.ts`).
  Code, comments, identifiers and commits are in English.
- The demos in `public/landing/` are recordings of the real app: never draw a feature Hodi does not have.
- SEO and speed are part of the work: every page has its title, description and canonical link, and Lighthouse stays
  at 99 or more for performance and 100 for SEO and best practices.
- TypeScript strict, ES modules, imports with the `.ts` extension. Prettier decides formatting (no semicolons, single
  quotes, 120 columns): run `npm run format`. At most 300 lines per file and 80 per function, cognitive complexity
  under 15, no nested ternary. Comments say why in one or two plain sentences, above the line they concern.
- Check a visual change in a real browser at 1440 × 900, 820 × 1180 and 390 × 844, in the dark and light themes.
- Before a pull request: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` and `npm test`
  must pass.
- Commits and pull request titles follow Conventional Commits. Never put a session link in a commit, a pull request or
  a comment. Only Antho merges.
