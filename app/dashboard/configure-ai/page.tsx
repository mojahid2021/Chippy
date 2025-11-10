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
  Settings as SettingsIcon,
  Brain,
  AlertCircle,
  MessageSquare,
  Zap,
  Globe,
  Palette,
  Code,
  Star,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  X,
  Loader2,
  Crown,
  Users,
  Lightbulb,
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
        newProfile.preferences.maxResponseLength !== (editingProfile.preferences.maxResponseLength || 500)

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
          <h1 className="text-2xl font-bold text-slate-900">AI Configuration</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage your AI assistant profiles and settings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Active Profiles</p>
              <p className="text-2xl font-bold text-slate-900">{aiProfiles.filter(p => p.isActive).length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <Bot className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Total Profiles</p>
              <p className="text-2xl font-bold text-slate-900">{aiProfiles.length}</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 font-medium">Default Profile</p>
              <p className="text-lg font-bold text-slate-900">
                {aiProfiles.find(p => p.isDefault)?.name || 'None'}
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center">
              <Crown className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* AI Profiles Section */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-slate-600" />
                <span>AI Profiles</span>
              </CardTitle>
              <p className="text-sm text-slate-600 mt-1">Create and manage AI assistant profiles</p>
            </div>
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Profile
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
                    },
                    isDefault: false,
                  })
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Create/Edit Form */}
          {showCreateForm && (
            <Card className="mb-6 border-2 border-dashed border-slate-300">
              <CardHeader className="bg-slate-50">
                <CardTitle className="flex items-center space-x-2">
                  {editingProfile ? (
                    <>
                      <Edit3 className="h-5 w-5 text-slate-600" />
                      <span>Edit AI Profile</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-5 w-5 text-slate-600" />
                      <span>Create New AI Profile</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!editingProfile && (
                    <div className="space-y-2">
                      <Label htmlFor="profileId" className="flex items-center space-x-2">
                        <Code className="h-4 w-4" />
                        <span>Profile ID *</span>
                      </Label>
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
                    <Label htmlFor="profileName" className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <span>Profile Name *</span>
                    </Label>
                    <Input
                      id="profileName"
                      placeholder="My AI Assistant"
                      value={newProfile.name}
                      onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileDescription">
                      <MessageSquare className="h-4 w-4 inline mr-2" />
                      Description
                    </Label>
                    <Input
                      id="profileDescription"
                      placeholder="Brief description of this AI profile"
                      value={newProfile.description}
                      onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language" className="flex items-center space-x-2">
                      <Globe className="h-4 w-4" />
                      <span>Language</span>
                    </Label>
                    <select
                      id="language"
                      value={newProfile.preferences.language}
                      onChange={(e) => setNewProfile({
                        ...newProfile,
                        preferences: { ...newProfile.preferences, language: e.target.value }
                      })}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">🇺🇸 English</option>
                      <option value="es">🇪🇸 Spanish</option>
                      <option value="fr">🇫🇷 French</option>
                      <option value="de">🇩🇪 German</option>
                      <option value="bn">🇧🇩 Bengali</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tone" className="flex items-center space-x-2">
                      <Palette className="h-4 w-4" />
                      <span>Tone</span>
                    </Label>
                    <select
                      id="tone"
                      value={newProfile.preferences.tone}
                      onChange={(e) => setNewProfile({
                        ...newProfile,
                        preferences: { ...newProfile.preferences, tone: e.target.value }
                      })}
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="professional">👔 Professional</option>
                      <option value="casual">😊 Casual</option>
                      <option value="friendly">🤝 Friendly</option>
                      <option value="formal">🎩 Formal</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxResponseLength" className="flex items-center space-x-2">
                      <Zap className="h-4 w-4" />
                      <span>Max Response Length</span>
                    </Label>
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
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profilePersonality" className="flex items-center space-x-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>Personality</span>
                    </Label>
                    <textarea
                      id="profilePersonality"
                      placeholder="Describe the personality traits of this AI assistant"
                      value={newProfile.personality}
                      onChange={(e) => setNewProfile({ ...newProfile, personality: e.target.value })}
                      rows={3}
                      className="flex min-h-20 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profileInstructions" className="flex items-center space-x-2">
                      <SettingsIcon className="h-4 w-4" />
                      <span>Instructions</span>
                    </Label>
                    <textarea
                      id="profileInstructions"
                      placeholder="Specific instructions for how this AI should behave"
                      value={newProfile.instructions}
                      onChange={(e) => setNewProfile({ ...newProfile, instructions: e.target.value })}
                      rows={3}
                      className="flex min-h-20 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="isDefault"
                      type="checkbox"
                      checked={newProfile.isDefault}
                      onChange={(e) => setNewProfile({ ...newProfile, isDefault: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="isDefault" className="flex items-center space-x-2 cursor-pointer">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>Set as Default Profile</span>
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
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
                        },
                        isDefault: false,
                      })
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                    disabled={(editingProfile ? updatingProfile : creatingProfile) || (!editingProfile && !newProfile.id) || !newProfile.name}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {(editingProfile ? updatingProfile : creatingProfile) ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {editingProfile ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {editingProfile ? 'Update Profile' : 'Create Profile'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {aiProfilesLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Loading AI profiles...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {aiProfilesError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-red-700">{aiProfilesError}</p>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4 bg-red-600 hover:bg-red-700"
                  size="sm"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!aiProfilesLoading && !aiProfilesError && aiProfiles.length === 0 && (
            <Card className="border-dashed border-slate-300">
              <CardContent className="p-12 text-center">
                <Bot className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No AI Profiles Found</h3>
                <p className="text-slate-600 mb-4">
                  Create your first AI assistant profile to get started.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Profile
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Profiles List */}
          {!aiProfilesLoading && !aiProfilesError && aiProfiles.length > 0 && (
            <div className="space-y-4">
              {aiProfiles.map((profile) => (
                <Card key={profile.id} className="border border-slate-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${profile.isActive ? 'bg-green-100' : 'bg-slate-100'}`}>
                          <Bot className={`h-5 w-5 ${profile.isActive ? 'text-green-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{profile.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            {profile.isDefault && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Crown className="h-3 w-3 mr-1" />
                                Default
                              </Badge>
                            )}
                            <Badge variant={profile.isActive ? "default" : "secondary"}>
                              {profile.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProfile(profile)}
                          disabled={updatingProfile}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {!profile.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.id)}
                            disabled={deletingProfile === profile.id}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {deletingProfile === profile.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {profile.description && (
                      <p className="text-slate-600 mb-4">{profile.description}</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-sm">Personality</span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {profile.personality || "No personality defined"}
                        </p>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <SettingsIcon className="h-4 w-4 text-slate-600" />
                          <span className="font-medium text-sm">Instructions</span>
                        </div>
                        <p className="text-sm text-slate-700">
                          {profile.instructions || "No instructions defined"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Palette className="h-4 w-4 text-slate-600" />
                        <span className="font-medium text-sm">Preferences</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {profile.preferences.language === 'en' ? 'English' :
                           profile.preferences.language === 'es' ? 'Spanish' :
                           profile.preferences.language === 'fr' ? 'French' :
                           profile.preferences.language === 'de' ? 'German' :
                           profile.preferences.language === 'bn' ? 'Bengali' :
                           profile.preferences.language}
                        </Badge>
                        <Badge variant="outline">
                          <Palette className="h-3 w-3 mr-1" />
                          {profile.preferences.tone}
                        </Badge>
                        {profile.preferences.maxResponseLength && (
                          <Badge variant="outline">
                            <Zap className="h-3 w-3 mr-1" />
                            Max: {profile.preferences.maxResponseLength} chars
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs text-slate-500">
                      Created: {new Date(profile.createdAt).toLocaleDateString()} • 
                      Updated: {new Date(profile.updatedAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}