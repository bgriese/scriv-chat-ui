import OpenAI from 'openai'
import { ChatMessage, ReasoningEffort, VerbosityLevel } from '@/types/chat'

type ModelType = 'legacy' | 'modern' | 'reasoning'

export class OpenAIChatService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  private classifyModel(model: string): ModelType {
    // Legacy models
    if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
      return 'legacy'
    }
    
    // Reasoning models
    if (model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')) {
      return 'reasoning'
    }
    
    // Modern chat models (gpt-4o, gpt-4.1, gpt-4-turbo, etc.)
    return 'modern'
  }

  private buildCompletionParams(
    model: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[],
    reasoningEffort?: ReasoningEffort,
    verbosity?: VerbosityLevel
  ) {
    const modelType = this.classifyModel(model)
    const baseParams: any = {
      model,
      messages
    }

    switch (modelType) {
      case 'legacy':
        return {
          ...baseParams,
          temperature: 0.7,
          max_tokens: 2000
        }
      
      case 'modern':
        return {
          ...baseParams,
          temperature: 0.7,
          max_completion_tokens: 2000
        }
      
      case 'reasoning':
        const reasoningParams: any = {
          ...baseParams,
          max_completion_tokens: 2000
        }
        
        // Add reasoning_effort if provided
        if (reasoningEffort) {
          reasoningParams.reasoning_effort = reasoningEffort
        } else {
          reasoningParams.reasoning_effort = 'medium' // Default
        }
        
        // Add verbosity for GPT-5 models only
        if (model.startsWith('gpt-5') && verbosity) {
          reasoningParams.verbosity = verbosity
        } else if (model.startsWith('gpt-5')) {
          reasoningParams.verbosity = 'medium' // Default for GPT-5
        }
        
        return reasoningParams
      
      default:
        return baseParams
    }
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    model: string = 'gpt-4o-mini',
    reasoningEffort?: ReasoningEffort,
    verbosity?: VerbosityLevel,
    systemPrompt?: string
  ): Promise<ChatMessage> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []
      
      // Add system prompt if provided
      if (systemPrompt) {
        messages.push({
          role: 'system' as const,
          content: systemPrompt
        })
      }
      
      // Add conversation history
      messages.push(...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })))
      
      // Add current user message
      messages.push({
        role: 'user' as const,
        content: message
      })

      const completionParams = this.buildCompletionParams(
        model,
        messages,
        reasoningEffort,
        verbosity
      )

      const completion = await this.client.chat.completions.create(completionParams)

      const responseMessage = completion.choices[0]?.message
      if (!responseMessage?.content) {
        throw new Error('No response content received')
      }

      return {
        id: completion.id,
        role: 'assistant',
        content: responseMessage.content,
        timestamp: new Date(),
        provider: 'openai-chat',
        metadata: {
          model,
          usage: completion.usage,
          modelType: this.classifyModel(model),
          ...(reasoningEffort && { reasoningEffort }),
          ...(verbosity && { verbosity })
        }
      }
    } catch (error) {
      console.error('Failed to send message to OpenAI Chat:', error)
      throw error
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const models = await this.client.models.list()
      return models.data
        .filter(model => model.id.includes('gpt') || model.id.includes('o3') || model.id.includes('o4'))
        .map(model => model.id)
        .sort()
    } catch (error) {
      console.error('Failed to list models:', error)
      return [
        'gpt-5',
        'gpt-4.1',
        'gpt-4.1-mini',
        'gpt-4o',
        'gpt-4o-mini',
        'gpt-4o-realtime-preview',
        'o3-mini',
        'o4-mini',
        'gpt-4-turbo',
        'gpt-4',
        'gpt-3.5-turbo'
      ]
    }
  }
}