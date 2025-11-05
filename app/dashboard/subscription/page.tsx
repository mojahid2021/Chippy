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
  Settings,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/userStore'

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
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching subscription:', err)
      // Don't set error here to avoid breaking the UI, just log it
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
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial load - fetch both subscription and transactions
  useEffect(() => {
    fetchSubscription()
    fetchTransactions()
  }, [fetchSubscription, fetchTransactions])

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
    amount: 49,
    currency: 'USD',
    billingDate: 'Dec 15, 2024',
    daysLeft: 39,
    usage: {
      orders: { current: 847, limit: 1000 },
      conversations: { current: 3240, limit: 5000 },
      aiMessages: { current: 12580, limit: 20000 },
    }
  }

  // Available plans
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      monthlyPrice: 19,
      yearlyPrice: 190,
      yearlyDiscount: 17,
      icon: Zap,
      color: 'blue',
      features: [
        '500 Orders/month',
        '2,000 Conversations',
        '10,000 AI Messages',
        '2 Team Members',
        '10GB Storage',
        'Email Support',
        'Basic Analytics',
        'Standard Templates'
      ],
      limits: {
        orders: 500,
        conversations: 2000,
        aiMessages: 10000,
        users: 2,
        storage: 10
      }
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Best for growing e-commerce businesses',
      monthlyPrice: 49,
      yearlyPrice: 490,
      yearlyDiscount: 17,
      icon: Crown,
      color: 'violet',
      popular: true,
      features: [
        '1,000 Orders/month',
        '5,000 Conversations',
        '20,000 AI Messages',
        '5 Team Members',
        '50GB Storage',
        'Priority Support',
        'Advanced Analytics',
        'Custom Branding',
        'API Access',
        'Webhook Integration'
      ],
      limits: {
        orders: 1000,
        conversations: 5000,
        aiMessages: 20000,
        users: 5,
        storage: 50
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large businesses with custom needs',
      monthlyPrice: 149,
      yearlyPrice: 1490,
      yearlyDiscount: 17,
      icon: Shield,
      color: 'emerald',
      features: [
        'Unlimited Orders',
        'Unlimited Conversations',
        'Unlimited AI Messages',
        'Unlimited Team Members',
        'Unlimited Storage',
        '24/7 Phone Support',
        'Custom AI Training',
        'Dedicated Account Manager',
        'Advanced Security',
        'SLA Guarantee',
        'Custom Integration',
        'White Label Option'
      ],
      limits: {
        orders: -1,
        conversations: -1,
        aiMessages: -1,
        users: -1,
        storage: -1
      }
    }
  ]

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : Math.floor(plan.yearlyPrice / 12)
  }

  const getTotalPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
  }

  const getColorClasses = (color: string, variant: 'bg' | 'text' | 'border' | 'hover') => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-500',
        hover: 'hover:bg-blue-600'
      },
      violet: {
        bg: 'bg-violet-50',
        text: 'text-violet-600',
        border: 'border-violet-500',
        hover: 'hover:bg-violet-600'
      },
      emerald: {
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        border: 'border-emerald-500',
        hover: 'hover:bg-emerald-600'
      }
    }
    return colors[color as keyof typeof colors]?.[variant] || ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription</h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage your plan and billing</p>
        </div>
        <Button variant="outline" size="sm" className="h-8">
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          Manage Billing
        </Button>
      </div>

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
            const Icon = plan.icon
            const isCurrentPlan = plan.name === currentSubscription.plan
            
            return (
              <Card 
                key={plan.id}
                className={`relative border-2 transition-all hover:shadow-lg ${
                  isCurrentPlan 
                    ? 'border-violet-500 bg-violet-50/30' 
                    : plan.popular 
                      ? 'border-violet-200 shadow-md' 
                      : 'border-slate-200'
                }`}
              >
                {plan.popular && !isCurrentPlan && (
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
                    <div className={`h-10 w-10 rounded-lg ${getColorClasses(plan.color, 'bg')} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${getColorClasses(plan.color, 'text')}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{plan.name}</h3>
                      <p className="text-xs text-slate-600">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-slate-900">
                        ${getPrice(plan)}
                      </span>
                      <span className="text-sm text-slate-600">/month</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p className="text-xs text-slate-600 mt-1">
                        ${getTotalPrice(plan)} billed annually
                      </p>
                    )}
                  </div>

                  <Button 
                    className={`w-full mb-4 ${
                      isCurrentPlan
                        ? 'bg-slate-600 hover:bg-slate-700'
                        : `${getColorClasses(plan.color, 'border')} ${getColorClasses(plan.color, 'hover')} hover:text-white`
                    }`}
                    variant={isCurrentPlan ? 'default' : 'outline'}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.name === 'Professional' ? (
                      <>Upgrade Now <ArrowRight className="h-4 w-4 ml-1" /></>
                    ) : plan.name === 'Starter' ? (
                      'Downgrade'
                    ) : (
                      <>Upgrade <ArrowRight className="h-4 w-4 ml-1" /></>
                    )}
                  </Button>

                  <div className="space-y-2">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-700">{feature}</span>
                      </div>
                    ))}
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
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
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900">•••• 4242</p>
                <p className="text-xs text-slate-600">Expires 12/2025</p>
              </div>
              <Badge className="text-[10px] bg-blue-100 text-blue-700">Default</Badge>
            </div>

            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start h-8">
                <CreditCard className="h-3.5 w-3.5 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8">
                <Calendar className="h-3.5 w-3.5 mr-2" />
                Billing History
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start h-8">
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
