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
  aiProfileId?: string | null
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
  aiProfileId?: string | null
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

/**
 * AI Profile & Prompt Compiler Types
 */

export interface KnowledgeSnippet {
  id: string
  title: string
  content: string
  tags?: string[]
}

export interface ReferenceUrl {
  title: string
  url: string
  description?: string
}

export interface CustomVariable {
  key: string
  defaultValue: string
  description?: string
}

export interface FewShotExample {
  user: string
  assistant: string
}

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'mistral' | 'ollama' | string
  modelName: string
  temperature?: number
  topP?: number
  maxTokens?: number
  frequencyPenalty?: number
  presencePenalty?: number
  stopSequences?: string[]
  responseFormat?: 'text' | 'json_object' | string
}

export interface AiProfile {
  id: string
  userId: string
  name: string
  role: string
  description?: string
  avatar?: string | null
  category?: string
  tone?: string
  style?: string
  language?: string
  responseLength?: 'concise' | 'balanced' | 'detailed' | string
  systemPrompt?: string
  mission?: string
  dos?: string[]
  donts?: string[]
  fallbackResponse?: string
  knowledgeSnippets?: KnowledgeSnippet[]
  referenceUrls?: ReferenceUrl[]
  customVariables?: CustomVariable[]
  fewShotExamples?: FewShotExample[]
  modelConfig?: ModelConfig
  isDefault: boolean
  isActive: boolean
  tags?: string[]
  version: number
  createdAt: string
  updatedAt: string
}

export interface AiProfilesResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: AiProfile[]
}

export interface CompilePromptRequest {
  userPrompt: string
  dynamicVariables?: Record<string, string>
  additionalContext?: string
  includeFewShot?: boolean
}

export interface CompilePromptMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompilePromptResponse {
  message: string
  data: {
    profile: {
      id: string
      name: string
      role: string
      category?: string
      version?: number
    }
    compiledSystemPrompt: string
    messages: CompilePromptMessage[]
    userPrompt: string
    modelConfig: ModelConfig
    appliedVariables: Record<string, string>
    missingVariables: string[]
    estimatedTokens: {
      systemPrompt: number
      messages: number
      total: number
    }
  }
}

export interface CompileWebhookEventPromptRequest {
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  includeFewShot?: boolean
}

export interface CompileWebhookEventPromptResponse {
  message: string
  data: {
    profile: {
      id: string
      name: string
      role: string
    }
    compiledSystemPrompt: string
    messages: CompilePromptMessage[]
    userPrompt: string
    appliedVariables: Record<string, string>
  }
}

export interface WebhookAiProfileBindingResponse {
  message: string
  data: {
    id: string
    aiProfileId: string | null
    name: string
  }
}

/**
 * AI Response Generation & Dispatch Types
 */

export interface GenerateResponseRequest {
  sendToUser?: boolean
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  additionalContext?: string
  includeFewShot?: boolean
}

export interface GenerateResponseResult {
  eventId: string
  webhookId: string
  senderId: string
  aiProfileId?: string
  generatedResponse: string
  isFallback: boolean
  provider: string
  modelName: string
  latencyMs: number
  dispatchedToMessenger: boolean
  messageIds: string[]
  tokenUsage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface GenerateResponseApiResponse {
  message: string
  data: GenerateResponseResult
}

/**
 * Multi-Turn Conversation History Types
 */

export interface ConversationMessage {
  id: string
  webhookId: string
  userId: string
  senderId: string
  pageId: string
  role: 'assistant' | 'user' | string
  content: string
  aiProfileId?: string
  messageId?: string
  createdAt: string
}

export interface ConversationHistoryResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: ConversationMessage[]
}

/**
 * Live Operator Outbound Messaging Types
 */

export interface SendManualMessageRequest {
  recipientId: string
  text: string
}

export interface SendManualMessageResponse {
  message: string
  data: {
    recipientId: string
    messageIds: string[]
    chunksSent: number
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 6: Live Meta Facebook Messenger Graph API Client (Custom Messenger Suite)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type LiveConversationFolder = 'inbox' | 'other' | 'page_done' | 'spam'
export type LiveConversationPlatform = 'messenger' | 'instagram'
export type LiveSenderActionType = 'typing_on' | 'typing_off' | 'mark_seen'
export type LiveAttachmentType = 'image' | 'audio' | 'video' | 'file'

export interface LiveParticipant {
  id: string
  name: string
  email?: string
}

export interface LiveCustomer {
  id: string
  name: string
  email?: string
}

export interface LiveConversation {
  id: string
  updatedTime: string
  link?: string
  messageCount: number
  unreadCount: number
  snippet: string
  customer?: LiveCustomer | null
  participants: LiveParticipant[]
  senders?: LiveParticipant[]
}

export interface LivePagingCursors {
  before?: string | null
  after?: string | null
}

export interface LivePaging {
  cursors?: LivePagingCursors | null
  next?: string | null
  previous?: string | null
  hasNext?: boolean
  hasPrevious?: boolean
}

export interface LiveConversationsData {
  conversations: LiveConversation[]
  paging?: LivePaging
}

export interface LiveConversationsResponse {
  message: string
  data: LiveConversationsData
}

export interface LiveConversationDetailResponse {
  message: string
  data: LiveConversation
}

export interface LiveAttachmentImageData {
  url: string
  previewUrl?: string
  maxWidth?: number
  maxHeight?: number
}

export interface LiveAttachment {
  id?: string
  mimeType?: string
  name?: string
  size?: number
  fileUrl?: string
  imageData?: LiveAttachmentImageData
  videoData?: {
    url: string
    previewUrl?: string
    width?: number
    height?: number
  }
}

export interface LiveMessage {
  id: string
  createdTime: string
  from: LiveParticipant
  to: LiveParticipant[]
  text?: string
  attachments?: LiveAttachment[]
  isFromPage: boolean
}

export interface LiveMessagesData {
  messages: LiveMessage[]
  paging?: LivePaging
}

export interface LiveMessagesResponse {
  message: string
  data: LiveMessagesData
}

export interface LiveMessageDetailResponse {
  message: string
  data: LiveMessage
}

export interface LiveCustomerProfile {
  id: string
  name: string
  firstName?: string
  lastName?: string
  profilePic?: string
  locale?: string
  timezone?: number
  gender?: string
}

export interface LiveCustomerProfileResponse {
  message: string
  data: LiveCustomerProfile
}

export interface LiveQuickReply {
  title: string
  payload: string
}

export interface LiveMessageAttachment {
  type: LiveAttachmentType
  url: string
  isReusable?: boolean
}

export interface SendLiveMessageRequest {
  recipientId: string
  text?: string
  quickReplies?: LiveQuickReply[]
  attachment?: LiveMessageAttachment
}

export interface SendLiveMessageData {
  recipientId: string
  messageIds: string[]
  chunksSent: number
}

export interface SendLiveMessageResponse {
  message: string
  data: SendLiveMessageData
}

export interface SendLiveSenderActionRequest {
  recipientId: string
  action: LiveSenderActionType
}

export interface SendLiveSenderActionData {
  recipientId: string
  action: LiveSenderActionType
  success: boolean
}

export interface SendLiveSenderActionResponse {
  message: string
  data: SendLiveSenderActionData
}



