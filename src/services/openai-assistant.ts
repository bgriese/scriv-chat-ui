import OpenAI from 'openai'
import { ChatMessage, OpenAIAssistant, AssistantRun, RunStatus } from '@/types/chat'

export class OpenAIAssistantService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async listAssistants(): Promise<OpenAIAssistant[]> {
    try {
      const response = await this.client.beta.assistants.list({
        order: 'desc',
        limit: 20
      })
      
      return response.data.map(assistant => ({
        id: assistant.id,
        name: assistant.name || 'Unnamed Assistant',
        description: assistant.description,
        model: assistant.model,
        instructions: assistant.instructions,
        tools: assistant.tools
      }))
    } catch (error) {
      console.error('Failed to list assistants:', error)
      throw new Error('Failed to fetch assistants')
    }
  }

  async createThread(): Promise<string> {
    try {
      const thread = await this.client.beta.threads.create()
      return thread.id
    } catch (error) {
      console.error('Failed to create thread:', error)
      throw new Error('Failed to create thread')
    }
  }

  async addMessageToThread(threadId: string, content: string): Promise<void> {
    try {
      await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content
      })
    } catch (error) {
      console.error('Failed to add message to thread:', error)
      throw new Error('Failed to add message to thread')
    }
  }

  async createRun(threadId: string, assistantId: string): Promise<AssistantRun> {
    try {
      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId
      })
      
      return {
        id: run.id,
        status: run.status as RunStatus,
        threadId,
        assistantId
      }
    } catch (error) {
      console.error('Failed to create run:', error)
      throw new Error('Failed to create run')
    }
  }

  async pollRunStatus(threadId: string, runId: string): Promise<AssistantRun> {
    try {
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId)
      
      return {
        id: run.id,
        status: run.status as RunStatus,
        threadId,
        assistantId: run.assistant_id
      }
    } catch (error) {
      console.error('Failed to poll run status:', error)
      throw new Error('Failed to get run status')
    }
  }

  async waitForCompletion(threadId: string, runId: string, maxWaitTime = 30000): Promise<AssistantRun> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      const run = await this.pollRunStatus(threadId, runId)
      
      if (['completed', 'failed', 'cancelled', 'expired'].includes(run.status)) {
        return run
      }
      
      if (run.status === 'requires_action') {
        throw new Error('Run requires action - function calls not implemented yet')
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    throw new Error('Run timed out')
  }

  async getThreadMessages(threadId: string): Promise<ChatMessage[]> {
    try {
      const messages = await this.client.beta.threads.messages.list(threadId, {
        order: 'asc'
      })
      
      return messages.data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: this.extractTextContent(msg.content),
        timestamp: new Date(msg.created_at * 1000),
        provider: 'openai-assistant' as const
      }))
    } catch (error) {
      console.error('Failed to get thread messages:', error)
      throw new Error('Failed to get thread messages')
    }
  }

  private extractTextContent(content: any[]): string {
    return content
      .filter(item => item.type === 'text')
      .map(item => item.text?.value || '')
      .join('\n')
  }

  async sendMessage(
    message: string, 
    assistantId: string, 
    threadId?: string
  ): Promise<{ messages: ChatMessage[], threadId: string }> {
    try {
      const finalThreadId = threadId || await this.createThread()
      
      await this.addMessageToThread(finalThreadId, message)
      
      const run = await this.createRun(finalThreadId, assistantId)
      await this.waitForCompletion(finalThreadId, run.id)
      
      const messages = await this.getThreadMessages(finalThreadId)
      
      return {
        messages,
        threadId: finalThreadId
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  }
}