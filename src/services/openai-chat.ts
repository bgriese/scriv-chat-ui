import OpenAI from 'openai'
import { ChatMessage } from '@/types/chat'

export class OpenAIChatService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = [],
    model: string = 'gpt-4o-mini'
  ): Promise<ChatMessage> {
    try {
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: message
        }
      ]

      const completion = await this.client.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })

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
          usage: completion.usage
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
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort()
    } catch (error) {
      console.error('Failed to list models:', error)
      return ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo']
    }
  }
}