/**
 * Woombat User API Documentation Types
 */

export interface ApiResponse<T> {
  message: string
  data: T
}

export interface ApiError {
  statusCode: number
  error: string
  message: string
}

export interface HealthData {
  status: string
  uptime: number
  timestamp: string
}

export interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  role: string
  phone?: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: string
}

export interface AuthLoginData {
  token: string
  user: UserProfile
}

export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency: string
  interval: string
  intervalCount: number
  trialDays: number
  features: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SubscriptionInvoice {
  id: string
  subscriptionId: string
  userId: string
  amount: number
  currency: string
  status: string
  billingReason: string
  periodStart: string
  periodEnd: string
  paidAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: 'ACTIVE' | 'TRIALING' | 'CANCELED' | 'PAST_DUE' | string
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  canceledAt: string | null
  autoRenew: boolean
  lastRenewalAt: string | null
  createdAt: string
  updatedAt: string
  plan: SubscriptionPlan
  invoices?: SubscriptionInvoice[]
}

export interface SubscriptionHistoryPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SubscriptionHistoryResponse {
  pagination: SubscriptionHistoryPagination
  data: SubscriptionInvoice[]
}

export interface PremiumContentData {
  content: string
  tier: string
  expiresAt: string
}

