import type { Page } from '../page.ts'
import { loadInfo, send } from './api.ts'
import { type Signup, altcha, codeOf, emailIn, mountSteps, onSubmit, sayRefusal, stateOfInfo } from './steps.ts'
import { type JoinState, type JoinView, joinView, sayUnder } from './view.ts'

// The links e-mails carry: a waiting-list address to confirm, or an invitation from the waiting list.
const CONFIRM_LINK = /^#waitlist-confirm=([A-Za-z0-9_-]{8,100})$/
const INVITE_LINK = /^#join=([A-Za-z0-9_-]{8,100})$/

// Where a refusal of the last step sends the visitor, to fix what it says.
const BACK_TO: Record<string, JoinState> = {
  invalid_code: 'code',
  code_expired: 'code',
  weak_password: 'account',
  email_taken: 'open',
  invalid_invite: 'expired'
}

// The household's two fields: each one says under it what is missing.
const householdFields = (page: Page, view: JoinView) => {
  const { $ } = page
  const read = (name: 'name' | 'household') => {
    const input = $<HTMLInputElement>(`#join-household input[name="${name}"]`)
    const value = input.value.trim()
    sayUnder($(`#join-${name}-error`), value ? null : view.errorText(name), input.closest('.field'))
    return value
  }
  return () => {
    const name = read('name')
    const household = read('household')
    return name && household ? { name, household } : null
  }
}

type Steps = ReturnType<typeof mountSteps>

// A refusal of the last step: back to the step that fixes it, its message under the field it is about.
const sendBack = (page: Page, view: JoinView, steps: Steps, show: (state: JoinState) => void, failure: unknown) => {
  const { $ } = page
  const back = BACK_TO[codeOf(failure)]
  if (back === 'code') {
    steps.step('code')
    steps.sayCode(failure)
  } else if (back === 'account') {
    steps.step('account')
    sayRefusal($('#join-account-error'), view, failure, $('#join-account .field'))
  } else if (back === 'open') {
    show('open')
    sayRefusal($('#join-open-error'), view, failure, $('#join-open .field'))
  } else if (back) show(back)
  else sayRefusal($('#join-error'), view, failure)
}

const mountForms = (page: Page, view: JoinView, signup: Signup, show: (state: JoinState) => void) => {
  const { $ } = page
  const steps = mountSteps(page, view, signup)
  const lang = page.lang

  onSubmit(page, '#join-open', async () => {
    const email = emailIn($('#join-open'), view)
    if (!email) return
    try {
      await send('/signup/start', { email, altcha: await altcha(), lang })
      view.setEmail(email)
      signup.invite = null
      steps.pins.clear()
      steps.step('code')
    } catch (failure) {
      sayRefusal($('#join-open-error'), view, failure, $('#join-open .field'))
    }
  })

  onSubmit(page, '#join-wait', async () => {
    const email = emailIn($('#join-wait'), view)
    const ticked = $<HTMLInputElement>('#consent').checked
    sayUnder($('#join-wait-consent'), ticked ? null : view.errorText('consent'))
    if (!email || !ticked) return
    try {
      await send('/waitlist', { email, altcha: await altcha(), lang })
      view.setEmail(email)
      view.notice('sent')
    } catch (failure) {
      sayRefusal($('#join-wait-error'), view, failure, $('#join-wait .field'))
    }
  })

  const readHousehold = householdFields(page, view)
  onSubmit(page, '#join-household', async () => {
    const names = readHousehold()
    if (!names) return
    const proof = signup.invite === null ? { code: signup.code } : { invite: signup.invite }
    try {
      await send('/signup/finish', {
        email: view.email(),
        ...proof,
        ...names,
        password: signup.password,
        consent: true,
        lang
      })
      show('done')
    } catch (failure) {
      sendBack(page, view, steps, show, failure)
    }
  })

  $('#join-resend a').addEventListener(
    'click',
    e => {
      e.preventDefault()
      void altcha()
        .then(proof => send('/signup/start', { email: view.email(), altcha: proof, lang }))
        .then(
          () => {
            sayUnder($('#join-code-error'), view.t.resent, null)
            $('#join-code-error').classList.remove('err')
            steps.pins.clear()
          },
          failure => steps.sayCode(failure)
        )
    },
    { signal: page.signal }
  )
  return steps
}

// A link from an e-mail, read once, then taken off the address so a reload does not use it again.
const followEmailLink = async (view: JoinView, signup: Signup, steps: Steps) => {
  const confirm = CONFIRM_LINK.exec(location.hash)?.[1]
  const invite = INVITE_LINK.exec(location.hash)?.[1]
  if (!confirm && !invite) return false
  history.replaceState(history.state, '', location.pathname + location.search)
  if (confirm) {
    view.show('wait')
    await send('/waitlist/confirm', { token: confirm }).then(
      () => view.notice('confirmed'),
      () => view.sayAlone('confirm_expired')
    )
  } else if (invite) {
    await send(`/invite/${invite}`).then(
      data => {
        view.setEmail(String(data.email))
        signup.invite = invite
        steps.step('account')
      },
      () => view.show('expired')
    )
  }
  requestAnimationFrame(() => document.getElementById('join')?.scrollIntoView({ block: 'start' }))
  return true
}

// « Rejoindre »: what the server offers, then each step in place, without leaving the page.
export const mountJoin = (page: Page) => {
  const view = joinView(page)
  const signup: Signup = { code: '', invite: null, password: '' }
  const show = (state: JoinState) => {
    view.show(state, state === 'open' ? '1 / 4' : '')
  }
  const steps = mountForms(page, view, signup, show)
  void loadInfo().then(async info => {
    const state = stateOfInfo(info)
    // The header's button follows what the server offers: « Créer mon foyer », « File d'attente », or nothing.
    page.body.dataset.cta = state
    if (await followEmailLink(view, signup, steps)) return
    show(state)
  })
  // A link from an e-mail opened while the site already is: the same page, a new hash.
  addEventListener('hashchange', () => void followEmailLink(view, signup, steps), { signal: page.signal })
}
