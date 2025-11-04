"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import {
  Bot,
  Save,
  Settings as SettingsIcon,
  Brain,
  AlertCircle,
} from "lucide-react"

interface AIProfile {
  id: string
  name: string
  description: string
  personality: string
  instructions: string
  preferences: {
    language: string
    tone: string
    maxResponseLength?: number
    includeCodeExamples?: boolean
  }
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AIProfilesResponse {
  success: boolean
  data: AIProfile[]
  error?: string
  message: string
  timestamp: string
}

export default function ConfigureAIPage() {
  const { token } = useUserStore()
  const [aiProfiles, setAiProfiles] = useState<AIProfile[]>([])
  const [aiProfilesLoading, setAiProfilesLoading] = useState(true)
  const [aiProfilesError, setAiProfilesError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null)
  const [newProfile, setNewProfile] = useState({
    id: '',
    name: '',
    description: '',
    personality: '',
    instructions: '',
    preferences: {
      language: 'en',
      tone: 'professional',
      maxResponseLength: 500,
      includeCodeExamples: false,
    },
    isDefault: false,
  })

    // Fetch AI profiles on component mount
  useEffect(() => {
    const fetchAIProfiles = async () => {
      if (!token) return

      try {
        setAiProfilesLoading(true)
        setAiProfilesError(null)

        const response = await fetch('/api/user/ai-profiles', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data: AIProfilesResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch AI profiles')
        }

        if (data.success && data.data) {
          setAiProfiles(data.data)
        }
      } catch (err) {
        setAiProfilesError(err instanceof Error ? err.message : 'An error occurred while fetching AI profiles')
        console.error('Error fetching AI profiles:', err)
      } finally {
        setAiProfilesLoading(false)
      }
    }

    fetchAIProfiles()
  }, [token])

  const handleCreateProfile = async () => {
    if (!token) return

    if (!newProfile.id || !newProfile.name) {
      alert('Please fill in all required fields (ID and Name)')
      return
    }

    try {
      setCreatingProfile(true)

      const response = await fetch('/api/user/ai-profiles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProfile),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create AI profile')
      }

      if (data.success && data.data) {
        // Add the new profile to the list
        setAiProfiles(prev => [...prev, data.data])
        // Reset form
        setNewProfile({
          id: '',
          name: '',
          description: '',
          personality: '',
          instructions: '',
          preferences: {
            language: 'en',
            tone: 'professional',
            maxResponseLength: 500,
            includeCodeExamples: false,
          },
          isDefault: false,
        })
        setShowCreateForm(false)
        alert('AI profile created successfully!')
      }
    } catch (err) {
      console.error('Error creating AI profile:', err)
      alert(err instanceof Error ? err.message : 'Failed to create AI profile')
    } finally {
      setCreatingProfile(false)
    }
  }

  const handleEditProfile = (profile: AIProfile) => {
    setEditingProfile(profile)
    setNewProfile({
      id: profile.id,
      name: profile.name,
      description: profile.description,
      personality: profile.personality,
      instructions: profile.instructions,
      preferences: {
        language: profile.preferences.language,
        tone: profile.preferences.tone,
        maxResponseLength: profile.preferences.maxResponseLength || 500,
        includeCodeExamples: profile.preferences.includeCodeExamples || false,
      },
      isDefault: profile.isDefault,
    })
    setShowCreateForm(true)
  }

  const handleUpdateProfile = async () => {
    if (!token || !editingProfile) return

    if (!newProfile.name) {
      alert('Please fill in the name field')
      return
    }

    try {
      setUpdatingProfile(true)

      // Build request body with only changed fields
      const requestBody: {
        name: string
        description?: string
        personality?: string
        instructions?: string
        preferences?: typeof newProfile.preferences
        isDefault?: boolean
      } = {
        name: newProfile.name,
      }

      // Only include fields that have changed
      if (newProfile.description !== editingProfile.description) {
        requestBody.description = newProfile.description
      }

      if (newProfile.personality !== editingProfile.personality) {
        requestBody.personality = newProfile.personality
      }

      if (newProfile.instructions !== editingProfile.instructions) {
        requestBody.instructions = newProfile.instructions
      }

      if (newProfile.isDefault !== editingProfile.isDefault) {
        requestBody.isDefault = newProfile.isDefault
      }

      // Check if preferences have changed
      const preferencesChanged =
        newProfile.preferences.language !== editingProfile.preferences.language ||
        newProfile.preferences.tone !== editingProfile.preferences.tone ||
        newProfile.preferences.maxResponseLength !== (editingProfile.preferences.maxResponseLength || 500) ||
        newProfile.preferences.includeCodeExamples !== (editingProfile.preferences.includeCodeExamples || false)

      if (preferencesChanged) {
        requestBody.preferences = newProfile.preferences
      }

      const response = await fetch(`/api/user/ai-profiles/${editingProfile.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update AI profile')
      }

      if (data.success && data.data) {
        // Update the profile in the list
        setAiProfiles(prev => prev.map(p => p.id === editingProfile.id ? data.data : p))
        // Reset form
        setNewProfile({
          id: '',
          name: '',
          description: '',
          personality: '',
          instructions: '',
          preferences: {
            language: 'en',
            tone: 'professional',
            maxResponseLength: 500,
            includeCodeExamples: false,
          },
          isDefault: false,
        })
        setEditingProfile(null)
        setShowCreateForm(false)
        alert('AI profile updated successfully!')
      }
    } catch (err) {
      console.error('Error updating AI profile:', err)
      alert(err instanceof Error ? err.message : 'Failed to update AI profile')
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleDeleteProfile = async (profileId: string) => {
    if (!token) return

    if (!confirm('Are you sure you want to delete this AI profile? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingProfile(profileId)

      const response = await fetch(`/api/user/ai-profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete AI profile')
      }

      if (data.success) {
        // Remove the profile from the list
        setAiProfiles(prev => prev.filter(p => p.id !== profileId))
        alert('AI profile deleted successfully!')
      }
    } catch (err) {
      console.error('Error deleting AI profile:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete AI profile')
    } finally {
      setDeletingProfile(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configure AI</h1>
          <p className="text-gray-600 mt-1">Manage your AI assistant profiles and configurations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* AI Profiles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <span>AI Profiles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Create Profile Button */}
          <div className="flex justify-end mb-4">
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Bot className="h-4 w-4 mr-2" />
                Create AI Profile
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewProfile({
                    id: '',
                    name: '',
                    description: '',
                    personality: '',
                    instructions: '',
                    preferences: {
                      language: 'en',
                      tone: 'professional',
                      maxResponseLength: 500,
                      includeCodeExamples: false,
                    },
                    isDefault: false,
                  })
                }}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Create/Edit Profile Form */}
          {showCreateForm && (
            <div className="border border-gray-200 rounded-lg p-6 mb-6 bg-gray-50">
              <h4 className="font-semibold text-gray-900 mb-4">
                {editingProfile ? 'Edit AI Profile' : 'Create New AI Profile'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!editingProfile && (
                  <div className="space-y-2">
                    <Label htmlFor="profileId">Profile ID *</Label>
                    <Input
                      id="profileId"
                      placeholder="unique-profile-id"
                      value={newProfile.id}
                      onChange={(e) => setNewProfile({ ...newProfile, id: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="profileName">Profile Name *</Label>
                  <Input
                    id="profileName"
                    placeholder="My AI Assistant"
                    value={newProfile.name}
                    onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profileDescription">Description</Label>
                  <Input
                    id="profileDescription"
                    placeholder="Brief description of this AI profile"
                    value={newProfile.description}
                    onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profilePersonality">Personality</Label>
                  <textarea
                    id="profilePersonality"
                    placeholder="Describe the personality traits of this AI assistant"
                    value={newProfile.personality}
                    onChange={(e) => setNewProfile({ ...newProfile, personality: e.target.value })}
                    rows={3}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="profileInstructions">Instructions</Label>
                  <textarea
                    id="profileInstructions"
                    placeholder="Specific instructions for how this AI should behave"
                    value={newProfile.instructions}
                    onChange={(e) => setNewProfile({ ...newProfile, instructions: e.target.value })}
                    rows={3}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={newProfile.preferences.language}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      preferences: { ...newProfile.preferences, language: e.target.value }
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <select
                    id="tone"
                    value={newProfile.preferences.tone}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      preferences: { ...newProfile.preferences, tone: e.target.value }
                    })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="friendly">Friendly</option>
                    <option value="formal">Formal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxResponseLength">Max Response Length</Label>
                  <Input
                    id="maxResponseLength"
                    type="number"
                    min="100"
                    max="2000"
                    placeholder="500"
                    value={newProfile.preferences.maxResponseLength}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      preferences: { ...newProfile.preferences, maxResponseLength: parseInt(e.target.value) || 500 }
                    })}
                  />
                </div>
                <div className="space-y-2 flex items-center space-x-2">
                  <input
                    id="includeCodeExamples"
                    type="checkbox"
                    checked={newProfile.preferences.includeCodeExamples}
                    onChange={(e) => setNewProfile({
                      ...newProfile,
                      preferences: { ...newProfile.preferences, includeCodeExamples: e.target.checked }
                    })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="includeCodeExamples">Include Code Examples</Label>
                </div>
                <div className="space-y-2 flex items-center space-x-2">
                  <input
                    id="isDefault"
                    type="checkbox"
                    checked={newProfile.isDefault}
                    onChange={(e) => setNewProfile({ ...newProfile, isDefault: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault">Set as Default Profile</Label>
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingProfile(null)
                    setNewProfile({
                      id: '',
                      name: '',
                      description: '',
                      personality: '',
                      instructions: '',
                      preferences: {
                        language: 'en',
                        tone: 'professional',
                        maxResponseLength: 500,
                        includeCodeExamples: false,
                      },
                      isDefault: false,
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                  disabled={(editingProfile ? updatingProfile : creatingProfile) || (!editingProfile && !newProfile.id) || !newProfile.name}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {(editingProfile ? updatingProfile : creatingProfile) ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingProfile ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Bot className="h-4 w-4 mr-2" />
                      {editingProfile ? 'Update Profile' : 'Create Profile'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {aiProfilesLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
              <span className="text-gray-600">Loading AI profiles...</span>
            </div>
          ) : aiProfilesError ? (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Profiles</h3>
              <p className="text-gray-600">{aiProfilesError}</p>
            </div>
          ) : aiProfiles.length === 0 ? (
            <div className="text-center py-6">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Profiles Found</h3>
              <p className="text-gray-600">You don&apos;t have any AI profiles configured yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiProfiles.map((profile) => (
                <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{profile.name}</h4>
                        {profile.isDefault && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Default
                          </Badge>
                        )}
                        <Badge variant={profile.isActive ? "default" : "secondary"}>
                          {profile.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{profile.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Personality:</span>
                          <p className="text-gray-600 mt-1">{profile.personality}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Instructions:</span>
                          <p className="text-gray-600 mt-1">{profile.instructions}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className="font-medium text-gray-700">Preferences:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="outline">{profile.preferences.language}</Badge>
                          <Badge variant="outline">{profile.preferences.tone}</Badge>
                          {profile.preferences.maxResponseLength && (
                            <Badge variant="outline">Max: {profile.preferences.maxResponseLength} chars</Badge>
                          )}
                          {profile.preferences.includeCodeExamples && (
                            <Badge variant="outline">Code Examples</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditProfile(profile)}
                        disabled={updatingProfile}
                      >
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      {!profile.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProfile(profile.id)}
                          disabled={deletingProfile === profile.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          {deletingProfile === profile.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    Created: {new Date(profile.createdAt).toLocaleDateString()} •
                    Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}