import { useState } from 'react'
import { User, Plus, Trash2 } from 'lucide-react'
import { useProfiles, useCreateProfile, useDeleteProfile } from '../hooks/useProfiles'
import CitadelBackdrop from '../components/CitadelBackdrop'
import CitadelNav from '../components/CitadelNav'

const ROLES = [
  { value: 'plaintiff', label: 'PLAINTIFF' },
  { value: 'defendant', label: 'DEFENDANT' },
  { value: 'witness', label: 'WITNESS' },
  { value: 'expert', label: 'EXPERT' },
] as const

const CIT_INPUT =
  'w-full px-4 py-3 rounded-lg bg-cit-bg-1 border border-scan-cyan/20 text-cit-text placeholder-cit-text-dim focus:outline-none focus:border-scan-cyan/50 focus:ring-1 focus:ring-scan-cyan/20 transition-colors font-mono text-sm'

const CIT_LABEL = 'block text-[10px] tracking-[0.2em] text-cit-text-dim font-mono mb-2'

export default function ProfilesPage() {
  const { data: profiles, isLoading } = useProfiles()
  const createProfile = useCreateProfile()
  const deleteProfile = useDeleteProfile()

  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    role: 'plaintiff' as const,
    relationship_to_case: '',
    knowledge_areas: '',
    limitations: '',
    notes: '',
    agent_intensity: 5,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProfile.mutateAsync({
      name: formData.name,
      role: formData.role,
      relationship_to_case: formData.relationship_to_case,
      knowledge_areas: formData.knowledge_areas.split(',').map((s) => s.trim()).filter(Boolean),
      limitations: formData.limitations || undefined,
      notes: formData.notes || undefined,
      agent_intensity: formData.agent_intensity,
    })
    setFormData({ name: '', role: 'plaintiff', relationship_to_case: '', knowledge_areas: '', limitations: '', notes: '', agent_intensity: 5 })
    setShowForm(false)
  }

  const handleDelete = async (profileId: string, profileName: string) => {
    if (window.confirm(`PURGE witness profile "${profileName}" from the registry?`)) {
      await deleteProfile.mutateAsync(profileId)
    }
  }

  return (
    <div className="relative h-screen overflow-hidden flex flex-col bg-vacuum">
      <CitadelBackdrop density={0.5} />

      <CitadelNav
        backTo="/"
        links={[
          { to: '/clerk', label: 'CLERK', color: 'var(--cit-flare)' },
        ]}
      />

      <main className="relative z-10 flex-1 overflow-y-auto cit-no-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-10">

          {/* Title */}
          <div className="mb-8">
            <div className="text-[10px] tracking-[0.3em] text-scan-cyan font-mono mb-1">
              DIMENSIONAL REGISTRY
            </div>
            <h1 className="text-xl font-display text-cit-text" style={{ letterSpacing: '0.1em' }}>
              WITNESS PROFILES
            </h1>
            <p className="text-xs text-cit-text-dim font-mono mt-1">
              Registered profiles tailor agent questioning to witness knowledge and role
            </p>
          </div>

          {/* Create / Form */}
          <div
            className="rounded-xl border border-scan-cyan/20 p-6 mb-6"
            style={{ background: 'rgba(14,18,24,0.85)', backdropFilter: 'blur(10px)' }}
          >
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] text-scan-cyan hover:opacity-80 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                REGISTER NEW WITNESS
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="text-[11px] tracking-[0.2em] text-scan-cyan font-mono mb-4">
                  NEW WITNESS PROFILE
                </div>

                <div>
                  <label className={CIT_LABEL}>WITNESS NAME</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Smith" required className={CIT_INPUT} />
                </div>

                <div>
                  <label className={CIT_LABEL}>ROLE CLASSIFICATION</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as typeof formData.role })}
                    className={CIT_INPUT}
                    style={{ colorScheme: 'dark' }}
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className={CIT_LABEL}>RELATIONSHIP TO CASE</label>
                  <textarea
                    value={formData.relationship_to_case}
                    onChange={(e) => setFormData({ ...formData, relationship_to_case: e.target.value })}
                    placeholder="e.g. Dimension-hopping tourist who accidentally activated a Meeseeks cube"
                    required rows={3}
                    className={CIT_INPUT + ' resize-none'}
                  />
                </div>

                <div>
                  <label className={CIT_LABEL}>KNOWLEDGE AREAS (comma-separated)</label>
                  <input type="text" value={formData.knowledge_areas} onChange={(e) => setFormData({ ...formData, knowledge_areas: e.target.value })} placeholder="e.g. Contract terms, Payment history, Communications" className={CIT_INPUT} />
                </div>

                <div>
                  <label className={CIT_LABEL}>KNOWN LIMITATIONS (optional)</label>
                  <input type="text" value={formData.limitations} onChange={(e) => setFormData({ ...formData, limitations: e.target.value })} placeholder="e.g. Not present for daily construction activities" className={CIT_INPUT} />
                </div>

                <div>
                  <label className={CIT_LABEL}>ADDITIONAL NOTES (optional)</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Any additional context for the agent..." rows={2} className={CIT_INPUT + ' resize-none'} />
                </div>

                <div>
                  <label className={CIT_LABEL}>
                    INTERROGATION INTENSITY · {formData.agent_intensity}/10
                  </label>
                  <input
                    type="range" min="1" max="10"
                    value={formData.agent_intensity}
                    onChange={(e) => setFormData({ ...formData, agent_intensity: parseInt(e.target.value) })}
                    className="w-full accent-scan-cyan"
                  />
                  <div className="flex justify-between font-mono text-[9px] text-cit-text-dim mt-1">
                    <span>GENTLE</span><span>AGGRESSIVE</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={createProfile.isPending}
                    className="flex-1 py-3 rounded-lg font-mono text-[11px] tracking-[0.2em] transition-colors disabled:opacity-40"
                    style={{ border: '1px solid var(--cit-scan-cyan)', color: 'var(--cit-scan-cyan)', background: 'rgba(125,241,255,0.06)' }}
                  >
                    {createProfile.isPending ? 'REGISTERING...' : 'REGISTER WITNESS'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-3 rounded-lg font-mono text-[11px] tracking-[0.2em] text-cit-text-dim transition-colors hover:text-cit-text"
                    style={{ border: '1px solid rgba(125,244,188,0.15)' }}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Profiles List */}
          {isLoading ? (
            <div className="text-center font-mono text-[10px] tracking-[0.2em] text-cit-text-dim py-8">
              ACCESSING REGISTRY...
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div
              className="rounded-xl border border-scan-cyan/20 overflow-hidden"
              style={{ background: 'rgba(14,18,24,0.75)', backdropFilter: 'blur(8px)' }}
            >
              <div className="px-6 py-3 border-b border-scan-cyan/10">
                <span className="font-mono text-[10px] tracking-[0.2em] text-cit-text-dim">
                  REGISTERED WITNESSES · {profiles.length}
                </span>
              </div>
              <div className="divide-y divide-scan-cyan/10">
                {profiles.map((profile) => (
                  <div key={profile.id} className="px-6 py-4 flex items-start justify-between hover:bg-scan-cyan/5 transition-colors">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ border: '1px solid rgba(125,241,255,0.3)', background: 'rgba(125,241,255,0.06)' }}
                      >
                        <User className="w-4 h-4 text-scan-cyan" />
                      </div>
                      <div>
                        <p className="font-mono text-sm text-cit-text">{profile.name}</p>
                        <p className="font-mono text-[10px] tracking-[0.15em] text-scan-cyan/70 mt-0.5">
                          {profile.role.toUpperCase()}
                        </p>
                        <p className="text-xs text-cit-text-dim mt-1 leading-relaxed">{profile.relationship_to_case}</p>
                        {profile.session_count > 0 && (
                          <p className="font-mono text-[9px] text-cit-text-dim/60 mt-2">
                            {profile.session_count} SESSION{profile.session_count !== 1 ? 'S' : ''} LOGGED
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(profile.id, profile.name)}
                      disabled={deleteProfile.isPending}
                      className="p-2 text-cit-text-dim hover:text-alarm transition-colors flex-shrink-0"
                      title="Purge profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl border border-scan-cyan/15 p-8 text-center font-mono text-[10px] tracking-[0.2em] text-cit-text-dim"
              style={{ background: 'rgba(14,18,24,0.6)' }}
            >
              REGISTRY EMPTY — NO WITNESSES ON FILE
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
