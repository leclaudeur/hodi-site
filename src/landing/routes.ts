export type Lang = 'fr' | 'en'
export type LegalId = 'legal' | 'privacy' | 'terms'
export const LEGAL_IDS: LegalId[] = ['legal', 'privacy', 'terms']

// The landing's addresses, each its own page for search engines (plugin.json, publicPages): / and /en, and the legal
// pages at /legal, /privacy and /terms, in English under /en. The address decides the language.
export interface Route {
  lang: Lang
  legal: LegalId | null
}

const ROUTE = /^(\/en)?(?:\/([a-z]+))?\/?$/

// The page of an address; any other address shows the landing in French.
export const routeOf = (pathname: string): Route => {
  const [, en, id] = ROUTE.exec(pathname) ?? []
  const legal = LEGAL_IDS.find(page => page === id) ?? null
  if (id && !legal) return { lang: 'fr', legal: null }
  return { lang: en ? 'en' : 'fr', legal }
}

export const pathOf = ({ lang, legal }: Route) => {
  const prefix = lang === 'en' ? '/en' : ''
  return legal ? `${prefix}/${legal}` : prefix || '/'
}

// The legal pages' older addresses, #/legal and #legal: still in links shared before they had their own.
export const legacyLegalOf = (hash: string): LegalId | null => {
  const id = /^#\/?([a-z]+)$/.exec(hash)?.[1]
  return LEGAL_IDS.find(page => page === id) ?? null
}
