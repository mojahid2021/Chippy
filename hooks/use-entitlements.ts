"use client"

import { useState, useEffect, useCallback } from "react"
import { useUserStore } from "@/lib/stores/userStore"

export interface EntitlementsData {
  active: boolean
  gracePeriod: boolean
  graceEndsAt: string | null
  reason: string | null
  plan: string | null
  endsAt: string | null
  features: Record<string, boolean>
  usage: Record<string, { used: number; limit: number | null }>
}

export function useEntitlements() {
  const { activeTenantId } = useUserStore()
  const [data, setData] = useState<EntitlementsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntitlements = useCallback(async () => {
    if (!activeTenantId) return
    setLoading(true)
    try {
      const res = await fetch("/api/tenant/entitlements", { method: "GET" })
      const json = await res.json()
      if (res.ok && json.success) {
        setData(json.data)
      } else {
        setError(json.message || "Failed to load entitlements")
      }
    } catch {
      setError("Network error while loading entitlements")
    } finally {
      setLoading(false)
    }
  }, [activeTenantId])

  useEffect(() => {
    void fetchEntitlements()
  }, [fetchEntitlements])

  const hasFeature = (feature: string): boolean => {
    if (!data) return true // optimistic fallback
    return Boolean(data.active && data.features?.[feature])
  }

  const isLimitReached = (limitKey: string): boolean => {
    if (!data || !data.usage?.[limitKey]) return false
    const u = data.usage[limitKey]
    if (u.limit === null) return false // unlimited
    return u.used >= u.limit
  }

  const getUsageInfo = (limitKey: string) => {
    if (!data || !data.usage?.[limitKey]) {
      return { used: 0, limit: null, percent: 0, isNear: false, isFull: false }
    }
    const { used, limit } = data.usage[limitKey]
    if (limit === null) {
      return { used, limit: null, percent: 0, isNear: false, isFull: false }
    }
    const percent = Math.min(Math.round((used / limit) * 100), 100)
    return {
      used,
      limit,
      percent,
      isNear: percent >= 80 && percent < 100,
      isFull: percent >= 100,
    }
  }

  return {
    entitlements: data,
    loading,
    error,
    refresh: fetchEntitlements,
    hasFeature,
    isLimitReached,
    getUsageInfo,
    isActive: Boolean(data?.active),
    isGracePeriod: Boolean(data?.gracePeriod),
    planName: data?.plan || "Free",
  }
}
