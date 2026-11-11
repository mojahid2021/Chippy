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
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit,
  MessageSquare,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Send,
  Star,
  Trash2,
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
