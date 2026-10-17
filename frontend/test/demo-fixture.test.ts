import { describe, expect, it } from 'vitest'
import fixture from '../../postman/mocks/counsel-api/fixture.json'
import type { FactEntry, LedgerResponse, Session, Message } from '../src/types'

// Exercise synthetic examples shaped by the existing application contract.
const session = fixture.session as Session
const messages = fixture.messages as Message[]
const ledger = fixture.ledger as LedgerResponse

describe('public synthetic demo contract', () => {
  it('identifies the session as synthetic and uses valid referenced fact IDs', () => {
    expect(session.witness_name).toContain('SYNTHETIC')
    expect(messages[0].content).toContain('synthetic')
    const ids = new Set(ledger.facts.map((fact: FactEntry) => fact.id))
    for (const fact of ledger.facts) for (const other of fact.contradicts) expect(ids.has(other)).toBe(true)
  })
  it('matches existing server count definitions, including overlapping categories', () => {
    expect(ledger.facts).toHaveLength(6)
    expect(ledger.facts.filter(f => f.contradicts.length > 0)).toHaveLength(ledger.contradiction_count)
    expect(ledger.facts.filter(f => f.citations.length === 0)).toHaveLength(ledger.unsupported_count)
    expect(ledger.facts.some(f => f.contradicts.length > 0 && f.citations.length === 0)).toBe(true)
  })
})
