import type { ZxcvbnFactory } from '@zxcvbn-ts/core'
import type { JoinTexts } from './texts.ts'

// The password step's ring and line, as Hodi's PasswordRing and PasswordHint: 0 (too short) to 4, and what would take
// it one step further. zxcvbn-ts's dictionaries weigh about a megabyte: they load when the step first shows.
export const MIN_PASSWORD = 8

let estimator: ZxcvbnFactory | null = null
let loading: Promise<void> | null = null

export const loadEstimator = () =>
  (loading ??= Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
    import('@zxcvbn-ts/language-fr'),
    import('@zxcvbn-ts/language-en')
  ]).then(([{ ZxcvbnFactory }, common, fr, en]) => {
    estimator = new ZxcvbnFactory({
      dictionary: { ...common.dictionary, ...fr.dictionary, ...en.dictionary },
      graphs: common.adjacencyGraphs
    })
  }))

type Tip = keyof JoinTexts['password']['tips']

const TIPS: Record<string, Tip> = {
  straightRow: 'keyboard',
  keyPattern: 'keyboard',
  simpleRepeat: 'repeat',
  extendedRepeat: 'repeat',
  sequences: 'repeat',
  recentYears: 'dates',
  dates: 'dates',
  topTen: 'common',
  topHundred: 'common',
  common: 'common',
  similarToCommon: 'common',
  pwned: 'common',
  wordByItself: 'word',
  namesByThemselves: 'word',
  commonNames: 'word',
  userInputs: 'word'
}

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  hint: string | null
}

export const strengthOf = (password: string, t: JoinTexts['password']): Strength => {
  const label = (score: number) => t.levels[score] ?? ''
  if (password.length < MIN_PASSWORD) {
    const missing = MIN_PASSWORD - password.length
    const hint =
      password.length === 0
        ? t.minimum
        : (missing === 1 ? t.missing_one : t.missing_other).replace('{n}', String(missing))
    return { score: 0, label: label(0), hint }
  }
  // Until the dictionaries are in, the first step up is the usual advice.
  if (!estimator) return { score: 1, label: label(1), hint: t.another.replace('{level}', label(2)) }
  const { score: found, feedback } = estimator.check(password)
  const score = Math.max(1, found) as Strength['score']
  const tip = feedback.warning ? TIPS[feedback.warning] : undefined
  if (score === 4) return { score, label: label(score), hint: null }
  return { score, label: label(score), hint: tip ? t.tips[tip] : t.another.replace('{level}', label(score + 1)) }
}

const TONES = ['weak', 'weak', 'fair', 'strong', 'strong'] as const
const LENGTH = 2 * Math.PI * 10

// The ring in the field's icon place, and the line under it while the password is not strong yet.
export const drawStrength = (field: HTMLElement, tip: HTMLElement, password: string, t: JoinTexts['password']) => {
  const { score, label, hint } = strengthOf(password, t)
  const ring = field.querySelector<HTMLElement>('.pw-ring')
  const filled = score === 0 ? Math.min(1, password.length / MIN_PASSWORD) / 4 : score / 4
  if (ring) {
    ring.classList.remove(...TONES)
    if (password) ring.classList.add(TONES[score])
    ring.setAttribute('aria-valuenow', String(score))
    ring.setAttribute('aria-valuetext', label)
    ring.querySelector('.arc')?.setAttribute('stroke-dashoffset', String(LENGTH * (1 - filled)))
  }
  tip.classList.remove(...TONES)
  tip.classList.add(TONES[score])
  tip.hidden = !password || score >= 3
  const level = tip.querySelector('.lvl')
  const words = tip.querySelector('.t')
  if (level) level.textContent = label
  if (words) words.textContent = hint ?? ''
}
