import templates from './legal.json'

import type { Lang, LegalId } from './routes.ts'

export type { Lang, LegalId } from './routes.ts'

// What the legal pages say about this server: who runs it, how to write to them, when the texts last changed, and how
// long the backups keep a copy (Serveur › Sauvegardes keeps one copy a day).
export interface LegalInfo {
  operator: string
  email: string
  // YYYY-MM-DD
  updated: string
  backupDays: number
}

export const LEGAL_UI = {
  fr: {
    kicker: 'Pages légales',
    nav: 'Pages légales',
    pages: 'Pages',
    close: 'Fermer',
    tabs: { legal: 'Mentions légales', privacy: 'Confidentialité', terms: 'Conditions' }
  },
  en: {
    kicker: 'Legal',
    nav: 'Legal pages',
    pages: 'Pages',
    close: 'Close',
    tabs: { legal: 'Legal notice', privacy: 'Privacy', terms: 'Terms' }
  }
} as const

// The day the texts themselves last changed: the page shows it, or the day the admin changed who runs the server.
export const TEXTS_UPDATED = '2026-11-12'
export const lastUpdate = (operatorUpdated: string | null | undefined) =>
  operatorUpdated && operatorUpdated > TEXTS_UPDATED ? operatorUpdated : TEXTS_UPDATED

const BLANKS = {
  fr: { operator: '[nom de l’exploitant]', email: '[adresse e-mail de contact]' },
  en: { operator: '[operator’s name]', email: '[contact email]' }
}

const escape = (text: string) =>
  text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

const days = (n: number, lang: Lang) => (lang === 'fr' ? `${n} jour${n > 1 ? 's' : ''}` : `${n} day${n > 1 ? 's' : ''}`)

// One legal page, its blanks filled with the server's own details.
export const legalPage = (lang: Lang, id: LegalId, info: LegalInfo) => {
  const page = templates[lang][id]
  const date = new Date(`${info.updated}T12:00:00Z`).toLocaleDateString(lang === 'fr' ? 'fr-BE' : 'en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
  // Until the server's admin fills them in (Serveur › Village › Pages légales), the blanks say so.
  const blank = BLANKS[lang]
  const email = info.email ? `<a href="mailto:${escape(info.email)}">${escape(info.email)}</a>` : escape(blank.email)
  const values: Record<string, string> = {
    operator: escape(info.operator || blank.operator),
    email,
    date: escape(date),
    backupDays: days(info.backupDays, lang)
  }
  return { label: page.label, html: page.html.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '') }
}
