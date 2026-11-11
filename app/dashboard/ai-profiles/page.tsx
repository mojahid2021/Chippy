"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Bot,
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Edit,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Star,
  Trash2,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
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
  { value: "ALL", label: "All categories" },
  { value: "customer-support", label: "Customer support" },
  { value: "sales", label: "Sales" },
  { value: "booking", label: "Bookings" },
  { value: "real-estate", label: "Real estate" },
  { value: "tech-support", label: "Tech support" },
  { value: "general", label: "General" },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "Bangla" },
  { value: "banglish", label: "Banglish (Bangla in English letters)" },
  { value: "auto", label: "Match the customer" },
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
  const [activeTab, setActiveTab] = useState<"identity" | "prompts" | "rules" | "knowledge" | "variables" | "examples" | "model">("identity")

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
        title: "Copied",
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
        title: "Couldn’t load assistants",
        description: "Check your connection and refresh.",
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
      category: "sales",
      tone: "friendly",
      style: "conversational",
      language: "auto",
      responseLength: "concise",
      systemPrompt: "You are the Messenger sales assistant for {{company_name}}. Answer questions about products, prices, sizes, and delivery. When a customer wants to buy, collect their name, phone number, and full address, then confirm the order.",
      mission: "Answer quickly and help the customer place an order.",
      fallbackResponse: "Ekjon team member ekhuni apnake janabe. Call korte paren {{support_phone}} e.",
      dos: [
        "Reply in the customer’s language: Bangla, Banglish, or English",
        "Show prices in {{currency}}",
        "Mention cash on delivery when talking about payment",
      ],
      donts: [
        "Promise a discount or free delivery that isn’t in your knowledge",
        "Confirm an order without a phone number and address",
      ],
      knowledgeSnippets: [
        {
          id: "delivery",
          title: "Delivery",
          content: "Inside Dhaka ৳60, 1–2 days. Outside Dhaka ৳120, 3–4 days. Cash on delivery available everywhere.",
          tags: ["delivery"],
        },
      ],
      referenceUrls: [],
      customVariables: [
        {
          key: "company_name",
          defaultValue: "My Shop",
          description: "Your shop’s name",
        },
        {
          key: "support_phone",
          defaultValue: "01XXXXXXXXX",
          description: "Phone number customers can call",
        },
        {
          key: "currency",
          defaultValue: "৳ (BDT)",
          description: "Currency for prices",
        },
      ],
      fewShotExamples: [
        {
          user: "XL ache? Price koto?",
          assistant: "Ji apu, XL ache! Price ৳1,850. Order korte apnar naam, phone number ar address diben?",
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
      tags: [],
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
        title: "Couldn’t open this assistant",
        description: "Refresh the page and try again.",
      })
    }
  }

  // Save AI Profile (Create or Update)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({
        variant: "destructive",
        title: "Name and role needed",
        description: "Add a name and a role for this assistant.",
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
          title: modalMode === "create" ? "Assistant created" : "Changes saved",
          description: `${json.data.name} is ready.`,
        })
        setIsModalOpen(false)
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t save",
          description: json.message || "Check the fields and try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn’t reach the server. Your changes are still here; try saving again.",
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
          title: "Default assistant updated",
          description: `${profile.name} now replies on pages without their own assistant.`,
        })
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t change the default",
          description: json.message || "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn’t reach the server. Try again in a moment.",
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
          title: newStatus ? "Assistant turned on" : "Assistant turned off",
          description: newStatus ? `${profile.name} can reply again.` : `${profile.name} won’t reply until you turn it back on.`,
        })
        setProfiles((prev) =>
          prev.map((item) => (item.id === profile.id ? { ...item, isActive: newStatus } : item))
        )
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Couldn’t change this assistant. Try again.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn’t reach the server. Try again in a moment.",
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
          title: "Assistant deleted",
          description: `${profileToDelete.name} was deleted.`,
        })
        setDeleteModalOpen(false)
        setProfileToDelete(null)
        await fetchProfiles(currentPage)
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t delete",
          description: "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn’t reach the server. Try again in a moment.",
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
    setCompilerUserPrompt("XL ache? Dhaka-r baire delivery charge koto?")
    setCompilerAdditionalContext("")
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
          title: "Preview ready",
          description: `About ${json.data.estimatedTokens.total} tokens.`,
        })
      } else {
        toast({
          variant: "destructive",
          title: "Couldn’t build the preview",
          description: json.message || "Try again in a moment.",
        })
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Couldn’t reach the server. Try again in a moment.",
      })
    } finally {
      setCompilerLoading(false)
    }
  }

  const defaultProfile = profiles.find((p) => p.isDefault)
  const filtersOn = !!searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL"
  const patch = (next: Partial<typeof formData>) => setFormData({ ...formData, ...next })
  const patchModel = (next: Partial<ModelConfig>) => setFormData({ ...formData, modelConfig: { ...formData.modelConfig, ...next } })

  const sections = [
    { id: "identity", label: "Basics", icon: Bot, count: null },
    { id: "prompts", label: "Instructions", icon: MessageSquare, count: null },
    { id: "rules", label: "Rules", icon: ShieldAlert, count: formData.dos.length + formData.donts.length },
    { id: "knowledge", label: "Knowledge", icon: BookOpen, count: formData.knowledgeSnippets.length + formData.referenceUrls.length },
    { id: "variables", label: "Variables", icon: Code2, count: formData.customVariables.length },
    { id: "examples", label: "Example replies", icon: Bookmark, count: formData.fewShotExamples.length },
    { id: "model", label: "AI model", icon: Cpu, count: null },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI assistants"
        description="Decide how Chippy talks, what it knows about your shop, and which AI model it uses. The default assistant replies on any page without its own."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => fetchProfiles(currentPage)} disabled={loading}>
              <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="size-3.5" />
              New assistant
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assistants"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search assistants"
          />
        </div>
        <NativeSelect value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="sm:w-48" aria-label="Category">
          {CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </NativeSelect>
        <div role="group" aria-label="Status" className="inline-flex rounded-lg bg-secondary p-0.5 text-sm">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((s) => (
            <button
              key={s}
              aria-pressed={statusFilter === s}
              onClick={() => setStatusFilter(s)}
              className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", statusFilter === s && "bg-card text-foreground shadow-xs")}
            >
              {s === "ALL" ? "All" : s === "ACTIVE" ? "On" : "Off"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border bg-muted" />
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <EmptyState
          icon={<Bot />}
          title={filtersOn ? "No assistants match" : "Create your first assistant"}
          body={
            filtersOn
              ? "Try a different search or clear the filters."
              : "Tell it about your shop and how to talk to customers. Then choose it on a Facebook page and it starts replying."
          }
          action={
            filtersOn ? (
              <Button variant="outline" onClick={() => { setSearchQuery(""); setCategoryFilter("ALL"); setStatusFilter("ALL") }}>Clear filters</Button>
            ) : (
              <Button onClick={handleOpenCreate}><Plus className="size-4" />New assistant</Button>
            )
          }
        />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {profiles.map((profile) => (
              <li
                key={profile.id}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-card p-4 shadow-xs transition-shadow hover:shadow-md",
                  profile.isDefault && "border-ink"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl font-display text-base font-bold",
                      profile.isDefault ? "bg-brand text-brand-foreground" : "bg-secondary"
                    )}
                    aria-hidden
                  >
                    {profile.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => handleOpenEdit(profile)} className="block max-w-full text-left after:absolute after:inset-0 after:rounded-2xl">
                      <h3 className="truncate text-base">{profile.name}</h3>
                    </button>
                    <p className="truncate text-xs text-muted-foreground">{profile.role}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-1">
                    <Switch
                      checked={profile.isActive}
                      onCheckedChange={(checked) => handleToggleActive(profile, checked)}
                      aria-label={profile.isActive ? `Turn off ${profile.name}` : `Turn on ${profile.name}`}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`More for ${profile.name}`}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => handleOpenEdit(profile)}><Edit className="mr-2 size-4" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCompiler(profile)}><Zap className="mr-2 size-4" />Test a message</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenBoundWebhooks(profile)}><MessageSquare className="mr-2 size-4" />Pages using it</DropdownMenuItem>
                        {!profile.isDefault && (
                          <DropdownMenuItem onClick={() => handleSetDefault(profile)}><Star className="mr-2 size-4" />Make default</DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => { setProfileToDelete(profile); setDeleteModalOpen(true) }}
                        >
                          <Trash2 className="mr-2 size-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {profile.description || "No description yet."}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.isDefault && <Badge variant="brand"><Star className="fill-current" />Default</Badge>}
                  {!profile.isActive && <Badge variant="secondary">Off</Badge>}
                  {profile.tone && <Badge variant="outline" className="capitalize">{profile.tone}</Badge>}
                  <Badge variant="outline">{profile.modelConfig?.modelName || "gpt-4o"}</Badge>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 border-t pt-3 text-center">
                  {[
                    ["Rules", (profile.dos?.length || 0) + (profile.donts?.length || 0)],
                    ["Facts", profile.knowledgeSnippets?.length || 0],
                    ["Variables", profile.customVariables?.length || 0],
                  ].map(([label, n]) => (
                    <div key={label as string}>
                      <dd className="font-display text-lg font-semibold">{n}</dd>
                      <dt className="text-2xs text-muted-foreground">{label}</dt>
                    </div>
                  ))}
                </dl>

                <Button
                  variant="secondary"
                  size="sm"
                  className="relative z-10 mt-3 w-full"
                  onClick={() => handleOpenCompiler(profile)}
                >
                  <Zap className="size-3.5" />
                  Test a message
                </Button>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              {totalCount || profiles.length} assistant{(totalCount || profiles.length) === 1 ? "" : "s"}
              {defaultProfile && <> · default is <span className="font-medium text-foreground">{defaultProfile.name}</span></>}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <span>Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="icon-sm" disabled={currentPage <= 1 || loading} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} aria-label="Previous page"><ChevronLeft /></Button>
                <Button variant="outline" size="icon-sm" disabled={currentPage >= totalPages || loading} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} aria-label="Next page"><ChevronRight /></Button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Editor ─────────────────────────────────────────── */}
      <Sheet open={isModalOpen} onOpenChange={setIsModalOpen}>
        <SheetContent
          side="right"
          title={modalMode === "create" ? "New assistant" : `Edit ${formData.name}`}
          className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
        >
          <form onSubmit={handleSaveProfile} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-6 py-5 pr-14">
              <h2 className="text-2xl">{modalMode === "create" ? "New assistant" : formData.name || "Edit assistant"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Changes apply to every page that uses this assistant.</p>
            </div>

            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              <nav aria-label="Assistant settings" className="flex shrink-0 gap-1 overflow-x-auto border-b px-4 py-2 sm:w-48 sm:flex-col sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveTab(s.id)}
                    aria-current={activeTab === s.id ? "step" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground",
                      activeTab === s.id && "bg-brand text-brand-foreground hover:bg-brand"
                    )}
                  >
                    <s.icon className="size-4" />
                    <span className="flex-1 text-left">{s.label}</span>
                    {!!s.count && <span className="text-2xs tabular-nums opacity-70">{s.count}</span>}
                  </button>
                ))}
              </nav>

              <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {activeTab === "identity" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Name" required>
                        <Input placeholder="e.g. Chippy for Nakshi Threads" value={formData.name} onChange={(e) => patch({ name: e.target.value })} required />
                      </Field>
                      <Field label="Role" required hint="Shown to you, and used in the AI’s instructions.">
                        <Input placeholder="e.g. Sales assistant" value={formData.role} onChange={(e) => patch({ role: e.target.value })} required />
                      </Field>
                    </div>
                    <Field label="Description">
                      <Textarea rows={2} placeholder="What this assistant is for, in a sentence." value={formData.description} onChange={(e) => patch({ description: e.target.value })} />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Category">
                        <NativeSelect value={formData.category} onChange={(e) => patch({ category: e.target.value })}>
                          {CATEGORIES.filter((c) => c.value !== "ALL").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </NativeSelect>
                      </Field>
                      <Field label="Reply language">
                        <NativeSelect value={formData.language} onChange={(e) => patch({ language: e.target.value })}>
                          {LANGUAGES.some((l) => l.value === formData.language) ? null : <option value={formData.language}>{formData.language}</option>}
                          {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </NativeSelect>
                      </Field>
                      <Field label="Tone" hint="e.g. friendly, polite, playful">
                        <Input value={formData.tone} onChange={(e) => patch({ tone: e.target.value })} />
                      </Field>
                      <Field label="Style" hint="e.g. conversational, short and direct">
                        <Input value={formData.style} onChange={(e) => patch({ style: e.target.value })} />
                      </Field>
                    </div>
                    <div className="space-y-1.5">
                      <p id="reply-length" className="text-sm font-medium">Reply length</p>
                      <div role="radiogroup" aria-labelledby="reply-length" className="grid grid-cols-3 gap-2">
                        {(["concise", "balanced", "detailed"] as const).map((len) => (
                          <button
                            key={len}
                            type="button"
                            role="radio"
                            aria-checked={formData.responseLength === len}
                            onClick={() => patch({ responseLength: len })}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-left text-sm",
                              formData.responseLength === len ? "border-ink bg-brand-soft" : "hover:border-input"
                            )}
                          >
                            <span className="block font-medium capitalize">{len === "concise" ? "Short" : len === "balanced" ? "Medium" : "Detailed"}</span>
                            <span className="block text-xs text-muted-foreground">{len === "concise" ? "1–2 lines" : len === "balanced" ? "A short paragraph" : "Full explanations"}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="divide-y rounded-xl border">
                      <ToggleRow label="Turned on" hint="When off, this assistant never replies." checked={formData.isActive} onChange={(v) => patch({ isActive: v })} />
                      <ToggleRow label="Default assistant" hint="Replies on pages that don’t have their own assistant." checked={formData.isDefault} onChange={(v) => patch({ isDefault: v })} />
                    </div>
                  </>
                )}

                {activeTab === "prompts" && (
                  <>
                    <Field label="Main instructions" hint="Tell it who it is, what your shop sells, and how to handle orders. Use {{variable}} for values you set under Variables.">
                      <Textarea rows={9} className="font-mono text-sm" value={formData.systemPrompt} onChange={(e) => patch({ systemPrompt: e.target.value })} placeholder="You are the sales assistant for {{company_name}}…" />
                    </Field>
                    <Field label="Goal" hint="One line on what a good conversation achieves.">
                      <Input value={formData.mission} onChange={(e) => patch({ mission: e.target.value })} placeholder="Answer quickly and help the customer place an order." />
                    </Field>
                    <Field label="When it doesn’t know" hint="Sent when the answer isn’t in its instructions or knowledge.">
                      <Textarea rows={3} value={formData.fallbackResponse} onChange={(e) => patch({ fallbackResponse: e.target.value })} placeholder="Ekjon team member ekhuni apnake janabe." />
                    </Field>
                  </>
                )}

                {activeTab === "rules" && (
                  <div className="grid gap-5 lg:grid-cols-2">
                    <RuleList
                      title="Always"
                      tone="success"
                      items={formData.dos}
                      draft={newDo}
                      setDraft={setNewDo}
                      placeholder="e.g. Mention cash on delivery"
                      onAdd={() => { if (newDo.trim()) { patch({ dos: [...formData.dos, newDo.trim()] }); setNewDo("") } }}
                      onRemove={(i) => patch({ dos: formData.dos.filter((_, j) => j !== i) })}
                    />
                    <RuleList
                      title="Never"
                      tone="destructive"
                      items={formData.donts}
                      draft={newDont}
                      setDraft={setNewDont}
                      placeholder="e.g. Promise a discount"
                      onAdd={() => { if (newDont.trim()) { patch({ donts: [...formData.donts, newDont.trim()] }); setNewDont("") } }}
                      onRemove={(i) => patch({ donts: formData.donts.filter((_, j) => j !== i) })}
                    />
                  </div>
                )}

                {activeTab === "knowledge" && (
                  <>
                    <SectionHead
                      title="Facts about your shop"
                      hint="Delivery charges, return policy, sizes. The assistant looks here before answering."
                      onAdd={() => patch({ knowledgeSnippets: [...formData.knowledgeSnippets, { id: `snippet-${Date.now()}`, title: "", content: "", tags: [] }] })}
                      addLabel="Add fact"
                    />
                    {formData.knowledgeSnippets.length === 0 && <Hint>No facts yet.</Hint>}
                    {formData.knowledgeSnippets.map((snip, i) => (
                      <div key={snip.id} className="space-y-2 rounded-xl border p-3">
                        <div className="flex gap-2">
                          <Input placeholder="Title, e.g. Delivery charges" value={snip.title} aria-label="Fact title"
                            onChange={(e) => patch({ knowledgeSnippets: formData.knowledgeSnippets.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)) })} />
                          <RemoveButton label="Remove fact" onClick={() => patch({ knowledgeSnippets: formData.knowledgeSnippets.filter((_, j) => j !== i) })} />
                        </div>
                        <Textarea rows={3} placeholder="Inside Dhaka ৳60, outside Dhaka ৳120. 2–4 days." value={snip.content} aria-label="Fact details"
                          onChange={(e) => patch({ knowledgeSnippets: formData.knowledgeSnippets.map((s, j) => (j === i ? { ...s, content: e.target.value } : s)) })} />
                      </div>
                    ))}

                    <SectionHead
                      title="Links"
                      hint="Pages the assistant can share, like your size chart or website."
                      onAdd={() => patch({ referenceUrls: [...formData.referenceUrls, { title: "", url: "", description: "" }] })}
                      addLabel="Add link"
                    />
                    {formData.referenceUrls.length === 0 && <Hint>No links yet.</Hint>}
                    {formData.referenceUrls.map((ref, i) => (
                      <div key={i} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1.4fr_auto]">
                        <Input placeholder="Title" value={ref.title} aria-label="Link title"
                          onChange={(e) => patch({ referenceUrls: formData.referenceUrls.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)) })} />
                        <Input type="url" placeholder="https://" value={ref.url} aria-label="Link address"
                          onChange={(e) => patch({ referenceUrls: formData.referenceUrls.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)) })} />
                        <RemoveButton label="Remove link" onClick={() => patch({ referenceUrls: formData.referenceUrls.filter((_, j) => j !== i) })} />
                      </div>
                    ))}
                  </>
                )}

                {activeTab === "variables" && (
                  <>
                    <SectionHead
                      title="Variables"
                      hint={<>Reusable values like your shop name or phone number. Write <code className="rounded bg-secondary px-1 font-mono text-xs">{"{{key}}"}</code> in instructions and rules to use them.</>}
                      onAdd={() => patch({ customVariables: [...formData.customVariables, { key: "", defaultValue: "", description: "" }] })}
                      addLabel="Add variable"
                    />
                    {formData.customVariables.length === 0 && <Hint>No variables yet.</Hint>}
                    {formData.customVariables.length > 0 && (
                      <div className="overflow-hidden rounded-xl border">
                        <div className="hidden grid-cols-[1fr_1.3fr_auto] gap-2 border-b bg-muted px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
                          <span>Key</span><span>Value</span><span className="w-8" />
                        </div>
                        {formData.customVariables.map((v, i) => (
                          <div key={i} className="grid gap-2 border-b p-3 last:border-0 sm:grid-cols-[1fr_1.3fr_auto]">
                            <Input className="font-mono text-sm" placeholder="shop_phone" value={v.key} aria-label="Variable key"
                              onChange={(e) => patch({ customVariables: formData.customVariables.map((c, j) => (j === i ? { ...c, key: e.target.value.replace(/\s+/g, "_") } : c)) })} />
                            <Input placeholder="01712-345678" value={v.defaultValue} aria-label="Variable value"
                              onChange={(e) => patch({ customVariables: formData.customVariables.map((c, j) => (j === i ? { ...c, defaultValue: e.target.value } : c)) })} />
                            <RemoveButton label="Remove variable" onClick={() => patch({ customVariables: formData.customVariables.filter((_, j) => j !== i) })} />
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "examples" && (
                  <>
                    <SectionHead
                      title="Example replies"
                      hint="Show it how you’d answer. A few good examples teach tone better than long instructions."
                      onAdd={() => patch({ fewShotExamples: [...formData.fewShotExamples, { user: "", assistant: "" }] })}
                      addLabel="Add example"
                    />
                    {formData.fewShotExamples.length === 0 && <Hint>No examples yet.</Hint>}
                    {formData.fewShotExamples.map((ex, i) => (
                      <div key={i} className="space-y-2 rounded-xl border bg-muted/40 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Example {i + 1}</span>
                          <RemoveButton label="Remove example" onClick={() => patch({ fewShotExamples: formData.fewShotExamples.filter((_, j) => j !== i) })} />
                        </div>
                        <Textarea rows={2} placeholder="Customer: XL ache?" value={ex.user} aria-label="Customer message" className="rounded-2xl rounded-bl-md"
                          onChange={(e) => patch({ fewShotExamples: formData.fewShotExamples.map((x, j) => (j === i ? { ...x, user: e.target.value } : x)) })} />
                        <Textarea rows={2} placeholder="Reply: Ji apu, XL ache!" value={ex.assistant} aria-label="Assistant reply" className="ml-auto w-[92%] rounded-2xl rounded-br-md border-ink bg-ink text-white placeholder:text-white/50"
                          onChange={(e) => patch({ fewShotExamples: formData.fewShotExamples.map((x, j) => (j === i ? { ...x, assistant: e.target.value } : x)) })} />
                      </div>
                    ))}
                  </>
                )}

                {activeTab === "model" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Provider">
                        <NativeSelect value={formData.modelConfig.provider} onChange={(e) => patchModel({ provider: e.target.value })}>
                          {LLM_PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </NativeSelect>
                      </Field>
                      <Field label="Model">
                        <Input className="font-mono text-sm" placeholder="gpt-4o" value={formData.modelConfig.modelName} onChange={(e) => patchModel({ modelName: e.target.value })} />
                      </Field>
                    </div>
                    <Field label={`Creativity · ${formData.modelConfig.temperature ?? 0.7}`} hint="Lower is more predictable. 0.3–0.7 works well for sales.">
                      <input type="range" min={0} max={2} step={0.05} value={formData.modelConfig.temperature ?? 0.7}
                        onChange={(e) => patchModel({ temperature: parseFloat(e.target.value) })} className="w-full accent-ink" />
                    </Field>
                    <details className="group rounded-xl border">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                        Advanced
                        <ChevronRight className="size-4 transition-transform group-open:rotate-90" />
                      </summary>
                      <div className="grid gap-4 border-t p-4 sm:grid-cols-3">
                        <Field label="Top P">
                          <Input type="number" step="0.05" min="0" max="1" value={formData.modelConfig.topP ?? 1} onChange={(e) => patchModel({ topP: parseFloat(e.target.value) })} />
                        </Field>
                        <Field label="Max reply tokens">
                          <Input type="number" step="128" min="128" max="32768" value={formData.modelConfig.maxTokens ?? 2048} onChange={(e) => patchModel({ maxTokens: parseInt(e.target.value) })} />
                        </Field>
                        <Field label="Reply format">
                          <NativeSelect value={formData.modelConfig.responseFormat ?? "text"} onChange={(e) => patchModel({ responseFormat: e.target.value })}>
                            <option value="text">Plain text</option>
                            <option value="json_object">JSON</option>
                          </NativeSelect>
                        </Field>
                      </div>
                    </details>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t bg-card px-6 py-3">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveLoading}>
                {saveLoading && <RefreshCw className="animate-spin" />}
                {modalMode === "create" ? "Create assistant" : "Save changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Test a message ─────────────────────────────────── */}
      <Sheet open={compilerModalOpen} onOpenChange={setCompilerModalOpen}>
        <SheetContent side="right" title={`Test ${compilerProfile?.name ?? "assistant"}`} className="flex w-full flex-col gap-0 p-0 sm:max-w-4xl">
          <div className="border-b px-6 py-5 pr-14">
            <h2 className="text-2xl">Test {compilerProfile?.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">See exactly what the AI receives for a customer message. Nothing is sent to anyone.</p>
          </div>
          <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[1fr_1.2fr] lg:overflow-hidden">
            <form onSubmit={handleRunCompiler} className="custom-scrollbar space-y-4 border-b p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r">
              <Field label="Customer message" required>
                <Textarea rows={3} value={compilerUserPrompt} onChange={(e) => setCompilerUserPrompt(e.target.value)} required />
              </Field>
              <Field label="Extra context" hint="Anything the bot would know about this chat, like the product they tapped.">
                <Input value={compilerAdditionalContext} onChange={(e) => setCompilerAdditionalContext(e.target.value)} />
              </Field>
              <div className="rounded-xl border">
                <ToggleRow label="Include example replies" hint="Adds your examples before the message." checked={compilerIncludeFewShot} onChange={setCompilerIncludeFewShot} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Variables</p>
                {Object.keys(compilerVariables).length === 0 ? (
                  <Hint>This assistant has no variables.</Hint>
                ) : (
                  Object.entries(compilerVariables).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-[8rem_1fr] items-center gap-2">
                      <code className="truncate font-mono text-xs text-muted-foreground">{key}</code>
                      <Input value={val} aria-label={key} onChange={(e) => setCompilerVariables({ ...compilerVariables, [key]: e.target.value })} />
                    </div>
                  ))
                )}
              </div>
              <Button type="submit" className="w-full" disabled={compilerLoading}>
                {compilerLoading ? <RefreshCw className="animate-spin" /> : <Send />}
                Build preview
              </Button>
            </form>

            <div className="flex min-h-[380px] flex-col bg-muted/40 lg:min-h-0">
              {compiledResult ? (
                <>
                  <div className="flex items-center justify-between gap-2 border-b bg-card px-4 py-2">
                    <div role="tablist" className="flex gap-1 text-sm">
                      {([
                        ["messages", `Conversation (${compiledResult.messages.length})`],
                        ["systemPrompt", "Full instructions"],
                        ["variables", "Variables"],
                      ] as const).map(([id, label]) => (
                        <button key={id} role="tab" aria-selected={compilerActiveResultTab === id} onClick={() => setCompilerActiveResultTab(id)}
                          className={cn("rounded-md px-2.5 py-1 font-medium text-muted-foreground", compilerActiveResultTab === id && "bg-secondary text-foreground")}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <Badge variant="outline" className="font-mono">{compiledResult.estimatedTokens.total} tokens</Badge>
                  </div>
                  <div className="custom-scrollbar flex-1 overflow-y-auto p-4">
                    {compilerActiveResultTab === "messages" && (
                      <div className="flex flex-col gap-2">
                        {compiledResult.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={cn(
                              "group relative max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm",
                              msg.role === "system" && "max-w-full border border-dashed bg-card text-muted-foreground",
                              msg.role === "user" && "self-start rounded-bl-md border bg-card",
                              msg.role === "assistant" && "self-end rounded-br-md bg-ink text-white"
                            )}
                          >
                            <div className="mb-1 flex items-center justify-between gap-3 text-2xs font-medium opacity-70">
                              {msg.role === "system" ? "Instructions" : msg.role === "user" ? "Customer" : "Assistant"}
                              <button type="button" onClick={() => copyToClipboard(msg.content, `msg-${i}`)} aria-label="Copy">
                                {copiedKey === `msg-${i}` ? <Check className="size-3" /> : <Copy className="size-3" />}
                              </button>
                            </div>
                            <p className={cn("whitespace-pre-wrap", msg.role === "system" && "line-clamp-6 font-mono text-xs")}>{msg.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {compilerActiveResultTab === "systemPrompt" && (
                      <div className="relative">
                        <Button type="button" variant="outline" size="sm" className="absolute right-2 top-2" onClick={() => copyToClipboard(compiledResult.compiledSystemPrompt, "full-sys")}>
                          {copiedKey === "full-sys" ? <Check /> : <Copy />} Copy
                        </Button>
                        <pre className="whitespace-pre-wrap rounded-xl border bg-card p-4 pt-12 font-mono text-xs leading-relaxed">{compiledResult.compiledSystemPrompt}</pre>
                      </div>
                    )}
                    {compilerActiveResultTab === "variables" && (
                      <div className="space-y-4">
                        <dl className="divide-y rounded-xl border bg-card">
                          {Object.entries(compiledResult.appliedVariables || {}).map(([k, v]) => (
                            <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-3 py-2 text-sm">
                              <dt className="truncate font-mono text-xs text-muted-foreground">{k}</dt>
                              <dd className="truncate">{v}</dd>
                            </div>
                          ))}
                          {Object.keys(compiledResult.appliedVariables || {}).length === 0 && <p className="p-3 text-sm text-muted-foreground">No variables used.</p>}
                        </dl>
                        {compiledResult.missingVariables?.length > 0 && (
                          <div className="rounded-xl bg-destructive-soft p-3 text-sm text-destructive">
                            <p className="font-medium">Missing values</p>
                            <p className="mt-1 text-xs">These are used in the instructions but have no value: {compiledResult.missingVariables.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="m-auto max-w-[32ch] p-6 text-center text-sm text-muted-foreground">
                  <Zap className="mx-auto mb-3 size-6" />
                  Write a customer message and press Build preview to see the full conversation the AI receives.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Pages using this assistant ─────────────────────── */}
      <Dialog open={webhooksModalOpen} onOpenChange={setWebhooksModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pages using {selectedProfileForWebhooks?.name}</DialogTitle>
            <DialogDescription>Pages without their own assistant use the default one.</DialogDescription>
          </DialogHeader>
          {boundWebhooksLoading ? (
            <div className="flex justify-center py-8"><RefreshCw className="size-5 animate-spin text-muted-foreground" /></div>
          ) : boundWebhooks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No page uses this assistant yet.
              <Button asChild variant="outline" size="sm" className="mt-3"><Link href="/dashboard/messenger">Choose it on a page</Link></Button>
            </div>
          ) : (
            <ul className="divide-y rounded-xl border">
              {boundWebhooks.map((hook) => (
                <li key={hook.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{hook.pageName || hook.name}</p>
                    <p className="text-xs text-muted-foreground">{hook.isActive ? "Replying" : "Paused"}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/messenger/${hook.id}/inbox`}>Open inbox</Link></Button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete ─────────────────────────────────────────── */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {profileToDelete?.name}?</DialogTitle>
            <DialogDescription>
              This can’t be undone. Pages using it will switch to your default assistant{profileToDelete?.isDefault ? ", and you’ll need to choose a new default" : ""}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteModalOpen(false)}>Keep it</Button>
            <Button variant="destructive" onClick={handleDeleteProfile} disabled={deleteLoading}>
              {deleteLoading && <RefreshCw className="animate-spin" />}
              Delete assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, hint, required, children }: { label: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-muted-foreground"> *</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

function SectionHead({ title, hint, onAdd, addLabel }: { title: string; hint?: React.ReactNode; onAdd: () => void; addLabel: string }) {
  return (
    <div className="flex items-end justify-between gap-4 pt-1">
      <div>
        <h3 className="text-base">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="size-3.5" />{addLabel}</Button>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">{children}</p>
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-sm" onClick={onClick} aria-label={label} className="shrink-0 hover:text-destructive">
      <Trash2 />
    </Button>
  )
}

function RuleList({
  title, tone, items, draft, setDraft, placeholder, onAdd, onRemove,
}: {
  title: string
  tone: "success" | "destructive"
  items: string[]
  draft: string
  setDraft: (v: string) => void
  placeholder: string
  onAdd: () => void
  onRemove: (i: number) => void
}) {
  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 text-base">
        <span className={cn("size-2 rounded-full", tone === "success" ? "bg-success" : "bg-destructive")} />
        {title}
      </h3>
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          aria-label={`Add “${title}” rule`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd() } }}
        />
        <Button type="button" variant="outline" size="icon" onClick={onAdd} aria-label="Add rule"><Plus /></Button>
      </div>
      {items.length === 0 ? (
        <Hint>No rules yet.</Hint>
      ) : (
        <ul className="divide-y rounded-xl border">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 py-1.5 pl-3 pr-1.5 text-sm">
              <span className="flex-1 py-1">{item}</span>
              <RemoveButton label="Remove rule" onClick={() => onRemove(i)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
