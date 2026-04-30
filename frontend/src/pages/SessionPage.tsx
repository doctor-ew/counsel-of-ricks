import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, AlertTriangle, FileText, Sparkles, Download, X, Copy, Check, BookOpen } from 'lucide-react'
import { useSession, useEndSession } from '../hooks/useSession'
import { useMessages, useSendMessage } from '../hooks/useChat'
import { useLedger } from '../hooks/useLedger'
import { useGenerateQuestions, useExportQuestions } from '../hooks/useQuestions'
import TruthOMeter from '../components/TruthOMeter'
import AppHeader from '../components/AppHeader'
import CitadelBackdrop from '../components/CitadelBackdrop'
import type { Message, ArbiterFlag, Citation, FactEntry, GeneratedQuestion } from '../types'

function formatUptime(startedAt: string): string {
  const elapsedMs = Date.now() - new Date(startedAt).getTime()
  const totalSec = Math.max(0, Math.floor(elapsedMs / 1000))
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0')
  const s = String(totalSec % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()

  const { data: session } = useSession(sessionId!)
  const { data: messages } = useMessages(sessionId!)
  const { data: ledger } = useLedger(sessionId!)
  const sendMessage = useSendMessage(sessionId!)
  const endSession = useEndSession()

  const [input, setInput] = useState('')
  const [showQuestions, setShowQuestions] = useState(false)
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([])
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'standard' | 'aggressive' | 'expert'>('standard')
  const [uptime, setUptime] = useState('00:00:00')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const generateQuestions = useGenerateQuestions()
  const exportQuestions = useExportQuestions()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Live-tick the IN-SESSION uptime in the header.
  useEffect(() => {
    if (!session?.started_at) return
    setUptime(formatUptime(session.started_at))
    const id = setInterval(() => setUptime(formatUptime(session.started_at)), 1000)
    return () => clearInterval(id)
  }, [session?.started_at])

  const handleSend = async () => {
    if (!input.trim() || sendMessage.isPending) return

    const message = input.trim()
    setInput('')

    await sendMessage.mutateAsync(message)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEndSession = async () => {
    if (!sessionId) return
    await endSession.mutateAsync(sessionId)
    navigate('/')
  }

  const handleGenerateQuestions = async () => {
    if (!sessionId) return
    const result = await generateQuestions.mutateAsync({
      sessionId,
      request: { count: questionCount, difficulty },
    })
    setQuestions(result.questions)
    setShowQuestions(true)
  }

  const handleExportQuestions = async () => {
    if (!sessionId) return
    const content = await exportQuestions.mutateAsync({ sessionId, format: 'markdown' })
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `questions_${sessionId}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!session) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-cit-text-dim"
        style={{ background: 'var(--cit-vacuum)' }}
      >
        <div>Booting tribunal...</div>
      </div>
    )
  }

  const isCoach = session.agent_mode === 'plaintiff_coach'
  const headerAgent: 'coach' | 'defense' = isCoach ? 'coach' : 'defense'

  // Truth-O-Meter score is sourced from the most recent agent-role message.
  // Arbiter analysis runs against the witness response but its outputs
  // (arbiter_flags + truth_score) are persisted on the agent message that
  // follows it (see app/services/chat.py:99-105). Null = no score yet.
  const latestAgentScore =
    messages?.filter((m) => m.role === 'agent').slice(-1)[0]?.truth_score ?? null

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden text-cit-text"
      style={{ background: 'var(--cit-vacuum)' }}
    >
      <CitadelBackdrop density={1.0} />

      <div className="relative z-10 flex h-screen min-h-0 flex-col">
        <AppHeader agent={headerAgent} uptime={uptime} caseId={`CR-${(session.id ?? 'XXXXX').slice(0, 5).toUpperCase()}`} />

        {/* Sub-toolbar: nav + actions, citadel-styled */}
        <div
          className="flex items-center gap-3 border-b px-4 py-2 text-[11px] tracking-[0.15em] text-cit-text-dim"
          style={{ borderColor: 'var(--cit-hairline)', background: 'rgba(7,9,12,0.6)' }}
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded px-2 py-1 hover:text-portal"
            style={{ border: '1px solid var(--cit-hairline)' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            BACK
          </button>
          <span className="text-cit-text">{session.witness_name}</span>
          <span>·</span>
          <span>{isCoach ? "PLAINTIFF'S COACH" : 'DEFENSE CROSS-EXAMINATION'}</span>

          <div className="flex-1" />

          <button
            onClick={() => navigate(`/clerk?session=${sessionId}`)}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 hover:text-scan-cyan"
            style={{ border: '1px solid var(--cit-hairline)' }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            ASK CLERK
          </button>
          <button
            onClick={handleGenerateQuestions}
            disabled={generateQuestions.isPending}
            className="flex items-center gap-1.5 rounded px-2.5 py-1 hover:text-flare disabled:opacity-50"
            style={{ border: '1px solid var(--cit-hairline)' }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {generateQuestions.isPending ? 'GENERATING…' : 'GENERATE QUESTIONS'}
          </button>
          <button
            onClick={handleEndSession}
            disabled={endSession.isPending}
            className="rounded px-2.5 py-1 hover:text-alarm disabled:opacity-50"
            style={{ border: '1px solid var(--cit-hairline)' }}
          >
            {endSession.isPending ? 'ENDING…' : 'END SESSION'}
          </button>
        </div>

        {/* Main Content */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 min-h-0">
          {/* Chat Panel */}
          <div className="flex flex-1 flex-col min-h-0">
            {/* Truth-O-Meter — aggregated arbiter confidence for the latest agent message.
                Sits above the scrollable message column so it stays pinned while messages scroll. */}
            <div
              className="flex flex-shrink-0 justify-center border-b px-6 pb-2 pt-4"
              style={{
                borderColor: 'var(--cit-hairline)',
                background: 'rgba(7,9,12,0.55)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <TruthOMeter score={latestAgentScore} />
            </div>

            {/* Messages */}
            <div className="chat-scroll flex-1 min-h-0 space-y-4 overflow-y-auto p-6">
              {(!messages || messages.length === 0) && (
                <div className="py-12 text-center text-cit-text-dim">
                  <p className="mb-2 text-lg font-medium text-cit-text">
                    {isCoach
                      ? "Let's begin. Tell me about the situation with your kitchen renovation."
                      : "I'll be cross-examining you today. Let's start with the basics."}
                  </p>
                  <p className="text-sm">Type your response below to begin.</p>
                </div>
              )}

              {messages?.map((message) => (
                <MessageBubble key={message.id} message={message} isCoach={isCoach} />
              ))}

              {sendMessage.isPending && (
                <div className="flex justify-start">
                  <div
                    className="animate-pulse rounded-2xl px-4 py-3"
                    style={{
                      background: 'var(--cit-bg-2)',
                      border: '1px solid var(--cit-hairline)',
                    }}
                  >
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-portal" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-portal delay-100" />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-portal delay-200" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div
              className="border-t p-4"
              style={{
                borderColor: 'var(--cit-hairline)',
                background: 'rgba(14,18,24,0.7)',
              }}
            >
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl px-4 py-3 text-cit-text placeholder:text-cit-text-dim focus:outline-none"
                  style={{
                    background: 'var(--cit-bg-1)',
                    border: '1px solid var(--cit-hairline)',
                    fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sendMessage.isPending}
                  className="rounded-xl px-6 font-medium transition-all disabled:opacity-40"
                  style={{
                    background: isCoach ? 'var(--cit-portal-dim)' : 'rgba(255,74,215,0.15)',
                    color: isCoach ? 'var(--cit-portal)' : 'var(--cit-plasma)',
                    border: `1px solid ${isCoach ? 'var(--cit-portal)' : 'var(--cit-plasma)'}`,
                    boxShadow: `0 0 12px ${isCoach ? 'rgba(93,255,175,0.3)' : 'rgba(255,74,215,0.3)'}`,
                  }}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Sidebar */}
          <aside
            className="w-80 overflow-y-auto border-l"
            style={{
              borderColor: 'var(--cit-hairline)',
              background: 'rgba(14,18,24,0.55)',
            }}
          >
            <div
              className="border-b p-4"
              style={{ borderColor: 'var(--cit-hairline)' }}
            >
              <h2
                className="text-[12px] tracking-[0.25em] text-portal"
                style={{ fontFamily: 'Audiowide, system-ui, sans-serif' }}
              >
                ◉ FACT LEDGER
              </h2>
              {ledger && (
                <div className="mt-2 flex gap-4 text-xs text-cit-text-dim">
                  <span>{ledger.facts.length} facts</span>
                  {ledger.contradiction_count > 0 && (
                    <span className="font-medium text-alarm">
                      {ledger.contradiction_count} contradictions
                    </span>
                  )}
                  {ledger.unsupported_count > 0 && (
                    <span className="text-flare">
                      {ledger.unsupported_count} unsupported
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 p-4">
              {ledger?.facts.map((fact) => (
                <FactCard key={fact.id} fact={fact} />
              ))}

              {(!ledger || ledger.facts.length === 0) && (
                <p className="py-8 text-center text-sm text-cit-text-dim">
                  Facts will appear here as you testify
                </p>
              )}
            </div>
          </aside>
        </main>
      </div>

      {/* Questions Modal */}
      {showQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl"
            style={{
              background: 'var(--cit-bg-1)',
              border: '1px solid var(--cit-hairline)',
              boxShadow: '0 0 60px rgba(93,255,175,0.15)',
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between border-b p-6"
              style={{ borderColor: 'var(--cit-hairline)' }}
            >
              <div>
                <h2
                  className="text-xl text-portal"
                  style={{ fontFamily: 'Audiowide, system-ui, sans-serif' }}
                >
                  GENERATED QUESTIONS
                </h2>
                <p className="mt-1 text-sm text-cit-text-dim">
                  {questions.length} questions · {difficulty} difficulty
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportQuestions}
                  disabled={exportQuestions.isPending}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-portal disabled:opacity-50"
                  style={{
                    background: 'var(--cit-portal-dim)',
                    border: '1px solid var(--cit-portal)',
                  }}
                >
                  <Download className="h-4 w-4" />
                  {exportQuestions.isPending ? 'Exporting…' : 'Download'}
                </button>
                <button
                  onClick={() => setShowQuestions(false)}
                  className="p-2 text-cit-text-dim hover:text-cit-text"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Settings */}
            <div
              className="flex items-center gap-4 border-b p-4"
              style={{
                borderColor: 'var(--cit-hairline)',
                background: 'var(--cit-bg-2)',
              }}
            >
              <div className="flex items-center gap-2">
                <label className="text-sm text-cit-text-dim">Count:</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="rounded-lg px-3 py-1 text-sm text-cit-text"
                  style={{
                    background: 'var(--cit-bg-1)',
                    border: '1px solid var(--cit-hairline)',
                  }}
                >
                  {[5, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-cit-text-dim">Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
                  className="rounded-lg px-3 py-1 text-sm text-cit-text"
                  style={{
                    background: 'var(--cit-bg-1)',
                    border: '1px solid var(--cit-hairline)',
                  }}
                >
                  <option value="standard">Standard</option>
                  <option value="aggressive">Aggressive</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
              <button
                onClick={handleGenerateQuestions}
                disabled={generateQuestions.isPending}
                className="rounded-lg px-4 py-1 text-sm font-medium text-portal disabled:opacity-50"
                style={{
                  background: 'var(--cit-portal-dim)',
                  border: '1px solid var(--cit-portal)',
                }}
              >
                {generateQuestions.isPending ? 'Generating…' : 'Regenerate'}
              </button>
            </div>

            {/* Questions List */}
            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {questions.map((q, i) => (
                <QuestionCard key={i} question={q} index={i + 1} />
              ))}

              {questions.length === 0 && !generateQuestions.isPending && (
                <div className="py-12 text-center text-cit-text-dim">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 opacity-50" />
                  <p>Click "Generate Questions" to create prep questions</p>
                </div>
              )}

              {generateQuestions.isPending && (
                <div className="py-12 text-center text-cit-text-dim">
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-portal border-t-transparent" />
                  <p>Generating questions based on your session...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MessageBubble({ message, isCoach }: { message: Message; isCoach: boolean }) {
  const isWitness = message.role === 'witness'
  const isArbiter = message.role === 'arbiter'

  // Tint per speaker: witness = scan-cyan (you), agent = portal (coach) or plasma (defense),
  // arbiter = flare (judge). Borders use the tint, body uses cit-bg-1/2.
  const tint = isWitness
    ? 'var(--cit-scan-cyan)'
    : isArbiter
      ? 'var(--cit-flare)'
      : isCoach
        ? 'var(--cit-portal)'
        : 'var(--cit-plasma)'

  return (
    <div className={`flex ${isWitness ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-2xl px-4 py-3 text-cit-text"
        style={{
          background: isWitness ? 'var(--cit-bg-2)' : 'var(--cit-bg-1)',
          border: `1px solid ${tint}55`,
          boxShadow: `0 0 12px ${tint}22, inset 0 0 8px ${tint}11`,
        }}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {/* Citations */}
        {message.citations.length > 0 && (
          <div
            className="mt-3 space-y-2 border-t pt-3"
            style={{ borderColor: `${tint}33` }}
          >
            {message.citations.map((cite, i) => (
              <CitationBadge key={i} citation={cite} />
            ))}
          </div>
        )}

        {/* Arbiter Flags — preserved per AC #12. */}
        {message.arbiter_flags.length > 0 && (
          <div
            className="mt-3 space-y-2 border-t pt-3"
            style={{ borderColor: `${tint}33` }}
          >
            {message.arbiter_flags.map((flag, i) => (
              <FlagBadge key={i} flag={flag} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CitationBadge({ citation }: { citation: Citation }) {
  return (
    <div className="flex items-start gap-2 text-xs text-cit-text-dim">
      <FileText className="mt-0.5 h-3 w-3 flex-shrink-0" />
      <span>
        {citation.document_name}, p.{citation.page_number}
      </span>
    </div>
  )
}

function FlagBadge({ flag }: { flag: ArbiterFlag }) {
  // Citadel-tinted flag colors. Per AC #12, this still renders one badge per flag
  // with description text and a colored icon — backwards-compat preserved.
  const colors: Record<ArbiterFlag['flag_type'], string> = {
    contradiction: 'text-alarm',
    unsupported: 'text-flare',
    vague: 'text-flare',
    risk: 'text-plasma',
  }

  return (
    <div className="flex items-start gap-2 text-xs text-cit-text">
      <AlertTriangle className={`mt-0.5 h-3 w-3 flex-shrink-0 ${colors[flag.flag_type]}`} />
      <span>{flag.description}</span>
    </div>
  )
}

function FactCard({ fact }: { fact: FactEntry }) {
  const confidenceTints: Record<FactEntry['confidence'], string> = {
    certain: 'var(--cit-portal)',
    uncertain: 'var(--cit-flare)',
    estimate: 'var(--cit-flare)',
    dont_recall: 'var(--cit-text-dim)',
  }

  const hasContradiction = fact.contradicts.length > 0
  const hasSupport = fact.citations.length > 0
  const borderTint = hasContradiction
    ? 'var(--cit-alarm)'
    : hasSupport
      ? 'var(--cit-portal)'
      : 'var(--cit-flare)'

  return (
    <div
      className="rounded-lg p-3"
      style={{
        background: 'var(--cit-bg-1)',
        border: `1px solid ${borderTint}55`,
        boxShadow: `0 0 8px ${borderTint}22`,
      }}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span
          className="rounded px-2 py-0.5 text-[10px] font-medium tracking-[0.15em]"
          style={{
            color: confidenceTints[fact.confidence],
            border: `1px solid ${confidenceTints[fact.confidence]}55`,
          }}
        >
          {fact.confidence.replace('_', ' ').toUpperCase()}
        </span>
        {hasContradiction && (
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-alarm" />
        )}
      </div>

      <p className="text-sm text-cit-text">{fact.fact_text}</p>

      {hasSupport && (
        <div className="mt-2 text-xs text-cit-text-dim">
          ◉ {fact.citations[0].document_name}, p.{fact.citations[0].page_number}
        </div>
      )}

      {!hasSupport && (
        <div className="mt-2 text-xs text-flare">⚠ No documentary support</div>
      )}
    </div>
  )
}

function QuestionCard({ question, index }: { question: GeneratedQuestion; index: number }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(question.question)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--cit-bg-2)',
        border: '1px solid var(--cit-hairline)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-xs font-medium text-portal"
              style={{ border: '1px solid var(--cit-portal)', background: 'var(--cit-portal-dim)' }}
            >
              #{index}
            </span>
            <span
              className="rounded px-2 py-0.5 text-xs capitalize text-cit-text-dim"
              style={{ border: '1px solid var(--cit-hairline)' }}
            >
              {question.topic}
            </span>
          </div>
          <p className="font-medium text-cit-text">{question.question}</p>
          <p className="mt-2 text-sm italic text-cit-text-dim">{question.purpose}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-2 text-cit-text-dim hover:text-portal"
          title="Copy question"
        >
          {copied ? <Check className="h-4 w-4 text-portal" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>

      {question.suggested_followups.length > 0 && (
        <div
          className="mt-4 border-t pt-4"
          style={{ borderColor: 'var(--cit-hairline)' }}
        >
          <p className="mb-2 text-xs font-medium tracking-[0.15em] text-cit-text-dim">
            FOLLOW-UP QUESTIONS
          </p>
          <ul className="space-y-1">
            {question.suggested_followups.map((fu, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-cit-text">
                <span className="text-cit-text-dim">→</span>
                {fu}
              </li>
            ))}
          </ul>
        </div>
      )}

      {question.citations.length > 0 && (
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: 'var(--cit-hairline)' }}
        >
          <p className="text-xs text-cit-text-dim">
            ◉ {question.citations.map((c) => `${c.document_name}, p.${c.page_number}`).join(' · ')}
          </p>
        </div>
      )}
    </div>
  )
}
