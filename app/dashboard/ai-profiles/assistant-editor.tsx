"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { NativeSelect } from "@/components/ui/native-select"
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Code2,
  Cpu,
  Loader2,
  MessageSquare,
  Mic,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/page-header"
import { toast } from "@/hooks/use-toast"
import type { AiProfile, KnowledgeSnippet, ReferenceUrl, CustomVariable, FewShotExample, ModelConfig } from "@/lib/types/woombat"

export const CATEGORIES = [
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

type FormData = {
  name: string
  role: string
  description: string
  avatar: string
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
}

const DEFAULT_MODEL: ModelConfig = {
  provider: "openai",
  modelName: "gpt-4o",
  temperature: 0.7,
  topP: 1.0,
  maxTokens: 2048,
  frequencyPenalty: 0,
  presencePenalty: 0,
  stopSequences: [],
  responseFormat: "text",
}

// A ready-to-edit starter for a Bangladeshi Messenger shop, so a new assistant works on first save.
const STARTER: FormData = {
  name: "",
  role: "",
  description: "",
  avatar: "",
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
    { id: "delivery", title: "Delivery", content: "Inside Dhaka ৳60, 1–2 days. Outside Dhaka ৳120, 3–4 days. Cash on delivery available everywhere.", tags: ["delivery"] },
  ],
  referenceUrls: [],
  customVariables: [
    { key: "company_name", defaultValue: "My Shop", description: "Your shop’s name" },
    { key: "support_phone", defaultValue: "01XXXXXXXXX", description: "Phone number customers can call" },
    { key: "currency", defaultValue: "৳ (BDT)", description: "Currency for prices" },
  ],
  fewShotExamples: [
    { user: "XL ache? Price koto?", assistant: "Ji apu, XL ache! Price ৳1,850. Order korte apnar naam, phone number ar address diben?" },
  ],
  modelConfig: DEFAULT_MODEL,
  tags: [],
  isActive: true,
  isDefault: false,
}

const fromProfile = (data: AiProfile): FormData => ({
  name: data.name || "",
  role: data.role || "",
  description: data.description || "",
  avatar: data.avatar || "",
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
  modelConfig: { ...DEFAULT_MODEL, ...(data.modelConfig || {}) },
  tags: data.tags || [],
  isActive: data.isActive ?? true,
  isDefault: data.isDefault ?? false,
})

const SECTIONS = [
  { id: "basics", label: "Basics", icon: Bot, hint: "Name it and choose where it replies." },
  { id: "voice", label: "Voice", icon: Mic, hint: "How it sounds to your customers." },
  { id: "instructions", label: "Instructions", icon: MessageSquare, hint: "The brief it reads before every reply." },
  { id: "rules", label: "Rules", icon: ShieldAlert, hint: "Short lines it always follows, or never does." },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, hint: "Facts and links it can answer from." },
  { id: "variables", label: "Variables", icon: Code2, hint: "Values you reuse across instructions and rules." },
  { id: "examples", label: "Example replies", icon: Bookmark, hint: "Show it how you’d answer a real customer." },
  { id: "model", label: "AI model", icon: Cpu, hint: "Which AI writes the replies." },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

const TONE_SUGGESTIONS = ["Friendly", "Polite", "Playful", "Professional"]

const isDone = (f: FormData): Record<SectionId, boolean> => ({
  basics: !!f.name.trim() && !!f.role.trim(),
  voice: !!f.tone.trim() && !!f.language,
  instructions: !!f.systemPrompt.trim(),
  rules: f.dos.length + f.donts.length > 0,
  knowledge: f.knowledgeSnippets.length + f.referenceUrls.length > 0,
  variables: f.customVariables.length > 0,
  examples: f.fewShotExamples.length > 0,
  model: !!f.modelConfig.provider && !!f.modelConfig.modelName,
})

/** Full-page editor for one assistant. No `profileId` means "create". */
export function AssistantEditor({ profileId }: { profileId?: string }) {
  const router = useRouter()
  const creating = !profileId
  const [formData, setFormData] = useState<FormData | null>(creating ? STARTER : null)
  const [saved, setSaved] = useState<string>(JSON.stringify(STARTER))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [newDo, setNewDo] = useState("")
  const [newDont, setNewDont] = useState("")
  const [tab, setTab] = useState<SectionId>("basics")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (creating) {
      // The first assistant becomes the default so pages start replying right away.
      fetch("/api/v1/ai-profiles/default")
        .then(async (res) => {
          const json = await res.json().catch(() => null)
          if (!res.ok || !json?.data) {
            setFormData((f) => (f ? { ...f, isDefault: true } : f))
            setSaved(JSON.stringify({ ...STARTER, isDefault: true }))
          }
        })
        .catch(() => {})
      return
    }
    fetch(`/api/v1/ai-profiles/${encodeURIComponent(profileId)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.data) throw new Error(json.message || "This assistant was deleted or you don’t have access to it.")
        const next = fromProfile(json.data as AiProfile)
        setFormData(next)
        setSaved(JSON.stringify(next))
      })
      .catch((e: Error) => setLoadError(e.message))
  }, [creating, profileId])

  const dirty = !!formData && JSON.stringify(formData) !== saved

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const done = useMemo(() => (formData ? isDone(formData) : null), [formData])

  if (loadError) {
    return (
      <EmptyState
        icon={<Bot />}
        title="This assistant didn’t open"
        body={loadError}
        action={<Button asChild><Link href="/dashboard/ai-profiles">Back to AI assistants</Link></Button>}
      />
    )
  }

  if (!formData || !done) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Opening assistant
      </div>
    )
  }

  const patch = (next: Partial<FormData>) => setFormData({ ...formData, ...next })
  const patchModel = (next: Partial<ModelConfig>) => setFormData({ ...formData, modelConfig: { ...formData.modelConfig, ...next } })
  const doneCount = Object.values(done).filter(Boolean).length
  const tabIndex = SECTIONS.findIndex((s) => s.id === tab)
  const go = (step: number) => {
    setTab(SECTIONS[tabIndex + step].id)
    formRef.current?.scrollIntoView({ block: "start" })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.role.trim()) {
      toast({ variant: "destructive", title: "Name and role needed", description: "Add a name and a role for this assistant." })
      setTab("basics")
      return
    }
    try {
      setSaveLoading(true)
      const res = await fetch(creating ? "/api/v1/ai-profiles" : `/api/v1/ai-profiles/${profileId}`, {
        method: creating ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const json = await res.json()
      if (res.ok && json.data) {
        setSaved(JSON.stringify(formData))
        toast({ variant: "success", title: creating ? "Assistant created" : "Changes saved", description: `${json.data.name} is ready.` })
        if (creating) router.push("/dashboard/ai-profiles")
      } else {
        toast({ variant: "destructive", title: "Couldn’t save", description: json.message || "Check the fields and try again." })
      }
    } catch {
      toast({ variant: "destructive", title: "Couldn’t save", description: "Couldn’t reach the server. Your changes are still here; try saving again." })
    } finally {
      setSaveLoading(false)
    }
  }

  const title = creating ? "New assistant" : formData.name || "Untitled assistant"
  const status = creating ? "Draft" : dirty ? "Unsaved changes" : "Saved"

  return (
    <form ref={formRef} onSubmit={handleSave} className="scroll-mt-0">
      {/* ── Top bar: title, save state and actions stay in reach while scrolling ── */}
      <div className="sticky top-0 z-20 -mx-4 -mt-6 mb-6 border-b bg-card/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:-mt-8 lg:mb-8 lg:px-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Back to AI assistants">
            <Link href="/dashboard/ai-profiles"><ArrowLeft /></Link>
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl tracking-[-0.02em]">{title}</h1>
              <span
                aria-live="polite"
                className={cn(
                  "hidden shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-2xs font-medium sm:inline-flex",
                  status === "Saved" ? "bg-success-soft text-success" : status === "Draft" ? "bg-secondary text-muted-foreground" : "bg-brand-soft text-brand-ink"
                )}
              >
                <span className={cn("size-1.5 rounded-full", status === "Saved" ? "bg-success" : status === "Draft" ? "bg-muted-foreground" : "bg-brand-ink")} />
                {status}
              </span>
            </div>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">
              {creating ? "Starts from a template for Messenger shops. Change what doesn’t fit." : "Changes apply to every Facebook page that uses this assistant."}
            </p>
          </div>
          <Button type="button" variant="ghost" className="hidden sm:inline-flex" onClick={() => router.push("/dashboard/ai-profiles")}>
            {creating || dirty ? "Cancel" : "Done"}
          </Button>
          <Button type="submit" disabled={saveLoading || (!creating && !dirty)}>
            {saveLoading ? <Loader2 className="animate-spin" /> : <Check />}
            {creating ? "Create assistant" : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] xl:grid-cols-[13rem_minmax(0,1fr)_19rem] xl:gap-8">
        {/* ── Section nav with setup progress ── */}
        <nav aria-label="Assistant settings" className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 hidden px-2.5 lg:block">
            <p className="flex justify-between text-xs text-muted-foreground">
              <span>Setup</span>
              <span className="tabular-nums">{doneCount} of {SECTIONS.length}</span>
            </p>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${(doneCount / SECTIONS.length) * 100}%` }} />
            </div>
          </div>
          <div role="tablist" aria-orientation="vertical" aria-label="Assistant settings" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:px-0 lg:pb-0">
            {SECTIONS.map((s) => {
              const active = tab === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  id={`${s.id}-tab`}
                  aria-selected={active}
                  aria-controls={`${s.id}-panel`}
                  onClick={() => setTab(s.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    active && "border-border bg-card font-medium text-foreground shadow-xs hover:bg-card",
                    "max-lg:border-border"
                  )}
                >
                  <s.icon className="size-4 shrink-0" />
                  <span className="flex-1 whitespace-nowrap">{s.label}</span>
                  {done[s.id] ? (
                    <CheckCircle2 className="size-3.5 shrink-0 text-success" aria-label="Set up" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-input" aria-label="Not set up" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* ── Settings ── */}
        <div className="min-w-0 space-y-5">
          {tab === "basics" && (
          <Section id="basics">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required hint="Only you see this.">
                <Input autoFocus={creating} placeholder="e.g. Nakshi Threads sales" value={formData.name} onChange={(e) => patch({ name: e.target.value })} required />
              </Field>
              <Field label="Role" required hint="Used in the AI’s instructions.">
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
              <Field label="Avatar URL" hint="Optional icon image link.">
                <Input placeholder="https://example.com/avatar.png" value={formData.avatar} onChange={(e) => patch({ avatar: e.target.value })} />
              </Field>
            </div>
            <Field label="Tags" hint="Press Enter or comma to add tags (e.g. concierge, sales).">
              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                    {tag}
                    <button type="button" onClick={() => patch({ tags: formData.tags.filter((_, j) => j !== idx) })} className="hover:text-destructive" aria-label={`Remove tag ${tag}`}>
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                ))}
                <input
                  placeholder={formData.tags.length === 0 ? "Type a tag and press Enter" : "Add another tag..."}
                  className="flex-1 bg-transparent px-1.5 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      const val = e.currentTarget.value.trim().toLowerCase().replace(/^,+|,+$/g, "")
                      if (val && !formData.tags.includes(val)) {
                        patch({ tags: [...formData.tags, val] })
                        e.currentTarget.value = ""
                      }
                    }
                  }}
                />
              </div>
            </Field>
            <div className="-mx-5 -mb-5 divide-y border-t bg-muted/40 [&>label]:px-5">
              <ToggleRow label="Turned on" hint="When off, this assistant never replies." checked={formData.isActive} onChange={(v) => patch({ isActive: v })} />
              <ToggleRow label="Default assistant" hint="Replies on pages that don’t have their own assistant." checked={formData.isDefault} onChange={(v) => patch({ isDefault: v })} />
            </div>
          </Section>
          )}

          {tab === "voice" && (
          <Section id="voice">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reply language">
                <NativeSelect value={formData.language} onChange={(e) => patch({ language: e.target.value })}>
                  {LANGUAGES.some((l) => l.value === formData.language) ? null : <option value={formData.language}>{formData.language}</option>}
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </NativeSelect>
              </Field>
              <Field label="Style" hint="e.g. conversational, short and direct">
                <Input value={formData.style} onChange={(e) => patch({ style: e.target.value })} />
              </Field>
            </div>
            <div className="space-y-1.5">
              <Field label="Tone">
                <Input value={formData.tone} onChange={(e) => patch({ tone: e.target.value })} placeholder="e.g. friendly" />
              </Field>
              <div className="flex flex-wrap gap-1.5">
                {TONE_SUGGESTIONS.map((t) => {
                  const on = formData.tone.toLowerCase() === t.toLowerCase()
                  return (
                    <button
                      key={t}
                      type="button"
                      aria-pressed={on}
                      onClick={() => patch({ tone: t.toLowerCase() })}
                      className={cn("rounded-full border px-2.5 py-0.5 text-xs", on ? "border-ink bg-ink text-white" : "text-muted-foreground hover:border-input hover:text-foreground")}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              <p id="reply-length" className="text-sm font-medium">Reply length</p>
              <div role="radiogroup" aria-labelledby="reply-length" className="grid grid-cols-3 gap-2">
                {(["concise", "balanced", "detailed"] as const).map((len) => {
                  const on = formData.responseLength === len
                  return (
                    <button
                      key={len}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => patch({ responseLength: len })}
                      className={cn("relative rounded-xl border px-3 py-2.5 text-left text-sm transition-colors", on ? "border-ink bg-brand-soft" : "hover:border-input")}
                    >
                      <span className="block font-medium">{len === "concise" ? "Short" : len === "balanced" ? "Medium" : "Detailed"}</span>
                      <span className="block text-xs text-muted-foreground">{len === "concise" ? "1–2 lines" : len === "balanced" ? "A short paragraph" : "Full explanations"}</span>
                      {on && <Check className="absolute right-2.5 top-2.5 size-3.5" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </Section>
          )}

          {tab === "instructions" && (
          <Section id="instructions">
            <Field label="Main instructions" hint={<>Who it is, what your shop sells, and how to handle orders. Use <code className="rounded bg-secondary px-1 font-mono">{"{{variable}}"}</code> for values set under Variables.</>}>
              <Textarea rows={8} className="font-mono text-sm leading-relaxed" value={formData.systemPrompt} onChange={(e) => patch({ systemPrompt: e.target.value })} placeholder="You are the sales assistant for {{company_name}}…" />
            </Field>
            <Field label="Goal" hint="One line on what a good conversation achieves.">
              <Input value={formData.mission} onChange={(e) => patch({ mission: e.target.value })} placeholder="Answer quickly and help the customer place an order." />
            </Field>
            <Field label="When it doesn’t know" hint="Sent when the answer isn’t in its instructions or knowledge.">
              <Textarea rows={2} value={formData.fallbackResponse} onChange={(e) => patch({ fallbackResponse: e.target.value })} placeholder="Ekjon team member ekhuni apnake janabe." />
            </Field>
          </Section>
          )}

          {tab === "rules" && (
          <Section id="rules">
            <div className="grid gap-5 sm:grid-cols-2">
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
          </Section>
          )}

          {tab === "knowledge" && (
          <Section id="knowledge">
            <SubHead
              title="Facts about your shop"
              hint="Delivery charges, return policy, sizes. It looks here before answering."
              action={<AddButton onClick={() => patch({ knowledgeSnippets: [...formData.knowledgeSnippets, { id: `snippet-${Date.now()}`, title: "", content: "", tags: [] }] })}>Add fact</AddButton>}
            />
            {formData.knowledgeSnippets.length === 0 && <Hint>No facts yet. Start with delivery charges; customers ask about them most.</Hint>}
            {formData.knowledgeSnippets.map((snip, i) => (
              <div key={snip.id} className="space-y-2 rounded-xl border bg-muted/40 p-3">
                <div className="flex gap-2">
                  <Input placeholder="Title, e.g. Delivery charges" value={snip.title} aria-label="Fact title" className="bg-card font-medium"
                    onChange={(e) => patch({ knowledgeSnippets: formData.knowledgeSnippets.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)) })} />
                  <RemoveButton label="Remove fact" onClick={() => patch({ knowledgeSnippets: formData.knowledgeSnippets.filter((_, j) => j !== i) })} />
                </div>
                <Textarea rows={2} placeholder="Inside Dhaka ৳60, outside Dhaka ৳120. 2–4 days." value={snip.content} aria-label="Fact details" className="bg-card"
                  onChange={(e) => patch({ knowledgeSnippets: formData.knowledgeSnippets.map((s, j) => (j === i ? { ...s, content: e.target.value } : s)) })} />
                <Input
                  placeholder="Tags (comma-separated, e.g. policy, delivery)"
                  value={(snip.tags || []).join(", ")}
                  aria-label="Fact tags"
                  className="bg-card text-xs font-mono"
                  onChange={(e) => {
                    const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
                    patch({
                      knowledgeSnippets: formData.knowledgeSnippets.map((s, j) => (j === i ? { ...s, tags } : s)),
                    })
                  }}
                />
              </div>
            ))}

            <div className="border-t pt-5">
              <SubHead
                title="Links"
                hint="Pages it can share, like your size chart or website."
                action={<AddButton onClick={() => patch({ referenceUrls: [...formData.referenceUrls, { title: "", url: "", description: "" }] })}>Add link</AddButton>}
              />
            </div>
            {formData.referenceUrls.length === 0 && <Hint>No links yet.</Hint>}
            {formData.referenceUrls.map((ref, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
                <Input placeholder="Title" value={ref.title} aria-label="Link title"
                  onChange={(e) => patch({ referenceUrls: formData.referenceUrls.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)) })} />
                <Input type="url" placeholder="https://" value={ref.url} aria-label="Link address"
                  onChange={(e) => patch({ referenceUrls: formData.referenceUrls.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)) })} />
                <RemoveButton label="Remove link" onClick={() => patch({ referenceUrls: formData.referenceUrls.filter((_, j) => j !== i) })} />
              </div>
            ))}
          </Section>
          )}

          {tab === "variables" && (
          <Section
            id="variables"
            action={<AddButton onClick={() => patch({ customVariables: [...formData.customVariables, { key: "", defaultValue: "", description: "" }] })}>Add variable</AddButton>}
          >
            {formData.customVariables.length === 0 ? (
              <Hint>No variables yet. Add your shop name and phone number so you only change them in one place.</Hint>
            ) : (
              <div className="overflow-hidden rounded-xl border">
                <div className="hidden grid-cols-[1fr_1.3fr_2rem] gap-2 border-b bg-muted px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
                  <span>Key</span><span>Value</span><span />
                </div>
                {formData.customVariables.map((v, i) => (
                  <div key={i} className="grid gap-2 border-b p-2.5 last:border-0 sm:grid-cols-[1fr_1.3fr_2rem]">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">{"{{"}</span>
                      <Input className="px-7 font-mono text-sm" placeholder="shop_phone" value={v.key} aria-label="Variable key"
                        onChange={(e) => patch({ customVariables: formData.customVariables.map((c, j) => (j === i ? { ...c, key: e.target.value.replace(/\s+/g, "_") } : c)) })} />
                      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">{"}}"}</span>
                    </div>
                    <Input placeholder="01712-345678" value={v.defaultValue} aria-label="Variable value"
                      onChange={(e) => patch({ customVariables: formData.customVariables.map((c, j) => (j === i ? { ...c, defaultValue: e.target.value } : c)) })} />
                    <RemoveButton label="Remove variable" onClick={() => patch({ customVariables: formData.customVariables.filter((_, j) => j !== i) })} />
                  </div>
                ))}
              </div>
            )}
          </Section>
          )}

          {tab === "examples" && (
          <Section
            id="examples"
            action={<AddButton onClick={() => patch({ fewShotExamples: [...formData.fewShotExamples, { user: "", assistant: "" }] })}>Add example</AddButton>}
          >
            {formData.fewShotExamples.length === 0 && <Hint>No examples yet. A few good ones teach tone better than long instructions.</Hint>}
            {formData.fewShotExamples.map((ex, i) => (
              <div key={i} className="rounded-xl border bg-muted/40 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Example {i + 1}</span>
                  <RemoveButton label="Remove example" onClick={() => patch({ fewShotExamples: formData.fewShotExamples.filter((_, j) => j !== i) })} />
                </div>
                <div className="space-y-2">
                  <Textarea rows={2} placeholder="Customer writes: XL ache?" value={ex.user} aria-label="Customer message" className="w-[88%] rounded-2xl rounded-bl-md bg-card"
                    onChange={(e) => patch({ fewShotExamples: formData.fewShotExamples.map((x, j) => (j === i ? { ...x, user: e.target.value } : x)) })} />
                  <Textarea rows={2} placeholder="Assistant replies: Ji apu, XL ache!" value={ex.assistant} aria-label="Assistant reply" className="ml-auto w-[88%] rounded-2xl rounded-br-md border-ink bg-ink text-white placeholder:text-white/50"
                    onChange={(e) => patch({ fewShotExamples: formData.fewShotExamples.map((x, j) => (j === i ? { ...x, assistant: e.target.value } : x)) })} />
                </div>
              </div>
            ))}
          </Section>
          )}

          {tab === "model" && (
          <Section id="model">
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
            <Field label="Creativity" hint="Lower is more predictable. 0.3–0.7 works well for sales.">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Precise</span>
                <input type="range" min={0} max={2} step={0.05} value={formData.modelConfig.temperature ?? 0.7}
                  onChange={(e) => patchModel({ temperature: parseFloat(e.target.value) })} className="flex-1 accent-ink" aria-label="Creativity" />
                <span className="text-xs text-muted-foreground">Creative</span>
                <span className="w-10 rounded-md bg-secondary py-0.5 text-center font-mono text-xs tabular-nums">{(formData.modelConfig.temperature ?? 0.7).toFixed(2)}</span>
              </div>
            </Field>
            <details className="group -mx-5 -mb-5 border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-3 text-sm font-medium hover:bg-muted/50">
                Advanced settings
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="grid gap-4 border-t bg-muted/40 p-5 sm:grid-cols-3">
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
                <Field label="Frequency penalty" hint="Reduces token repetition (-2.0 to 2.0).">
                  <Input
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={formData.modelConfig.frequencyPenalty ?? 0}
                    onChange={(e) => patchModel({ frequencyPenalty: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Presence penalty" hint="Encourages new topics (-2.0 to 2.0).">
                  <Input
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={formData.modelConfig.presencePenalty ?? 0}
                    onChange={(e) => patchModel({ presencePenalty: parseFloat(e.target.value) || 0 })}
                  />
                </Field>
                <Field label="Stop sequences" hint="Halts reply (comma-separated).">
                  <Input
                    placeholder="e.g. User:, \n\n"
                    value={(formData.modelConfig.stopSequences || []).join(", ")}
                    onChange={(e) => {
                      const seqs = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                      patchModel({ stopSequences: seqs })
                    }}
                  />
                </Field>
              </div>
            </details>
          </Section>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {tabIndex > 0 ? (
              <Button type="button" variant="ghost" onClick={() => go(-1)}><ArrowLeft className="size-3.5" />{SECTIONS[tabIndex - 1].label}</Button>
            ) : <span />}
            {tabIndex < SECTIONS.length - 1 ? (
              <Button type="button" variant="outline" onClick={() => go(1)}>Next: {SECTIONS[tabIndex + 1].label}<ChevronRight className="size-3.5" /></Button>
            ) : (
              <Button type="submit" disabled={saveLoading || (!creating && !dirty)}>
                {saveLoading ? <Loader2 className="animate-spin" /> : <Check />}
                {creating ? "Create assistant" : "Save changes"}
              </Button>
            )}
          </div>
        </div>

        {/* ── Live preview (wide screens) ── */}
        <aside aria-label="Preview" className="hidden xl:sticky xl:top-24 xl:block xl:self-start">
          <Preview form={formData} />
        </aside>
      </div>
    </form>
  )
}

function Preview({ form }: { form: FormData }) {
  const name = form.name.trim() || "Your assistant"
  const ex = form.fewShotExamples.find((x) => x.user.trim() || x.assistant.trim())
  const language = LANGUAGES.find((l) => l.value === form.language)?.label.replace(/ \(.*\)$/, "") ?? form.language
  return (
    <div className="space-y-3">
      <p className="px-1 text-xs font-medium text-muted-foreground">Preview in Messenger</p>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b px-4 py-3">
          {form.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar} alt="" className="size-8 rounded-full border object-cover" />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-brand font-display text-sm font-bold">{name[0].toUpperCase()}</span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="flex items-center gap-1 text-2xs text-muted-foreground">
              <span className={cn("size-1.5 rounded-full", form.isActive ? "bg-success" : "bg-input")} />
              {form.isActive ? "Replies instantly" : "Turned off"}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 bg-muted px-3 py-4 text-sm">
          <p className="max-w-[85%] self-start rounded-2xl rounded-bl-md bg-card px-3 py-2 ring-1 ring-border">{ex?.user.trim() || "Hi! Is this still available?"}</p>
          <p className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-ink px-3 py-2 text-white">
            {ex?.assistant.trim() || form.mission.trim() || "Your assistant’s reply shows up here."}
          </p>
        </div>
        <dl className="grid grid-cols-3 divide-x border-t text-center">
          {[
            ["Language", language],
            ["Length", form.responseLength === "concise" ? "Short" : form.responseLength === "balanced" ? "Medium" : "Detailed"],
            ["Tone", form.tone || "Not set"],
          ].map(([k, v]) => (
            <div key={k} className="px-2 py-2.5">
              <dt className="text-2xs text-muted-foreground">{k}</dt>
              <dd className="truncate text-xs font-medium capitalize">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="px-1 text-2xs text-muted-foreground">Uses your first example reply. Test real messages from the assistants list after saving.</p>
    </div>
  )
}

function Section({ id, action, children }: { id: SectionId; action?: React.ReactNode; children: React.ReactNode }) {
  const meta = SECTIONS.find((s) => s.id === id)!
  return (
    <section id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab`} className="overflow-hidden rounded-2xl border bg-card shadow-xs">
      <header className="flex items-center gap-3 border-b px-5 py-4">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary"><meta.icon className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base">{meta.label}</h2>
          <p className="text-xs text-muted-foreground">{meta.hint}</p>
        </div>
        {action}
      </header>
      <div className="space-y-4 p-5">{children}</div>
    </section>
  )
}

function SubHead({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, hint, required, children }: { label: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
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

export function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
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

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="shrink-0">
      <Plus className="size-3.5" />{children}
    </Button>
  )
}

export function Hint({ children }: { children: React.ReactNode }) {
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
        <ul className="divide-y rounded-xl border bg-card">
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
