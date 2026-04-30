import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scale, Shield, Swords, Users, LogOut, BookOpen } from 'lucide-react'
import { useSessions, useCreateSession } from '../hooks/useSession'
import { useProfiles } from '../hooks/useProfiles'
import { logout } from '../api/client'

export default function HomePage() {
  const navigate = useNavigate()
  const { data: sessions, isLoading } = useSessions()
  const { data: profiles } = useProfiles()
  const createSession = useCreateSession()

  const [witnessName, setWitnessName] = useState('')
  const [agentMode, setAgentMode] = useState<'plaintiff_coach' | 'defense_cross'>('plaintiff_coach')
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  // Auto-fill witness name when profile is selected
  useEffect(() => {
    if (selectedProfileId && profiles) {
      const profile = profiles.find((p) => p.id === selectedProfileId)
      if (profile) {
        setWitnessName(profile.name)
      }
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

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-legal-navy to-gray-900">
      {/* Header */}
      <header className="py-8 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Scale className="w-10 h-10 text-legal-gold" />
            <div>
              <h1 className="text-3xl font-bold text-white">Deposition Prep Simulator</h1>
              <p className="text-gray-400">Practice makes prepared</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/clerk"
              className="flex items-center gap-2 text-amber-300 hover:text-amber-100 transition-colors"
            >
              <BookOpen className="w-5 h-5" />
              <span className="hidden sm:inline">Clerk</span>
            </Link>
            <Link
              to="/profiles"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="hidden sm:inline">Profiles</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 pb-12">
        {/* New Session Card */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Start New Session</h2>

          <div className="space-y-6">
            {/* Profile Selector */}
            {profiles && profiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Profile (Optional)
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                >
                  <option value="">No profile - generic session</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name} ({profile.role})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Profiles customize the agent's questioning to the witness's knowledge and role
                </p>
              </div>
            )}

            {/* Witness Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Witness Name
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
              />
            </div>

            {/* Agent Mode Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Mode
              </label>
              <div className="grid grid-cols-2 gap-4">
                {/* Plaintiff Coach */}
                <button
                  onClick={() => setAgentMode('plaintiff_coach')}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    agentMode === 'plaintiff_coach'
                      ? 'border-coach-green bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Shield className={`w-8 h-8 mb-3 ${
                    agentMode === 'plaintiff_coach' ? 'text-coach-green' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-gray-900">Plaintiff Coach</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Friendly questioning to build your narrative and identify weak spots
                  </p>
                </button>

                {/* Defense Cross */}
                <button
                  onClick={() => setAgentMode('defense_cross')}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    agentMode === 'defense_cross'
                      ? 'border-defense-red bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Swords className={`w-8 h-8 mb-3 ${
                    agentMode === 'defense_cross' ? 'text-defense-red' : 'text-gray-400'
                  }`} />
                  <h3 className="font-semibold text-gray-900">Defense Cross</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Aggressive cross-examination to stress-test your testimony
                  </p>
                </button>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartSession}
              disabled={!witnessName.trim() || createSession.isPending}
              className="w-full py-4 bg-legal-navy text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {createSession.isPending ? 'Starting...' : 'Begin Session'}
            </button>
          </div>
        </div>

        {/* Previous Sessions */}
        {sessions && sessions.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Previous Sessions</h2>
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <button
                  key={session.id}
                  onClick={() => navigate(`/session/${session.id}`)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-gray-900">{session.witness_name}</p>
                    <p className="text-sm text-gray-500">
                      {session.agent_mode === 'plaintiff_coach' ? 'Coach' : 'Defense'} •{' '}
                      {new Date(session.started_at).toLocaleDateString()}
                      {session.profile && (
                        <span className="ml-1 text-legal-navy capitalize">• {session.profile.role}</span>
                      )}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {session.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center text-gray-400 py-8">Loading sessions...</div>
        )}
      </main>
    </div>
  )
}
