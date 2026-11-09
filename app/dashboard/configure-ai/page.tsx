"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useUserStore } from "@/lib/stores/userStore"
import { useEntitlements } from "@/hooks/use-entitlements"
import { usePermissions } from "@/hooks/use-permissions"
import { FeatureGateCard } from "@/components/feature-gate-card"
import { Bot, Settings as SettingsIcon, AlertCircle, MessageSquare, Zap, Globe, Palette, Code, Star, Plus, Edit3, Trash2, CheckCircle2, X, Loader2, Crown, Users, Lightbulb, Sparkles, Send, Wand2, Play } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
  const { hasFeature, loading: entitlementsLoading } = useEntitlements()
  const { canConfigureAI } = usePermissions()
  const [aiProfiles, setAiProfiles] = useState<AIProfile[]>([])
  const [aiProfilesLoading, setAiProfilesLoading] = useState(true)
  const [aiProfilesError, setAiProfilesError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creatingProfile, setCreatingProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState<AIProfile | null>(null)
  const [updatingProfile, setUpdatingProfile] = useState(false)
  const [deletingProfile, setDeletingProfile] = useState<string | null>(null)

  // Interactive Test Simulator state
  const [simulatorInput, setSimulatorInput] = useState("Ei Panjabi ta ki delivery charge free? Koto din lagbe?")
  const [simulatedReply, setSimulatedReply] = useState<string | null>(null)
  const [isSimulating, setIsSimulating] = useState(false)

  const [newProfile, setNewProfile] = useState({
    id: '',
    name: '',
    description: '',
    personality: '',
    instructions: '',
    preferences: {
      language: 'bn',
      tone: 'friendly',
      maxResponseLength: 500,
    },
    isDefault: false,
  })

  // Pre-configured templates
  const templates = [
    {
      title: "🇧🇩 BD F-Commerce Sales Rep",
      personality: "Warm, respectful, natural Banglish e-commerce sales assistant. Uses polite Bangladeshi conversational norms (e.g. 'Ji bhai/apu', 'Stock ache', 'Order confirm korte inbox-e address din').",
      instructions: "Answer product inquiries politely, recommend matching colors/sizes, ask for customer delivery address and phone number to finalize order."
    },
    {
      title: "⚡ Flash Deal Closer",
      personality: "High-energy, persuasive sales closer focusing on discounts, limited stock, and same-day dispatch.",
      instructions: "Highlight current promotional pricing, remind the customer that stock is running out fast, offer immediate Cash On Delivery option."
    },
    {
      title: "💼 Formal Enterprise Support",
      personality: "Clear, highly professional, direct, concise, and structured.",
      instructions: "Provide accurate catalog specifications, order status updates, and clear refund/return policy information without slang."
    }
  ]

  // Fetch AI profiles
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
    } finally {
      setAiProfilesLoading(false)
    }
  }

  useEffect(() => {
    fetchAIProfiles()
  }, [token])

  const handleCreateProfile = async () => {
    if (!token) return

    if (!newProfile.id || !newProfile.name) {
      toast({
        variant: "warning",
        title: "Required Fields Missing",
        description: "Please specify both Profile ID and Name",
      })
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
        setAiProfiles(prev => [...prev, data.data])
        setNewProfile({
          id: '',
          name: '',
          description: '',
          personality: '',
          instructions: '',
          preferences: {
            language: 'bn',
            tone: 'friendly',
            maxResponseLength: 500,
          },
          isDefault: false,
        })
        setShowCreateForm(false)
        toast({
          variant: "success",
          title: "Profile Created!",
          description: "New AI personality profile is ready for deployment.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Creation Error",
        description: err instanceof Error ? err.message : 'Failed to create AI profile',
      })
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
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleUpdateProfile = async () => {
    if (!token || !editingProfile) return

    if (!newProfile.name) {
      toast({
        variant: "warning",
        title: "Name Required",
        description: "Please fill in the profile name",
      })
      return
    }

    try {
      setUpdatingProfile(true)

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

      if (newProfile.description !== editingProfile.description) requestBody.description = newProfile.description
      if (newProfile.personality !== editingProfile.personality) requestBody.personality = newProfile.personality
      if (newProfile.instructions !== editingProfile.instructions) requestBody.instructions = newProfile.instructions
      if (newProfile.isDefault !== editingProfile.isDefault) requestBody.isDefault = newProfile.isDefault

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
        setAiProfiles(prev => prev.map(p => p.id === editingProfile.id ? data.data : p))
        setEditingProfile(null)
        setShowCreateForm(false)
        toast({
          variant: "success",
          title: "Profile Updated",
          description: "Changes applied to live conversation engine.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Error",
        description: err instanceof Error ? err.message : 'Failed to update AI profile',
      })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleDeleteProfile = async (id: string) => {
    if (!token) return
    if (!confirm('Are you sure you want to delete this AI profile?')) return

    try {
      setDeletingProfile(id)

      const response = await fetch(`/api/user/ai-profiles/${id}`, {
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
        setAiProfiles(prev => prev.filter(p => p.id !== id))
        toast({
          variant: "success",
          title: "Profile Deleted",
          description: "The AI profile was successfully removed.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Delete Error",
        description: err instanceof Error ? err.message : 'Failed to delete AI profile',
      })
    } finally {
      setDeletingProfile(null)
    }
  }

  const handleSetDefaultProfile = async (profileId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/user/ai-profiles/${profileId}/set-default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to set default profile')
      }

      if (data.success) {
        setAiProfiles(prev => prev.map(p => ({
          ...p,
          isDefault: p.id === profileId,
        })))

        toast({
          variant: "success",
          title: "Default Changed",
          description: "This profile is now actively responding to Facebook messages.",
        })
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to set default profile',
      })
    }
  }

  // Simulate AI Response in Playground
  const handleSimulate = () => {
    setIsSimulating(true)
    setSimulatedReply(null)

    setTimeout(() => {
      const defaultProf = aiProfiles.find(p => p.isDefault) || aiProfiles[0]
      const tone = defaultProf?.preferences.tone || 'friendly'
      
      let reply = ""
      if (tone === 'friendly' || defaultProf?.preferences.language === 'bn') {
        reply = "Ji bhai/apu! 🖤 Dhaka shohorer bhetore delivery charge matro ৮০ taka, ebong Dhaka-r baire ১৫০ taka (Cash on Delivery available). Order confirm korte apnar Name, Full Address, ebong Phone Number ta kindly inbox-e share korun!"
      } else if (tone === 'formal') {
        reply = "Hello. Thank you for your inquiry. Delivery charges are BDT 80 inside Dhaka and BDT 150 nationwide. Estimated delivery time is 2-3 business days. Please provide your delivery details to confirm."
      } else {
        reply = "Hey! Panjabi stock-e ache. Ajkei order korle 48 hours er moddhe delivery peye jaben! Order korte phone number din please."
      }

      setSimulatedReply(reply)
      setIsSimulating(false)
    }, 700)
  }

  const activeCount = aiProfiles.filter(p => p.isActive).length
  const defaultProfile = aiProfiles.find(p => p.isDefault)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">AI Assistant Settings</h1>
          <p className="text-sm text-muted-foreground">
            Define tone, personality, and instructions for how the bilingual AI sells products in Facebook Messenger.
          </p>
        </div>

        {canConfigureAI && (
          <Button
            onClick={() => {
              setEditingProfile(null)
              setShowCreateForm(!showCreateForm)
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs h-9 px-4 rounded-md"
          >
            {showCreateForm ? <X className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            <span>{showCreateForm ? "Close Form" : "Create AI Profile"}</span>
          </Button>
        )}
      </div>

      {/* Feature Gate */}
      {!hasFeature("AI_REPLIES") && !entitlementsLoading && (
        <FeatureGateCard
          title="Automated AI Replies Module"
          description="Your current plan does not include the automated AI Replies module. Upgrade your subscription to enable automatic Facebook conversation handling."
          featureKey="AI_REPLIES"
          planRequired="Starter or Pro"
        />
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Active Profiles</span>
            <div className="w-8 h-8 rounded-md bg-success-soft border border-success/30 text-success flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Live in deployment</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Created</span>
            <div className="w-8 h-8 rounded-md bg-info-soft border border-info/30 text-info flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{aiProfiles.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Personality configurations</p>
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Default Responder</span>
            <div className="w-8 h-8 rounded-md bg-warning-soft border border-warning/30 text-warning flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base font-bold text-warning mt-2 truncate">
            {defaultProfile?.name || "None Selected"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Answers customer inbox</p>
        </div>
      </div>

      {/* Create / Edit Form Drawer */}
      {showCreateForm && (
        <div className="p-6 rounded-lg bg-card border border-primary/30 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-info-soft border border-info/30 text-info flex items-center justify-center">
                {editingProfile ? <Edit3 className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {editingProfile ? `Edit Profile: ${editingProfile.name}` : "Create New AI Personality Profile"}
                </h3>
                <p className="text-xs text-muted-foreground">Configure language, tone, and specific selling rules.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingProfile(null)
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Preset Chips */}
          {!editingProfile && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5 text-info" />
                <span>Quick-Start Presets (Click to autofill):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setNewProfile(prev => ({
                        ...prev,
                        name: tpl.title.replace(/[^a-zA-Z0-9 ]/g, '').trim(),
                        id: tpl.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20),
                        personality: tpl.personality,
                        instructions: tpl.instructions,
                        preferences: {
                          ...prev.preferences,
                          language: 'bn',
                          tone: 'friendly'
                        }
                      }))
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-muted border border-border hover:border-primary/30 hover:bg-info-soft text-foreground/80 hover:text-foreground transition-all duration-200"
                  >
                    {tpl.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {!editingProfile && (
              <div className="space-y-1.5">
                <Label className="text-foreground/80">
                  Profile Identifier (Unique slug) <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="e.g. sales-agent-v1"
                  value={newProfile.id}
                  onChange={(e) => setNewProfile({ ...newProfile, id: e.target.value })}
                  className="bg-background border-border text-foreground font-mono text-xs h-10"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-foreground/80">
                Display Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Rahim - Lead Sales Bot"
                value={newProfile.name}
                onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-foreground/80">Description</Label>
              <Input
                placeholder="Brief summary of what this bot handles..."
                value={newProfile.description}
                onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                className="bg-background border-border text-foreground text-xs h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground/80">Primary Language</Label>
              <select
                value={newProfile.preferences.language}
                onChange={(e) => setNewProfile({
                  ...newProfile,
                  preferences: { ...newProfile.preferences, language: e.target.value }
                })}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-foreground text-xs"
              >
                <option value="bn">🇧🇩 Bengali / Banglish (Natural Bangladesh)</option>
                <option value="en">🇺🇸 English</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground/80">Tone of Voice</Label>
              <select
                value={newProfile.preferences.tone}
                onChange={(e) => setNewProfile({
                  ...newProfile,
                  preferences: { ...newProfile.preferences, tone: e.target.value }
                })}
                className="w-full h-10 px-3 bg-background border border-border rounded-xl text-foreground text-xs"
              >
                <option value="friendly">🤝 Friendly & Courteous</option>
                <option value="professional">👔 Professional & Polite</option>
                <option value="casual">😊 Casual & Energetic</option>
                <option value="formal">🎩 Formal</option>
              </select>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-foreground/80">Personality Traits</Label>
              <textarea
                rows={3}
                placeholder="Describe how the assistant carries itself (e.g. Enthusiastic, polite, always suggests complementary products)..."
                value={newProfile.personality}
                onChange={(e) => setNewProfile({ ...newProfile, personality: e.target.value })}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground text-xs resize-none"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-foreground/80">Specific Business Instructions</Label>
              <textarea
                rows={3}
                placeholder="Rules: Return policy is 7 days, delivery fee is 80 tk in Dhaka, ask for phone number before confirming order..."
                value={newProfile.instructions}
                onChange={(e) => setNewProfile({ ...newProfile, instructions: e.target.value })}
                className="w-full p-3 bg-background border border-border rounded-xl text-foreground text-xs resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newProfile.isDefault}
                onChange={(e) => setNewProfile({ ...newProfile, isDefault: e.target.checked })}
                className="rounded border-border bg-background text-primary w-4 h-4"
              />
              <span className="text-xs text-foreground/80 flex items-center gap-1 font-medium">
                <Star className="w-3.5 h-3.5 text-warning" />
                <span>Make Default Active Responder</span>
              </span>
            </label>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingProfile(null)
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={editingProfile ? handleUpdateProfile : handleCreateProfile}
                disabled={editingProfile ? updatingProfile : creatingProfile}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-5 rounded-md font-medium"
              >
                {(editingProfile ? updatingProfile : creatingProfile) ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>{editingProfile ? "Update Profile" : "Save Profile"}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Profiles List + Interactive Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Profiles List (Left) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span>Configured AI Profiles ({aiProfiles.length})</span>
            </h3>
          </div>

          {aiProfilesLoading ? (
            <div className="p-12 text-center space-y-2 rounded-lg bg-card border border-border">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">Loading AI profiles...</p>
            </div>
          ) : aiProfilesError ? (
            <div className="p-4 rounded-lg bg-destructive-soft border border-destructive/30 text-xs text-destructive">
              {aiProfilesError}
            </div>
          ) : aiProfiles.length === 0 ? (
            <div className="p-10 rounded-lg bg-card border border-border text-center space-y-3">
              <Bot className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold text-foreground">No Profiles Yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Create your first AI profile above to customize how BDChatPro interacts with your customers.
              </p>
            </div>
          ) : (
            aiProfiles.map((profile) => (
              <div
                key={profile.id}
                className={`p-5 rounded-lg border transition-colors space-y-4 ${
                  profile.isDefault
                    ? "bg-card border-warning/30"
                    : "bg-card border-border hover:border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs ${
                      profile.isDefault
                        ? "bg-marigold text-foreground font-semibold"
                        : "bg-muted border border-border text-foreground/80"
                    }`}>
                      {profile.isDefault ? <Crown className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-foreground">{profile.name}</h4>
                        {profile.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded bg-warning-soft border border-warning/30 text-warning font-semibold flex items-center gap-1">
                            <Crown className="w-3 h-3" /> Active Default
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">ID: {profile.id}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!profile.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultProfile(profile.id)}
                        className="text-xs border-warning/30 text-warning hover:bg-warning-soft h-8 px-2.5 rounded-lg"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProfile(profile)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    {!profile.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={deletingProfile === profile.id}
                        className="text-muted-foreground hover:text-destructive h-8 w-8 p-0"
                      >
                        {deletingProfile === profile.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                  </div>
                </div>

                {profile.description && (
                  <p className="text-xs text-foreground/80">{profile.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-muted-foreground font-medium">Personality</span>
                    <p className="text-foreground line-clamp-2">{profile.personality || "Standard assistant"}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-muted-foreground font-medium">Instructions</span>
                    <p className="text-foreground line-clamp-2">{profile.instructions || "General rules"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-muted border border-border font-medium">
                    {profile.preferences.language}
                  </span>
                  <span className="capitalize">{profile.preferences.tone} tone</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Live Playground / Simulator (Right) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="p-5 rounded-lg bg-card border border-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">AI Simulator Playground</h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">Real-time Preview</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Test how your active default profile responds to real customer questions in Facebook Messenger.
            </p>

            {/* Simulated Messenger Box */}
            <div className="p-4 rounded-lg bg-background border border-border space-y-3 min-h-[220px] flex flex-col justify-between">
              <div className="space-y-3">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground text-xs px-3.5 py-2 rounded-lg rounded-tr-sm max-w-[85%]">
                    {simulatorInput || "Customer query..."}
                  </div>
                </div>

                {/* AI Response */}
                {isSimulating ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>AI generating response with active rules...</span>
                  </div>
                ) : simulatedReply ? (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground border border-border text-xs px-3.5 py-2.5 rounded-lg rounded-tl-sm max-w-[90%] space-y-1">
                      <p className="leading-relaxed">{simulatedReply}</p>
                      <div className="pt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        <span>Profile: {defaultProfile?.name || "Active Default"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Click &quot;Simulate Reply&quot; to test your prompt rules
                  </div>
                )}
              </div>

              {/* Sample Queries */}
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground block mb-1">Try example customer inquiries:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Price koto? Delivery fee ache?",
                    "Black XL size available?",
                    "Return policy ki apnader?"
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSimulatorInput(sample)}
                      className="text-xs px-2 py-0.5 rounded bg-card border border-border text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input & Fire */}
            <div className="flex items-center gap-2">
              <Input
                value={simulatorInput}
                onChange={(e) => setSimulatorInput(e.target.value)}
                placeholder="Type customer message..."
                className="bg-background border-border text-foreground text-xs h-9 rounded-md"
              />
              <Button
                onClick={handleSimulate}
                disabled={isSimulating || !simulatorInput}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-4 rounded-md shrink-0 font-medium"
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                Simulate
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}