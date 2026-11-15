import { type Challenge, solveChallenge } from './altcha.ts'

// Village's public routes, on the site's own address: nginx sends /api/ on to Hodi (nginx.conf).
const BASE = '/api/public/plugins/village'

export type Signup = 'invite' | 'open' | 'waitlist' | 'full'

export interface Info {
  signup: Signup
  mail: boolean
}

// A refused request: the server's error, "rate" for too many requests, "network" when nothing answered.
export class Refused extends Error {
  constructor(
    readonly code: string,
    readonly left?: number
  ) {
    super(code)
  }
}

export const send = async (path: string, body?: unknown): Promise<Record<string, unknown>> => {
  let answer: Response
  try {
    answer = await fetch(
      BASE + path,
      body === undefined
        ? undefined
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )
  } catch {
    throw new Refused('network')
  }
  const data = (await answer.json().catch(() => ({}))) as Record<string, unknown>
  if (answer.ok) return data
  if (answer.status === 429) throw new Refused('rate')
  const left = typeof data.left === 'number' ? data.left : undefined
  throw new Refused(typeof data.error === 'string' ? data.error : 'network', left)
}

// What the server offers now. Without an answer, the page offers only « Se connecter ».
export const loadInfo = async (): Promise<Info> => {
  try {
    const info = (await send('/info')) as unknown as Info
    return { signup: info.signup, mail: info.mail }
  } catch {
    return { signup: 'invite', mail: false }
  }
}

// The bot check: the browser finds the number behind the server's challenge, without a box to tick.
export const altcha = async () => solveChallenge((await send('/challenge')) as unknown as Challenge)
