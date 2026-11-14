import { sha256 } from '@noble/hashes/sha2.js'
import { base64, hex, utf8 } from '@scure/base'

// The site's side of ALTCHA (Village's server/altcha.ts): find the number behind the challenge's hash, then send the payload
// as ALTCHA's own widget does. SHA-256 comes from @noble/hashes: it runs in the page, with no wait for crypto.subtle.
export interface Challenge {
  algorithm: string
  challenge: string
  maxnumber: number
  salt: string
  signature: string
}

// Numbers tried between two pauses, so the page keeps answering while it searches (about 20 ms each).
const BATCH = 2_000

const pause = () => new Promise<void>(resolve => setTimeout(resolve, 0))

export const solveChallenge = async (challenge: Challenge, signal?: AbortSignal): Promise<string> => {
  const started = Date.now()
  for (let number = 0; number <= challenge.maxnumber; number++) {
    if (number % BATCH === 0 && number > 0) {
      await pause()
      if (signal?.aborted) throw new Error('aborted')
    }
    if (hex.encode(sha256(utf8.decode(challenge.salt + number))) !== challenge.challenge) continue
    const payload = { ...challenge, number, took: Date.now() - started }
    return base64.encode(utf8.decode(JSON.stringify(payload)))
  }
  throw new Error('no_solution')
}
