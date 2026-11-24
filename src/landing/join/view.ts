import type { Page } from '../page.ts'
import { ICON_SVG } from '../texts.ts'
import { type ErrorKey, type JoinTexts, textsOf } from './texts.ts'

// Every state of « Rejoindre »: a step of « Créer un compte », the waiting list, or a server that takes nobody.
export type JoinState = 'open' | 'code' | 'account' | 'name' | 'done' | 'wait' | 'invite' | 'closed' | 'expired'

const escape = (text: string) =>
  text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c)

// A message under its field: the error's words, the field's border in red. Null hides it.
export const sayUnder = (message: HTMLElement, text: string | null, field?: Element | null) => {
  const words = message.querySelector('.t')
  if (words) words.textContent = text ?? ''
  message.hidden = text === null
  field?.classList.toggle('bad', text !== null)
}

export const joinView = (page: Page) => {
  const { $, body } = page
  const t: JoinTexts = textsOf(page.lang)
  let email = ''

  // The title, its line (the address in bold) and the step's place in the kicker.
  const show = (state: JoinState, step = '') => {
    const [title = '', line = ''] = t.steps[state]
    $('#join-kicker').textContent = step ? `${t.kicker} · ${step}` : t.kicker
    $('#join-title').innerHTML = `${escape(title)}<span class="dot" aria-hidden="true"></span>`
    $('#join-lead').innerHTML = escape(line)
      .replace(/&lt;br&gt;/g, '<br>')
      .replace('{email}', `<b class="em">${escape(email)}</b>`)
    $('#join-open-app').textContent = state === 'done' ? t.openApp : t.signIn
    $('#join-notice').hidden = true
    $<HTMLElement>('#join-error').hidden = true
    body.dataset.signup = state
  }

  // What worked on the waiting list: a notice in place of its form.
  const notice = (kind: 'sent' | 'confirmed') => {
    const [title = '', line = ''] = t[kind]
    $('#join-notice-mark').innerHTML = ICON_SVG[kind === 'sent' ? 'mail-check' : 'circle-check'] ?? ''
    $('#join-notice-t').textContent = title
    $('#join-notice-p').innerHTML = escape(line).replace('{email}', `<b>${escape(email)}</b>`)
    $('#join-notice').hidden = false
    // The waiting list's title and line stay; its form and links go.
    body.dataset.signup = 'notice'
  }

  const errorText = (key: string, n?: number) => {
    const text = t.errors[key as ErrorKey] ?? t.errors.network
    return n === undefined ? text : text.replace('{n}', String(n))
  }

  // An error that belongs to no field: under the section.
  const sayAlone = (key: string | null) => sayUnder($('#join-error'), key && errorText(key))

  return {
    t,
    show,
    notice,
    errorText,
    sayAlone,
    setEmail: (next: string) => (email = next),
    email: () => email
  }
}

export type JoinView = ReturnType<typeof joinView>
