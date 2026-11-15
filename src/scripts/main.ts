import { mountCopy, mountFaq, mountMenus, mountScroll, themeSetter } from '../landing/chrome.ts'
import { mountComparison } from '../landing/comparison.ts'
import { mountDemos } from '../landing/demos.ts'
import { mountJoin } from '../landing/join/index.ts'
import { LANG_KEY, type Page, pageOf, write } from '../landing/page.ts'
import { legacyLegalOf, pathOf } from '../landing/routes.ts'

// The site's one script: the page is already written (Astro), this only makes it move.

// The pages panel of a tablet or a phone, on a legal page: a native dialog, closed by its button or a click beside it.
const mountLegalTree = ({ $, signal }: Page) => {
  const tree = $<HTMLDialogElement>('.legal-tree')
  const close = () => tree.open && tree.close()
  $('.legal-tree-open').addEventListener('click', () => tree.showModal(), { signal })
  $('.legal-tree-close').addEventListener('click', close, { signal })
  tree.addEventListener('click', e => e.target === tree && close(), { signal })
}

// The language: each is its own page. A choice made here is remembered, so the next visit to / opens in it.
const mountLanguage = (page: Page) => {
  const { $$, root, signal } = page
  const to = (lang: string) => {
    write(LANG_KEY, lang)
    if (lang !== page.lang) location.assign((root.dataset.switch ?? '/') + location.hash)
  }
  $$('[data-lang-next]').forEach(b =>
    b.addEventListener('click', () => to(page.lang === 'fr' ? 'en' : 'fr'), { signal })
  )
  $$<HTMLElement>('[data-lang-pick]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.langPick === page.lang))
    b.addEventListener('click', () => to(b.dataset.langPick ?? 'fr'), { signal })
  })
}

const off = new AbortController()
const page = pageOf(document, { base: '/landing/' }, off.signal)

// The legal pages' older addresses, #/legal and #legal, from links shared before they had their own.
const legacy = legacyLegalOf(location.hash)
if (legacy) location.replace(pathOf({ lang: page.lang, legal: legacy }))

// The 404 names the address that led nowhere, as the app's does.
const lostPath = document.querySelector('[data-lost-path]')
if (lostPath) lostPath.textContent = location.pathname

const demos = mountDemos(page)
mountComparison(page)
const setTheme = themeSetter(page, demos.tell)
const { closeSheet } = mountMenus(page, setTheme)
const onScroll = mountScroll(page)
mountCopy(page)
mountFaq(page)
mountLegalTree(page)
mountLanguage(page)
mountJoin(page)
// A link of the menu sheet closes it on the way.
page.$('#sheet').addEventListener('click', e => (e.target as Element).closest('a') && closeSheet(), {
  signal: off.signal
})

setTheme(page.theme)
demos.load(true)
demos.observe()
onScroll()
