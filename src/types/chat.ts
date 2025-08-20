export type ChatProvider = 'openai-assistant' | 'openai-chat'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  provider?: ChatProvider
  metadata?: Record<string, any>
}

export interface ChatThread {
  id: string
  messages: ChatMessage[]
  provider: ChatProvider
  assistantId?: string
  createdAt: Date
  updatedAt: Date
}

export interface OpenAIAssistant {
  id: string
  name: string
  description?: string
  model: string
  instructions?: string
  tools?: any[]
}

export type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high'
export type VerbosityLevel = 'low' | 'medium' | 'high'

export interface ChatRequest {
  message: string
  provider: ChatProvider
  threadId?: string
  assistantId?: string
  model?: string
  reasoningEffort?: ReasoningEffort
  verbosity?: VerbosityLevel
  systemPrompt?: string
}

export interface ChatResponse {
  message: ChatMessage
  threadId?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export type RunStatus = 
  | 'queued'
  | 'in_progress' 
  | 'requires_action'
  | 'cancelling'
  | 'cancelled'
  | 'failed'
  | 'completed'
  | 'expired'

export interface AssistantRun {
  id: string
  status: RunStatus
  threadId: string
  assistantId: string
}


export interface TemplateImportData {
  documentName: string
  notes: string
  mustache: string
  docSchema: string
  threadId?: string
}

export interface TemplateImportRequest {
  documentName: string
  notes: string
  mustache: string
  docSchema: string
  threadId?: string
}

export interface TemplateImportResponse {
  sessionId: string
  expiresAt: Date
}

export interface TemplateSession {
  id: string
  data: TemplateImportData
  expiresAt: Date
  createdAt: Date
}

export interface ProviderConfig {
  openai?: {
    apiKey: string
    defaultAssistantId?: string
  }
}