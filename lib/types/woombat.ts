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

export interface SubAgentCapabilities {
  productSearch?: boolean
  visualSearch?: boolean
  orderTracking?: boolean
  inventoryCheck?: boolean
  cartAssistance?: boolean
  humanHandoff?: boolean
  [key: string]: boolean | undefined
}

export interface SubAgentConfig {
  speciality: string
  triggerKeywords: string[]
  triggerIntents?: string[]
  priority?: number
  autoDelegate?: boolean
  negativeKeywords?: string[]
}

export interface AiProfileShoppingConfig {
  enabled: boolean
  visualSearchEnabled: boolean
  exactMatchThreshold?: number
  suggestionThreshold?: number
  maxExactMatches?: number
  maxSuggestions?: number
  sendSuggestedImages?: boolean
  deliveryFormat?: 'CAROUSEL' | 'IMAGE_ATTACHMENT' | 'TEXT_WITH_LINKS' | string
  customSuggestionPrompt?: string
}

export interface AiProfile {
  id: string
  userId: string
  parentId?: string | null
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
  capabilities?: SubAgentCapabilities
  subAgentConfig?: SubAgentConfig
  shoppingConfig?: AiProfileShoppingConfig
  routingMode?: 'KEYWORD_FIRST' | 'SEMANTIC_SIMILARITY' | 'HYBRID' | string
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
 * Coordinator AI Profile Sub-Agents & Specialist Delegation Types
 */

export interface SubAgentProfile {
  id: string
  userId: string
  parentId: string
  name: string
  role: string
  category?: string
  capabilities?: SubAgentCapabilities
  subAgentConfig?: SubAgentConfig
  systemPrompt?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CoordinatorSubAgentsResponse {
  message: string
  data: {
    parentId: string
    parentName: string
    routingMode?: 'KEYWORD_FIRST' | 'SEMANTIC_SIMILARITY' | 'HYBRID' | string
    subAgents: SubAgentProfile[]
  }
}

export interface SubAgentResponse {
  message: string
  data: SubAgentProfile
}

export interface CreateSubAgentRequest {
  name: string
  role: string
  category?: string
  capabilities?: SubAgentCapabilities
  subAgentConfig?: SubAgentConfig
  systemPrompt?: string
  isActive?: boolean
}

export interface UpdateSubAgentRequest {
  name?: string
  role?: string
  category?: string
  capabilities?: SubAgentCapabilities
  subAgentConfig?: SubAgentConfig
  systemPrompt?: string
  isActive?: boolean
}

export interface SimulateRoutingRequest {
  userPrompt: string
  hasImages?: boolean
}

export interface EvaluatedSubAgent {
  id: string
  name: string
  speciality: string
  priority: number
  score: number
  matchedKeywords: string[]
  negativeTriggered: boolean
  isEligible: boolean
}

export interface SimulateRoutingResponse {
  message: string
  data: {
    parentProfileId: string
    parentProfileName: string
    selectedProfileId: string
    selectedProfileName: string
    selectedProfileRole: string
    selectedProfileSpeciality?: string
    isSubAgent: boolean
    routingReason: string
    confidenceScore: number
    matchedKeywords: string[]
    evaluatedSubAgents: EvaluatedSubAgent[]
  }
}

export interface AutoProvisionSubAgentsRequest {
  industryPack: 'ECOMMERCE_RETAIL' | string
}

export interface AutoProvisionSubAgentsResponse {
  message: string
  data: {
    parentId: string
    industryPack: string
    createdSubAgents: Array<{
      id: string
      name: string
      role: string
    }>
  }
}

/**
 * Conversation Bot Pause & Takeover Types
 */

export interface PauseBotRequest {
  durationMinutes?: number
  reason?: string
}

export interface PauseBotResponse {
  message: string
  data: {
    senderId: string
    isPaused: boolean
    pausedUntil?: string | null
    reason?: string
  }
}

export interface ResumeBotResponse {
  message: string
  data: {
    senderId: string
    isPaused: boolean
    resumedAt: string
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

export interface AiProfileFacebookFeedWebhooksResponse {
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
    pageId?: string | null
    pageName?: string | null
    replyMode?: FacebookFeedReplyMode
    autoReply?: boolean
    isActive: boolean
    webhookUrl?: string
  }>
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 9: Facebook Page Feed Webhooks & Comment Reply Automation
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type FacebookFeedReplyMode = 'PUBLIC_COMMENT' | 'PRIVATE_MESSAGE' | 'BOTH'

export interface FacebookFeedWebhook {
  id: string
  userId: string
  name: string
  pageId: string
  pageName?: string | null
  pageCategory?: string | null
  pagePictureUrl?: string | null
  pageLink?: string | null
  pageSubscribedAt?: string | null
  verifyToken: string
  webhookUrl: string
  aiProfileId?: string | null
  replyMode: FacebookFeedReplyMode
  autoReply: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FacebookFeedWebhooksResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: FacebookFeedWebhook[]
}

export interface FacebookFeedWebhookResponse {
  message: string
  data: FacebookFeedWebhook
}

export interface CreateFacebookFeedWebhookRequest {
  name: string
  appSecret: string
  verifyToken?: string
  pageId?: string
  pageAccessToken?: string
  aiProfileId?: string
  replyMode?: FacebookFeedReplyMode
  autoReply?: boolean
}

export interface UpdateFacebookFeedWebhookRequest {
  name?: string
  appSecret?: string
  verifyToken?: string
  pageId?: string
  pageAccessToken?: string
  aiProfileId?: string | null
  replyMode?: FacebookFeedReplyMode
  autoReply?: boolean
  isActive?: boolean
}

export interface SyncFacebookFeedPageResponse {
  message: string
  data: {
    webhook: FacebookFeedWebhook
    pageDetails?: {
      id: string
      name: string
      category?: string
      link?: string
      pictureUrl?: string
    }
    isSubscribed?: boolean
  }
}

export interface FacebookFeedEvent {
  id: string
  userId: string
  webhookId: string
  pageId?: string
  postId?: string
  commentId?: string
  parentId?: string | null
  eventType: string
  senderId: string
  senderName?: string
  recipientId: string
  metaTimestamp: number
  status: 'PROCESSED' | 'DUPLICATE' | 'ERROR' | string
  errorMessage?: string | null
  eventData?: Record<string, unknown>
  rawPayload?: Record<string, unknown>
  createdAt: string
}

export interface FacebookFeedEventsResponse {
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: FacebookFeedEvent[]
}

export interface FacebookFeedEventResponse {
  message: string
  data: FacebookFeedEvent
}

export interface CompileFacebookFeedPromptRequest {
  additionalContext?: string
  humanize?: boolean
}

export interface CompileFacebookFeedPromptResponse {
  message: string
  data: {
    systemPrompt: string
    messages: CompilePromptMessage[]
    modelConfig?: {
      provider?: string
      model?: string
      modelName?: string
      temperature?: number
      maxTokens?: number
      [key: string]: unknown
    }
    userPrompt?: string
  }
}

export interface GenerateFacebookFeedResponseRequest {
  commentId?: string
  postId?: string
  userInquiry?: string
  replyModeOverride?: FacebookFeedReplyMode
  sendReply?: boolean
  additionalContext?: string
  humanize?: boolean
}

export interface GenerateFacebookFeedResponseResponse {
  message: string
  data: {
    aiProfileId?: string
    generatedResponse: string
    replyMode: FacebookFeedReplyMode
    publicCommentReplyId?: string | null
    privateMessageId?: string | null
    isFallback?: boolean
    provider?: string
    modelName?: string
    latencyMs: number
    postContext?: {
      postId: string
      message?: string | null
      story?: string | null
      permalinkUrl?: string | null
    }
    parentCommentContext?: unknown
    tokenUsage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  }
}

export interface FacebookFeedCommentMessage {
  id: string
  webhookId: string
  userId: string
  postId: string
  commentId: string
  parentId?: string | null
  role: 'user' | 'assistant'
  content: string
  replyMode?: FacebookFeedReplyMode
  aiProfileId?: string
  metaCommentId?: string
  createdAt: string
}

export interface FacebookFeedCommentsResponse {
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: FacebookFeedCommentMessage[]
}

export interface SendFacebookFeedCommentRequest {
  commentId: string
  messageText: string
}

export interface SendFacebookFeedCommentResponse {
  message: string
  data?: unknown
}

export interface SendFacebookFeedPrivateReplyRequest {
  commentId: string
  messageText: string
}

export interface SendFacebookFeedPrivateReplyResponse {
  message: string
  data?: unknown
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Section 10: Multi-Tenant E-Commerce Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface StoreProfile {
  id: string
  userId: string
  name: string
  slug: string
  description?: string | null
  logoUrl?: string | null
  bannerUrl?: string | null
  currency: string
  contactEmail?: string | null
  contactPhone?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  isActive: boolean
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreProfileResponse {
  message: string
  data: StoreProfile
}

export interface CreateStoreRequest {
  name: string
  slug: string
  description?: string
  currency?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  city?: string
  country?: string
  logoUrl?: string
  bannerUrl?: string
}

export interface UpdateStoreRequest {
  name?: string
  slug?: string
  description?: string
  logoUrl?: string | null
  bannerUrl?: string | null
  currency?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  city?: string
  country?: string
  isActive?: boolean
  isPublished?: boolean
}

export interface StoreAnalytics {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
  grossRevenue: number
  currency: string
  lowStockCount: number
  recentOrders?: StoreOrder[]
}

export interface StoreAnalyticsResponse {
  message: string
  data: StoreAnalytics
}

export interface PresignedUploadUrlRequest {
  fileName: string
  contentType: string
  assetType: 'logo' | 'banner' | 'product_image' | 'store_logo' | 'store_banner' | 'category_image' | string
}

export interface PresignedUploadUrlResponse {
  message: string
  data: {
    uploadUrl: string
    fileUrl: string
    key?: string
  }
}

export type MediaAssetType = 'product_image' | 'store_logo' | 'store_banner' | 'category_image' | string

export interface DirectMediaUploadRequest {
  fileName: string
  contentType: string
  assetType?: MediaAssetType
  data: string // Base64 data URL
}

export interface DirectMediaUploadResponse {
  message: string
  data: {
    key: string
    url: string
    fileName: string
    contentType: string
    size?: number
  }
}

export interface StoreCategory {
  id: string
  storeId?: string
  name: string
  slug: string
  description?: string | null
  sortOrder?: number
  parentId?: string | null
  isActive?: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreCategoriesResponse {
  message?: string
  data: StoreCategory[]
}

export interface StoreCategoryResponse {
  message: string
  data: StoreCategory
}

export interface CreateStoreCategoryRequest {
  name: string
  slug: string
  description?: string
  sortOrder?: number
  parentId?: string | null
}

export interface UpdateStoreCategoryRequest {
  name?: string
  slug?: string
  description?: string
  sortOrder?: number
  parentId?: string | null
  isActive?: boolean
}

export interface ProductVariant {
  id?: string
  productId?: string
  title: string
  sku?: string
  price?: number
  compareAtPrice?: number | null
  inventoryQuantity: number
  options?: Record<string, string>
  createdAt?: string
  updatedAt?: string
}

export interface StoreProduct {
  id: string
  storeId?: string
  categoryId?: string | null
  title: string
  slug: string
  description?: string | null
  price: number
  compareAtPrice?: number | null
  costPrice?: number | null
  sku?: string | null
  barcode?: string | null
  trackInventory: boolean
  inventoryQuantity: number
  lowStockThreshold?: number | null
  images: string[]
  isActive: boolean
  variants?: ProductVariant[]
  category?: StoreCategory | null
  createdAt: string
  updatedAt: string
}

export interface StoreProductsResponse {
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: StoreProduct[]
}

export interface StoreProductResponse {
  message: string
  data: StoreProduct
}

export interface CreateStoreProductRequest {
  title: string
  slug: string
  description?: string
  price: number
  compareAtPrice?: number
  costPrice?: number
  sku?: string
  barcode?: string
  trackInventory?: boolean
  inventoryQuantity?: number
  lowStockThreshold?: number
  images?: string[]
  categoryId?: string | null
  isActive?: boolean
  variants?: Array<{
    title: string
    sku?: string
    price?: number
    compareAtPrice?: number
    inventoryQuantity: number
    options?: Record<string, string>
  }>
}

export interface UpdateStoreProductRequest {
  title?: string
  slug?: string
  description?: string
  price?: number
  compareAtPrice?: number | null
  costPrice?: number | null
  sku?: string
  barcode?: string
  trackInventory?: boolean
  inventoryQuantity?: number
  lowStockThreshold?: number | null
  images?: string[]
  categoryId?: string | null
  isActive?: boolean
  variants?: ProductVariant[]
}

export type InventoryAdjustReason =
  | 'RESTOCK'
  | 'CORRECTION'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGE'
  | string

export interface InventoryAdjustRequest {
  productId: string
  variantId?: string
  change: number
  reason: InventoryAdjustReason
  note?: string
}

export interface InventoryAdjustResponse {
  message: string
  data?: unknown
}

export interface InventoryLog {
  id: string
  storeId?: string
  productId: string
  variantId?: string | null
  productTitle?: string
  variantTitle?: string | null
  previousQuantity: number
  change: number
  newQuantity: number
  reason: string
  note?: string | null
  createdAt: string
}

export interface InventoryLogsResponse {
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: InventoryLog[]
}

export type DiscountType = 'PERCENTAGE' | 'FIXED'

export interface StoreCoupon {
  id: string
  storeId?: string
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number | null
  maxDiscountAmount?: number | null
  usageLimit?: number | null
  usageCount: number
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreCouponsResponse {
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: StoreCoupon[]
}

export interface StoreCouponResponse {
  message: string
  data: StoreCoupon
}

export interface CreateStoreCouponRequest {
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageLimit?: number
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export interface UpdateStoreCouponRequest {
  code?: string
  discountType?: DiscountType
  discountValue?: number
  minOrderAmount?: number | null
  maxDiscountAmount?: number | null
  usageLimit?: number | null
  startDate?: string | null
  endDate?: string | null
  isActive?: boolean
}

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'

export interface ShippingAddress {
  fullName: string
  addressLine1: string
  addressLine2?: string
  city: string
  state?: string
  postalCode?: string
  country: string
  phone?: string
}

export interface StoreOrderItem {
  id: string
  orderId?: string
  productId: string
  variantId?: string | null
  title: string
  variantTitle?: string | null
  price: number
  quantity: number
  total: number
  image?: string
}

export interface StoreOrder {
  id: string
  orderNumber: string
  storeId?: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  status: OrderStatus
  paymentMethod: string
  paymentStatus: PaymentStatus
  currency: string
  subtotal: number
  discountAmount: number
  shippingCost: number
  totalAmount: number
  couponCode?: string | null
  trackingNumber?: string | null
  items: StoreOrderItem[]
  createdAt: string
  updatedAt: string
}

export interface StoreOrdersResponse {
  message?: string
  pagination?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  data: StoreOrder[]
}

export interface StoreOrderResponse {
  message: string
  data: StoreOrder
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus
  trackingNumber?: string
}

export interface CartItem {
  id: string
  productId: string
  variantId?: string | null
  title: string
  variantTitle?: string | null
  price: number
  quantity: number
  image?: string
}

export interface CartSession {
  id: string
  cartId?: string
  storeId?: string
  items: CartItem[]
  couponCode?: string | null
  discount?: number
  subtotal?: number
  total?: number
  itemCount?: number
}

export interface CartResponse {
  message: string
  data: CartSession
}

export interface AddCartItemRequest {
  productId: string
  variantId?: string
  quantity: number
}

export interface UpdateCartItemRequest {
  quantity: number
}

export interface ApplyCartCouponRequest {
  code: string
}

export interface CheckoutRequest {
  cartId: string
  customerEmail: string
  customerName: string
  customerPhone?: string
  shippingAddress: ShippingAddress
  billingAddress?: ShippingAddress
  paymentMethod: string
}

export interface CheckoutResponse {
  message: string
  data: StoreOrder
}

/**
 * Visual Search & Vector Embedding Types (Qdrant)
 */

export interface VisualSearchSyncResponse {
  message: string
  data: {
    indexedCount: number
  }
}

export interface VisualSearchRequest {
  image: string // image URL or base64 data URI
  limit?: number // default 5
  minScore?: number // default 0.65
}

export interface VisualMatchedProduct {
  productId: string
  productSlug: string
  title: string
  price: number
  currency: string
  imageUrl?: string
  score: number
}

export interface VisualSearchResponse {
  message: string
  data: {
    matchedProducts: VisualMatchedProduct[]
    count: number
    queryImage: string
  }
}






