import type { Lang } from './routes.ts'
import { SCRIPT_EN } from './texts.ts'

export interface PageOptions {
  // The folder of the demos and their files, ending with a slash.
  base: string
}

export const THEME_KEY = 'hodi-landing-theme'
export const LANG_KEY = 'hodi-landing-lang'

export const read = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Private windows may refuse: the choice then lasts for this visit.
  }
}

// What every part of the page shares: the document, its observers and timers, and the visitor's theme and
// language.
export interface Page {
  options: PageOptions
  doc: Document
  root: HTMLElement
  body: HTMLElement
  $: <T extends Element = HTMLElement>(selector: string) => T
  $$: <T extends Element = HTMLElement>(selector: string) => T[]
  signal: AbortSignal
  observers: { disconnect: () => void }[]
  timers: Set<number>
  theme: string
  lang: Lang
  // A French text of the script, in the page's language.
  tr: (fr: string) => string
}

export const pageOf = (doc: Document, options: PageOptions, signal: AbortSignal): Page => {
  const $ = <T extends Element = HTMLElement>(selector: string) => doc.querySelector<T>(selector) as T
  const $$ = <T extends Element = HTMLElement>(selector: string) => [...doc.querySelectorAll<T>(selector)]
  const systemTheme = () => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  const stored = read(THEME_KEY) || systemTheme()
  const page: Page = {
    options,
    doc,
    root: doc.documentElement,
    body: doc.body,
    $,
    $$,
    signal,
    observers: [],
    timers: new Set(),
    // Poudré was stored under its old French id before ids went English.
    theme: stored === 'poudre' ? 'powder' : stored,
    lang: doc.documentElement.lang === 'en' ? 'en' : 'fr',
    tr: fr => (page.lang === 'en' && SCRIPT_EN[fr]) || fr
  }
  return page
}
