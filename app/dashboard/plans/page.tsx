"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap, Star, ArrowRight, AlertCircle, Loader2, ShoppingCart, Info, CreditCard } from "lucide-react"

// API Response Types
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

interface ApiError {
  success: false
  error: string
  message: string
  timestamp: string
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [viewingDetails, setViewingDetails] = useState(false)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/public/plans?sortBy=createdAt&sortOrder=desc')
      const data: PlansResponse | ApiError = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch plans')
      }

      if (data.success && 'data' in data) {
        setPlans(data.data.plans)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching plans')
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (plan: Plan) => {
    setSelectedPlan(plan)
    setViewingDetails(true)
  }

  const handleBackToPlans = () => {
    setSelectedPlan(null)
    setViewingDetails(false)
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

  // Filter to show only active (purchaseable) plans
  const activePlans = plans.filter(plan => plan.isActive)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <span className="ml-2 text-gray-600">Loading plans...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Plans</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchPlans} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (viewingDetails && selectedPlan) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToPlans}
              className="flex items-center space-x-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              <span>Back to Plans</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h1>
              <p className="text-gray-600">Plan details and pricing information</p>
            </div>
          </div>
          {selectedPlan.isPopular && (
            <Badge className="bg-blue-100 text-blue-800">
              <Star className="h-3 w-3 mr-1" />
              Most Popular
            </Badge>
          )}
        </div>

        {/* Plan Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Pricing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2 mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(selectedPlan.price, selectedPlan.currency)}
                  </span>
                  <span className="text-lg text-gray-600">
                    /{formatInterval(selectedPlan.interval, selectedPlan.intervalCount)}
                  </span>
                </div>

                {selectedPlan.annualPrice && selectedPlan.interval === 'monthly' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-green-800 font-medium">
                      💰 Save {Math.round(((selectedPlan.price * 12) - selectedPlan.annualPrice) / (selectedPlan.price * 12) * 100)}% with annual billing
                    </p>
                    <p className="text-green-700 text-sm mt-1">
                      {formatPrice(selectedPlan.annualPrice, selectedPlan.currency)} billed annually
                    </p>
                  </div>
                )}

                {selectedPlan.trialDays > 0 && (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    <Zap className="h-3 w-3 mr-1" />
                    {selectedPlan.trialDays} days free trial included
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>What&apos;s Included</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {selectedPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{selectedPlan.description}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Plan Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Users</span>
                  <span className="font-medium">
                    {selectedPlan.maxUsers === -1 ? 'Unlimited' : selectedPlan.maxUsers}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-medium">
                    {selectedPlan.maxStorageGB === -1 ? 'Unlimited' : `${selectedPlan.maxStorageGB}GB`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Projects</span>
                  <span className="font-medium">
                    {selectedPlan.maxProjects === -1 ? 'Unlimited' : selectedPlan.maxProjects}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Plan Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Plan ID</span>
                  <span className="font-mono text-xs">{selectedPlan.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span>{new Date(selectedPlan.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span>{new Date(selectedPlan.updatedAt).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Purchase Plan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600 mt-1">Choose and manage your subscription plans</p>
        </div>
      </div>

      {/* Plans Grid */}
      {activePlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Info className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Plans Available</h3>
            <p className="text-gray-600 text-center">Check back later for new plans and pricing options.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activePlans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              {plan.isPopular && (
                <div className="bg-blue-600 text-white text-center py-2 px-4 rounded-t-lg">
                  <div className="flex items-center justify-center space-x-1">
                    <Crown className="h-4 w-4" />
                    <span className="font-medium">Most Popular</span>
                  </div>
                </div>
              )}

              <CardHeader className={plan.isPopular ? "pt-4" : ""}>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(plan.price, plan.currency)}
                  </span>
                  <span className="text-gray-600 ml-1">
                    /{formatInterval(plan.interval, plan.intervalCount)}
                  </span>
                </div>
                {plan.trialDays > 0 && (
                  <Badge variant="outline" className="mt-2 w-fit">
                    {plan.trialDays} days free trial
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{plan.description}</p>

                {/* Key Limits */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Users:</span>
                    <span className="font-medium">
                      {plan.maxUsers === -1 ? 'Unlimited' : plan.maxUsers}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Storage:</span>
                    <span className="font-medium">
                      {plan.maxStorageGB === -1 ? 'Unlimited' : `${plan.maxStorageGB}GB`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Projects:</span>
                    <span className="font-medium">
                      {plan.maxProjects === -1 ? 'Unlimited' : plan.maxProjects}
                    </span>
                  </div>
                </div>

                {/* Features Preview */}
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-2">Features:</p>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-3 w-3 text-green-500 shrink-0" />
                        <span className="text-gray-700 truncate">{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{plan.features.length - 3} more features
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleViewDetails(plan)}
                  >
                    <Info className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Purchase
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}