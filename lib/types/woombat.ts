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

export type SupportedMessengerEventType =
  | 'messages'
  | 'message_deliveries'
  | 'message_reads'
  | 'messaging_seen'
  | 'message_echoes'
  | 'message_reactions'
  | 'message_edits'
  | 'messaging_postbacks'
  | 'messaging_referrals'
  | 'messaging_optins'
  | 'messaging_handovers'
  | 'messaging_policy_enforcement'
  | 'messaging_account_linking'
  | 'messaging_game_plays'
  | 'response_feedback'
  | 'messaging_feedback'
  | 'send_cart'
  | 'standby'
  | 'group_feed'
  | 'calls'
  | 'messenger_template_status_update'
  | string

export interface MessengerWebhookEventData {
  message?: {
    mid: string
    text?: string
    attachments?: unknown[]
    quick_reply?: { payload: string }
    reply_to?: { mid: string }
    is_echo?: boolean
    app_id?: string
    metadata?: string
    [key: string]: unknown
  }
  postback?: {
    title: string
    payload: string
    referral?: {
      ref?: string
      source?: string
      type?: string
      ads_context_data?: Record<string, unknown>
    }
    [key: string]: unknown
  }
  delivery?: {
    mids?: string[]
    watermark?: number
    [key: string]: unknown
  }
  read?: {
    watermark?: number
    [key: string]: unknown
  }
  reaction?: {
    action: 'react' | 'unreact' | string
    emoji?: string
    reaction?: string
    mid?: string
  }
  edit?: {
    mid: string
    text: string
    num_edit?: number
  }
  referral?: {
    ref?: string
    source?: string
    type?: string
    ads_context_data?: Record<string, unknown>
  }
  optin?: {
    notification_messages_token?: string
    frequency?: string
    status?: string
    type?: string
  }
  handover?: {
    action?: string
    target_app_id?: string
    metadata?: string
    [key: string]: unknown
  }
  feedback?: {
    feedback?: string
    score?: number
    [key: string]: unknown
  }
  call?: {
    status?: string
    call_id?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MessengerWebhookEvent {
  id: string
  userId: string
  webhookId: string
  aiProfileId?: string | null
  pageId: string
  eventType: SupportedMessengerEventType
  senderId: string
  recipientId: string
  metaTimestamp: number
  status: 'PROCESSED' | 'DUPLICATE' | 'ERROR' | string
  errorMessage?: string | null
  rawPayload?: Record<string, unknown>
  eventData?: MessengerWebhookEventData
  createdAt: string
}

export interface MessengerEventsQueryParams {
  page?: number
  limit?: number
  eventType?: string
  status?: string
  pageId?: string
  startDate?: string
  endDate?: string
}

export interface UpdateMessengerWebhookRequest {
  name?: string
  appSecret?: string
  verifyToken?: string
  pageId?: string
  pageAccessToken?: string
  aiProfileId?: string | null
  isActive?: boolean
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
  humanize?: boolean
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
  humanize?: boolean
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
  humanize?: boolean
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
  from: LiveParticipant & { email?: string }
  to?: LiveParticipant[] | { data: LiveParticipant[] }
  text?: string
  message?: string
  attachments?: LiveAttachment[] | { data: LiveAttachment[] }
  isFromPage?: boolean
  shares?: Record<string, unknown>
  tags?: Record<string, unknown>
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

/**
 * 7. Meta Instagram Platform Webhooks & Management
 */
export interface InstagramWebhook {
  id: string
  userId: string
  name: string
  instagramAccountId: string
  username?: string | null
  profilePictureUrl?: string | null
  pageId?: string | null
  verifyToken: string
  webhookUrl: string
  aiProfileId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface InstagramWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: InstagramWebhook[]
}

export interface InstagramWebhookResponse {
  message: string
  data: InstagramWebhook
}

export interface CreateInstagramWebhookRequest {
  name: string
  appSecret: string
  verifyToken?: string
  instagramAccountId: string
  pageId?: string
  accessToken?: string
  aiProfileId?: string
}

export interface UpdateInstagramWebhookRequest {
  name?: string
  aiProfileId?: string | null
  isActive?: boolean
  instagramAccountId?: string
  pageId?: string
  accessToken?: string
  appSecret?: string
}

export interface SyncInstagramAccountResponse {
  message: string
  data: {
    webhook: InstagramWebhook
    accountDetails?: {
      id: string
      username: string
      name?: string
      profilePictureUrl?: string
    }
    isSubscribed?: boolean
  }
}

export interface InstagramEvent {
  id: string
  userId: string
  webhookId: string
  instagramAccountId?: string
  eventType: string
  senderId: string
  recipientId: string
  metaTimestamp: number
  status: 'PROCESSED' | 'DUPLICATE' | 'ERROR'
  errorMessage?: string | null
  eventData?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
  createdAt: string
}

export interface InstagramEventsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: InstagramEvent[]
}

export interface InstagramEventResponse {
  message: string
  data: InstagramEvent
}

export interface CompileInstagramEventPromptRequest {
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  includeFewShot?: boolean
  humanize?: boolean
}

export interface CompileInstagramEventPromptResponse {
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

export interface GenerateInstagramResponseRequest {
  sendToUser?: boolean
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  additionalContext?: string
  includeFewShot?: boolean
  humanize?: boolean
}

export interface GenerateInstagramResponseResponse {
  message: string
  data: {
    eventId: string
    webhookId: string
    senderId: string
    aiProfileId?: string
    generatedResponse: string
    isFallback?: boolean
    provider?: string
    modelName?: string
    latencyMs: number
    dispatchedToInstagram?: boolean
    messageIds?: string[]
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface InstagramConversationMessage {
  id: string
  webhookId: string
  userId: string
  senderId: string
  role: 'user' | 'assistant'
  content: string
  aiProfileId?: string
  messageId?: string
  createdAt: string
}

export interface InstagramConversationsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: InstagramConversationMessage[]
}

export interface SendInstagramMessageRequest {
  recipientId: string
  text: string
}

export interface SendInstagramMessageResponse {
  message: string
  data: {
    recipientId: string
    messageIds: string[]
    chunksSent?: number
  }
}

/**
 * 8. WhatsApp Business Cloud API Webhooks & Management
 */
export interface WhatsAppWebhook {
  id: string
  userId: string
  name: string
  phoneNumberId: string
  wabaId?: string | null
  displayPhoneNumber?: string | null
  verifiedName?: string | null
  qualityRating?: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN' | string | null
  verifyToken: string
  webhookUrl: string
  aiProfileId?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WhatsAppWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: WhatsAppWebhook[]
}

export interface WhatsAppWebhookResponse {
  message: string
  data: WhatsAppWebhook
}

export interface CreateWhatsAppWebhookRequest {
  name: string
  appSecret: string
  verifyToken?: string
  phoneNumberId: string
  wabaId?: string
  accessToken?: string
  aiProfileId?: string
}

export interface UpdateWhatsAppWebhookRequest {
  name?: string
  aiProfileId?: string | null
  isActive?: boolean
  phoneNumberId?: string
  wabaId?: string
  accessToken?: string
  appSecret?: string
}

export interface SyncWhatsAppAccountResponse {
  message: string
  data: {
    webhook: WhatsAppWebhook
    verifiedName?: string
    displayPhoneNumber?: string
    qualityRating?: string
    isSubscribed?: boolean
  }
}

export interface WhatsAppEvent {
  id: string
  userId: string
  webhookId: string
  phoneNumberId?: string
  eventType: string
  senderId: string
  recipientId: string
  metaTimestamp: number
  status: 'PROCESSED' | 'DUPLICATE' | 'ERROR'
  errorMessage?: string | null
  eventData?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
  createdAt: string
}

export interface WhatsAppEventsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: WhatsAppEvent[]
}

export interface WhatsAppEventResponse {
  message: string
  data: WhatsAppEvent
}

export interface CompileWhatsAppEventPromptRequest {
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  includeFewShot?: boolean
  humanize?: boolean
}

export interface CompileWhatsAppEventPromptResponse {
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

export interface GenerateWhatsAppResponseRequest {
  sendToUser?: boolean
  aiProfileId?: string
  dynamicVariables?: Record<string, string>
  additionalContext?: string
  includeFewShot?: boolean
  humanize?: boolean
}

export interface GenerateWhatsAppResponseResponse {
  message: string
  data: {
    eventId: string
    webhookId: string
    senderId: string
    aiProfileId?: string
    generatedResponse: string
    isFallback?: boolean
    provider?: string
    modelName?: string
    latencyMs: number
    dispatchedToWhatsApp?: boolean
    messageIds?: string[]
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface WhatsAppConversationMessage {
  id: string
  webhookId: string
  userId: string
  senderId: string
  role: 'user' | 'assistant'
  content: string
  aiProfileId?: string
  messageId?: string
  createdAt: string
}

export interface WhatsAppConversationsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: WhatsAppConversationMessage[]
}

export interface SendWhatsAppMessageRequest {
  recipientId: string
  text: string
}

export interface SendWhatsAppMessageResponse {
  message: string
  data: {
    recipientId: string
    messageIds: string[]
    chunksSent?: number
  }
}

/**
 * AI Profile Multi-Channel Bound Webhooks Responses
 */
export interface AiProfileInstagramWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: Array<{
    id: string
    userId: string
    name: string
    aiProfileId: string
    instagramAccountId: string
    username?: string | null
    isActive: boolean
  }>
}

export interface AiProfileWhatsAppWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: Array<{
    id: string
    userId: string
    name: string
    aiProfileId: string
    phoneNumberId: string
    displayPhoneNumber?: string | null
    verifiedName?: string | null
    isActive: boolean
  }>
}



