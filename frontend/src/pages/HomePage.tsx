import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Swords } from 'lucide-react'
import { useSessions, useCreateSession } from '../hooks/useSession'
import { useProfiles } from '../hooks/useProfiles'
import CitadelBackdrop from '../components/CitadelBackdrop'
import CitadelNav from '../components/CitadelNav'

const CIT_INPUT =
  'w-full px-4 py-3 rounded-lg bg-cit-bg-1 border border-portal/20 text-cit-text placeholder-cit-text-dim focus:outline-none focus:border-portal/50 focus:ring-1 focus:ring-portal/30 transition-colors font-mono text-sm'

const CIT_SELECT =
  'w-full px-4 py-3 rounded-lg bg-cit-bg-1 border border-portal/20 text-cit-text focus:outline-none focus:border-portal/50 focus:ring-1 focus:ring-portal/30 transition-colors font-mono text-sm'

export default function HomePage() {
  const navigate = useNavigate()
  const { data: sessions, isLoading } = useSessions()
  const { data: profiles } = useProfiles()
  const createSession = useCreateSession()

  const [witnessName, setWitnessName] = useState('')
  const [agentMode, setAgentMode] = useState<'plaintiff_coach' | 'defense_cross'>('plaintiff_coach')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  useEffect(() => {
    if (selectedProfileId && profiles) {
      const profile = profiles.find((p) => p.id === selectedProfileId)
      if (profile) setWitnessName(profile.name)
    }
  }, [selectedProfileId, profiles])

  const handleStartSession = async () => {
    if (!witnessName.trim()) return
    const session = await createSession.mutateAsync({
      witnessName: witnessName.trim(),
      agentMode,
      profileId: selectedProfileId || undefined,
    })
    navigate(`/session/${session.id}`)
  }

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-vacuum">
      <CitadelBackdrop density={0.6} />

      <CitadelNav
        links={[
          { to: '/clerk', label: 'CLERK', color: 'var(--cit-flare)' },
          { to: '/profiles', label: 'PROFILES', color: 'var(--cit-scan-cyan)' },
        ]}
      />

      <main className="relative z-10 flex-1 overflow-y-auto cit-no-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* Title */}
          <div className="mb-8 text-center">
            <div
              className="text-[11px] tracking-[0.3em] text-portal mb-2 font-mono"
              style={{ textShadow: '0 0 10px rgba(93,255,175,0.4)' }}
            >
              DIMENSIONAL ACCESS GRANTED · DEPOSITION SUITE ALPHA
            </div>
            <h1
              className="text-2xl font-display text-cit-text"
              style={{ letterSpacing: '0.1em' }}
            >
              INITIATE DEPOSITION PROTOCOL
            </h1>
          </div>

          {/* Session Card */}
          <div
            className="rounded-xl border border-portal/20 p-8 mb-8 space-y-6"
            style={{ background: 'rgba(14,18,24,0.85)', backdropFilter: 'blur(10px)' }}
          >
            {/* Profile Selector */}
            {profiles && profiles.length > 0 && (
              <div>
                <label className="block text-[10px] tracking-[0.2em] text-cit-text-dim font-mono mb-2">
                  SELECT WITNESS PROFILE
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className={CIT_SELECT}
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="">— GENERIC SESSION —</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name.toUpperCase()} · {profile.role.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Witness Name */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-cit-text-dim font-mono mb-2">
                WITNESS DESIGNATION
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                placeholder="Enter witness name..."
                className={CIT_INPUT}
              />
            </div>

            {/* Mode Selection */}
            <div>
              <label className="block text-[10px] tracking-[0.2em] text-cit-text-dim font-mono mb-3">
                COUNSEL MODE
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAgentMode('plaintiff_coach')}
                  className="p-5 rounded-xl border-2 text-left transition-all"
                  style={
                    agentMode === 'plaintiff_coach'
                      ? {
                          borderColor: 'var(--cit-portal)',
                          background: 'rgba(93,255,175,0.08)',
                          boxShadow: '0 0 20px rgba(93,255,175,0.15)',
                        }
                      : { borderColor: 'rgba(125,244,188,0.15)', background: 'transparent' }
                  }
                >
                  <Shield
                    className="w-7 h-7 mb-3"
                    style={{ color: agentMode === 'plaintiff_coach' ? 'var(--cit-portal)' : 'var(--cit-text-dim)' }}
                  />
                  <div
                    className="font-mono text-[11px] tracking-[0.15em] mb-1"
                    style={{ color: agentMode === 'plaintiff_coach' ? 'var(--cit-portal)' : 'var(--cit-text)' }}
                  >
                    COACH · ADVOCATE SUMMER
                  </div>
                  <p className="text-xs text-cit-text-dim leading-relaxed">
                    Friendly prep — build narrative, find weak spots
                  </p>
                </button>

                <button
                  onClick={() => setAgentMode('defense_cross')}
                  className="p-5 rounded-xl border-2 text-left transition-all"
                  style={
                    agentMode === 'defense_cross'
                      ? {
                          borderColor: 'var(--cit-plasma)',
                          background: 'rgba(255,74,215,0.08)',
                          boxShadow: '0 0 20px rgba(255,74,215,0.15)',
                        }
                      : { borderColor: 'rgba(125,244,188,0.15)', background: 'transparent' }
                  }
                >
                  <Swords
                    className="w-7 h-7 mb-3"
                    style={{ color: agentMode === 'defense_cross' ? 'var(--cit-plasma)' : 'var(--cit-text-dim)' }}
                  />
                  <div
                    className="font-mono text-[11px] tracking-[0.15em] mb-1"
                    style={{ color: agentMode === 'defense_cross' ? 'var(--cit-plasma)' : 'var(--cit-text)' }}
                  >
                    CROSS · LAWYER RICK
                  </div>
                  <p className="text-xs text-cit-text-dim leading-relaxed">
                    Aggressive cross — stress-test your testimony
                  </p>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={!witnessName.trim() || createSession.isPending}
              className="w-full py-4 rounded-lg font-mono text-[11px] tracking-[0.25em] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: '1px solid var(--cit-portal)',
                color: 'var(--cit-portal)',
                background: 'rgba(93,255,175,0.06)',
                boxShadow: '0 0 18px rgba(93,255,175,0.15)',
              }}
              onMouseEnter={(e) => {
                if (!createSession.isPending && witnessName.trim()) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(93,255,175,0.12)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 28px rgba(93,255,175,0.3)'
                }
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(93,255,175,0.06)'
                ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 18px rgba(93,255,175,0.15)'
              }}
            >
              {createSession.isPending ? 'ESTABLISHING LINK...' : 'ENTER TRIBUNAL'}
            </button>
          </div>

          {/* Previous Sessions */}
          {sessions && sessions.length > 0 && (
            <div
              className="rounded-xl border border-portal/20 overflow-hidden"
              style={{ background: 'rgba(14,18,24,0.75)', backdropFilter: 'blur(8px)' }}
            >
              <div className="px-6 py-4 border-b border-portal/10 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] text-cit-text-dim">
                  SESSION ARCHIVE
                </span>
                <span className="font-mono text-[10px] text-portal/60">
                  {sessions.length} RECORD{sessions.length !== 1 ? 'S' : ''}
                </span>
              </div>
              <div className="divide-y divide-portal/10">
                {sessions.slice(0, 5).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => navigate(`/session/${session.id}`)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-portal/5 transition-colors"
                  >
                    <div>
                      <p className="font-mono text-sm text-cit-text">{session.witness_name}</p>
                      <p className="font-mono text-[10px] text-cit-text-dim mt-0.5 tracking-[0.1em]">
                        {session.agent_mode === 'plaintiff_coach' ? 'COACH' : 'CROSS'} ·{' '}
                        {new Date(session.started_at).toLocaleDateString()}
                        {session.profile && ` · ${session.profile.role.toUpperCase()}`}
                      </p>
                    </div>
                    <span
                      className="font-mono text-[9px] tracking-[0.15em] px-2 py-1 rounded"
                      style={
                        session.status === 'active'
                          ? { color: 'var(--cit-portal)', border: '1px solid var(--cit-portal)', background: 'rgba(93,255,175,0.08)' }
                          : { color: 'var(--cit-text-dim)', border: '1px solid rgba(125,244,188,0.15)' }
                      }
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div className="text-center font-mono text-[10px] tracking-[0.2em] text-cit-text-dim py-8">
              LOADING SESSION ARCHIVE...
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
