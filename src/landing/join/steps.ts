import type { Page } from '../page.ts'
import { type Info, Refused, altcha, send } from './api.ts'
import { MIN_PASSWORD, drawStrength, loadEstimator } from './password.ts'
import { mountPins } from './pins.ts'
import { type JoinState, type JoinView, sayUnder } from './view.ts'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface Signup {
  code: string
  invite: string | null
  password: string
}

// What the server offers when the page opens: a full server without a waiting list, or one that cannot send e-mail,
// shows « Serveur complet » rather than a form that cannot answer.
export const stateOfInfo = (info: Info): JoinState => {
  if (info.signup === 'invite') return 'invite'
  if (!info.mail || info.signup === 'full') return 'closed'
  return info.signup === 'waitlist' ? 'wait' : 'open'
}

// A form waits for its answer with its button off, so a second click never sends a second request.
export const whileBusy = async (form: HTMLFormElement, run: () => Promise<void>) => {
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  if (button?.disabled) return
  if (button) button.disabled = true
  try {
    await run()
  } finally {
    if (button) button.disabled = false
  }
}

// A wrong code says how many tries are left, and that none is when none is.
const codeKey = ({ code, left }: Refused) => {
  if (code !== 'invalid_code') return code
  if (left === 0) return 'code_over'
  return left === 1 ? 'code_one' : 'code_other'
}

const codeOf = (failure: unknown) => (failure instanceof Refused ? failure.code : 'network')

// The steps of « Créer un foyer » after the address: the code, the password and the age, then the household.
export const mountSteps = (page: Page, view: JoinView, signup: Signup) => {
  const { $, signal } = page
  const invited = () => signup.invite !== null
  const step = (state: 'code' | 'account' | 'household') => {
    const at = { code: '2 / 4', account: invited() ? '1 / 2' : '3 / 4', household: invited() ? '2 / 2' : '4 / 4' }
    view.show(state, at[state])
    if (state === 'account') void loadEstimator().then(() => drawPassword())
    requestAnimationFrame(() => $<HTMLInputElement>(`#join-${state} input`).focus({ preventScroll: true }))
  }

  const pins = mountPins(page, () => sayUnder($('#join-code-error'), null, $('#join-code .pin-row')))
  const passwordField = $('#join-account .field')
  const drawPassword = () =>
    drawStrength(
      passwordField,
      $('#join-pw-tip'),
      $<HTMLInputElement>('#join-account input[name="password"]').value,
      view.t.password
    )
  $('#join-account input[name="password"]').addEventListener(
    'input',
    () => {
      drawPassword()
      sayUnder($('#join-account-error'), null, passwordField)
    },
    { signal }
  )
  $('.pw-eye').addEventListener(
    'click',
    e => {
      const input = $<HTMLInputElement>('#join-account input[name="password"]')
      const shown = input.type === 'text'
      input.type = shown ? 'password' : 'text'
      ;(e.currentTarget as HTMLElement).setAttribute('aria-label', shown ? view.t.show : view.t.hide)
    },
    { signal }
  )
  $('#age').addEventListener('change', () => sayUnder($('#join-account-consent'), null), { signal })

  // The code: checked by the server on its own step, so a wrong one is said before the rest of the form.
  const sayCode = (failure: unknown) => {
    const refused = failure instanceof Refused ? failure : new Refused('network')
    sayUnder($('#join-code-error'), view.errorText(codeKey(refused), refused.left), $('#join-code .pin-row'))
    $('#join-code-error').classList.add('err')
  }
  onSubmit(page, '#join-code', async () => {
    if (pins.value().length !== 8) return
    signup.code = pins.formatted()
    try {
      await send('/signup/code', { email: view.email(), code: signup.code })
      step('account')
    } catch (failure) {
      sayCode(failure)
    }
  })

  onSubmit(page, '#join-account', async () => {
    const password = $<HTMLInputElement>('#join-account input[name="password"]').value
    const short = password.length < MIN_PASSWORD
    sayUnder($('#join-account-error'), short ? view.errorText('weak_password') : null, passwordField)
    const unticked = !$<HTMLInputElement>('#age').checked
    sayUnder($('#join-account-consent'), unticked ? view.errorText('age') : null)
    if (short || unticked) return
    signup.password = password
    step('household')
  })

  return { step, sayCode, pins }
}

// A form's submit, with its button off until the answer.
export const onSubmit = (page: Page, selector: string, run: () => Promise<void>) =>
  page.$<HTMLFormElement>(selector).addEventListener(
    'submit',
    e => {
      e.preventDefault()
      void whileBusy(e.currentTarget as HTMLFormElement, run)
    },
    { signal: page.signal }
  )

// The address of a form, checked before anything leaves: an error under its field otherwise.
export const emailIn = (form: HTMLElement, view: JoinView) => {
  const input = form.querySelector('input[type="email"]') as HTMLInputElement
  const email = input.value.trim()
  const message = form.querySelector<HTMLElement>('.join-msg.err')
  const valid = EMAIL.test(email)
  if (message) sayUnder(message, valid ? null : view.errorText('invalid_email'), input.closest('.field'))
  return valid ? email : null
}

export const sayRefusal = (message: HTMLElement, view: JoinView, failure: unknown, field?: Element | null) =>
  sayUnder(message, view.errorText(codeOf(failure)), field)

export { altcha, codeOf }
