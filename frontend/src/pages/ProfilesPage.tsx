import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Plus, Trash2, ArrowLeft, Users } from 'lucide-react'
import { useProfiles, useCreateProfile, useDeleteProfile } from '../hooks/useProfiles'

const ROLES = [
  { value: 'plaintiff', label: 'Plaintiff' },
  { value: 'defendant', label: 'Defendant' },
  { value: 'witness', label: 'Witness' },
  { value: 'expert', label: 'Expert' },
] as const

export default function ProfilesPage() {
  const navigate = useNavigate()
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
      knowledge_areas: formData.knowledge_areas
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      limitations: formData.limitations || undefined,
      notes: formData.notes || undefined,
      agent_intensity: formData.agent_intensity,
    })
    setFormData({
      name: '',
      role: 'plaintiff',
      relationship_to_case: '',
      knowledge_areas: '',
      limitations: '',
      notes: '',
      agent_intensity: 5,
    })
    setShowForm(false)
  }

  const handleDelete = async (profileId: string, profileName: string) => {
    if (window.confirm(`Delete profile "${profileName}"? This cannot be undone.`)) {
      await deleteProfile.mutateAsync(profileId)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-legal-navy to-gray-900">
      {/* Header */}
      <header className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <Users className="w-10 h-10 text-legal-gold" />
            <div>
              <h1 className="text-3xl font-bold text-white">Witness Profiles</h1>
              <p className="text-gray-400">Manage profiles for tailored preparation</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pb-12">
        {/* Create Profile Button/Form */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 text-legal-navy font-medium hover:text-legal-gold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Profile
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">New Witness Profile</h2>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., John Smith"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as typeof formData.role })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                >
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Relationship to Case */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship to Case
                </label>
                <textarea
                  value={formData.relationship_to_case}
                  onChange={(e) =>
                    setFormData({ ...formData, relationship_to_case: e.target.value })
                  }
                  placeholder="e.g., Homeowner who hired the contractor for kitchen renovation"
                  required
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                />
              </div>

              {/* Knowledge Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Knowledge Areas (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.knowledge_areas}
                  onChange={(e) => setFormData({ ...formData, knowledge_areas: e.target.value })}
                  placeholder="e.g., Contract terms, Payment history, Communications"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                />
              </div>

              {/* Limitations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limitations (optional)
                </label>
                <input
                  type="text"
                  value={formData.limitations}
                  onChange={(e) => setFormData({ ...formData, limitations: e.target.value })}
                  placeholder="e.g., Was not present for daily construction activities"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional context for the agent..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-legal-navy focus:border-transparent"
                />
              </div>

              {/* Agent Intensity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Questioning Intensity: {formData.agent_intensity}/10
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.agent_intensity}
                  onChange={(e) =>
                    setFormData({ ...formData, agent_intensity: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Gentle</span>
                  <span>Aggressive</span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={createProfile.isPending}
                  className="flex-1 py-3 bg-legal-navy text-white font-semibold rounded-lg hover:bg-opacity-90 disabled:opacity-50"
                >
                  {createProfile.isPending ? 'Creating...' : 'Create Profile'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Profiles List */}
        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading profiles...</div>
        ) : profiles && profiles.length > 0 ? (
          <div className="bg-white rounded-xl shadow-xl p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Existing Profiles</h2>
            <div className="space-y-4">
              {profiles.map((profile) => (
                <div
                  key={profile.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex justify-between items-start"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-legal-navy bg-opacity-10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-legal-navy" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{profile.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                      <p className="text-sm text-gray-600 mt-1">{profile.relationship_to_case}</p>
                      {profile.session_count > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {profile.session_count} session{profile.session_count !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(profile.id, profile.name)}
                    disabled={deleteProfile.isPending}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete profile"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl p-8 text-center text-gray-500">
            No profiles yet. Create one to get started.
          </div>
        )}
      </main>
    </div>
  )
}
