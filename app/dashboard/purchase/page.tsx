"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, ArrowRight, Check, Sparkles, Shield, Zap, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import type { SubscriptionPlan, UserSubscription } from '@/lib/types/woombat'

export default function PurchasePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams?.get('planId')

  const [plan, setPlan] = useState<SubscriptionPlan | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchingPlan, setFetchingPlan] = useState(true)
  const [autoRenew, setAutoRenew] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setFetchingPlan(true)
        const [plansRes, subRes] = await Promise.all([
          fetch('/api/v1/subscriptions/plans'),
          fetch('/api/v1/subscriptions/current').catch(() => null),
        ])

        const plansJson = await plansRes.json()
        if (plansRes.ok && Array.isArray(plansJson.data)) {
          if (planId) {
            const found = plansJson.data.find((p: SubscriptionPlan) => p.id === planId)
            setPlan(found || null)
          } else if (plansJson.data.length > 0) {
            setPlan(plansJson.data[0])
          }
        }

        if (subRes && subRes.ok) {
          const subJson = await subRes.json()
          if (subJson.data) {
            setCurrentSubscription(subJson.data)
          }
        }
      } catch (err) {
        console.error('Error loading subscription details:', err)
      } finally {
        setFetchingPlan(false)
      }
    }

    load()
  }, [planId])

  const confirmSubscription = async () => {
    if (!plan) {
      toast({ variant: 'destructive', title: 'Missing Plan', description: 'Please select a valid plan' })
      return
    }

    try {
      setLoading(true)

      const isPlanChange = !!currentSubscription && currentSubscription.status === 'ACTIVE'
      const endpoint = isPlanChange ? '/api/v1/subscriptions/change-plan' : '/api/v1/subscriptions/subscribe'
      const payload = isPlanChange
        ? { newPlanId: plan.id, autoRenew }
        : { planId: plan.id, autoRenew }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to process subscription')
      }

      toast({
        variant: 'success',
        title: isPlanChange ? 'Plan Updated' : 'Subscription Created',
        description: data.message || `Successfully enrolled into ${plan.name}.`,
      })

      router.push('/dashboard/subscription')
    } catch (err) {
      console.error('Subscription error:', err)
      toast({
        variant: 'destructive',
        title: 'Subscription Failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount)
  }

  if (fetchingPlan) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading plan details...</span>
      </div>
    )
  }

  const isCurrentPlan = currentSubscription?.planId === plan?.id

  return (
    <div className="max-w-2xl mx-auto space-y-3.5 py-1">
      <div className="flex items-center gap-2">
        <Link 
          href="/dashboard/subscription" 
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" /> Back to Subscriptions
        </Link>
      </div>

      <Card className="border-border bg-card shadow-sm py-0 gap-0">
        <CardHeader className="border-b border-border pb-2.5 pt-3 px-3.5 sm:px-4">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            {currentSubscription ? 'Update Subscription' : 'Review & Confirm Subscription'}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {currentSubscription
              ? 'Switch your billing plan to the selected tier.'
              : 'Complete your subscription enrollment to access premium merchant features.'}
          </p>
        </CardHeader>
        <CardContent className="pt-3 pb-3.5 px-3.5 sm:px-4">
          {plan ? (
            <div className="space-y-3.5">
              {/* Plan Overview Card */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-info-soft flex items-center justify-center text-primary shrink-0">
                      {plan.price > 20 ? <Shield className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-foreground">
                      {formatCurrency(plan.price, plan.currency)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      /{plan.interval}
                    </p>
                  </div>
                </div>

                {plan.trialDays > 0 && (
                  <div className="pt-1.5 border-t border-border/60">
                    <Badge className="bg-success-soft text-success border-success/30 text-[10px] py-0 px-1.5">
                      <Sparkles className="h-2.5 w-2.5 mr-1" />
                      Includes {plan.trialDays}-day free trial with initial $0 invoice
                    </Badge>
                  </div>
                )}
              </div>

              {/* Plan Features */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Features Included
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-0.5">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs">
                      <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                      <span className="text-foreground/90">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Renew Setting */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">Enable Automatic Renewal</p>
                  <p className="text-[11px] text-muted-foreground">
                    Automatically renew billing at the end of each {plan.interval?.toLowerCase() || 'period'}.
                  </p>
                </div>
                <Switch 
                  checked={autoRenew} 
                  onCheckedChange={setAutoRenew} 
                />
              </div>

              {/* Summary note */}
              <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border">
                {plan.trialDays > 0 ? (
                  <p className="text-[11px]">
                    Your subscription will start in <strong>TRIALING</strong> status for {plan.trialDays} days. An initial invoice of $0 will be generated immediately.
                  </p>
                ) : (
                  <p className="text-[11px]">
                    Your subscription will start immediately in <strong>ACTIVE</strong> status.
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  onClick={confirmSubscription}
                  disabled={loading || isCurrentPlan}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Processing...
                    </>
                  ) : isCurrentPlan ? (
                    'Already Subscribed to This Plan'
                  ) : currentSubscription ? (
                    <>
                      Confirm Plan Change <ArrowRight className="h-3 w-3 ml-1.5" />
                    </>
                  ) : (
                    <>
                      Start Subscription <ArrowRight className="h-3 w-3 ml-1.5" />
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => router.push('/dashboard/subscription')}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-muted-foreground">Plan not found.</p>
              <Button 
                variant="outline" 
                size="sm"
                className="h-7 text-xs"
                onClick={() => router.push('/dashboard/subscription')}
              >
                Back to Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
