import { parseHTML } from 'linkedom'
import markup from '../landing/markup.html?raw'
import { LEGAL_UI, TEXTS_UPDATED, legalPage } from '../landing/legal.ts'
import { type Lang, type LegalId, LEGAL_IDS, pathOf } from '../landing/routes.ts'
import { FAQ, I18N, icon } from '../landing/texts.ts'
import { TEXT_ATTRIBUTES } from '../landing/units.ts'
import { LEGAL_INFO } from './site.ts'

// Each page of the site is the landing's markup, written once per address at build time: the right language, the
// questions and the legal page's text, so search engines and the first paint get it all without a script.

const SKIP = 'script, style, svg, iframe, .site-layer, [data-no-i18n]'
const TEXT = 3
const ELEMENT = 1

const textsIn = (el: Node, out: Text[]) => {
  for (const n of el.childNodes) {
    if (n.nodeType === TEXT && n.nodeValue?.trim()) out.push(n as Text)
    else if (n.nodeType === ELEMENT && !(n as Element).matches('svg, script, style')) textsIn(n, out)
  }
  return out
}

// One element with text of its own: its French text is the key, and its English words replace it in order.
const translateUnit = (el: Element) => {
  const nodes = textsIn(el, [])
  const fr = nodes.map(n => n.nodeValue ?? '')
  const found = I18N.units[fr.map(t => t.replace(/\s+/g, ' ').trim()).join(' | ')]
  const words = typeof found === 'string' ? [found] : found
  if (!words || words.length !== nodes.length) return
  nodes.forEach((n, i) => {
    const text = fr[i] ?? ''
    n.nodeValue = (text.match(/^\s*/)?.[0] ?? '') + words[i] + (text.match(/\s*$/)?.[0] ?? '')
  })
}

// What units.ts did in the browser, on the build's DOM, then the attributes that carry words.
const translate = (root: Element) => {
  const walk = (el: Element) => {
    if (el.matches(SKIP)) return
    if ([...el.childNodes].some(n => n.nodeType === TEXT && n.nodeValue?.trim())) translateUnit(el)
    else for (const child of el.children) walk(child)
  }
  walk(root)
  root.querySelectorAll('*').forEach(e => {
    if (e.closest('svg, .site-layer, [data-no-i18n]')) return
    for (const a of TEXT_ATTRIBUTES) {
      const fr = e.getAttribute(a)
      const en = fr ? I18N.attrs[fr] : undefined
      if (en) e.setAttribute(a, en)
    }
  })
}

const faqHtml = () =>
  FAQ.map(
    ([q, a], i) => `
  <section class="acc${i === 0 ? ' open' : ''}">
    <h3><button type="button" class="acc-h" aria-expanded="${i === 0}" aria-controls="faq-${i}">${q}<span class="chev" aria-hidden="true">${icon('chevron-down')}</span></button></h3>
    <div class="acc-b" id="faq-${i}"><div><p>${a}</p></div></div>
  </section>`
  ).join('')

// The legal view's text, title and menus in the page's language.
const fillLegal = (body: Element, lang: Lang, id: LegalId) => {
  const $ = (s: string) => body.querySelector(s) as Element
  const $$ = (s: string) => [...body.querySelectorAll(s)]
  const shown = legalPage(lang, id, { ...LEGAL_INFO, updated: TEXTS_UPDATED })
  const ui = LEGAL_UI[lang]
  $('[data-legal-title]').textContent = shown.label
  $('[data-legal-kicker]').textContent = ui.kicker
  // The text opens with its date: it moves up under the title, in the captions' mono font.
  const [, date = '', text = shown.html] = shown.html.match(/^<p><em>(.*?)<\/em><\/p>\s*([\s\S]*)$/) || []
  $('[data-legal-date]').textContent = date
  $('[data-legal-body]').innerHTML = text
  $$('.legal-side').forEach(nav => nav.setAttribute('aria-label', ui.nav))
  $$('[data-legal-group]').forEach(el => (el.textContent = ui.nav))
  $$('[data-legal-pages]').forEach(el => (el.textContent = ui.pages))
  $('.legal-tree-close').setAttribute('aria-label', ui.close)
  $$('.legal-side a').forEach(a => {
    const tab = LEGAL_IDS.find(page => a.getAttribute('href') === `/${page}`)
    const label = a.querySelector('[data-legal-tab]')
    if (tab && label) label.textContent = ui.tabs[tab]
    if (tab === id) a.setAttribute('aria-current', 'page')
  })
  return shown.label
}

// Links lead to the page's own language; a section's link from a legal page goes back to the landing.
const fixLinks = (body: Element, lang: Lang, legal: LegalId | null) => {
  const home = pathOf({ lang, legal: null })
  body.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href') ?? ''
    const id = LEGAL_IDS.find(page => href === `/${page}`)
    if (id) a.setAttribute('href', pathOf({ lang, legal: id }))
    else if (href.startsWith('#') && legal) a.setAttribute('href', href === '#top' ? home : home + href)
  })
}

export interface Rendered {
  body: string
  legalTitle: string | null
}

export const renderPage = (lang: Lang, legal: LegalId | null): Rendered => {
  const { document } = parseHTML(`<!doctype html><html><body class="hl-body">${markup}</body></html>`)
  const body = document.body
  const faq = body.querySelector('#faq')
  if (faq) faq.innerHTML = faqHtml()
  // Each demo's box has its height before the script scales the demo in it: nothing below it moves.
  body.querySelectorAll('.demo-frame[data-w][data-h]').forEach(box => {
    box.setAttribute('style', `aspect-ratio: ${box.getAttribute('data-w')} / ${box.getAttribute('data-h')}`)
  })
  if (lang === 'en') translate(body)
  const legalTitle = legal ? fillLegal(body, lang, legal) : null
  fixLinks(body, lang, legal)
  return { body: body.innerHTML, legalTitle }
}
