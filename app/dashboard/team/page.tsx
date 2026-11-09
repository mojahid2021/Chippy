"use client"

import { useState, useEffect, useCallback } from "react"
import { useUserStore } from "@/lib/stores/userStore"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import {
  Users,
  UserPlus,
  Shield,
  Building2,
  Mail,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  LogOut,
  Crown,
  Copy,
  Check,
  Edit2,
  Sparkles,
  Zap,
} from "lucide-react"

interface Member {
  id: string
  userId: string
  role: "OWNER" | "ADMIN" | "MANAGER" | "AGENT" | "VIEWER"
  status: "ACTIVE" | "DISABLED"
  grantedPermissions?: string[]
  deniedPermissions?: string[]
  createdAt: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    username: string
  }
}

interface Invite {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt?: string
  inviteLink?: string
}

interface Entitlements {
  active: boolean
  gracePeriod: boolean
  graceEndsAt: string | null
  reason: string | null
  plan: string | null
  endsAt: string | null
  features: Record<string, boolean>
  usage: Record<string, { used: number; limit: number | null }>
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: "bg-warning-soft text-warning border-warning/30",
  ADMIN: "bg-pop-soft text-pop border-pop/30",
  MANAGER: "bg-info-soft text-info border-info/30",
  AGENT: "bg-success-soft text-success border-success/30",
  VIEWER: "bg-muted text-foreground border-border",
}

export default function TeamManagementPage() {
  const { user, activeTenantId, tenants, currentRole, permissions, loadTenantContext, switchTenant } = useUserStore()

  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals & form state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("AGENT")
  const [inviting, setInviting] = useState(false)
  const [latestInviteLink, setLatestInviteLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameWorkspaceName, setRenameWorkspaceName] = useState("")
  const [renaming, setRenaming] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState("")
  const [creatingWorkspace, setCreatingWorkspace] = useState(false)

  const [transferMember, setTransferMember] = useState<Member | null>(null)
  const [transferring, setTransferring] = useState(false)

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0]
  const isOwner = currentRole === "OWNER" || activeTenant?.role === "OWNER"
  const canManageMembers = isOwner || currentRole === "ADMIN" || permissions.includes("member:manage")

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [membersRes, invitesRes, entitlementsRes] = await Promise.all([
        fetch("/api/tenant/members", { method: "GET" }).catch(() => null),
        fetch("/api/tenant/invites", { method: "GET" }).catch(() => null),
        fetch("/api/tenant/entitlements", { method: "GET" }).catch(() => null),
      ])

      if (membersRes && membersRes.ok) {
        const data = await membersRes.json()
        if (data.success && Array.isArray(data.data)) {
          setMembers(data.data)
        }
      }

      if (invitesRes && invitesRes.ok) {
        const data = await invitesRes.json()
        if (data.success && Array.isArray(data.data)) {
          setInvites(data.data)
        }
      }

      if (entitlementsRes && entitlementsRes.ok) {
        const data = await entitlementsRes.json()
        if (data.success && data.data) {
          setEntitlements(data.data)
        }
      }
    } catch {
      setError("Failed to load team data. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData, activeTenantId])

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please enter a valid email address." })
      return
    }

    setInviting(true)
    try {
      const res = await fetch("/api/tenant/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast({
          variant: "success",
          title: "Invitation Sent",
          description: `Invitation sent to ${inviteEmail}.`,
        })
        if (data.data?.inviteLink) {
          setLatestInviteLink(data.data.inviteLink)
        } else {
          setShowInviteModal(false)
          setInviteEmail("")
        }
        await fetchData()
      } else {
        toast({ variant: "destructive", title: "Invite Failed", description: data.message || "Failed to send invitation." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again later." })
    } finally {
      setInviting(false)
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/tenant/invites/${inviteId}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "info", title: "Invite Revoked", description: "The invitation has been revoked." })
        setInvites(invites.filter((i) => i.id !== inviteId))
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to revoke invite." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/tenant/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "success", title: "Role Updated", description: "Member role has been updated." })
        await fetchData()
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to update role." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    }
  }

  const handleToggleMemberStatus = async (member: Member) => {
    const nextStatus = member.status === "ACTIVE" ? "DISABLED" : "ACTIVE"
    try {
      const res = await fetch(`/api/tenant/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "info", title: "Status Updated", description: `Member is now ${nextStatus.toLowerCase()}.` })
        await fetchData()
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to update member status." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member from the workspace?")) return
    try {
      const res = await fetch(`/api/tenant/members/${memberId}`, { method: "DELETE" })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "info", title: "Member Removed", description: "The member has been removed." })
        setMembers(members.filter((m) => m.id !== memberId))
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to remove member." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    }
  }

  const handleTransferOwnership = async () => {
    if (!transferMember) return
    setTransferring(true)
    try {
      const res = await fetch("/api/tenant/transfer-ownership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: transferMember.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "success", title: "Ownership Transferred", description: `Ownership transferred to ${transferMember.user.firstName}.` })
        setTransferMember(null)
        await loadTenantContext()
        await fetchData()
      } else {
        toast({ variant: "destructive", title: "Transfer Failed", description: data.message || "Failed to transfer ownership." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    } finally {
      setTransferring(false)
    }
  }

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameWorkspaceName.trim()) return
    setRenaming(true)
    try {
      const res = await fetch("/api/tenant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameWorkspaceName.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "success", title: "Workspace Renamed", description: `Workspace renamed to ${data.data.name}.` })
        setShowRenameModal(false)
        await loadTenantContext()
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to rename workspace." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    } finally {
      setRenaming(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return
    setCreatingWorkspace(true)
    try {
      const res = await fetch("/api/tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "success", title: "Workspace Created", description: `Workspace "${data.data.name}" created.` })
        setShowCreateModal(false)
        setNewWorkspaceName("")
        await loadTenantContext()
        if (data.data?.id) {
          await switchTenant(data.data.id)
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to create workspace." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    } finally {
      setCreatingWorkspace(false)
    }
  }

  const handleLeaveWorkspace = async () => {
    if (!confirm("Are you sure you want to leave this workspace?")) return
    try {
      const res = await fetch("/api/tenant/leave", { method: "POST" })
      const data = await res.json()
      if (res.ok && data.success) {
        toast({ variant: "info", title: "Workspace Left", description: "You have left the workspace." })
        await loadTenantContext()
        window.location.reload()
      } else {
        toast({ variant: "destructive", title: "Error", description: data.message || "Failed to leave workspace." })
      }
    } catch {
      toast({ variant: "destructive", title: "Network Error", description: "Please try again." })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast({ variant: "success", title: "Link Copied", description: "Invite link copied to clipboard." })
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 lg:p-6">
      {/* Workspace Header Card */}
      <div className="bg-card rounded-lg p-6 text-foreground border border-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-md bg-info-soft border border-info/30 flex items-center justify-center text-info">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  {activeTenant?.name || "My Workspace"}
                </h1>
                <Badge variant="outline" className={`${ROLE_COLORS[currentRole || "OWNER"]} text-xs font-semibold px-2.5 py-0.5 rounded`}>
                  {currentRole || "MEMBER"}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs mt-1 font-mono">
                Slug: {activeTenant?.slug || "personal"} • ID: {activeTenantId}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRenameWorkspaceName(activeTenant?.name || "")
                  setShowRenameModal(true)
                }}
                className="bg-muted border-border text-foreground hover:bg-muted text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Rename
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-muted border-border text-foreground hover:bg-muted text-xs"
            >
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> New Workspace
            </Button>
            {canManageMembers && (
              <Button
                size="sm"
                onClick={() => {
                  setLatestInviteLink(null)
                  setShowInviteModal(true)
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Invite Teammate
              </Button>
            )}
            {!isOwner && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeaveWorkspace}
                className="text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Leave Workspace
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Plan Entitlements & Usage Overview */}
      {entitlements && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" /> Active Plan & Limits
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Plan entitlements and real-time usage for this workspace
                </CardDescription>
              </div>
              <Badge className={entitlements.active ? "bg-success text-white" : "bg-destructive text-white"}>
                {entitlements.plan || "Free / Base"} • {entitlements.active ? "Active" : "Expired"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(entitlements.usage || {}).map(([key, u]) => (
                <div key={key} className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-xs font-medium text-muted-foreground block mb-1">
                    {key.replace(/_/g, " ")}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-foreground">{u.used}</span>
                    <span className="text-xs text-muted-foreground">/ {u.limit === null ? "Unlimited" : u.limit}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Section */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Team Members ({members.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                People with access to manage products, categories, orders, and AI profiles in this workspace.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading members...
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No members found in this workspace.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-background text-muted-foreground text-xs font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Member</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((member) => {
                    const isSelf = member.userId === user?.id
                    return (
                      <tr key={member.id} className="hover:bg-muted transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-info-soft text-info font-bold flex items-center justify-center text-xs">
                            {member.user.firstName?.[0] || member.user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div>
                              {member.user.firstName} {member.user.lastName} {isSelf && <span className="text-xs text-primary font-semibold">(You)</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">@{member.user.username}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">{member.user.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`${ROLE_COLORS[member.role]} text-xs font-semibold px-2 py-0.5`}>
                            {member.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={member.status === "ACTIVE" ? "outline" : "secondary"} className={member.status === "ACTIVE" ? "text-success bg-success-soft border-success/30 text-xs" : "text-muted-foreground text-xs"}>
                            {member.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {canManageMembers && member.role !== "OWNER" && !isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 text-xs">
                                <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "ADMIN")}>Make Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "MANAGER")}>Make Manager</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "AGENT")}>Make Agent</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateMemberRole(member.id, "VIEWER")}>Make Viewer</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleToggleMemberStatus(member)}>
                                  {member.status === "ACTIVE" ? "Disable Access" : "Enable Access"}
                                </DropdownMenuItem>
                                {isOwner && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setTransferMember(member)} className="text-warning font-medium">
                                      <Crown className="h-3.5 w-3.5 mr-2" /> Transfer Ownership
                                    </DropdownMenuItem>
                                  </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRemoveMember(member.id)} className="text-destructive font-medium">
                                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from Team
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Invites Section */}
      {canManageMembers && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4 text-warning" /> Pending Invitations ({invites.length})
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Invitations waiting to be accepted by recipient email addresses.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invites.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-xs">No pending invitations.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-background text-muted-foreground text-xs font-semibold border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Invited Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Expires At</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {invites.map((invite) => (
                      <tr key={invite.id} className="hover:bg-muted">
                        <td className="py-3 px-4 text-xs font-medium text-foreground">{invite.email}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={`${ROLE_COLORS[invite.role]} text-xs`}>
                            {invite.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {new Date(invite.expiresAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive-soft text-xs h-7 px-2"
                          >
                            Revoke
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Invite Team Member</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Send an email invitation to join <strong>{activeTenant?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          {latestInviteLink ? (
            <div className="space-y-4 py-3">
              <Alert className="bg-success-soft border-success/30 text-success">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <AlertDescription className="text-xs">
                  Invitation created! Outside production, you can copy the direct invitation link:
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-2 bg-muted p-2 rounded-lg border border-border">
                <input
                  readOnly
                  value={latestInviteLink}
                  className="bg-transparent text-xs text-foreground flex-1 outline-none font-mono"
                />
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(latestInviteLink)}
                  className="h-7 px-2 text-xs bg-muted hover:bg-muted text-foreground"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowInviteModal(false)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSendInvite} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="inviteEmail" className="text-xs font-semibold text-foreground">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  required
                  placeholder="colleague@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inviteRole" className="text-xs font-semibold text-foreground">Role & Access Level</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="inviteRole" className="text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="ADMIN">ADMIN — Full management access</SelectItem>
                    <SelectItem value="MANAGER">MANAGER — Products, orders & catalogs</SelectItem>
                    <SelectItem value="AGENT">AGENT — Orders & customer messages</SelectItem>
                    <SelectItem value="VIEWER">VIEWER — Read-only visibility</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowInviteModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={inviting} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                  {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <UserPlus className="h-3.5 w-3.5 mr-1.5" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Rename Workspace Dialog */}
      <Dialog open={showRenameModal} onOpenChange={setShowRenameModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Rename Workspace</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the display name of your workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="renameName" className="text-xs font-semibold text-foreground">Workspace Name</Label>
              <Input
                id="renameName"
                required
                minLength={2}
                maxLength={80}
                value={renameWorkspaceName}
                onChange={(e) => setRenameWorkspaceName(e.target.value)}
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowRenameModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={renaming} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                {renaming ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Create New Workspace</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an additional workspace/store under your account. You will be its Owner.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wsName" className="text-xs font-semibold text-foreground">Workspace Name</Label>
              <Input
                id="wsName"
                required
                minLength={2}
                maxLength={80}
                placeholder="e.g. Dhaka Storefront"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="text-xs"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creatingWorkspace} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">
                {creatingWorkspace ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Dialog */}
      <Dialog open={Boolean(transferMember)} onOpenChange={(open) => !open && setTransferMember(null)}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Transfer Workspace Ownership
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to transfer ownership of <strong>{activeTenant?.name}</strong> to{" "}
              <strong>{transferMember?.user.firstName} {transferMember?.user.lastName}</strong>? You will no longer be the Owner.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setTransferMember(null)} className="text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={transferring}
              onClick={handleTransferOwnership}
              className="text-xs bg-marigold hover:bg-marigold/85 text-ink"
            >
              {transferring ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
