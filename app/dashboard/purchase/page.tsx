"use client"

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import { useUserStore } from '@/lib/stores/userStore'
import { toast } from '@/hooks/use-toast'

// Minimal plan type used by purchase page
type PlanType = {
  id: string
  name: string
  description?: string
  price: number
  currency?: string
  interval?: string
  isActive?: boolean
  isPopular?: boolean
}

export default function PurchasePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const planId = searchParams?.get('planId')
  const { token } = useUserStore()

  const [plan, setPlan] = useState<PlanType | null>(null)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'card'>('bank_transfer')

  useEffect(() => {
    // load plans and find matching plan
    const load = async () => {
      try {
        const res = await fetch('/api/public/plans?sortBy=createdAt&sortOrder=desc')
        const data = await res.json()
          if (data?.success && data?.data?.plans) {
            if (planId) {
              const found = data.data.plans.find((p: PlanType) => p.id === planId)
              setPlan(found || null)
            }
          }
      } catch (err) {
        console.error('Error loading plans on purchase page', err)
      }
    }

    load()
  }, [planId])

  const confirmPurchase = async () => {
    if (!planId) {
      toast({ variant: 'destructive', title: 'Missing plan', description: 'No plan selected' })
      return
    }

    if (!token) {
      toast({ variant: 'destructive', title: 'Not authenticated', description: 'Please sign in to continue' })
      return
    }

    try {
      setLoading(true)
      const res = await fetch('/api/user/purchase-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, paymentMethod: method }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Purchase request failed')
      }

      if (data.success && data.data) {
        // If backend returned a checkout/redirect URL, follow it
        const redirectUrl = data.data.checkoutUrl || data.data.redirectUrl || data.data.url || data.data.paymentUrl
        if (redirectUrl) {
          window.location.href = redirectUrl
          return
        }

        // If the chosen method is bank_transfer, backend should provide a subscription id
        // Try multiple possible fields that may contain the id
        const subscriptionId = data.data.subscriptionId || data.data.subscription?.id || data.data.id || data.data.subscription?.subscriptionId

        if (method === 'bank_transfer' && subscriptionId) {
          // Navigate to internal bank transfer page which shows bank details and instructions
          router.push(`/dashboard/bank-transfer/${subscriptionId}`)
          return
        }

        // Otherwise show success and return to subscription page
        toast({ variant: 'success', title: 'Purchase initiated', description: data.message || 'Purchase request submitted' })
        router.push('/dashboard/subscription')
      } else {
        throw new Error(data.message || 'Purchase failed')
      }
    } catch (err) {
      console.error('Purchase error', err)
      toast({ variant: 'destructive', title: 'Purchase failed', description: err instanceof Error ? err.message : 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Complete Purchase</CardTitle>
        </CardHeader>
        <CardContent>
          {plan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">Tk {plan.price}</p>
                  <p className="text-xs text-muted-foreground">/{plan.interval === 'yearly' ? 'year' : 'month'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">Choose payment method</p>
                <div className="flex gap-2 mt-2">
                  <button
                    className={`px-3 py-2 rounded-md border ${method === 'bkash' ? 'border-primary bg-info-soft' : 'border-border'}`}
                    onClick={() => setMethod('bkash')}
                  >
                    bKash
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md border ${method === 'nagad' ? 'border-primary bg-info-soft' : 'border-border'}`}
                    onClick={() => setMethod('nagad')}
                  >
                    Nagad
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md border ${method === 'rocket' ? 'border-primary bg-info-soft' : 'border-border'}`}
                    onClick={() => setMethod('rocket')}
                  >
                    Rocket
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md border ${method === 'bank_transfer' ? 'border-primary bg-info-soft' : 'border-border'}`}
                    onClick={() => setMethod('bank_transfer')}
                  >
                    Bank Transfer
                  </button>
                  <button
                    className={`px-3 py-2 rounded-md border ${method === 'card' ? 'border-primary bg-info-soft' : 'border-border'}`}
                    onClick={() => setMethod('card')}
                  >
                    Card
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  className="flex-1"
                  onClick={confirmPurchase}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>
                      Confirm & Continue <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.push('/dashboard/subscription')}>Cancel</Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>By continuing you will be redirected to complete payment via the selected provider.</p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No plan selected or plan not found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
