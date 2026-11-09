"use client"

import { useState, useEffect, useCallback } from "react"
import Link from 'next/link'
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Check, 
  Crown, 
  Calendar,
  CreditCard,
  Download,
  TrendingUp,
  Users,
  Zap,
  Shield,
  ArrowRight,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Loader2,
  AlertCircle,
  Building2
} from "lucide-react"
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/userStore'
import { usePermissions } from '@/hooks/use-permissions'
import { toast } from '@/hooks/use-toast'

// Transaction interface matching API response
interface Transaction {
  id: string
  type: string
  subscriptionId: string
  accountNumber: string
  transactionId: string
  amount: number
  currency: string
  status: 'pending' | 'verifying' | 'completed' | 'failed'
  submittedAt: string
  verifiedAt: string | null
  notes: string | null
  subscription: {
    id: string
    plan: {
      id: string
      name: string
      price: number
      interval: string
    }
    startDate: string
    endDate: string
    isActive: boolean
  }
}

// Subscription interface matching API response
interface Subscription {
  id: string
  planId: string
  planName: string
  paymentMethod: string
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount: number
  currency: string
  startDate: string
  endDate: string
  isActive: boolean
  autoRenew: boolean
  plan: {
    id: string
    name: string
    description: string
    price: number
    currency: string
    interval: 'monthly' | 'yearly'
    intervalCount: number
    features: string[]
    maxUsers: number
    maxStorageGB: number
    maxProjects: number
    isActive: boolean
    isPopular: boolean
    trialDays: number
    duration: number
  }
}

// API Response interfaces
interface TransactionsResponse {
  success: boolean
  data: {
    transactions: Transaction[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message: string
  timestamp: string
}

interface SubscriptionResponse {
  success: boolean
  data: {
    hasSubscription: boolean
    message: string
    subscription?: Subscription
  }
  message: string
  timestamp: string
}

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
  annualPrice?: number
}

interface PlansResponse {
  success: boolean
  data: {
    plans: Plan[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }
  message: string
  timestamp: string
}

const statusConfig = {
  completed: { color: 'bg-success-soft text-success', icon: CheckCircle },
  pending: { color: 'bg-warning-soft text-warning', icon: Clock },
  verifying: { color: 'bg-info-soft text-info', icon: Clock },
  failed: { color: 'bg-destructive-soft text-destructive', icon: XCircle },
}

export default function SubscriptionPage() {
  const { token, activeTenantId } = useUserStore()
  const { canManageBilling } = usePermissions()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean>(false)
  const [plans, setPlans] = useState<Plan[]>([])
  
  // Fetch subscription from API
  const fetchSubscription = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data: SubscriptionResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subscription')
      }

      if (data.success && data.data) {
        setHasSubscription(data.data.hasSubscription)
        setSubscription(data.data.subscription || null)
        
        if (data.data.hasSubscription && data.data.subscription) {
          toast({
            variant: "success",
            title: "Subscription Loaded",
            description: `Your ${data.data.subscription.plan.name} plan is active`,
          })
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      toast({
        variant: "destructive",
        title: "Error Loading Subscription",
        description: err instanceof Error ? err.message : "Failed to load subscription data",
      })
    }
  }, [token])
  
  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      })

      const response = await fetch(`/api/user/transactions?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data: TransactionsResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions')
      }

      if (data.success && data.data) {
        setTransactions(data.data.transactions)
        toast({
          variant: "info",
          title: "Transactions Loaded",
          description: `Found ${data.data.transactions.length} recent transactions`,
        })
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching transactions')
      console.error('Error fetching transactions:', err)
      toast({
        variant: "destructive",
        title: "Error Loading Transactions",
        description: err instanceof Error ? err.message : "Failed to load transaction history",
      })
    } finally {
      setLoading(false)
    }
  }, [token])

  // Fetch plans from API
  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/public/plans?sortBy=createdAt&sortOrder=desc')
      const data: PlansResponse = await response.json()

      if (data.success && data.data) {
        setPlans(data.data.plans.filter(plan => plan.isActive))
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
    }
  }, [])

  // Initial load - fetch both subscription and transactions
  useEffect(() => {
    fetchSubscription()
    fetchTransactions()
    fetchPlans()
  }, [fetchSubscription, fetchTransactions, fetchPlans, activeTenantId])

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  
  // Current subscription data - only use real data, no mock data
  const currentSubscription = subscription ? {
    plan: subscription.plan.name,
    status: subscription.isActive ? 'active' : 'inactive',
    amount: subscription.plan.price,
    currency: subscription.plan.currency,
    billingDate: new Date(subscription.endDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }),
    daysLeft: getDaysUntilExpiry(subscription.endDate),
    usage: {
      orders: { current: 847, limit: 1000 },
      conversations: { current: 3240, limit: 5000 },
      aiMessages: { current: 12580, limit: 20000 },
    }
  } : null

  // Available plans - now fetched from API
  // const plans = [ ... ] // Removed hardcoded plans

  const getPrice = (plan: Plan) => {
    // For monthly plans, show monthly price
    // For yearly plans, show yearly price if available, otherwise calculate
    if (plan.interval === 'yearly') {
      return plan.annualPrice || plan.price
    }
    return plan.price
  }

  const getTotalPrice = (plan: Plan) => {
    if (plan.interval === 'yearly') {
      return plan.annualPrice || plan.price
    }
    // For monthly plans, calculate yearly equivalent
    return plan.annualPrice || (plan.price * 12)
  }

  const getIconForPlan = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return Zap
      case 'professional':
        return Crown
      case 'enterprise':
        return Shield
      default:
        return Zap
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscription</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your plan and billing</p>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          Manage Billing
        </Button>
      </div> */}

      {/* Show message if no subscription */}
      {!hasSubscription && subscription === null && (
        <Card className="border-info/30 bg-info-soft">
          <div className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-info-soft flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">No active subscription</p>
              <p className="text-xs text-muted-foreground">Choose a plan below to get started with premium features</p>
            </div>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary/90"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            >
              View Plans
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Current Subscription Overview - Only show when user has an active subscription */}
      {hasSubscription && currentSubscription && (
        <Card className="border-border overflow-hidden bg-card">
          <div className="bg-card border-b border-border p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-md bg-info-soft border border-info/30 flex items-center justify-center text-info">
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <Badge className="bg-info-soft text-info border-info/30 mb-1 rounded">Active</Badge>
                  <h2 className="text-xl font-bold text-foreground">{currentSubscription.plan} Plan</h2>
                  <p className="text-sm text-pop">Your subscription is active and running smoothly</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-pop">Next billing</p>
                <p className="text-lg font-bold text-foreground">{currentSubscription.billingDate}</p>
                <p className="text-xs text-pop">{currentSubscription.daysLeft} days left</p>
              </div>
            </div>
          </div>
          

        </Card>
      )}

      {/* Available Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Available Plans</h2>
            <p className="text-sm text-muted-foreground">Choose the perfect plan for your business</p>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly
              <Badge className="ml-1.5 bg-success-soft text-success text-xs px-1">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = getIconForPlan(plan.name)
            const isCurrentPlan = subscription?.planId === plan.id
            
            return (
              <Card 
                key={plan.id}
                className={`relative border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan 
                    ? 'border-pop bg-pop-soft' 
                    : plan.isPopular 
                      ? 'border-primary/30' 
                      : 'border-border'
                }`}
              >
                {plan.isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-pop text-white px-3 py-0.5 shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-white" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-success text-white px-3 py-0.5 shadow-lg">
                      <Check className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">
                        Tk {getPrice(plan)}
                      </span>
                      <span className="text-sm text-muted-foreground">/{plan.interval === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.interval === 'monthly' && plan.annualPrice && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Tk {getTotalPrice(plan)} billed annually
                      </p>
                    )}
                  </div>

                  {isCurrentPlan ? (
                    <Button
                      className="w-full mb-4 bg-muted hover:bg-muted"
                      variant="default"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Link href={`/dashboard/purchase?planId=${plan.id}`}>
                      <Button
                        className="w-full mb-4"
                        variant="default"
                      >
                        {!hasSubscription ? (
                          <>Purchase <ArrowRight className="h-4 w-4 ml-1" /></>
                        ) : (() => {
                          const currentPlanPrice = subscription?.plan.price || 0
                          const targetPlanPrice = plan.price

                          if (targetPlanPrice > currentPlanPrice) {
                            return <>Upgrade <ArrowRight className="h-4 w-4 ml-1" /></>
                          } else if (targetPlanPrice < currentPlanPrice) {
                            return <>Downgrade <ArrowRight className="h-4 w-4 ml-1" /></>
                          } else {
                            return <>Change Plan <ArrowRight className="h-4 w-4 ml-1" /></>
                          }
                        })()}
                      </Button>
                    </Link>
                  )}

                  <div className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span className="text-xs text-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <div className="text-xs text-muted-foreground">
                        +{plan.features.length - 4} more features
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Transaction History</h3>
            <p className="text-xs text-muted-foreground">View all your payment transactions and invoices</p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading transactions...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div className="mt-2 text-center">
                  <p className="text-destructive font-medium">Error loading transactions</p>
                  <p className="text-muted-foreground text-sm">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={fetchTransactions}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="mt-2 text-center">
                  <p className="text-muted-foreground font-medium">No transactions found</p>
                  <p className="text-muted-foreground text-sm">Your payment history will appear here</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((transaction) => {
                  const statusInfo = statusConfig[transaction.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <div key={transaction.id} className="py-3 hover:bg-muted transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Side - Icon and Details */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-foreground">
                                {transaction.subscription.plan.name}
                              </p>
                              <Badge className={cn('text-xs flex items-center gap-1', statusInfo.color)}>
                                <StatusIcon className="h-3 w-3" />
                                <span className="capitalize">{transaction.status}</span>
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-0.5">
                              TXN: {transaction.transactionId}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Account: ****{transaction.accountNumber.slice(-4)} • {formatDate(transaction.submittedAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.subscription.plan.interval} plan
                            </p>
                          </div>
                        </div>

                        {/* Right Side - Amount and Actions */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                toast({
                                  variant: "info",
                                  title: "Transaction Details",
                                  description: `Viewing details for transaction ${transaction.transactionId}`,
                                })
                              }}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                toast({
                                  variant: "success",
                                  title: "Receipt Downloaded",
                                  description: `Receipt for ${formatCurrency(transaction.amount, transaction.currency)} is being downloaded`,
                                })
                              }}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Receipt
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Payment Info */}
        <Card className="border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Payment Method</h3>
            <p className="text-xs text-muted-foreground">Manage your billing details</p>
          </div>
          <div className="p-4 space-y-4">
            {transactions.length > 0 ? (() => {
              // Get the latest transaction (most recent submittedAt)
              const latestTransaction = transactions.sort((a, b) => 
                new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
              )[0]
              
              // Determine payment method icon and label based on transaction type
              const getPaymentMethodInfo = (type: string) => {
                switch (type.toLowerCase()) {
                  case 'bank_transfer':
                  case 'bank-transfer':
                    return {
                      icon: Building2,
                      label: 'Bank Transfer',
                      color: 'text-primary'
                    }
                  case 'credit_card':
                  case 'credit-card':
                    return {
                      icon: CreditCard,
                      label: 'Credit Card',
                      color: 'text-muted-foreground'
                    }
                  default:
                    return {
                      icon: CreditCard,
                      label: 'Payment Method',
                      color: 'text-muted-foreground'
                    }
                }
              }
              
              const paymentMethod = getPaymentMethodInfo(latestTransaction.type)
              const PaymentIcon = paymentMethod.icon
              
              return (
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center">
                    <PaymentIcon className={`h-5 w-5 ${paymentMethod.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      •••• {latestTransaction.accountNumber.slice(-4)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {paymentMethod.label} • Last used {formatDate(latestTransaction.submittedAt)}
                    </p>
                  </div>
                  <Badge className="text-xs bg-info-soft text-info">Default</Badge>
                </div>
              )
            })() : (
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">No payment method</p>
                  <p className="text-xs text-muted-foreground">Add a payment method to get started</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start h-8"
                onClick={() => {
                  toast({
                    variant: "info",
                    title: "Update Payment Method",
                    description: "Opening payment method settings...",
                  })
                }}
              >
                <CreditCard className="h-3.5 w-3.5 mr-2" />
                Update Payment Method
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start h-8"
                onClick={() => {
                  toast({
                    variant: "info",
                    title: "Billing History",
                    description: "Loading full billing history...",
                  })
                }}
              >
                <Calendar className="h-3.5 w-3.5 mr-2" />
                Billing History
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start h-8"
                onClick={() => {
                  toast({
                    variant: "success",
                    title: "Usage Reports",
                    description: "Generating usage reports...",
                  })
                }}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-2" />
                Usage Reports
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
