'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar,
  CreditCard,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Crown,
  Zap,
  Shield,
  Settings,
  RefreshCw,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserStore } from '@/lib/stores/userStore'

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

// API Response interface
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
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

export default function SubscriptionPage() {
  const { token } = useUserStore()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [hasSubscription, setHasSubscription] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch subscription from API
  const fetchSubscription = useCallback(async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

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
      setError(err instanceof Error ? err.message : 'An error occurred while fetching subscription')
      console.error('Error fetching subscription:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  // Initial load
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  const formatCurrency = (amount: number | undefined | null, currency?: string) => {
    // Handle invalid or missing amount
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0.00'
    }

    // Handle invalid or missing currency codes
    if (!currency || typeof currency !== 'string' || currency.trim() === '') {
      return `${Number(amount).toFixed(2)}`
    }

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(Number(amount))
    } catch (error) {
      // Fallback if currency code is invalid
      console.warn(`Invalid currency code: ${currency}`, error)
      return `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading subscription details...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-600" />
        <div className="ml-2">
          <p className="text-red-600 font-medium">Error loading subscription</p>
          <p className="text-gray-600 text-sm">{error}</p>
          <Button
            onClick={fetchSubscription}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!hasSubscription) {
    return (
      <div className="flex items-center justify-center py-12">
        <CreditCard className="h-8 w-8 text-gray-400" />
        <div className="ml-2">
          <p className="text-gray-600 font-medium">No active subscription</p>
          <p className="text-gray-500 text-sm">Subscribe to a plan to get started</p>
          <Button className="mt-2" onClick={() => window.location.href = '/dashboard/plans'}>
            View Plans
          </Button>
        </div>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-600" />
        <div className="ml-2">
          <p className="text-red-600 font-medium">Invalid subscription data</p>
          <p className="text-gray-600 text-sm">The subscription data received is incomplete.</p>
          <Button
            onClick={fetchSubscription}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[subscription.paymentStatus] || statusConfig.pending
  const StatusIcon = statusInfo.icon
  const daysUntilExpiry = getDaysUntilExpiry(subscription.endDate)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Subscription</h1>
          <p className="text-gray-600 mt-1">Manage your subscription and billing details</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Renew
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Crown className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Plan</p>
                <p className="text-2xl font-bold text-gray-900">{subscription.plan.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <StatusIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Status</p>
                <Badge className={cn('text-sm font-semibold', statusInfo.color)}>
                  {subscription.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next Billing</p>
                <p className="text-2xl font-bold text-gray-900">{formatDate(subscription.endDate)}</p>
                <p className="text-xs text-gray-500">
                  {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {subscription.plan.interval === 'yearly' ? 'Yearly Cost' : 'Monthly Cost'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(subscription.plan.price, subscription.plan.currency)}
                </p>
                <p className="text-xs text-gray-500 capitalize">{subscription.plan.interval}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Plan Details
              </CardTitle>
              <CardDescription>
                Your current subscription information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Plan Name</p>
                  <p className="text-lg font-semibold text-gray-900">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Billing Cycle</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{subscription.plan.interval}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(subscription.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(subscription.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Payment Method</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{subscription.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{subscription.plan.duration} days</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Auto Renew</p>
                  <Badge variant={subscription.autoRenew ? "default" : "secondary"}>
                    {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(subscription.plan.price, subscription.plan.currency)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                <p className="text-gray-700">{subscription.plan.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Features */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Plan Features
              </CardTitle>
              <CardDescription>
                What&apos;s included in your plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {subscription.plan.features && Array.isArray(subscription.plan.features) ? (
                  subscription.plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start">
                    <XCircle className="h-5 w-5 text-gray-400 mr-3 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-500">No features available</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="h-4 w-4 mr-2" />
                Change Billing Cycle
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <XCircle className="h-4 w-4 mr-2" />
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}