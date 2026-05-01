import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Send, FileText, BookOpen, Search, Trash2 } from 'lucide-react'
import { useAskClerk } from '../hooks/useClerk'
import type { ClerkMessage, ClerkResponse, Citation, ClerkSource } from '../types'
import CitadelBackdrop from '../components/CitadelBackdrop'
import CitadelNav from '../components/CitadelNav'

interface ConversationEntry {
  role: 'user' | 'clerk'
  content: string
  response?: ClerkResponse
}

const PROMPTS = [
  'What does the contract say about payment terms?',
  'Summarize the key facts established so far',
  'Are there contradictions in the testimony?',
  'What documents mention the renovation timeline?',
]

export default function ClerkPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || undefined

  const askClerk = useAskClerk()
  const [input, setInput] = useState('')
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const handleSend = async () => {
    if (!input.trim() || askClerk.isPending) return
    const query = input.trim()
    setInput('')
    setConversation((prev) => [...prev, { role: 'user', content: query }])
    const history: ClerkMessage[] = conversation.map((entry) => ({
      role: entry.role,
      content: entry.role === 'clerk' ? (entry.response?.answer || entry.content) : entry.content,
    }))
    const result = await askClerk.mutateAsync({ query, sessionId, conversationHistory: history })
    setConversation((prev) => [...prev, { role: 'clerk', content: result.answer, response: result }])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-vacuum">
      <CitadelBackdrop density={0.4} />

      <CitadelNav
        backTo="/"
        links={[
          { to: '/profiles', label: 'PROFILES', color: 'var(--cit-scan-cyan)' },
        ]}
      />

      {/* Sub-header */}
      <div
        className="relative z-10 flex flex-shrink-0 items-center justify-between px-4 py-2 border-b"
        style={{ background: 'rgba(7,9,12,0.9)', borderColor: 'rgba(255,200,87,0.15)' }}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-flare" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-flare">RESEARCH CLERK</span>
          {sessionId && (
            <span
              className="font-mono text-[9px] tracking-[0.15em] px-2 py-0.5 rounded"
              style={{ border: '1px solid rgba(255,200,87,0.3)', color: 'var(--cit-flare)', background: 'rgba(255,200,87,0.08)' }}
            >
              SESSION-SCOPED
            </span>
          )}
        </div>
        {conversation.length > 0 && (
          <button
            onClick={() => setConversation([])}
            className="p-1.5 text-cit-text-dim hover:text-alarm transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <main className="relative z-10 flex-1 min-h-0 overflow-y-auto cit-no-scrollbar px-4 py-6 space-y-4">
        {conversation.length === 0 && (
          <div className="text-center py-12">
            <div
              className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{
                border: '1px solid rgba(255,200,87,0.4)',
                background: 'rgba(255,200,87,0.06)',
                boxShadow: '0 0 24px rgba(255,200,87,0.15)',
              }}
            >
              <BookOpen className="w-7 h-7 text-flare" />
            </div>
            <p className="font-mono text-[10px] tracking-[0.25em] text-flare mb-1">DIMENSIONAL ARCHIVE ACCESS</p>
            <p className="text-xs text-cit-text-dim max-w-sm mx-auto mb-8 leading-relaxed">
              Query case documents and established testimony. Citation-backed answers from across the multiverse.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {PROMPTS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[10px] text-cit-text-dim hover:text-flare transition-colors"
                  style={{ border: '1px solid rgba(125,244,188,0.12)', background: 'rgba(14,18,24,0.7)' }}
                >
                  <Search className="w-3 h-3" />
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {conversation.map((entry, i) => (
          <div key={i}>
            {entry.role === 'user' ? (
              <UserBubble content={entry.content} />
            ) : (
              <ClerkBubble entry={entry} />
            )}
          </div>
        ))}

        {askClerk.isPending && (
          <div className="flex justify-start">
            <div
              className="rounded-2xl px-4 py-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-flare"
              style={{ border: '1px solid rgba(255,200,87,0.2)', background: 'rgba(14,18,24,0.8)' }}
            >
              <div className="w-3 h-3 rounded-full border border-flare border-t-transparent animate-spin" />
              SEARCHING ARCHIVES...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <div
        className="relative z-10 flex-shrink-0 p-4 border-t"
        style={{ background: 'rgba(7,9,12,0.95)', borderColor: 'rgba(255,200,87,0.15)' }}
      >
        <div className="flex gap-3 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Query the archive..."
            rows={2}
            className="flex-1 px-4 py-3 rounded-xl bg-cit-bg-1 border border-flare/20 text-cit-text placeholder-cit-text-dim focus:outline-none focus:border-flare/50 focus:ring-1 focus:ring-flare/20 font-mono text-sm resize-none transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || askClerk.isPending}
            className="px-5 rounded-xl transition-all disabled:opacity-40"
            style={{
              border: '1px solid var(--cit-flare)',
              color: 'var(--cit-flare)',
              background: 'rgba(255,200,87,0.08)',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div
        className="max-w-[78%] rounded-2xl px-4 py-3 font-mono text-sm text-vacuum"
        style={{ background: 'var(--cit-portal)' }}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  )
}

function ClerkBubble({ entry }: { entry: ConversationEntry }) {
  const response = entry.response
  const [showSources, setShowSources] = useState(false)

  return (
    <div className="flex justify-start">
      <div
        className="max-w-[85%] rounded-2xl px-5 py-4"
        style={{ border: '1px solid rgba(255,200,87,0.2)', background: 'rgba(20,16,8,0.85)' }}
      >
        <p className="text-sm text-cit-text whitespace-pre-wrap leading-relaxed">{entry.content}</p>

        {response && (
          <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,200,87,0.15)' }}>
            <div className="flex items-center gap-4 font-mono text-[9px] tracking-[0.15em] text-flare/60 mb-2">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {response.documents_searched} DOCS
              </span>
              {response.facts_referenced > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {response.facts_referenced} FACTS
                </span>
              )}
            </div>

            {response.citations.length > 0 && (
              <div className="space-y-1 mb-2">
                {response.citations.slice(0, 3).map((cite, i) => (
                  <CitationBadge key={i} citation={cite} />
                ))}
                {response.citations.length > 3 && (
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="font-mono text-[9px] tracking-[0.1em] text-flare/60 hover:text-flare transition-colors"
                  >
                    {showSources ? '▲ COLLAPSE' : `▼ +${response.citations.length - 3} MORE`}
                  </button>
                )}
                {showSources && response.citations.slice(3).map((cite, i) => (
                  <CitationBadge key={i + 3} citation={cite} />
                ))}
              </div>
            )}

            {response.sources
              .filter((s) => s.source_type === 'fact_ledger')
              .slice(0, 3)
              .map((source, i) => <FactSourceBadge key={i} source={source} />)}
          </div>
        )}
      </div>
    </div>
  )
}

function CitationBadge({ citation }: { citation: Citation }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-flare/70">
      <FileText className="w-3 h-3 flex-shrink-0" />
      <span>{citation.document_name} · p.{citation.page_number}</span>
    </div>
  )
}

function FactSourceBadge({ source }: { source: ClerkSource }) {
  const colors: Record<string, string> = {
    certain: 'var(--cit-portal)',
    uncertain: 'var(--cit-flare)',
    estimate: 'var(--cit-scan-cyan)',
    dont_recall: 'var(--cit-text-dim)',
  }
  return (
    <div className="flex items-start gap-2 font-mono text-[9px] tracking-[0.1em] text-cit-text-dim">
      <BookOpen className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>
        <span style={{ color: colors[source.confidence || ''] ?? 'var(--cit-text-dim)' }}>
          [{source.confidence?.toUpperCase()}]
        </span>{' '}
        {source.content.slice(0, 100)}{source.content.length > 100 ? '...' : ''}
      </span>
    </div>
  )
}
