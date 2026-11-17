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
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  Layers,
  Loader2,
  MessageSquare,
  MessageSquareQuote,
  MoreHorizontal,
  Phone,
  Play,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PageHeader, EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type {
  AiProfile,
  AiProfilesResponse,
  CompilePromptResponse,
  MessengerWebhook,
  SubAgentProfile,
  SubAgentCapabilities,
  SimulateRoutingResponse,
} from "@/lib/types/woombat"

import { CATEGORIES, Field, ToggleRow, Hint } from "./assistant-editor"

export default function AiProfilesPage() {
  const [profiles, setProfiles] = useState<AiProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [tagFilter, setTagFilter] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [profileToDelete, setProfileToDelete] = useState<AiProfile | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Bound Webhooks State
  const [webhooksModalOpen, setWebhooksModalOpen] = useState(false)
  const [boundWebhooks, setBoundWebhooks] = useState<MessengerWebhook[]>([])
  const [boundInstagramWebhooks, setBoundInstagramWebhooks] = useState<Array<{ id: string; name: string; username?: string | null; isActive: boolean }>>([])
  const [boundWhatsAppWebhooks, setBoundWhatsAppWebhooks] = useState<Array<{ id: string; name: string; displayPhoneNumber?: string | null; verifiedName?: string | null; isActive: boolean }>>([])
  const [boundFacebookFeedWebhooks, setBoundFacebookFeedWebhooks] = useState<Array<{ id: string; name: string; pageName?: string | null; replyMode?: string; autoReply?: boolean; isActive: boolean }>>([])
  const [boundWebhooksLoading, setBoundWebhooksLoading] = useState(false)
  const [selectedProfileForWebhooks, setSelectedProfileForWebhooks] = useState<AiProfile | null>(null)

  // Prompt Compiler Playground State
  const [compilerModalOpen, setCompilerModalOpen] = useState(false)
  const [compilerProfile, setCompilerProfile] = useState<AiProfile | null>(null)
  const [compilerUserPrompt, setCompilerUserPrompt] = useState("")
  const [compilerAdditionalContext, setCompilerAdditionalContext] = useState("")
  const [compilerIncludeFewShot, setCompilerIncludeFewShot] = useState(true)
  const [compilerHumanize, setCompilerHumanize] = useState(true)
  const [compilerVariables, setCompilerVariables] = useState<Record<string, string>>({})
  const [compilerLoading, setCompilerLoading] = useState(false)
  const [compiledResult, setCompiledResult] = useState<CompilePromptResponse["data"] | null>(null)
  const [compilerActiveResultTab, setCompilerActiveResultTab] = useState<"messages" | "systemPrompt" | "variables">("messages")

  // Sub-Agents / Specialist Team State (Live Woombat API)
  const [subAgentsSheetOpen, setSubAgentsSheetOpen] = useState(false)
  const [selectedProfileForSubAgents, setSelectedProfileForSubAgents] = useState<AiProfile | null>(null)
  const [subAgentsList, setSubAgentsList] = useState<SubAgentProfile[]>([])
  const [subAgentsLoading, setSubAgentsLoading] = useState(false)
  const [autoProvisioning, setAutoProvisioning] = useState(false)
  const [subAgentModalOpen, setSubAgentModalOpen] = useState(false)
  const [editingSubAgent, setEditingSubAgent] = useState<SubAgentProfile | null>(null)
  const [subAgentForm, setSubAgentForm] = useState({
    name: "",
    role: "",
    category: "shopping",
    speciality: "shopping",
    triggerKeywordsText: "",
    priority: 20,
    systemPrompt: "",
    isActive: true,
    capabilities: {
      productSearch: true,
      visualSearch: true,
      orderTracking: false,
      inventoryCheck: true,
      cartAssistance: true,
      humanHandoff: true,
    } as SubAgentCapabilities,
  })

  // Routing Simulator Sandbox State (POST /api/v1/ai-profiles/:id/sub-profiles/simulate-routing)
  const [routingPrompt, setRoutingPrompt] = useState("")
  const [routingHasImages, setRoutingHasImages] = useState(false)
  const [routingSimulating, setRoutingSimulating] = useState(false)
  const [routingResult, setRoutingResult] = useState<SimulateRoutingResponse["data"] | null>(null)

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
      if (tagFilter.trim()) params.append("tag", tagFilter.trim())

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
  }, [searchQuery, categoryFilter, statusFilter, tagFilter])

  useEffect(() => {
    fetchProfiles(currentPage)
  }, [fetchProfiles, currentPage])

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

      const [fbRes, igRes, waRes, feedRes] = await Promise.all([
        fetch(`/api/v1/ai-profiles/${profile.id}/webhooks`),
        fetch(`/api/v1/ai-profiles/${profile.id}/webhooks/instagram`),
        fetch(`/api/v1/ai-profiles/${profile.id}/webhooks/whatsapp`),
        fetch(`/api/v1/ai-profiles/${profile.id}/webhooks/facebook-feed`),
      ])

      const [fbJson, igJson, waJson, feedJson] = await Promise.all([
        fbRes.json().catch(() => null),
        igRes.json().catch(() => null),
        waRes.json().catch(() => null),
        feedRes.json().catch(() => null),
      ])

      setBoundWebhooks(Array.isArray(fbJson?.data) ? fbJson.data : [])
      setBoundInstagramWebhooks(Array.isArray(igJson?.data) ? igJson.data : [])
      setBoundWhatsAppWebhooks(Array.isArray(waJson?.data) ? waJson.data : [])
      setBoundFacebookFeedWebhooks(Array.isArray(feedJson?.data) ? feedJson.data : [])
    } catch (err) {
      console.error("Failed to load bound webhooks:", err)
      setBoundWebhooks([])
      setBoundInstagramWebhooks([])
      setBoundWhatsAppWebhooks([])
      setBoundFacebookFeedWebhooks([])
    } finally {
      setBoundWebhooksLoading(false)
    }
  }

  // Open Prompt Compiler Playground
  const handleOpenCompiler = (profile: AiProfile) => {
    setCompilerProfile(profile)
    setCompilerUserPrompt("")
    setCompilerAdditionalContext("")
    setCompilerIncludeFewShot(true)
    setCompilerHumanize(true)

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
          humanize: compilerHumanize,
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

  // ── Specialist Sub-Agents Handlers (GET/POST/PATCH/DELETE) ────────────────
  const loadSubAgentsForProfile = useCallback(async (profileId: string) => {
    setSubAgentsLoading(true)
    try {
      const res = await fetch(`/api/v1/ai-profiles/${encodeURIComponent(profileId)}/sub-profiles`)
      const json = await res.json()
      if (res.ok && json.data?.subAgents) {
        setSubAgentsList(json.data.subAgents)
      } else {
        setSubAgentsList([])
      }
    } catch {
      setSubAgentsList([])
    } finally {
      setSubAgentsLoading(false)
    }
  }, [])

  const handleOpenSubAgents = (profile: AiProfile) => {
    setSelectedProfileForSubAgents(profile)
    setRoutingResult(null)
    setRoutingPrompt("")
    setSubAgentsSheetOpen(true)
    void loadSubAgentsForProfile(profile.id)
  }

  const handleAutoProvisionSubAgents = async () => {
    if (!selectedProfileForSubAgents) return
    setAutoProvisioning(true)
    try {
      const res = await fetch(`/api/v1/ai-profiles/${encodeURIComponent(selectedProfileForSubAgents.id)}/sub-profiles/auto-provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ industryPack: "ECOMMERCE_RETAIL" }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({
          variant: "success",
          title: "Specialist Team Provisioned",
          description: "Standard retail specialists have been provisioned successfully.",
        })
        await loadSubAgentsForProfile(selectedProfileForSubAgents.id)
      } else {
        toast({ variant: "destructive", title: "Provision failed", description: json.message })
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" })
    } finally {
      setAutoProvisioning(false)
    }
  }

  const handleSaveSubAgentModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProfileForSubAgents) return
    if (!subAgentForm.name.trim() || !subAgentForm.role.trim()) {
      toast({ variant: "destructive", title: "Name and role required" })
      return
    }

    const triggerKeywords = subAgentForm.triggerKeywordsText
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean)

    const payload = {
      name: subAgentForm.name,
      role: subAgentForm.role,
      category: subAgentForm.category,
      systemPrompt: subAgentForm.systemPrompt,
      capabilities: subAgentForm.capabilities,
      subAgentConfig: {
        speciality: subAgentForm.speciality,
        triggerKeywords,
        priority: Number(subAgentForm.priority) || 10,
        autoDelegate: true,
      },
      isActive: subAgentForm.isActive,
    }

    try {
      const url = editingSubAgent
        ? `/api/v1/ai-profiles/${encodeURIComponent(selectedProfileForSubAgents.id)}/sub-profiles/${editingSubAgent.id}`
        : `/api/v1/ai-profiles/${encodeURIComponent(selectedProfileForSubAgents.id)}/sub-profiles`
      const method = editingSubAgent ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok) {
        toast({
          variant: "success",
          title: editingSubAgent ? "Specialist Updated" : "Specialist Created",
          description: `${subAgentForm.name} saved successfully.`,
        })
        setSubAgentModalOpen(false)
        await loadSubAgentsForProfile(selectedProfileForSubAgents.id)
      } else {
        toast({ variant: "destructive", title: "Failed to save specialist", description: json.message })
      }
    } catch {
      toast({ variant: "destructive", title: "Network error" })
    }
  }

  const handleDeleteSubAgentModal = async (subId: string) => {
    if (!selectedProfileForSubAgents) return
    try {
      const res = await fetch(`/api/v1/ai-profiles/${encodeURIComponent(selectedProfileForSubAgents.id)}/sub-profiles/${subId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast({ variant: "success", title: "Specialist removed" })
        setSubAgentsList((prev) => prev.filter((a) => a.id !== subId))
      } else {
        const json = await res.json().catch(() => null)
        toast({ variant: "destructive", title: "Delete failed", description: json?.message })
      }
    } catch {
      toast({ variant: "destructive", title: "Delete failed" })
    }
  }

  const handleSimulateRoutingModal = async () => {
    if (!selectedProfileForSubAgents || !routingPrompt.trim()) return
    setRoutingSimulating(true)
    try {
      const res = await fetch(`/api/v1/ai-profiles/${encodeURIComponent(selectedProfileForSubAgents.id)}/sub-profiles/simulate-routing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: routingPrompt,
          hasImages: routingHasImages,
        }),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setRoutingResult(json.data)
        toast({
          variant: "success",
          title: "Simulation evaluated",
          description: `Assigned to ${json.data.selectedProfileName} (${(json.data.confidenceScore * 100).toFixed(0)}% confidence).`,
        })
      } else {
        toast({ variant: "destructive", title: "Simulation failed", description: json.message })
      }
    } catch {
      toast({ variant: "destructive", title: "Simulation error" })
    } finally {
      setRoutingSimulating(false)
    }
  }

  const defaultProfile = profiles.find((p) => p.isDefault)
  const filtersOn = !!searchQuery || categoryFilter !== "ALL" || statusFilter !== "ALL" || !!tagFilter

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
            <Button asChild size="sm">
              <Link href="/dashboard/ai-profiles/new"><Plus className="size-3.5" />New assistant</Link>
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

      {tagFilter && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtered by tag:</span>
          <Badge variant="secondary" className="flex items-center gap-1 font-mono text-xs">
            #{tagFilter}
            <button type="button" onClick={() => setTagFilter("")} className="hover:text-foreground" aria-label="Clear tag filter">
              <X className="size-3" />
            </button>
          </Badge>
        </div>
      )}

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
              <Button asChild><Link href="/dashboard/ai-profiles/new"><Plus className="size-4" />New assistant</Link></Button>
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
                  {profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar} alt="" className="size-10 shrink-0 rounded-xl border object-cover" />
                  ) : (
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl font-display text-base font-bold",
                        profile.isDefault ? "bg-brand text-brand-foreground" : "bg-secondary"
                      )}
                      aria-hidden
                    >
                      {profile.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/dashboard/ai-profiles/${profile.id}`} className="block max-w-full text-left after:absolute after:inset-0 after:rounded-2xl">
                      <h3 className="truncate text-base">{profile.name}</h3>
                    </Link>
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
                        <DropdownMenuItem asChild><Link href={`/dashboard/ai-profiles/${profile.id}`}><Edit className="mr-2 size-4" />Edit</Link></DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenSubAgents(profile)}><Users className="mr-2 size-4" />Specialist team</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenCompiler(profile)}><Zap className="mr-2 size-4" />Test a message</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenBoundWebhooks(profile)}><MessageSquare className="mr-2 size-4" />Connected channels</DropdownMenuItem>
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

                {profile.tags && profile.tags.length > 0 && (
                  <div className="relative z-10 mt-2 flex flex-wrap gap-1">
                    {profile.tags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTagFilter(tagFilter === t ? "" : t)
                        }}
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 text-2xs font-medium transition-colors",
                          tagFilter === t ? "border-ink bg-ink text-white" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                )}

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

                <div className="relative z-10 mt-3 flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1 text-xs font-medium"
                    onClick={() => handleOpenSubAgents(profile)}
                  >
                    <Users className="mr-1.5 size-3.5 text-brand" />
                    Specialists
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-medium"
                    onClick={() => handleOpenCompiler(profile)}
                  >
                    <Zap className="mr-1.5 size-3.5" />
                    Test message
                  </Button>
                </div>
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
                <Textarea rows={3} placeholder="Type a customer message to preview prompt compilation..." value={compilerUserPrompt} onChange={(e) => setCompilerUserPrompt(e.target.value)} required />
              </Field>
              <Field label="Extra context" hint="Anything the bot would know about this chat, like the product they tapped.">
                <Input value={compilerAdditionalContext} onChange={(e) => setCompilerAdditionalContext(e.target.value)} />
              </Field>
              <div className="divide-y rounded-xl border">
                <ToggleRow label="Include example replies" hint="Adds your examples before the message." checked={compilerIncludeFewShot} onChange={setCompilerIncludeFewShot} />
                <ToggleRow label="Humanize behavioral directives" hint="Injects natural conversational directives into instructions." checked={compilerHumanize} onChange={setCompilerHumanize} />
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

      {/* ── Connected Channels Modal ───────────────────────── */}
      <Dialog open={webhooksModalOpen} onOpenChange={setWebhooksModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Channels using {selectedProfileForWebhooks?.name}</DialogTitle>
            <DialogDescription>Messenger, Facebook Feed, Instagram, and WhatsApp channels bound to this assistant.</DialogDescription>
          </DialogHeader>
          {boundWebhooksLoading ? (
            <div className="flex justify-center py-8"><RefreshCw className="size-5 animate-spin text-muted-foreground" /></div>
          ) : boundWebhooks.length === 0 && boundInstagramWebhooks.length === 0 && boundWhatsAppWebhooks.length === 0 && boundFacebookFeedWebhooks.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              <p>No channels use this assistant yet.</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm"><Link href="/dashboard/messenger">Messenger</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/dashboard/facebook-feed">Facebook Feed</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/dashboard/instagram">Instagram</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/dashboard/whatsapp">WhatsApp</Link></Button>
              </div>
            </div>
          ) : (
            <div className="custom-scrollbar max-h-[60vh] space-y-4 overflow-y-auto">
              {boundWebhooks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Messenger ({boundWebhooks.length})</p>
                  <ul className="divide-y rounded-xl border">
                    {boundWebhooks.map((hook) => (
                      <li key={hook.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Plug className="size-4 text-brand shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{hook.pageName || hook.name}</p>
                            <p className="text-xs text-muted-foreground">{hook.isActive ? "Auto-reply active" : "Paused"}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/messenger/${hook.id}/inbox`}>Inbox</Link></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {boundFacebookFeedWebhooks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Facebook Feed ({boundFacebookFeedWebhooks.length})</p>
                  <ul className="divide-y rounded-xl border">
                    {boundFacebookFeedWebhooks.map((hook) => (
                      <li key={hook.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MessageSquareQuote className="size-4 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{hook.pageName || hook.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {hook.replyMode || "PUBLIC_COMMENT"} • {hook.isActive ? (hook.autoReply ? "Auto-reply on" : "Manual reply only") : "Paused"}
                            </p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm"><Link href="/dashboard/facebook-feed">Manage</Link></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {boundInstagramWebhooks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">Instagram ({boundInstagramWebhooks.length})</p>
                  <ul className="divide-y rounded-xl border">
                    {boundInstagramWebhooks.map((hook) => (
                      <li key={hook.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Camera className="size-4 text-rose-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{hook.name}</p>
                            <p className="text-xs text-muted-foreground">{hook.username ? `@${hook.username}` : hook.isActive ? "Active" : "Paused"}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm"><Link href="/dashboard/instagram">Manage</Link></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {boundWhatsAppWebhooks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">WhatsApp ({boundWhatsAppWebhooks.length})</p>
                  <ul className="divide-y rounded-xl border">
                    {boundWhatsAppWebhooks.map((hook) => (
                      <li key={hook.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Phone className="size-4 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{hook.name}</p>
                            <p className="text-xs text-muted-foreground">{hook.displayPhoneNumber || (hook.isActive ? "Active" : "Paused")}</p>
                          </div>
                        </div>
                        <Button asChild variant="ghost" size="sm"><Link href="/dashboard/whatsapp">Manage</Link></Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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

      {/* ── Specialist Sub-Agents Modal (GET/POST/PATCH/DELETE /api/v1/ai-profiles/:id/sub-profiles) ── */}
      <Dialog open={subAgentsSheetOpen} onOpenChange={setSubAgentsSheetOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Users className="size-5 text-brand" />
              Specialist Sub-Agents · {selectedProfileForSubAgents?.name}
            </DialogTitle>
            <DialogDescription>
              Configure specialized sub-agents and smart query routing for this assistant.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-secondary/50 p-4 border">
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="size-4 text-brand" />
                  Specialist Multi-Agent Routing
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Queries are evaluated against keywords and capabilities. The winning specialist generates grounded replies.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoProvisionSubAgents}
                  disabled={autoProvisioning}
                  className="gap-1.5 text-xs font-medium"
                >
                  {autoProvisioning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-brand" />}
                  {autoProvisioning ? "Provisioning..." : "Auto-Provision Retail Team"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setEditingSubAgent(null)
                    setSubAgentForm({
                      name: "",
                      role: "",
                      category: "shopping",
                      speciality: "shopping",
                      triggerKeywordsText: "",
                      priority: 20,
                      systemPrompt: "",
                      isActive: true,
                      capabilities: {
                        productSearch: true,
                        visualSearch: true,
                        orderTracking: false,
                        inventoryCheck: true,
                        cartAssistance: true,
                        humanHandoff: true,
                      },
                    })
                    setSubAgentModalOpen(true)
                  }}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add Specialist
                </Button>
              </div>
            </div>

            {/* Live Sub-Agents List */}
            {subAgentsLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading specialist sub-agents...
              </div>
            ) : subAgentsList.length === 0 ? (
              <div className="rounded-xl border border-dashed py-10 text-center space-y-3">
                <Users className="mx-auto size-8 text-muted-foreground" />
                <p className="text-sm font-semibold">No specialist sub-agents deployed yet</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Click &quot;Auto-Provision Retail Team&quot; above to generate standard retail specialists (Shopping Concierge, Order Tracker, Customer Care), or click &quot;Add Specialist&quot; to configure one manually.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoProvisionSubAgents}
                  disabled={autoProvisioning}
                  className="gap-1.5 text-xs font-medium"
                >
                  {autoProvisioning ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5 text-brand" />}
                  Auto-Provision Retail Team
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {subAgentsList.map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
                          <Badge variant="outline" className="text-2xs font-mono">
                            {agent.subAgentConfig?.speciality || agent.category || "specialist"}
                          </Badge>
                          <Badge variant="secondary" className="text-2xs">
                            Priority: {agent.subAgentConfig?.priority ?? 10}
                          </Badge>
                          {agent.isActive ? (
                            <span className="inline-flex items-center gap-1 text-2xs text-emerald-600 font-medium">
                              <span className="size-1.5 rounded-full bg-emerald-500" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                              <span className="size-1.5 rounded-full bg-muted-foreground" /> Paused
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{agent.role}</p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSubAgent(agent)
                            setSubAgentForm({
                              name: agent.name,
                              role: agent.role,
                              category: agent.category || "shopping",
                              speciality: agent.subAgentConfig?.speciality || "shopping",
                              triggerKeywordsText: (agent.subAgentConfig?.triggerKeywords || []).join(", "),
                              priority: agent.subAgentConfig?.priority ?? 20,
                              systemPrompt: agent.systemPrompt || "",
                              isActive: agent.isActive ?? true,
                              capabilities: {
                                productSearch: agent.capabilities?.productSearch ?? false,
                                visualSearch: agent.capabilities?.visualSearch ?? false,
                                orderTracking: agent.capabilities?.orderTracking ?? false,
                                inventoryCheck: agent.capabilities?.inventoryCheck ?? false,
                                cartAssistance: agent.capabilities?.cartAssistance ?? false,
                                humanHandoff: agent.capabilities?.humanHandoff ?? false,
                              },
                            })
                            setSubAgentModalOpen(true)
                          }}
                          className="h-8 px-2 text-xs"
                        >
                          <Edit className="size-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDeleteSubAgentModal(agent.id)}
                          className="hover:text-destructive"
                          aria-label="Delete specialist"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Capabilities pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-2xs text-muted-foreground">Capabilities:</span>
                      {Object.entries(agent.capabilities || {}).map(([cap, enabled]) =>
                        enabled ? (
                          <span key={cap} className="rounded-md bg-secondary px-2 py-0.5 text-2xs font-medium text-foreground">
                            {cap.replace(/([A-Z])/g, " $1").toLowerCase()}
                          </span>
                        ) : null
                      )}
                    </div>

                    {/* Trigger keywords */}
                    {agent.subAgentConfig?.triggerKeywords && agent.subAgentConfig.triggerKeywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-2xs text-muted-foreground">Keywords:</span>
                        {agent.subAgentConfig.triggerKeywords.map((kw) => (
                          <span key={kw} className="rounded-full bg-brand/10 text-brand px-2 py-0.5 text-2xs font-mono">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Query Routing Simulation Sandbox */}
            <div className="rounded-2xl border bg-muted/30 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Play className="size-4 text-emerald-600 fill-emerald-600" />
                    Query Routing Simulation Sandbox
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Test customer queries to verify how incoming messages route between your specialists.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSimulateRoutingModal}
                  disabled={routingSimulating || !routingPrompt.trim() || subAgentsList.length === 0}
                  className="gap-1.5 text-xs"
                >
                  {routingSimulating ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                  {routingSimulating ? "Simulating..." : "Test Routing"}
                </Button>
              </div>

              <div className="space-y-3">
                <Input
                  value={routingPrompt}
                  onChange={(e) => setRoutingPrompt(e.target.value)}
                  placeholder="e.g. What is the price of your sneakers and do you have size 10 in stock?"
                  className="text-xs bg-card"
                />
                <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={routingHasImages}
                    onChange={(e) => setRoutingHasImages(e.target.checked)}
                    className="rounded border-border accent-brand"
                  />
                  <span>Simulate with attached photo (tests Visual Search capability matching)</span>
                </label>
              </div>

              {routingResult && (
                <div className="rounded-xl border bg-card p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="space-y-0.5">
                      <span className="text-2xs text-muted-foreground uppercase tracking-wide">Winning Specialist</span>
                      <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                        {routingResult.selectedProfileName}
                        {routingResult.selectedProfileSpeciality && (
                          <Badge variant="outline" className="text-2xs">{routingResult.selectedProfileSpeciality}</Badge>
                        )}
                      </p>
                      <p className="text-2xs text-muted-foreground">{routingResult.selectedProfileRole}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xs text-muted-foreground">Confidence</span>
                      <p className="font-mono font-bold text-sm text-emerald-600">
                        {(routingResult.confidenceScore * 100).toFixed(0)}%
                      </p>
                      <Badge variant="secondary" className="text-2xs">{routingResult.routingReason}</Badge>
                    </div>
                  </div>

                  {routingResult.matchedKeywords && routingResult.matchedKeywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-2xs font-medium text-muted-foreground">Matched Keywords:</span>
                      {routingResult.matchedKeywords.map((kw) => (
                        <span key={kw} className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-2xs font-mono font-medium">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {routingResult.evaluatedSubAgents && routingResult.evaluatedSubAgents.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Specialists Evaluated</p>
                      <div className="divide-y rounded-lg border text-2xs">
                        {routingResult.evaluatedSubAgents.map((candidate) => (
                          <div key={candidate.id} className="flex items-center justify-between p-2">
                            <div>
                              <span className="font-medium text-foreground">{candidate.name}</span>
                              <span className="text-muted-foreground ml-2">({candidate.speciality})</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-muted-foreground">Score: {candidate.score}</span>
                              {candidate.id === routingResult.selectedProfileId ? (
                                <Badge variant="brand" className="text-2xs">Selected</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-2xs">Passed</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Sub-Agent Create / Edit Modal ────────────────────── */}
      <Dialog open={subAgentModalOpen} onOpenChange={setSubAgentModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSubAgent ? `Edit ${editingSubAgent.name}` : "Create Specialist Sub-Agent"}
            </DialogTitle>
            <DialogDescription>
              {editingSubAgent
                ? "Update capabilities, trigger keywords, and instructions for this specialist."
                : "Add a dedicated specialist sub-agent to handle specific customer intents."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSubAgentModal} className="space-y-4 pt-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Specialist Name">
                <Input
                  value={subAgentForm.name}
                  onChange={(e) => setSubAgentForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Order Tracking Specialist"
                />
              </Field>
              <Field label="Specialist Role">
                <Input
                  value={subAgentForm.role}
                  onChange={(e) => setSubAgentForm((p) => ({ ...p, role: e.target.value }))}
                  placeholder="e.g. Order Fulfillment & Tracking"
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Domain / Speciality">
                <Input
                  value={subAgentForm.speciality}
                  onChange={(e) => setSubAgentForm((p) => ({ ...p, speciality: e.target.value }))}
                  placeholder="e.g. order-tracking"
                />
              </Field>
              <Field label="Priority (Higher = Priority)">
                <Input
                  type="number"
                  value={subAgentForm.priority}
                  onChange={(e) => setSubAgentForm((p) => ({ ...p, priority: parseInt(e.target.value) || 10 }))}
                />
              </Field>
              <Field label="Category">
                <NativeSelect
                  value={subAgentForm.category}
                  onChange={(e) => setSubAgentForm((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="shopping">Shopping</option>
                  <option value="customer-support">Customer Support</option>
                  <option value="sales">Sales</option>
                  <option value="booking">Booking</option>
                </NativeSelect>
              </Field>
            </div>

            <Field
              label="Trigger Keywords (comma-separated)"
              hint="When customer queries contain any of these keywords, this specialist is activated."
            >
              <Input
                value={subAgentForm.triggerKeywordsText}
                onChange={(e) => setSubAgentForm((p) => ({ ...p, triggerKeywordsText: e.target.value }))}
                placeholder="order, track, tracking, shipped, delivery, ORD-"
              />
            </Field>

            <div className="space-y-2">
              <label className="text-xs font-semibold">Specialist Capabilities</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 rounded-xl border p-3 bg-secondary/20">
                {[
                  { key: "productSearch", label: "Product Search" },
                  { key: "visualSearch", label: "Visual Search" },
                  { key: "orderTracking", label: "Order Tracking" },
                  { key: "inventoryCheck", label: "Inventory Check" },
                  { key: "cartAssistance", label: "Cart Assistance" },
                  { key: "humanHandoff", label: "Human Handoff" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!subAgentForm.capabilities[key as keyof SubAgentCapabilities]}
                      onChange={(e) =>
                        setSubAgentForm((p) => ({
                          ...p,
                          capabilities: { ...p.capabilities, [key]: e.target.checked },
                        }))
                      }
                      className="rounded border-border accent-brand"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Field label="Specialist System Prompt" hint="Direct instructions followed when this sub-agent replies.">
              <Textarea
                rows={4}
                value={subAgentForm.systemPrompt}
                onChange={(e) => setSubAgentForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                placeholder="You are the order fulfillment assistant. Help customers locate their orders and check delivery stages accurately."
              />
            </Field>

            <ToggleRow
              label="Active Status"
              hint="When paused, this specialist will not be considered during query routing."
              checked={subAgentForm.isActive}
              onChange={(v) => setSubAgentForm((p) => ({ ...p, isActive: v }))}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="ghost" onClick={() => setSubAgentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSubAgent ? "Update Specialist" : "Create Specialist"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
