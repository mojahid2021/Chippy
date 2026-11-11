"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Bot,
  Plus,
  RefreshCw,
  Copy,
  Trash2,
  Edit,
  Search,
  CheckCircle,
  Cpu,
  BookOpen,
  ShieldAlert,
  Sliders,
  Send,
  MessageSquare,
  Check,
  ChevronRight,
  Code2,
  Bookmark,
  Star,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import type {
  AiProfile,
  AiProfilesResponse,
  KnowledgeSnippet,
  ReferenceUrl,
  CustomVariable,
  FewShotExample,
  ModelConfig,
  CompilePromptResponse,
  MessengerWebhook,
} from "@/lib/types/woombat"

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "customer-support", label: "Customer Support" },
  { value: "sales", label: "Sales & Conversion" },
  { value: "booking", label: "Booking & Reservations" },
  { value: "real-estate", label: "Real Estate & Concierge" },
  { value: "tech-support", label: "Technical Support" },
  { value: "general", label: "General Assistant" },
]

const LLM_PROVIDERS = [
  { value: "openai", label: "OpenAI (GPT-4o, etc.)" },
  { value: "anthropic", label: "Anthropic (Claude 3.5 Sonnet)" },
  { value: "gemini", label: "Google (Gemini 1.5 Pro/Flash)" },
  { value: "groq", label: "Groq (Llama 3.3, Mixtral)" },
  { value: "mistral", label: "Mistral AI" },
  { value: "ollama", label: "Ollama (Self-Hosted)" },
]

export default function AiProfilesPage() {
  const [profiles, setProfiles] = useState<AiProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  const [saveLoading, setSaveLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"identity" | "prompts" | "knowledge" | "variables" | "model">("identity")

  // Form State
  const [formProfileId, setFormProfileId] = useState<string | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    role: string
    description: string
    category: string
    tone: string
    style: string
    language: string
    responseLength: string
    systemPrompt: string
    mission: string
    fallbackResponse: string
    dos: string[]
    donts: string[]
    knowledgeSnippets: KnowledgeSnippet[]
    referenceUrls: ReferenceUrl[]
    customVariables: CustomVariable[]
    fewShotExamples: FewShotExample[]
    modelConfig: ModelConfig
    tags: string[]
    isActive: boolean
    isDefault: boolean
  }>({
    name: "",
    role: "",
    description: "",
    category: "customer-support",
    tone: "empathetic",
    style: "conversational",
    language: "en",
    responseLength: "balanced",
    systemPrompt: "",
    mission: "",
    fallbackResponse: "",
    dos: [],
    donts: [],
    knowledgeSnippets: [],
    referenceUrls: [],
    customVariables: [],
    fewShotExamples: [],
    modelConfig: {
      provider: "openai",
      modelName: "gpt-4o",
      temperature: 0.7,
      topP: 1.0,
      maxTokens: 2048,
      responseFormat: "text",
    },
    tags: [],
    isActive: true,
    isDefault: false,
  })

  // Temporary item inputs for form arrays
  const [newDo, setNewDo] = useState("")
  const [newDont, setNewDont] = useState("")

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<AiProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bound Webhooks State
  const [webhooksModalOpen, setWebhooksModalOpen] = useState(false)
  const [boundWebhooks, setBoundWebhooks] = useState<MessengerWebhook[]>([])
  const [boundWebhooksLoading, setBoundWebhooksLoading] = useState(false)
  const [selectedProfileForWebhooks, setSelectedProfileForWebhooks] = useState<AiProfile | null>(null)

  // Prompt Compiler Playground State
  const [compilerModalOpen, setCompilerModalOpen] = useState(false)
  const [compilerProfile, setCompilerProfile] = useState<AiProfile | null>(null)
  const [compilerUserPrompt, setCompilerUserPrompt] = useState("")
  const [compilerAdditionalContext, setCompilerAdditionalContext] = useState("")
  const [compilerIncludeFewShot, setCompilerIncludeFewShot] = useState(true)
  const [compilerVariables, setCompilerVariables] = useState<Record<string, string>>({})
  const [compilerLoading, setCompilerLoading] = useState(false)
  const [compiledResult, setCompiledResult] = useState<CompilePromptResponse["data"] | null>(null)
  const [compilerActiveResultTab, setCompilerActiveResultTab] = useState<"messages" | "systemPrompt" | "variables">("messages")

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyToClipboard = (text: string, key: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast({
        variant: "info",
        title: "Copied to clipboard",
        description: text.length > 60 ? `${text.substring(0, 60)}...` : text,
      })
      setTimeout(() => setCopiedKey(null), 2000)
    }
  }

  // Fetch AI Profiles
  const fetchProfiles = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: page.toString(), limit: "12" })
      if (searchQuery.trim()) params.append("search", searchQuery.trim())
      if (categoryFilter !== "ALL") params.append("category", categoryFilter)
      if (statusFilter !== "ALL") params.append("isActive", statusFilter === "ACTIVE" ? "true" : "false")

      const res = await fetch(`/api/v1/ai-profiles?${params.toString()}`)
      const json: AiProfilesResponse = await res.json()

      if (res.ok && Array.isArray(json.data)) {
        setProfiles(json.data)
        if (json.pagination) {
          setCurrentPage(json.pagination.page)
          setTotalPages(json.pagination.totalPages)
          setTotalCount(json.pagination.total)
        }
      } else {
        setProfiles([])
      }
    } catch (err) {
      console.error("Failed to fetch AI profiles:", err)
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Failed to load AI profiles",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, categoryFilter, statusFilter])

  useEffect(() => {
    fetchProfiles(currentPage)
  }, [fetchProfiles, currentPage])

  // Open Create Modal
  const handleOpenCreate = () => {
    setModalMode("create")
    setFormProfileId(null)
    setActiveTab("identity")
    setFormData({
      name: "",
      role: "",
      description: "",
      category: "customer-support",
      tone: "empathetic",
      style: "conversational",
      language: "en",
      responseLength: "balanced",
      systemPrompt: "You represent {{company_name}}. Assist visitors with inquiries about properties and services.",
      mission: "Deliver fast, accurate, and friendly support to all prospects.",
      fallbackResponse: "I am not certain about that detail. Please email {{support_email}} and our team will follow up.",
      dos: [
        "Always greet the customer politely",
        "Refer to {{support_email}} for escalations",
        "Format prices in {{currency}}",
      ],
      donts: [
        "Never share internal admin credentials",
        "Do not promise discounts without manager approval",
      ],
      knowledgeSnippets: [
        {
          id: "general-policy",
          title: "Service Overview",
          content: "We provide automated customer support and property booking management.",
          tags: ["support", "general"],
        },
      ],
      referenceUrls: [
        {
          title: "Official Website",
          url: "https://example.com",
          description: "Main business portal",
        },
      ],
      customVariables: [
        {
          key: "company_name",
          defaultValue: "My Business",
          description: "Business name placeholder",
        },
        {
          key: "support_email",
          defaultValue: "support@example.com",
          description: "Customer service contact email",
        },
        {
          key: "currency",
          defaultValue: "USD",
          description: "Default transaction currency",
        },
      ],
      fewShotExamples: [
        {
          user: "What are your business hours?",
          assistant: "We are available 24/7 to assist you with inquiries and bookings.",
        },
      ],
      modelConfig: {
        provider: "openai",
        modelName: "gpt-4o",
        temperature: 0.7,
        topP: 1.0,
        maxTokens: 2048,
        responseFormat: "text",
      },
      tags: ["support", "concierge"],
      isActive: true,
      isDefault: profiles.length === 0,
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = async (profile: AiProfile) => {
    try {
      setModalMode("edit")
      setFormProfileId(profile.id)
      setActiveTab("identity")

      // Fetch fresh full configuration
      const res = await fetch(`/api/v1/ai-profiles/${profile.id}`)
      const json = await res.json()
      const data: AiProfile = res.ok && json.data ? json.data : profile

      setFormData({
        name: data.name || "",
        role: data.role || "",
        description: data.description || "",
        category: data.category || "customer-support",
        tone: data.tone || "empathetic",
        style: data.style || "conversational",
        language: data.language || "en",
        responseLength: data.responseLength || "balanced",
        systemPrompt: data.systemPrompt || "",
        mission: data.mission || "",
        fallbackResponse: data.fallbackResponse || "",
        dos: data.dos || [],
        donts: data.donts || [],
        knowledgeSnippets: data.knowledgeSnippets || [],
        referenceUrls: data.referenceUrls || [],
        customVariables: data.customVariables || [],
        fewShotExamples: data.fewShotExamples || [],
        modelConfig: data.modelConfig || {
          provider: "openai",
          modelName: "gpt-4o",
          temperature: 0.7,
          topP: 1.0,
          maxTokens: 2048,
          responseFormat: "text",
        },
        tags: data.tags || [],
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
      })
      setIsModalOpen(true)
    } catch (err) {
      console.error("Failed to load profile for editing:", err)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load full profile configuration.",
      })
    }
  }

  // Save AI Profile (Create or Update)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Persona Name and Role are required.",
      })
      return
    }

    try {
      setSaveLoading(true)
      const url = modalMode === "create" ? "/api/v1/ai-profiles" : `/api/v1/ai-profiles/${formProfileId}`
      const method = modalMode === "create" ? "POST" : "PATCH"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const json = await res.json()

      if (res.ok && json.data) {
        toast({
          variant: "success",
          title: modalMode === "create" ? "AI Profile Created" : "AI Profile Updated",
          description: `Persona "${json.data.name}" saved successfully.`,
        })
        setIsModalOpen(false)
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Save Failed",
          description: json.message || "Could not save AI profile.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while saving AI profile.",
      })
    } finally {
      setSaveLoading(false)
    }
  }

  // Set Profile as Default
  const handleSetDefault = async (profile: AiProfile) => {
    try {
      const res = await fetch(`/api/v1/ai-profiles/${profile.id}/set-default`, {
        method: "PATCH",
      })

      const json = await res.json()

      if (res.ok) {
        toast({
          variant: "success",
          title: "Default AI Persona Updated",
          description: `"${profile.name}" is now designated as your default AI profile.`,
        })
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: json.message || "Failed to set default profile.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while setting default profile.",
      })
    }
  }

  // Toggle Active Status
  const handleToggleActive = async (profile: AiProfile, newStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/ai-profiles/${profile.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      })

      if (res.ok) {
        toast({
          variant: "success",
          title: newStatus ? "AI Profile Activated" : "AI Profile Deactivated",
          description: `${profile.name} is now ${newStatus ? "active" : "disabled"}.`,
        })
        setProfiles((prev) =>
          prev.map((item) => (item.id === profile.id ? { ...item, isActive: newStatus } : item))
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile status.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error",
      })
    }
  }

  // Delete AI Profile
  const handleDeleteProfile = async () => {
    if (!profileToDelete) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/v1/ai-profiles/${profileToDelete.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast({
          variant: "success",
          title: "Profile Deleted",
          description: `"${profileToDelete.name}" has been permanently deleted.`,
        })
        setDeleteModalOpen(false)
        setProfileToDelete(null)
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Deletion Failed",
          description: "Could not delete AI profile.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while deleting profile.",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  // Open Bound Webhooks Modal
  const handleOpenBoundWebhooks = async (profile: AiProfile) => {
    try {
      setSelectedProfileForWebhooks(profile)
      setWebhooksModalOpen(true)
      setBoundWebhooksLoading(true)

      const res = await fetch(`/api/v1/ai-profiles/${profile.id}/webhooks`)
      const json = await res.json()

      if (res.ok && Array.isArray(json.data)) {
        setBoundWebhooks(json.data)
      } else {
        setBoundWebhooks([])
      }
    } catch (err) {
      console.error("Failed to load bound webhooks:", err)
      setBoundWebhooks([])
    } finally {
      setBoundWebhooksLoading(false)
    }
  }

  // Open Prompt Compiler Playground
  const handleOpenCompiler = (profile: AiProfile) => {
    setCompilerProfile(profile)
    setCompilerUserPrompt("Can I get a refund if I cancel my reservation tomorrow at {{company_name}}?")
    setCompilerAdditionalContext("Prospect is viewing penthouse suite #402.")
    setCompilerIncludeFewShot(true)

    // Pre-populate variables from profile
    const initialVars: Record<string, string> = {}
    profile.customVariables?.forEach((v) => {
      initialVars[v.key] = v.defaultValue
    })
    setCompilerVariables(initialVars)
    setCompiledResult(null)
    setCompilerModalOpen(true)
  }

  // Run Prompt Compilation
  const handleRunCompiler = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!compilerProfile) return

    try {
      setCompilerLoading(true)
      const res = await fetch(`/api/v1/ai-profiles/${compilerProfile.id}/compile-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: compilerUserPrompt,
          dynamicVariables: compilerVariables,
          additionalContext: compilerAdditionalContext || undefined,
          includeFewShot: compilerIncludeFewShot,
        }),
      })

      const json: CompilePromptResponse = await res.json()

      if (res.ok && json.data) {
        setCompiledResult(json.data)
        toast({
          variant: "success",
          title: "Prompt Compiled Successfully",
          description: `Total Estimated Tokens: ${json.data.estimatedTokens.total}`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Compilation Failed",
          description: json.message || "Failed to compile prompt bundle.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Network error while compiling prompt bundle.",
      })
    } finally {
      setCompilerLoading(false)
    }
  }

  const defaultProfile = profiles.find((p) => p.isDefault)
  const activeCount = profiles.filter((p) => p.isActive).length

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Persona & Prompt Compiler
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage rich AI profiles, guardrails, knowledge base snippets, dynamic variables, and compile production-ready chat prompts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProfiles(currentPage)}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-3 w-3" />
            Create AI Persona
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-3 border-border bg-card gap-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Total Personas</span>
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Bot className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">{totalCount || profiles.length}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Across all categories</p>
        </Card>

        <Card className="p-3 border-border bg-card gap-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Active Personas</span>
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xl font-bold text-foreground">{activeCount}</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">Ready to dispatch</p>
        </Card>

        <Card className="p-3 border-border bg-card gap-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Default Persona</span>
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-500">
              <Star className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xs font-bold text-foreground truncate">
            {defaultProfile ? defaultProfile.name : "None set"}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {defaultProfile ? defaultProfile.role : "Assign one below"}
          </p>
        </Card>

        <Card className="p-3 border-border bg-card gap-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">Prompt Engine</span>
            <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500">
              <Zap className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1 text-xs font-bold text-foreground">Multi-LLM Synthesizer</div>
          <p className="text-[10px] text-muted-foreground mt-0.5">OpenAI, Claude, Gemini, Groq</p>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="p-2.5 border-border bg-card gap-0">
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by persona name, role, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 pl-8 text-xs bg-background/50 border-border/70"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-7 px-2 rounded-md text-xs bg-background border border-border/70 text-foreground focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="h-7 px-2 rounded-md text-xs bg-background border border-border/70 text-foreground focus:outline-none"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          <div className="text-[11px] text-muted-foreground self-center">
            Showing {profiles.length} of {totalCount || profiles.length} personas
          </div>
        </div>
      </Card>

      {/* Profiles Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-xs font-medium">Loading AI profiles...</p>
        </div>
      ) : profiles.length === 0 ? (
        <Card className="py-12 text-center border-dashed border-border/80 bg-card/20">
          <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-60" />
          <h3 className="text-xs font-semibold text-foreground">No AI Personas Found</h3>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto mt-1 mb-3">
            {searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
              ? "No personas match your search filters. Try adjusting your parameters."
              : "You haven't created any AI persona profiles yet. Create your first profile to bind with Messenger webhooks and run dynamic prompt compilation."}
          </p>
          <Button size="sm" onClick={handleOpenCreate} className="h-7 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create AI Persona
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {profiles.map((profile) => {
            const modelProvider = profile.modelConfig?.provider || "openai"
            const modelName = profile.modelConfig?.modelName || "gpt-4o"

            return (
              <Card
                key={profile.id}
                className={cn(
                  "border transition-all duration-200 flex flex-col justify-between hover:border-primary/40 bg-card/70 shadow-sm gap-0 py-0",
                  profile.isDefault && "border-amber-500/40 bg-amber-500/[0.02]"
                )}
              >
                <div>
                  {/* Card Header */}
                  <div className="p-3 border-b border-border/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-foreground truncate">{profile.name}</h3>
                            {profile.isDefault && (
                              <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[9px] px-1 py-0 flex items-center gap-0.5">
                                <Star className="h-2 w-2 fill-current" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{profile.role}</p>
                        </div>
                      </div>

                      <Switch
                        checked={profile.isActive}
                        onCheckedChange={(checked) => handleToggleActive(profile, checked)}
                        aria-label="Toggle active status"
                      />
                    </div>

                    {profile.description && (
                      <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                        {profile.description}
                      </p>
                    )}
                  </div>

                  {/* Configuration Highlights */}
                  <div className="p-3 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-border/70 capitalize">
                        {profile.category || "custom"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-border/70 capitalize">
                        Tone: {profile.tone || "balanced"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 border-border/70">
                        v{profile.version || 1}
                      </Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5 flex items-center gap-1">
                        <Cpu className="h-2.5 w-2.5" />
                        {modelProvider}: {modelName}
                      </Badge>
                    </div>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
                      <div className="bg-muted/40 p-1 rounded text-center border border-border/40">
                        <div className="font-semibold text-foreground text-xs">
                          {profile.knowledgeSnippets?.length || 0}
                        </div>
                        <div className="text-[9px]">Snippets</div>
                      </div>

                      <div className="bg-muted/40 p-1 rounded text-center border border-border/40">
                        <div className="font-semibold text-foreground text-xs">
                          {(profile.dos?.length || 0) + (profile.donts?.length || 0)}
                        </div>
                        <div className="text-[9px]">Guardrails</div>
                      </div>

                      <div className="bg-muted/40 p-1 rounded text-center border border-border/40">
                        <div className="font-semibold text-foreground text-xs">
                          {profile.customVariables?.length || 0}
                        </div>
                        <div className="text-[9px]">Variables</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-2 border-t border-border/50 bg-muted/20 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenCompiler(profile)}
                      className="h-6 px-2 text-[10px] gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      title="Test Persona Prompt Compilation"
                    >
                      <Zap className="h-2.5 w-2.5" />
                      Test Compiler
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenBoundWebhooks(profile)}
                      className="h-6 px-1.5 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                      title="Inspect bound Messenger webhooks"
                    >
                      <MessageSquare className="h-2.5 w-2.5" />
                      Webhooks
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {!profile.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(profile)}
                        className="h-7 px-1.5 text-muted-foreground hover:text-amber-500"
                        title="Set as Default Persona"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(profile)}
                      className="h-7 px-1.5 text-muted-foreground hover:text-foreground"
                      title="Edit Profile"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProfileToDelete(profile)
                        setDeleteModalOpen(true)
                      }}
                      className="h-7 px-1.5 text-muted-foreground hover:text-destructive"
                      title="Delete Profile"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border/50 pt-4 text-xs">
          <p className="text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREATE & EDIT MODAL                                                       */}
      {/* ========================================================================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-5 border-border bg-card gap-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5 text-primary" />
              {modalMode === "create" ? "Create AI Persona Profile" : `Edit Persona: ${formData.name}`}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure system prompts, guardrails, knowledge base snippets, dynamic placeholders, and target LLM model parameters.
            </DialogDescription>
          </DialogHeader>

          {/* Form Tabs */}
          <div className="flex border-b border-border gap-2 text-xs font-medium pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("identity")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                activeTab === "identity"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Bot className="h-3.5 w-3.5" />
              Identity & Tone
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("prompts")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                activeTab === "prompts"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Prompts & Guardrails
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("knowledge")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                activeTab === "knowledge"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Knowledge & Links
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("variables")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                activeTab === "variables"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Variables & Few-Shot
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("model")}
              className={cn(
                "px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 shrink-0",
                activeTab === "model"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              LLM Model Config
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            {/* TAB 1: IDENTITY & TONE */}
            {activeTab === "identity" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Persona Name *</Label>
                    <Input
                      placeholder="e.g. Woombat Concierge"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Role / Title *</Label>
                    <Input
                      placeholder="e.g. Property & Support Specialist"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      required
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="Short summary of this persona's purpose and scope..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                    >
                      <option value="customer-support">Customer Support</option>
                      <option value="sales">Sales</option>
                      <option value="booking">Booking</option>
                      <option value="real-estate">Real Estate</option>
                      <option value="tech-support">Tech Support</option>
                      <option value="general">General</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Tone</Label>
                    <Input
                      placeholder="e.g. empathetic, friendly"
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Style</Label>
                    <Input
                      placeholder="e.g. conversational, concise"
                      value={formData.style}
                      onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Response Length</Label>
                    <select
                      value={formData.responseLength}
                      onChange={(e) => setFormData({ ...formData, responseLength: e.target.value })}
                      className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                    >
                      <option value="concise">Concise</option>
                      <option value="balanced">Balanced</option>
                      <option value="detailed">Detailed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Active State</Label>
                      <p className="text-[10px] text-muted-foreground">Available for webhook dispatching</p>
                    </div>
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-semibold">Set as Default</Label>
                      <p className="text-[10px] text-muted-foreground">Fallback persona for new webhooks</p>
                    </div>
                    <Switch
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PROMPTS & GUARDRAILS */}
            {activeTab === "prompts" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">System Prompt / Core Persona Instructions</Label>
                    <span className="text-[10px] text-muted-foreground">Supports &#123;&#123;variable_name&#125;&#125;</span>
                  </div>
                  <Textarea
                    rows={4}
                    placeholder="You represent {{company_name}}. Assist visitors with inquiries about properties and services..."
                    value={formData.systemPrompt}
                    onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                    className="text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Mission Statement</Label>
                    <Input
                      placeholder="e.g. Deliver fast, accurate, and friendly support."
                      value={formData.mission}
                      onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Fallback Response</Label>
                    <Input
                      placeholder="I am not certain about that detail. Please email {{support_email}}..."
                      value={formData.fallbackResponse}
                      onChange={(e) => setFormData({ ...formData, fallbackResponse: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {/* Behavioral Dos */}
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs font-semibold text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Behavioral Guidelines (Always Do)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a required rule (e.g. 'Format prices in {{currency}}')..."
                      value={newDo}
                      onChange={(e) => setNewDo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newDo.trim()) {
                            setFormData({ ...formData, dos: [...formData.dos, newDo.trim()] })
                            setNewDo("")
                          }
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newDo.trim()) {
                          setFormData({ ...formData, dos: [...formData.dos, newDo.trim()] })
                          setNewDo("")
                        }
                      }}
                      className="h-8 text-xs px-3"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {formData.dos.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-emerald-500/5 border border-emerald-500/20 px-2 py-1 rounded-md"
                      >
                        <span className="truncate">{item}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, dos: formData.dos.filter((_, i) => i !== idx) })}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Donts */}
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs font-semibold text-rose-500 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Safety Rules & Restrictions (Never Do)
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a safety restriction (e.g. 'Never disclose admin credentials')..."
                      value={newDont}
                      onChange={(e) => setNewDont(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (newDont.trim()) {
                            setFormData({ ...formData, donts: [...formData.donts, newDont.trim()] })
                            setNewDont("")
                          }
                        }
                      }}
                      className="h-8 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (newDont.trim()) {
                          setFormData({ ...formData, donts: [...formData.donts, newDont.trim()] })
                          setNewDont("")
                        }
                      }}
                      className="h-8 text-xs px-3"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {formData.donts.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs bg-rose-500/5 border border-rose-500/20 px-2 py-1 rounded-md"
                      >
                        <span className="truncate">{item}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, donts: formData.donts.filter((_, i) => i !== idx) })}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: KNOWLEDGE & LINKS */}
            {activeTab === "knowledge" && (
              <div className="space-y-4">
                {/* Knowledge Snippets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-primary" />
                      Knowledge Snippets ({formData.knowledgeSnippets.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          knowledgeSnippets: [
                            ...formData.knowledgeSnippets,
                            {
                              id: `snippet-${Date.now()}`,
                              title: "New Policy",
                              content: "Policy details here...",
                              tags: ["policy"],
                            },
                          ],
                        })
                      }
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Snippet
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {formData.knowledgeSnippets.map((snip, idx) => (
                      <div key={idx} className="p-2.5 rounded-md border border-border/70 bg-muted/20 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Input
                            placeholder="Snippet Title"
                            value={snip.title}
                            onChange={(e) => {
                              const updated = [...formData.knowledgeSnippets]
                              updated[idx].title = e.target.value
                              setFormData({ ...formData, knowledgeSnippets: updated })
                            }}
                            className="h-7 text-xs font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                knowledgeSnippets: formData.knowledgeSnippets.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Textarea
                          placeholder="Snippet Content..."
                          rows={2}
                          value={snip.content}
                          onChange={(e) => {
                            const updated = [...formData.knowledgeSnippets]
                            updated[idx].content = e.target.value
                            setFormData({ ...formData, knowledgeSnippets: updated })
                          }}
                          className="text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reference URLs */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold flex items-center gap-1.5">
                      <Bookmark className="h-3.5 w-3.5 text-primary" />
                      Reference URLs & Documentation ({formData.referenceUrls.length})
                    </Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          referenceUrls: [
                            ...formData.referenceUrls,
                            { title: "Terms of Service", url: "https://example.com/terms", description: "Official terms" },
                          ],
                        })
                      }
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add URL
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {formData.referenceUrls.map((ref, idx) => (
                      <div key={idx} className="p-2 rounded-md border border-border/70 bg-muted/20 flex gap-2 items-center">
                        <Input
                          placeholder="Link Title"
                          value={ref.title}
                          onChange={(e) => {
                            const updated = [...formData.referenceUrls]
                            updated[idx].title = e.target.value
                            setFormData({ ...formData, referenceUrls: updated })
                          }}
                          className="h-7 text-xs w-1/3"
                        />
                        <Input
                          placeholder="https://..."
                          value={ref.url}
                          onChange={(e) => {
                            const updated = [...formData.referenceUrls]
                            updated[idx].url = e.target.value
                            setFormData({ ...formData, referenceUrls: updated })
                          }}
                          className="h-7 text-xs flex-1 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              referenceUrls: formData.referenceUrls.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VARIABLES & FEW-SHOT */}
            {activeTab === "variables" && (
              <div className="space-y-4">
                {/* Custom Variables */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5 text-primary" />
                        Dynamic Template Variables ({formData.customVariables.length})
                      </Label>
                      <p className="text-[10px] text-muted-foreground">
                        Placeholders like &#123;&#123;company_name&#125;&#125; populated at runtime.
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          customVariables: [
                            ...formData.customVariables,
                            { key: `var_${Date.now()}`, defaultValue: "Value", description: "Variable description" },
                          ],
                        })
                      }
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Variable
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.customVariables.map((v, idx) => (
                      <div key={idx} className="p-2 rounded-md border border-border/70 bg-muted/20 flex gap-2 items-center">
                        <Input
                          placeholder="key"
                          value={v.key}
                          onChange={(e) => {
                            const updated = [...formData.customVariables]
                            updated[idx].key = e.target.value
                            setFormData({ ...formData, customVariables: updated })
                          }}
                          className="h-7 text-xs w-1/3 font-mono font-semibold"
                        />
                        <Input
                          placeholder="default value"
                          value={v.defaultValue}
                          onChange={(e) => {
                            const updated = [...formData.customVariables]
                            updated[idx].defaultValue = e.target.value
                            setFormData({ ...formData, customVariables: updated })
                          }}
                          className="h-7 text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              customVariables: formData.customVariables.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Few-Shot Examples */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        Few-Shot Dialog Examples ({formData.fewShotExamples.length})
                      </Label>
                      <p className="text-[10px] text-muted-foreground">Injected into conversation context.</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          fewShotExamples: [
                            ...formData.fewShotExamples,
                            { user: "User query here", assistant: "Ideal assistant reply here" },
                          ],
                        })
                      }
                      className="h-7 text-xs px-2 gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add Example
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.fewShotExamples.map((ex, idx) => (
                      <div key={idx} className="p-2.5 rounded-md border border-border/70 bg-muted/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-primary">Example #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                fewShotExamples: formData.fewShotExamples.filter((_, i) => i !== idx),
                              })
                            }
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <Input
                          placeholder="User question..."
                          value={ex.user}
                          onChange={(e) => {
                            const updated = [...formData.fewShotExamples]
                            updated[idx].user = e.target.value
                            setFormData({ ...formData, fewShotExamples: updated })
                          }}
                          className="h-7 text-xs"
                        />
                        <Input
                          placeholder="Assistant answer..."
                          value={ex.assistant}
                          onChange={(e) => {
                            const updated = [...formData.fewShotExamples]
                            updated[idx].assistant = e.target.value
                            setFormData({ ...formData, fewShotExamples: updated })
                          }}
                          className="h-7 text-xs text-muted-foreground"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: LLM MODEL CONFIG */}
            {activeTab === "model" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Model Provider</Label>
                    <select
                      value={formData.modelConfig.provider}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modelConfig: { ...formData.modelConfig, provider: e.target.value },
                        })
                      }
                      className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                    >
                      {LLM_PROVIDERS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Model Name</Label>
                    <Input
                      placeholder="e.g. gpt-4o, claude-3-5-sonnet, gemini-1.5-pro"
                      value={formData.modelConfig.modelName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modelConfig: { ...formData.modelConfig, modelName: e.target.value },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <Label className="text-xs">Temperature</Label>
                      <span className="text-[10px] text-muted-foreground">{formData.modelConfig.temperature ?? 0.7}</span>
                    </div>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="2"
                      value={formData.modelConfig.temperature ?? 0.7}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modelConfig: { ...formData.modelConfig, temperature: parseFloat(e.target.value) || 0.7 },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <Label className="text-xs">Top P</Label>
                      <span className="text-[10px] text-muted-foreground">{formData.modelConfig.topP ?? 1.0}</span>
                    </div>
                    <Input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={formData.modelConfig.topP ?? 1.0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modelConfig: { ...formData.modelConfig, topP: parseFloat(e.target.value) || 1.0 },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Max Tokens</Label>
                    <Input
                      type="number"
                      step="128"
                      min="128"
                      max="32768"
                      value={formData.modelConfig.maxTokens ?? 2048}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          modelConfig: { ...formData.modelConfig, maxTokens: parseInt(e.target.value, 10) || 2048 },
                        })
                      }
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Response Format</Label>
                  <select
                    value={formData.modelConfig.responseFormat || "text"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        modelConfig: { ...formData.modelConfig, responseFormat: e.target.value },
                      })
                    }
                    className="w-full h-8 px-2 rounded-md text-xs bg-background border border-input text-foreground focus:outline-none"
                  >
                    <option value="text">Plain Text</option>
                    <option value="json_object">JSON Object</option>
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border flex items-center justify-between sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saveLoading}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saveLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {modalMode === "create" ? "Create Persona" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* PROMPT COMPILER PLAYGROUND MODAL                                          */}
      {/* ========================================================================= */}
      <Dialog open={compilerModalOpen} onOpenChange={setCompilerModalOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-5 border-border bg-card gap-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-primary" />
              Prompt Compiler & Simulator: {compilerProfile?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Synthesize and inspect the full LLM prompt bundle generated for {compilerProfile?.role}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
            {/* Input Controls */}
            <form onSubmit={handleRunCompiler} className="space-y-3.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">User Inquiry Prompt *</Label>
                <Textarea
                  rows={3}
                  placeholder="Ask a question or enter user input..."
                  value={compilerUserPrompt}
                  onChange={(e) => setCompilerUserPrompt(e.target.value)}
                  required
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Dynamic Session Context (Optional)</Label>
                <Input
                  placeholder="e.g. Prospect is looking at penthouse suite #402"
                  value={compilerAdditionalContext}
                  onChange={(e) => setCompilerAdditionalContext(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-between p-2 rounded-md border border-border/70 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-xs">Include Few-Shot Dialogs</Label>
                  <p className="text-[10px] text-muted-foreground">Appends sample Q&A before user inquiry</p>
                </div>
                <Switch
                  checked={compilerIncludeFewShot}
                  onCheckedChange={setCompilerIncludeFewShot}
                />
              </div>

              {/* Dynamic Variables Map */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Dynamic Session Variables</span>
                  <span className="text-[10px] text-muted-foreground">Injected into &#123;&#123;tags&#125;&#125;</span>
                </Label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-md border border-border/60 bg-muted/10">
                  {Object.keys(compilerVariables).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground text-center py-2">
                      No custom variables defined on this persona.
                    </p>
                  ) : (
                    Object.entries(compilerVariables).map(([key, val]) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-primary w-1/3 truncate">
                          {key}:
                        </span>
                        <Input
                          value={val}
                          onChange={(e) =>
                            setCompilerVariables({ ...compilerVariables, [key]: e.target.value })
                          }
                          className="h-7 text-xs flex-1"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={compilerLoading}
                className="w-full h-9 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {compilerLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Synthesize & Compile Prompt
              </Button>
            </form>

            {/* Compiled Result Inspection */}
            <div className="flex flex-col border border-border rounded-lg bg-muted/10 overflow-hidden min-h-[380px]">
              {compiledResult ? (
                <div className="flex-1 flex flex-col">
                  {/* Results Subtabs */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={compilerActiveResultTab === "messages" ? "secondary" : "ghost"}
                        onClick={() => setCompilerActiveResultTab("messages")}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        Messages ({compiledResult.messages.length})
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={compilerActiveResultTab === "systemPrompt" ? "secondary" : "ghost"}
                        onClick={() => setCompilerActiveResultTab("systemPrompt")}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        System Prompt
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={compilerActiveResultTab === "variables" ? "secondary" : "ghost"}
                        onClick={() => setCompilerActiveResultTab("variables")}
                        className="h-7 px-2.5 text-[11px]"
                      >
                        Variables ({Object.keys(compiledResult.appliedVariables || {}).length})
                      </Button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
                        {compiledResult.estimatedTokens.total} tokens
                      </Badge>
                    </div>
                  </div>

                  {/* Results Body */}
                  <div className="p-3 flex-1 overflow-y-auto max-h-[460px] text-xs">
                    {compilerActiveResultTab === "messages" && (
                      <div className="space-y-2.5">
                        {compiledResult.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={cn(
                              "p-2.5 rounded-md border text-xs leading-relaxed",
                              msg.role === "system" && "bg-muted/40 border-border/80",
                              msg.role === "user" && "bg-primary/5 border-primary/20",
                              msg.role === "assistant" && "bg-emerald-500/5 border-emerald-500/20"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] uppercase font-bold",
                                  msg.role === "system" && "text-muted-foreground",
                                  msg.role === "user" && "text-primary border-primary/40",
                                  msg.role === "assistant" && "text-emerald-500 border-emerald-500/40"
                                )}
                              >
                                {msg.role}
                              </Badge>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.content, `msg-${i}`)}
                                className="text-muted-foreground hover:text-foreground p-0.5"
                                title="Copy content"
                              >
                                {copiedKey === `msg-${i}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-xs">{msg.content}</pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {compilerActiveResultTab === "systemPrompt" && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(compiledResult.compiledSystemPrompt, "full-sys")}
                          className="absolute right-2 top-2 p-1 rounded bg-background/80 border border-border text-muted-foreground hover:text-foreground"
                          title="Copy Full System Prompt"
                        >
                          {copiedKey === "full-sys" ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <pre className="p-3 rounded-md bg-muted/40 border border-border/70 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                          {compiledResult.compiledSystemPrompt}
                        </pre>
                      </div>
                    )}

                    {compilerActiveResultTab === "variables" && (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-emerald-500">Applied Variables</Label>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {Object.entries(compiledResult.appliedVariables || {}).map(([k, v]) => (
                              <div
                                key={k}
                                className="flex justify-between items-center p-1.5 rounded bg-muted/40 text-xs font-mono"
                              >
                                <span className="font-semibold text-primary">{k}</span>
                                <span className="text-muted-foreground">{v}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {compiledResult.missingVariables && compiledResult.missingVariables.length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold text-rose-500">Missing Placeholders</Label>
                            <div className="flex flex-wrap gap-1">
                              {compiledResult.missingVariables.map((m) => (
                                <Badge key={m} variant="destructive" className="text-[10px]">
                                  {m}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Zap className="h-10 w-10 opacity-30 mb-2" />
                  <p className="text-xs font-semibold">Simulator Ready</p>
                  <p className="text-[11px] max-w-xs mt-0.5">
                    Click &quot;Synthesize & Compile Prompt&quot; to test persona assembly, dynamic variable replacement, and token consumption.
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* BOUND WEBHOOKS MODAL                                                      */}
      {/* ========================================================================= */}
      <Dialog open={webhooksModalOpen} onOpenChange={setWebhooksModalOpen}>
        <DialogContent className="max-w-md p-4 sm:p-5 border-border bg-card gap-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-primary" />
              Webhooks Bound to {selectedProfileForWebhooks?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              All Meta Messenger integrations using this persona for automatic prompt generation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {boundWebhooksLoading ? (
              <div className="py-8 flex justify-center text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : boundWebhooks.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No webhooks currently bound to this AI persona.
                <div className="mt-3">
                  <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                    <Link href="/dashboard/messenger">Manage Webhooks</Link>
                  </Button>
                </div>
              </div>
            ) : (
              boundWebhooks.map((hook) => (
                <div
                  key={hook.id}
                  className="p-2.5 rounded-md border border-border/70 bg-muted/20 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{hook.name}</h4>
                    <p className="text-[10px] text-muted-foreground">
                      {hook.pageName ? hook.pageName : hook.pageId ? `Page ID: ${hook.pageId}` : "No page linked"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge
                      className={cn(
                        "text-[10px]",
                        hook.isActive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {hook.isActive ? "Active" : "Disabled"}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Link href="/dashboard/messenger" title="Go to Webhook">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md p-4 sm:p-5 border-border bg-card gap-3">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete AI Persona
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete &quot;{profileToDelete?.name}&quot;? Any Messenger webhooks bound to this profile will fall back to your default profile.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={deleteLoading}
              onClick={handleDeleteProfile}
              className="h-8 text-xs"
            >
              {deleteLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
