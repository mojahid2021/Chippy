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


export interface MessengerWebhook {
  id: string
  userId: string
  name: string
  pageId?: string | null
  pageName?: string | null
  pageCategory?: string | null
  pagePictureUrl?: string | null
  pageLink?: string | null
  pageSubscribedAt?: string | null
  verifyToken: string
  webhookUrl: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MessengerWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: MessengerWebhook[]
}

export interface MessengerWebhookEvent {
  id: string
  userId: string
  webhookId: string
  pageId: string
  eventType: string
  senderId: string
  recipientId: string
  metaTimestamp: number
  status: 'PROCESSED' | 'DUPLICATE' | 'ERROR' | string
  errorMessage?: string | null
  rawPayload?: Record<string, unknown>
  eventData?: {
    message?: {
      mid: string
      text?: string
      attachments?: unknown[]
    }
    postback?: {
      title: string
      payload: string
    }
    [key: string]: unknown
  }
  createdAt: string
}

export interface MessengerEventsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: MessengerWebhookEvent[]
}

export interface SyncPageResponse {
  message: string
  data: {
    webhook: MessengerWebhook
    pageDetails: {
      id: string
      name: string
      category?: string
      link?: string
      pictureUrl?: string
    }
    isSubscribed: boolean
  }
}
