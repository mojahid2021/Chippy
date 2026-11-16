"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Inbox, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/page-header"
import { MessengerInbox } from "@/components/messenger/inbox"
import type { MessengerWebhook } from "@/lib/types/woombat"

// Each inbox belongs to one connected page (webhook); it has no meaning without one.
export default function PageInbox() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState<MessengerWebhook | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/v1/messenger/webhooks/${encodeURIComponent(id)}`)
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || !json.data) throw new Error(json.message || "This page isn’t connected anymore.")
        setPage(json.data as MessengerWebhook)
      })
      .catch((e: Error) => setError(e.message))
  }, [id])

  return (
    // Bleed past <main>'s padding so the inbox fills the whole workspace below the top bar.
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3rem)] sm:-mx-6 lg:-mx-8 lg:-my-8 lg:h-[calc(100dvh-4rem-2px)]">
      {error ? (
        <div className="m-auto w-full max-w-md p-4">
          <EmptyState
            icon={<Inbox />}
            title="This inbox didn’t open"
            body={error}
            action={<Button asChild><Link href="/dashboard/messenger">Back to Messenger</Link></Button>}
          />
        </div>
      ) : !page ? (
        <div className="m-auto flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Opening inbox
        </div>
      ) : (
        <MessengerInbox webhook={page} />
      )}
    </div>
  )
}
