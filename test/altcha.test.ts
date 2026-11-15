import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'
import { solveChallenge } from '../src/landing/join/altcha.ts'

const challengeFor = (number: number) => {
  const salt = 'salt-of-the-test'
  const challenge = createHash('sha256')
    .update(salt + number)
    .digest('hex')
  return { algorithm: 'SHA-256', challenge, maxnumber: 10_000, salt, signature: 'signed-by-server' }
}

describe('the bot check', () => {
  it('finds the number behind the hash and sends it as ALTCHA does', async () => {
    const payload = JSON.parse(Buffer.from(await solveChallenge(challengeFor(4321)), 'base64').toString('utf8'))
    assert.equal(payload.number, 4321)
    assert.equal(payload.signature, 'signed-by-server')
    assert.equal(typeof payload.took, 'number')
  })

  it('gives up past the largest number', async () => {
    await assert.rejects(solveChallenge({ ...challengeFor(20_000), maxnumber: 100 }), /no_solution/)
  })
})
