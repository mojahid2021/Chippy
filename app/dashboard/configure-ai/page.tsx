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
  Sparkles,
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
    <>
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>

      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-indigo-700">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-purple-300/20 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-300/20 rounded-full blur-md animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-10 w-8 h-8 bg-indigo-300/20 rounded-full blur-sm animate-ping" style={{ animationDuration: '4s' }}></div>
        </div>

        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 group-hover:bg-white/20 transition-all duration-300">
                  <Brain className="h-12 w-12 text-white animate-pulse" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in-up">
              AI Configuration Center
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Craft intelligent AI assistants tailored to your needs. Customize personalities,
              behaviors, and capabilities to create the perfect conversational experience.
            </p>

            {/* Feature highlights */}
            <div className="mt-8 flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-white text-sm">Custom Personalities</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <MessageSquare className="h-4 w-4 text-green-300" />
                <span className="text-white text-sm">Smart Responses</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Zap className="h-4 w-4 text-orange-300" />
                <span className="text-white text-sm">Fast Performance</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-slate-50 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-linear-to-br from-blue-50 to-blue-100/50 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Active Profiles</p>
                  <p className="text-3xl font-bold text-blue-900">{aiProfiles.filter(p => p.isActive).length}</p>
                </div>
                <div className="bg-blue-500/10 p-3 rounded-full">
                  <Bot className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-purple-50 to-purple-100/50 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Total Profiles</p>
                  <p className="text-3xl font-bold text-purple-900">{aiProfiles.length}</p>
                </div>
                <div className="bg-purple-500/10 p-3 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-linear-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 mb-1">Default Profile</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {aiProfiles.find(p => p.isDefault)?.name || 'None'}
                  </p>
                </div>
                <div className="bg-emerald-500/10 p-3 rounded-full">
                  <Crown className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
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
          <div className="flex justify-end mb-6">
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2 animate-pulse" />
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
                    },
                    isDefault: false,
                  })
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 px-6 py-3"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </Button>
            )}
          </div>

          {/* Create/Edit Profile Form */}
          {showCreateForm && (
            <Card className="mb-6 border-2 border-dashed border-purple-200 bg-linear-to-br from-purple-50/50 to-blue-50/50 shadow-lg">
              <CardHeader className="bg-linear-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  {editingProfile ? (
                    <>
                      <div className="bg-white/20 p-2 rounded-full">
                        <Edit3 className="h-6 w-6" />
                      </div>
                      <span>Edit AI Profile</span>
                    </>
                  ) : (
                    <>
                      <div className="bg-white/20 p-2 rounded-full">
                        <Plus className="h-6 w-6" />
                      </div>
                      <span>Create New AI Profile</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {!editingProfile && (
                      <div className="space-y-3">
                        <Label htmlFor="profileId" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                          <Code className="h-4 w-4 text-purple-600" />
                          <span>Profile ID *</span>
                        </Label>
                        <Input
                          id="profileId"
                          placeholder="unique-profile-id"
                          value={newProfile.id}
                          onChange={(e) => setNewProfile({ ...newProfile, id: e.target.value })}
                          className="border-2 border-purple-200 focus:border-purple-400 transition-colors"
                          required
                        />
                        <p className="text-xs text-gray-500">A unique identifier for this profile</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label htmlFor="profileName" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <Bot className="h-4 w-4 text-purple-600" />
                        <span>Profile Name *</span>
                      </Label>
                      <Input
                        id="profileName"
                        placeholder="My AI Assistant"
                        value={newProfile.name}
                        onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                        className="border-2 border-purple-200 focus:border-purple-400 transition-colors"
                        required
                      />
                      <p className="text-xs text-gray-500">A friendly name for your AI assistant</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="profileDescription" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <MessageSquare className="h-4 w-4 text-purple-600" />
                        <span>Description</span>
                      </Label>
                      <Input
                        id="profileDescription"
                        placeholder="Brief description of this AI profile"
                        value={newProfile.description}
                        onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                        className="border-2 border-purple-200 focus:border-purple-400 transition-colors"
                      />
                      <p className="text-xs text-gray-500">A short description to help you identify this profile</p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="language" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <Globe className="h-4 w-4 text-purple-600" />
                        <span>Language</span>
                      </Label>
                      <select
                        id="language"
                        value={newProfile.preferences.language}
                        onChange={(e) => setNewProfile({
                          ...newProfile,
                          preferences: { ...newProfile.preferences, language: e.target.value }
                        })}
                        className="flex h-10 w-full rounded-md border-2 border-purple-200 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                      >
                        <option value="en">🇺🇸 English</option>
                        <option value="es">🇪🇸 Spanish</option>
                        <option value="fr">🇫🇷 French</option>
                        <option value="de">🇩🇪 German</option>
                        <option value="bn">🇧🇩 Bengali</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="tone" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <Palette className="h-4 w-4 text-purple-600" />
                        <span>Tone</span>
                      </Label>
                      <select
                        id="tone"
                        value={newProfile.preferences.tone}
                        onChange={(e) => setNewProfile({
                          ...newProfile,
                          preferences: { ...newProfile.preferences, tone: e.target.value }
                        })}
                        className="flex h-10 w-full rounded-md border-2 border-purple-200 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-colors"
                      >
                        <option value="professional">👔 Professional</option>
                        <option value="casual">😊 Casual</option>
                        <option value="friendly">🤝 Friendly</option>
                        <option value="formal">🎩 Formal</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="maxResponseLength" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                        <Zap className="h-4 w-4 text-purple-600" />
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
                        className="border-2 border-purple-200 focus:border-purple-400 transition-colors"
                      />
                      <p className="text-xs text-gray-500">Maximum characters in AI responses</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-purple-100">
                        <input
                          id="isDefault"
                          type="checkbox"
                          checked={newProfile.isDefault}
                          onChange={(e) => setNewProfile({ ...newProfile, isDefault: e.target.checked })}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                        <Label htmlFor="isDefault" className="flex items-center space-x-2 cursor-pointer">
                          <Star className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium">Set as Default Profile</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Full Width Fields */}
                <div className="mt-6 space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="profilePersonality" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <Lightbulb className="h-4 w-4 text-purple-600" />
                      <span>Personality</span>
                    </Label>
                    <textarea
                      id="profilePersonality"
                      placeholder="Describe the personality traits of this AI assistant (e.g., helpful, creative, analytical, witty)"
                      value={newProfile.personality}
                      onChange={(e) => setNewProfile({ ...newProfile, personality: e.target.value })}
                      rows={4}
                      className="flex min-h-20 w-full rounded-md border-2 border-purple-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:border-purple-400 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500">Define how your AI assistant should behave and communicate</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="profileInstructions" className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
                      <SettingsIcon className="h-4 w-4 text-purple-600" />
                      <span>Instructions</span>
                    </Label>
                    <textarea
                      id="profileInstructions"
                      placeholder="Specific instructions for how this AI should behave (e.g., always be polite, focus on business topics, provide step-by-step solutions)"
                      value={newProfile.instructions}
                      onChange={(e) => setNewProfile({ ...newProfile, instructions: e.target.value })}
                      rows={4}
                      className="flex min-h-20 w-full rounded-md border-2 border-purple-200 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:border-purple-400 transition-colors resize-none"
                    />
                    <p className="text-xs text-gray-500">Detailed guidelines for AI behavior and response patterns</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end space-x-3 pt-6 border-t border-purple-100">
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
                    className="px-6 py-2 border-2 border-gray-300 hover:border-gray-400 transition-colors"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                    disabled={(editingProfile ? updatingProfile : creatingProfile) || (!editingProfile && !newProfile.id) || !newProfile.name}
                    className="px-6 py-2 bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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

          {aiProfilesLoading ? (
            <Card className="bg-linear-to-br from-blue-50 to-purple-50/50 border-2 border-blue-200">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl animate-pulse"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-lg">
                      <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading AI Profiles</h3>
                  <p className="text-gray-600 max-w-sm">Please wait while we fetch your AI assistant profiles...</p>
                  <div className="mt-4 flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : aiProfilesError ? (
            <Card className="bg-linear-to-br from-red-50 to-orange-50/50 border-2 border-red-200">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-red-200 rounded-full blur-xl"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-lg">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profiles</h3>
                  <p className="text-gray-600 max-w-sm mb-6">{aiProfilesError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="bg-linear-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : aiProfiles.length === 0 ? (
            <Card className="bg-linear-to-br from-gray-50 to-slate-50/50 border-2 border-dashed border-gray-300">
              <CardContent className="p-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gray-200 rounded-full blur-xl"></div>
                    <div className="relative bg-white p-4 rounded-full shadow-lg">
                      <Bot className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No AI Profiles Found</h3>
                  <p className="text-gray-600 max-w-sm mb-6">
                    You don&apos;t have any AI profiles configured yet. Create your first AI assistant to get started with personalized conversations.
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-linear-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First AI Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {aiProfiles.map((profile) => (
                <Card key={profile.id} className="group relative overflow-hidden bg-linear-to-br from-white to-gray-50/50 border-2 border-gray-100 hover:border-purple-200 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Status indicator */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${profile.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>

                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`p-3 rounded-full ${profile.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Bot className={`h-6 w-6 ${profile.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xl font-bold text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                              {profile.name}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {profile.isDefault && (
                                <Badge className="bg-linear-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-sm">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                              <Badge variant={profile.isActive ? "default" : "secondary"} className={profile.isActive ? "bg-green-100 text-green-800 border-green-200" : ""}>
                                {profile.isActive ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </>
                                ) : (
                                  "Inactive"
                                )}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        {profile.description && (
                          <p className="text-gray-600 mb-4 leading-relaxed">{profile.description}</p>
                        )}

                        {/* Personality & Instructions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                          <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <Lightbulb className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-blue-900 text-sm">Personality</span>
                            </div>
                            <p className="text-blue-800 text-sm leading-relaxed">
                              {profile.personality || "No personality defined"}
                            </p>
                          </div>

                          <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100">
                            <div className="flex items-center space-x-2 mb-2">
                              <SettingsIcon className="h-4 w-4 text-purple-600" />
                              <span className="font-semibold text-purple-900 text-sm">Instructions</span>
                            </div>
                            <p className="text-purple-800 text-sm leading-relaxed">
                              {profile.instructions || "No instructions defined"}
                            </p>
                          </div>
                        </div>

                        {/* Preferences */}
                        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                          <div className="flex items-center space-x-2 mb-3">
                            <Palette className="h-4 w-4 text-gray-600" />
                            <span className="font-semibold text-gray-900 text-sm">Preferences</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="bg-white border-gray-300">
                              <Globe className="h-3 w-3 mr-1" />
                              {profile.preferences.language === 'en' ? '🇺🇸 English' :
                               profile.preferences.language === 'es' ? '🇪🇸 Spanish' :
                               profile.preferences.language === 'fr' ? '🇫🇷 French' :
                               profile.preferences.language === 'de' ? '🇩🇪 German' :
                               profile.preferences.language === 'bn' ? '🇧🇩 Bengali' :
                               profile.preferences.language}
                            </Badge>
                            <Badge variant="outline" className="bg-white border-gray-300">
                              <Palette className="h-3 w-3 mr-1" />
                              {profile.preferences.tone === 'professional' ? '👔 Professional' :
                               profile.preferences.tone === 'casual' ? '😊 Casual' :
                               profile.preferences.tone === 'friendly' ? '🤝 Friendly' :
                               profile.preferences.tone === 'formal' ? '🎩 Formal' :
                               profile.preferences.tone}
                            </Badge>
                            {profile.preferences.maxResponseLength && (
                              <Badge variant="outline" className="bg-white border-gray-300">
                                <Zap className="h-3 w-3 mr-1" />
                                Max: {profile.preferences.maxResponseLength} chars
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-3 ml-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProfile(profile)}
                          disabled={updatingProfile}
                          className="border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group/btn"
                        >
                          <Edit3 className="h-4 w-4 mr-2 group-hover/btn:text-blue-600" />
                          Edit
                        </Button>
                        {!profile.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProfile(profile.id)}
                            disabled={deletingProfile === profile.id}
                            className="border-2 border-red-200 hover:border-red-400 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors group/btn"
                          >
                            {deletingProfile === profile.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2 group-hover/btn:text-red-700" />
                                Delete
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Plus className="h-3 w-3" />
                            <span>Created: {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Edit3 className="h-3 w-3" />
                            <span>Updated: {new Date(profile.updatedAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span>{profile.isActive ? 'Online' : 'Offline'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
    </>
  )
}