import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, FileText, BookOpen, Search, Trash2 } from 'lucide-react'
import { useAskClerk } from '../hooks/useClerk'
import type { ClerkMessage, ClerkResponse, Citation, ClerkSource } from '../types'

interface ConversationEntry {
  role: 'user' | 'clerk'
  content: string
  response?: ClerkResponse
}

export default function ClerkPage() {
  const navigate = useNavigate()
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

    // Add user message immediately
    setConversation((prev) => [...prev, { role: 'user', content: query }])

    // Build conversation history for context
    const history: ClerkMessage[] = conversation.map((entry) => ({
      role: entry.role,
      content: entry.role === 'clerk' ? (entry.response?.answer || entry.content) : entry.content,
    }))

    const result = await askClerk.mutateAsync({
      query,
      sessionId,
      conversationHistory: history,
    })

    // Add clerk response
    setConversation((prev) => [
      ...prev,
      { role: 'clerk', content: result.answer, response: result },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setConversation([])
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="py-4 px-6 bg-amber-700 text-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6" />
              <div>
                <h1 className="font-semibold">Research Clerk</h1>
                <p className="text-sm opacity-80">
                  {sessionId ? 'Session-scoped research' : 'Full case document search'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {sessionId && (
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                Linked to session
              </span>
            )}
            {conversation.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-scroll">
          {/* Welcome */}
          {conversation.length === 0 && (
            <div className="text-center py-16">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-amber-600 opacity-60" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Research Clerk
              </h2>
              <p className="text-gray-500 max-w-md mx-auto mb-8">
                Ask me anything about the case documents and established testimony.
                I'll search the files and give you citation-backed answers.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  'What does the contract say about payment terms?',
                  'Summarize the key facts established so far',
                  'Are there contradictions in the testimony?',
                  'What documents mention the renovation timeline?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setInput(suggestion)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                  >
                    <Search className="w-3 h-3 inline mr-2" />
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
              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 max-w-[80%]">
                <div className="flex items-center gap-2 text-amber-700 text-sm">
                  <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                  Searching documents and facts...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about case documents, facts, or testimony..."
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || askClerk.isPending}
              className="px-6 rounded-xl font-medium text-white bg-amber-700 hover:bg-amber-800 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-legal-navy text-white">
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  )
}

function ClerkBubble({ entry }: { entry: ConversationEntry }) {
  const response = entry.response
  const [showSources, setShowSources] = useState(false)

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-2xl px-5 py-4 bg-amber-50 border border-amber-200 text-gray-900">
        <p className="whitespace-pre-wrap leading-relaxed">{entry.content}</p>

        {response && (
          <div className="mt-3 pt-3 border-t border-amber-200">
            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-amber-700 mb-2">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {response.documents_searched} docs searched
              </span>
              {response.facts_referenced > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {response.facts_referenced} facts referenced
                </span>
              )}
            </div>

            {/* Citations */}
            {response.citations.length > 0 && (
              <div className="space-y-1 mb-2">
                {response.citations.slice(0, 3).map((cite, i) => (
                  <CitationBadge key={i} citation={cite} />
                ))}
                {response.citations.length > 3 && (
                  <button
                    onClick={() => setShowSources(!showSources)}
                    className="text-xs text-amber-600 hover:text-amber-800"
                  >
                    {showSources
                      ? 'Show less'
                      : `+${response.citations.length - 3} more sources`}
                  </button>
                )}
              </div>
            )}

            {/* Expanded sources */}
            {showSources && (
              <div className="space-y-1 mb-2">
                {response.citations.slice(3).map((cite, i) => (
                  <CitationBadge key={i + 3} citation={cite} />
                ))}
              </div>
            )}

            {/* Fact ledger sources */}
            {response.sources
              .filter((s) => s.source_type === 'fact_ledger')
              .slice(0, 3)
              .map((source, i) => (
                <FactSourceBadge key={i} source={source} />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CitationBadge({ citation }: { citation: Citation }) {
  return (
    <div className="flex items-start gap-2 text-xs text-amber-700">
      <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
      <span>
        {citation.document_name}, p.{citation.page_number}
      </span>
    </div>
  )
}

function FactSourceBadge({ source }: { source: ClerkSource }) {
  const confidenceColors: Record<string, string> = {
    certain: 'text-green-700',
    uncertain: 'text-yellow-700',
    estimate: 'text-orange-700',
    dont_recall: 'text-gray-500',
  }

  return (
    <div className="flex items-start gap-2 text-xs text-gray-600">
      <BookOpen className="w-3 h-3 mt-0.5 flex-shrink-0" />
      <span>
        <span className={confidenceColors[source.confidence || ''] || ''}>
          [{source.confidence}]
        </span>{' '}
        {source.content.slice(0, 100)}
        {source.content.length > 100 ? '...' : ''}
      </span>
    </div>
  )
}
