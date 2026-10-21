import React, { Profiler, useEffect, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SessionPage from '../src/pages/SessionPage'
import fixture from '../../postman/mocks/counsel-api/fixture.json'
import type { LedgerResponse } from '../src/types'

vi.mock('../src/hooks/useSession', () => ({ useSession: () => ({ data: fixture.session }), useEndSession: () => ({}) }))
vi.mock('../src/hooks/useChat', () => ({ useMessages: () => ({ data: undefined }), useSendMessage: () => ({}) }))
vi.mock('../src/hooks/useQuestions', () => ({ useGenerateQuestions: () => ({}), useExportQuestions: () => ({}) }))
const ledger = fixture.ledger as LedgerResponse
let current = ledger
let requests = 0
let navigate: ReturnType<typeof useNavigate>
let route = ''
let client: QueryClient
let snapshots: { route: string; buttons: string[]; cards: string[] }[]
function Probe() { navigate = useNavigate(); route = useParams().sessionId!; return null }
function snapshot() {
  const aside = document.querySelector('aside')
  snapshots.push({ route, buttons: [...(aside?.querySelectorAll('button') ?? [])].map(b => `${b.textContent}:${b.getAttribute('aria-pressed')}`), cards: [...(aside?.querySelectorAll('p.text-sm') ?? [])].map(p => p.textContent!) })
}
function mount(value: LedgerResponse | null = ledger) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } })
  if (value) client.setQueryData(['ledger', 'A'], value)
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/session/A']}><Routes><Route path="/session/:sessionId" element={<><Probe/><Profiler id="page" onRender={snapshot}><SessionPage/></Profiler></>}/></Routes></MemoryRouter></QueryClientProvider>)
}
function buttons() { return within(document.querySelector('aside')!).getAllByRole('button') }
function choose(label: string) { fireEvent.click(within(document.querySelector('aside')!).getByRole('button', { name: new RegExp(`^${label}\\s`) })) }
function cards() { return [...document.querySelectorAll('aside p.text-sm')].map(p => p.textContent) }
function expectView(value: LedgerResponse, label = 'All') {
  const groups = [value.facts, value.facts.filter(f => f.contradicts.length), value.facts.filter(f => !f.citations.length)]
  const labels = ['All', 'Contradictions', 'Unsupported']
  expect(buttons().map(b => b.textContent?.replace(/\s+/g, ' ').trim())).toEqual(labels.map((l,i) => `${l} ${groups[i].length}`))
  expect(buttons().map(b => b.getAttribute('aria-pressed'))).toEqual(labels.map(l => String(l === label)))
  expect(cards()).toEqual(groups[labels.indexOf(label)].map(f => f.fact_text))
}
beforeEach(() => {
  snapshots = []; current = structuredClone(ledger); requests = 0
  vi.stubGlobal('fetch', vi.fn(async () => { requests++; return { ok: true, json: async () => current } }))
  Element.prototype.scrollIntoView = vi.fn()
})
afterEach(() => { cleanup(); client?.clear(); vi.unstubAllGlobals(); vi.useRealTimers() })
describe('ledger filter behavior', () => {
  it('C01/C07 default, membership, overlap, order and accessible selected controls', () => {
    mount(); expectView(ledger)
    for (const label of ['Contradictions','Unsupported','All']) { choose(label); expectView(ledger,label) }
    expect(buttons().every(b => b.tagName === 'BUTTON' && b.getAttribute('type') === 'button')).toBe(true)
  })
  it('C01 counts facts rather than contradiction references', () => {
    const value = structuredClone(ledger); value.facts = value.facts.slice(0,2)
    value.facts[0].contradicts = ['one','two','three']; value.facts[1].contradicts = []
    mount(value); choose('Contradictions'); expectView(value,'Contradictions')
  })
  it('C02 keeps zero categories enabled and distinguishes filtered empty', () => {
    const value = structuredClone(ledger); value.facts.forEach(f => { f.contradicts=[]; f.citations=[ledger.facts[0].citations[0]] })
    mount(value)
    for (const label of ['Contradictions','Unsupported']) {
      choose(label); expectView(value,label); expect(screen.getByText('No facts match this filter')).toBeTruthy()
      expect(buttons().every(b => !(b as HTMLButtonElement).disabled)).toBe(true)
      expect(screen.queryByText('Facts will appear here as you testify')).toBeNull()
    }
    choose('All'); expectView(value)
  })
  it.each([false,true])('C03 empty and unavailable ledgers (%s)', unavailable => {
    current = { ...ledger, facts: [] }; mount(unavailable ? null : current)
    for (const label of ['All','Contradictions','Unsupported']) {
      choose(label); expectView(current,label); expect(screen.getByText('Facts will appear here as you testify')).toBeTruthy()
      expect(screen.queryByText('No facts match this filter')).toBeNull()
    }
  })
  it.each(['Contradictions','Unsupported'])('C04 same-session query refresh retains %s and uses facts rather than summaries', async label => {
    mount(); choose(label)
    for (const facts of [[], [...ledger.facts].reverse(), ledger.facts.slice(0,1), ledger.facts]) {
      const value = {...ledger, facts, contradiction_count: 999, unsupported_count: 999}
      await act(async () => { client.setQueryData(['ledger','A'],value); await new Promise(r=>setTimeout(r,5)) })
      expectView(value,label)
    }
  })
  it.each(['Contradictions','Unsupported'])('C05 resets %s before every destination commit, including return navigation', async label => {
    mount(); choose(label)
    const destination = {...ledger, facts: [...ledger.facts].reverse()}
    client.setQueryData(['ledger','B'],destination)
    for (const [id,value] of [['B',destination],['A',ledger],['B',destination]] as const) {
      snapshots=[]
      await act(async()=>navigate('/session/'+id))
      const commits=snapshots.filter(s=>s.route===id)
      expect(commits.length).toBeGreaterThan(0)
      for (const commit of commits) {
        expect(commit.buttons).toEqual(['All '+value.facts.length+':true','Contradictions '+value.facts.filter(f=>f.contradicts.length).length+':false','Unsupported '+value.facts.filter(f=>!f.citations.length).length+':false'])
        expect(commit.cards).toEqual(value.facts.map(f=>f.fact_text))
      }
      expectView(value); choose(label)
    }
  })
  it('C06 freezes query data, counts switch requests separately and preserves ordinary polling', async () => {
    vi.useFakeTimers()
    const frozen=structuredClone(ledger)
    function freeze(value: any) { Object.freeze(value); Object.values(value).forEach(v=>{if(v && typeof v==='object' && !Object.isFrozen(v))freeze(v)}) }
    freeze(frozen); mount(frozen)
    const before=JSON.stringify(frozen)
    for (const label of ['Unsupported','Contradictions','All','Unsupported']) choose(label)
    expect(requests).toBe(0); expect(JSON.stringify(frozen)).toBe(before)
    await act(async()=>{ await vi.advanceTimersByTimeAsync(5000) })
    expect(requests).toBe(1)
  })
})
// Calibrate the commit recorder against a deliberately wrong effect reset and a render-derived reset.
describe('C05 recorder calibration', () => {
  it.each(['effect','derived'])('discriminates %s reset before effects settle', async mode => {
    let change: (id:string)=>void
    const commits: string[]=[]
    function Harness() {
      const [id,setId]=useState('A'); change=setId
      const [selection,setSelection]=useState({id:'A',value:'Unsupported'})
      useEffect(()=>{ if(mode==='effect')setSelection({id,value:'All'}) },[id])
      const value=mode==='derived' && selection.id!==id ? 'All' : selection.value
      return <div data-calibration>{id}:{value}<button onClick={()=>setSelection({id,value:'Unsupported'})}>select</button></div>
    }
    render(<Profiler id="calibration" onRender={()=>commits.push(document.querySelector('[data-calibration]')!.textContent!.replace(/select$/, ''))}><Harness/></Profiler>)
    fireEvent.click(screen.getByText('select')); commits.length=0
    await act(async()=>change!('B'))
    expect(document.querySelector('[data-calibration]')!.textContent).toBe('B:Allselect')
    expect(commits.includes('B:Unsupported')).toBe(mode==='effect')
    expect(commits[0]).toBe(mode==='effect'?'B:Unsupported':'B:All')
    console.log(JSON.stringify({calibration:mode,commits}))
  })
})
