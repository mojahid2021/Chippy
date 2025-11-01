"use client"

import { useState, useEffect, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useUserStore } from "@/lib/stores/userStore"
import {
  Check,
  Crown,
  ArrowLeft,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle,
  Building2,
  Smartphone
} from "lucide-react"

// Plan interface (same as in plans page)
interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  features: string[]
  maxUsers: number
  maxStorageGB: number
  maxProjects: number
  isActive: boolean
  isPopular: boolean
  trialDays: number
  createdAt: string
  updatedAt: string
  annualPrice: number
}

// Purchase request interface
interface PurchaseRequest {
  planId: string
  paymentMethod: string
  paymentReference?: string
  autoRenew: boolean
}

// Purchase response interface
interface PurchaseResponse {
  success: boolean
  data?: {
    id: string
    planId: string
    paymentMethod: string
    paymentStatus: string
    paymentReference?: string
    amount: number
    currency: string
    startDate: string
    endDate: string
    isActive: boolean
    autoRenew: boolean
    durationDays: number
    bankTransferInfo?: {
      paymentUrl: string
      instructions: string
      amount: number
      currency: string
      reference: string
      bankDetails: {
        accountName: string
        accountNumber: string
        bankName: string
        branch: string
        routingNumber: string
        swiftCode: string
      }
    }
  }
  message: string
  timestamp: string
  error?: string
}

interface PurchasePageProps {
  params: Promise<{ planId: string }>
}

const paymentMethods = [
  { value: 'bkash', label: 'bKash', icon: Smartphone, description: 'Pay with bKash mobile wallet' },
  { value: 'nagad', label: 'Nagad', icon: Smartphone, description: 'Pay with Nagad mobile wallet' },
  { value: 'rocket', label: 'Rocket', icon: Smartphone, description: 'Pay with Rocket mobile wallet' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building2, description: 'Direct bank transfer' },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, description: 'Pay with credit or debit card' },
]

export default function PurchasePage({ params }: PurchasePageProps) {
  const router = useRouter()
  const { planId } = use(params) // Unwrap the params Promise and destructure
  const { token, user } = useUserStore()
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<PurchaseResponse | null>(null)

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [paymentReference, setPaymentReference] = useState<string>('')
  const [autoRenew, setAutoRenew] = useState<boolean>(false)

  const fetchPlanDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/public/plans/${planId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch plan details')
      }

      if (data.success && data.data) {
        setPlan(data.data)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching plan details')
      console.error('Error fetching plan details:', err)
    } finally {
      setLoading(false)
    }
  }, [planId])

  useEffect(() => {
    fetchPlanDetails()
  }, [fetchPlanDetails])

  // Check authentication
  useEffect(() => {
    if (!token) {
      router.push('/auth/signin')
    }
  }, [token, router])

  const handlePurchase = async () => {
    if (!plan || !paymentMethod) {
      setError('Please select a payment method')
      return
    }

    if (!token) {
      setError('You must be logged in to make a purchase')
      router.push('/auth/signin')
      return
    }

    try {
      setPurchasing(true)
      setError(null)
      setSuccess(null)

      const purchaseData: PurchaseRequest = {
        planId: plan.id,
        paymentMethod,
        autoRenew,
      }

      if (paymentReference.trim()) {
        purchaseData.paymentReference = paymentReference.trim()
      }

      const response = await fetch('/api/user/purchase-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(purchaseData),
      })

      const data: PurchaseResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Purchase failed')
      }

      setSuccess(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during purchase')
      console.error('Purchase error:', err)
    } finally {
      setPurchasing(false)
    }
  }

  const formatPrice = (price: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatInterval = (interval: string, intervalCount: number) => {
    if (intervalCount === 1) {
      return `per ${interval.slice(0, -2)}` // Remove 'ly' from monthly/yearly
    }
    return `every ${intervalCount} ${interval.slice(0, -2)}s`
  }

  // Check authentication first
  if (!token) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-4">You must be logged in to purchase a plan.</p>
            <Button onClick={() => router.push('/auth/signin')} className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (error && !plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Plan</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Plan Not Found</h3>
            <p className="text-gray-600 mb-4">The requested plan could not be found.</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="space-y-6">
        {/* Success Header */}
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Initiated!</h1>
          <p className="text-gray-600">{success.message}</p>
        </div>

        {/* Purchase Details */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Plan</Label>
                <p className="font-medium">{plan.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Amount</Label>
                <p className="font-medium">{formatPrice(success.data!.amount, success.data!.currency)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                <p className="font-medium">{success.data!.paymentMethod}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge variant={success.data!.paymentStatus === 'pending' ? 'secondary' : 'default'}>
                  {success.data!.paymentStatus}
                </Badge>
              </div>
            </div>

            {success.data!.startDate && success.data!.endDate && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium text-gray-600">Subscription Period</Label>
                <p className="text-sm text-gray-600">
                  {new Date(success.data!.startDate).toLocaleDateString()} - {new Date(success.data!.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Transfer Instructions */}
        {success.data!.bankTransferInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Bank Transfer Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">{success.data!.bankTransferInfo.instructions}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount to Transfer</Label>
                  <p className="font-medium text-lg">{formatPrice(success.data!.bankTransferInfo.amount, success.data!.bankTransferInfo.currency)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Reference Number</Label>
                  <p className="font-mono text-sm">{success.data!.bankTransferInfo.reference}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Bank Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Account Name:</span>
                    <p className="font-medium">{success.data!.bankTransferInfo.bankDetails.accountName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Account Number:</span>
                    <p className="font-mono font-medium">{success.data!.bankTransferInfo.bankDetails.accountNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Bank Name:</span>
                    <p className="font-medium">{success.data!.bankTransferInfo.bankDetails.bankName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Branch:</span>
                    <p className="font-medium">{success.data!.bankTransferInfo.bankDetails.branch}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Routing Number:</span>
                    <p className="font-mono font-medium">{success.data!.bankTransferInfo.bankDetails.routingNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">SWIFT Code:</span>
                    <p className="font-mono font-medium">{success.data!.bankTransferInfo.bankDetails.swiftCode}</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => router.push(`/dashboard/bank-transfer/${success.data!.id}`)}
              >
                Submit Transfer Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex space-x-4">
          <Button onClick={() => router.push('/dashboard')} className="flex-1">
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/plans')} className="flex-1">
            View All Plans
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Plan</h1>
          <p className="text-gray-600">Complete your subscription purchase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                </div>
                {plan.isPopular && (
                  <Badge className="bg-blue-100 text-blue-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-baseline space-x-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600">
                    /{formatInterval(plan.interval, plan.intervalCount)}
                  </span>
                </div>

                {plan.trialDays > 0 && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    {plan.trialDays} days free trial included
                  </Badge>
                )}
              </div>

              {/* Plan Limits */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.maxUsers === -1 ? '∞' : plan.maxUsers}
                  </div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.maxStorageGB === -1 ? '∞' : `${plan.maxStorageGB}GB`}
                  </div>
                  <div className="text-sm text-gray-600">Storage</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {plan.maxProjects === -1 ? '∞' : plan.maxProjects}
                  </div>
                  <div className="text-sm text-gray-600">Projects</div>
                </div>
              </div>

              {/* Features */}
              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">What&apos;s included:</h4>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="space-y-2">
                <Label htmlFor="payment-method">Payment Method *</Label>
                <select
                  id="payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Reference */}
              <div className="space-y-2">
                <Label htmlFor="payment-reference">Payment Reference (Optional)</Label>
                <Input
                  id="payment-reference"
                  placeholder="Transaction ID, reference number, etc."
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Add a reference number to help track your payment
                </p>
              </div>

              {/* Auto Renew */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto-renew"
                  checked={autoRenew}
                  onCheckedChange={(checked) => setAutoRenew(checked as boolean)}
                />
                <Label htmlFor="auto-renew" className="text-sm">
                  Auto-renew subscription
                </Label>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(plan.price, plan.currency)}</span>
                </div>
              </div>

              {/* Purchase Button */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handlePurchase}
                disabled={purchasing || !paymentMethod}
              >
                {purchasing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Complete Purchase
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}