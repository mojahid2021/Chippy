"use client"

import { useState, useEffect, useCallback } from "react"
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
  completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  verifying: { color: 'bg-blue-100 text-blue-700', icon: Clock },
  failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
}

export default function SubscriptionPage() {
  const { token } = useUserStore()
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
  }, [fetchSubscription, fetchTransactions, fetchPlans])

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
  
  // Current subscription data - use real data if available, otherwise use mock data
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
  } : {
    plan: 'Professional',
    status: 'active' as const,
    amount: 4900,
    currency: 'BDT',
    billingDate: 'Dec 15, 2024',
    daysLeft: 39,
    usage: {
      orders: { current: 847, limit: 1000 },
      conversations: { current: 3240, limit: 5000 },
      aiMessages: { current: 12580, limit: 20000 },
    }
  }

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

  const getColorForPlan = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return 'blue'
      case 'professional':
        return 'violet'
      case 'enterprise':
        return 'emerald'
      default:
        return 'blue'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage your plan and billing</p>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          Manage Billing
        </Button>
      </div> */}

      {/* Show message if no subscription */}
      {!hasSubscription && subscription === null && (
        <Card className="border-blue-200 bg-blue-50/50 shadow-sm">
          <div className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">No active subscription</p>
              <p className="text-xs text-slate-600">Choose a plan below to get started with premium features</p>
            </div>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            >
              View Plans
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </Card>
      )}

      {/* Current Subscription Overview */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-linear-to-r from-violet-500 to-violet-600 p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <Badge className="bg-white/20 text-white border-white/30 mb-1">Active</Badge>
                <h2 className="text-xl font-bold text-white">{currentSubscription.plan} Plan</h2>
                <p className="text-sm text-violet-100">Your subscription is active and running smoothly</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-violet-100">Next billing</p>
              <p className="text-lg font-bold text-white">{currentSubscription.billingDate}</p>
              <p className="text-xs text-violet-100">{currentSubscription.daysLeft} days left</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Orders Usage */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Orders</span>
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">{currentSubscription.usage.orders.current}</span>
                <span className="text-xs text-slate-500">/ {currentSubscription.usage.orders.limit}</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(currentSubscription.usage.orders.current / currentSubscription.usage.orders.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((currentSubscription.usage.orders.current / currentSubscription.usage.orders.limit) * 100)}% used
              </p>
            </div>

            {/* Conversations Usage */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">Conversations</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">{currentSubscription.usage.conversations.current}</span>
                <span className="text-xs text-slate-500">/ {currentSubscription.usage.conversations.limit}</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(currentSubscription.usage.conversations.current / currentSubscription.usage.conversations.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((currentSubscription.usage.conversations.current / currentSubscription.usage.conversations.limit) * 100)}% used
              </p>
            </div>

            {/* AI Messages Usage */}
            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">AI Messages</span>
                <Zap className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-slate-900">{currentSubscription.usage.aiMessages.current}</span>
                <span className="text-xs text-slate-500">/ {currentSubscription.usage.aiMessages.limit}</span>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${(currentSubscription.usage.aiMessages.current / currentSubscription.usage.aiMessages.limit) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {Math.round((currentSubscription.usage.aiMessages.current / currentSubscription.usage.aiMessages.limit) * 100)}% used
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Available Plans Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Available Plans</h2>
            <p className="text-sm text-slate-600">Choose the perfect plan for your business</p>
          </div>
          
          {/* Billing Toggle */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yearly
              <Badge className="ml-1.5 bg-emerald-100 text-emerald-700 text-[10px] px-1">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const Icon = getIconForPlan(plan.name)
            const planColor = getColorForPlan(plan.name)
            const isCurrentPlan = subscription?.planId === plan.id
            
            return (
              <Card 
                key={plan.id}
                className={`relative border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan 
                    ? 'border-violet-500 bg-violet-50/30' 
                    : plan.isPopular 
                      ? 'border-violet-200 shadow-md' 
                      : 'border-slate-200'
                }`}
              >
                {plan.isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white px-3 py-0.5 shadow-lg">
                      <Star className="h-3 w-3 mr-1 fill-white" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-3 py-0.5 shadow-lg">
                      <Check className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg bg-${planColor}-50 flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 text-${planColor}-600`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-600">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        Tk {getPrice(plan)}
                      </span>
                      <span className="text-sm text-slate-600">/{plan.interval === 'yearly' ? 'year' : 'month'}</span>
                    </div>
                    {billingCycle === 'yearly' && plan.interval === 'monthly' && plan.annualPrice && (
                      <p className="text-xs text-slate-600 mt-1">
                        Tk {getTotalPrice(plan)} billed annually
                      </p>
                    )}
                  </div>

                  <Button 
                    className={`w-full mb-4 ${
                      isCurrentPlan
                        ? 'bg-slate-600 hover:bg-slate-700'
                        : `bg-${planColor}-600 hover:bg-${planColor}-700`
                    }`}
                    variant={isCurrentPlan ? 'default' : 'default'}
                    disabled={isCurrentPlan || true}
                    onClick={() => {
                      // Purchase functionality disabled - plans page removed
                      toast({
                        variant: "info",
                        title: "Purchase Unavailable",
                        description: "Plan purchase functionality is currently disabled.",
                      })
                    }}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.name === 'Professional' ? (
                      <>Upgrade Now <ArrowRight className="h-4 w-4 ml-1" /></>
                    ) : plan.name === 'Starter' ? (
                      'Get Started'
                    ) : (
                      <>Upgrade <ArrowRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>

                  <div className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <div className="text-xs text-slate-500">
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
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-600">View all your payment transactions and invoices</p>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-slate-600">Loading transactions...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="mt-2 text-center">
                  <p className="text-red-600 font-medium">Error loading transactions</p>
                  <p className="text-slate-600 text-sm">{error}</p>
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
                <FileText className="h-8 w-8 text-slate-400" />
                <div className="mt-2 text-center">
                  <p className="text-slate-600 font-medium">No transactions found</p>
                  <p className="text-slate-500 text-sm">Your payment history will appear here</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((transaction) => {
                  const statusInfo = statusConfig[transaction.status]
                  const StatusIcon = statusInfo.icon

                  return (
                    <div key={transaction.id} className="py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        {/* Left Side - Icon and Details */}
                        <div className="flex items-start gap-3 flex-1">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-900">
                                {transaction.subscription.plan.name}
                              </p>
                              <Badge className={cn('text-[10px] flex items-center gap-1', statusInfo.color)}>
                                <StatusIcon className="h-3 w-3" />
                                <span className="capitalize">{transaction.status}</span>
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 mb-0.5">
                              TXN: {transaction.transactionId}
                            </p>
                            <p className="text-xs text-slate-500">
                              Account: ****{transaction.accountNumber.slice(-4)} • {formatDate(transaction.submittedAt)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {transaction.subscription.plan.interval} plan
                            </p>
                          </div>
                        </div>

                        {/* Right Side - Amount and Actions */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">
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
        <Card className="border-slate-200 shadow-sm">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Payment Method</h3>
            <p className="text-xs text-slate-600">Manage your billing details</p>
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
                      color: 'text-blue-600'
                    }
                  case 'credit_card':
                  case 'credit-card':
                    return {
                      icon: CreditCard,
                      label: 'Credit Card',
                      color: 'text-slate-600'
                    }
                  default:
                    return {
                      icon: CreditCard,
                      label: 'Payment Method',
                      color: 'text-slate-600'
                    }
                }
              }
              
              const paymentMethod = getPaymentMethodInfo(latestTransaction.type)
              const PaymentIcon = paymentMethod.icon
              
              return (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    <PaymentIcon className={`h-5 w-5 ${paymentMethod.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      •••• {latestTransaction.accountNumber.slice(-4)}
                    </p>
                    <p className="text-xs text-slate-600">
                      {paymentMethod.label} • Last used {formatDate(latestTransaction.submittedAt)}
                    </p>
                  </div>
                  <Badge className="text-[10px] bg-blue-100 text-blue-700">Default</Badge>
                </div>
              )
            })() : (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">No payment method</p>
                  <p className="text-xs text-slate-600">Add a payment method to get started</p>
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
