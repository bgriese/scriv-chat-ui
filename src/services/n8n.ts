import { ChatMessage, N8nWebhookPayload } from '@/types/chat'

export class N8nService {
  private webhookUrl: string
  private apiUrl?: string
  private apiKey?: string

  constructor(webhookUrl: string, apiUrl?: string, apiKey?: string) {
    this.webhookUrl = webhookUrl
    this.apiUrl = apiUrl
    this.apiKey = apiKey
  }

  async sendMessage(
    message: string,
    threadId?: string,
    metadata?: Record<string, any>
  ): Promise<ChatMessage> {
    try {
      const payload: N8nWebhookPayload = {
        message,
        threadId,
        metadata
      }

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      return {
        id: `n8n-${Date.now()}`,
        role: 'assistant',
        content: this.extractResponseContent(result),
        timestamp: new Date(),
        provider: 'n8n',
        metadata: {
          ...metadata,
          n8nResponse: result
        }
      }
    } catch (error) {
      console.error('Failed to send message to n8n:', error)
      throw error
    }
  }

  private extractResponseContent(response: any): string {
    if (typeof response === 'string') {
      return response
    }
    
    if (response.message) {
      return response.message
    }
    
    if (response.response) {
      return response.response
    }
    
    if (response.data?.message) {
      return response.data.message
    }
    
    if (response.output) {
      return response.output
    }
    
    if (Array.isArray(response) && response.length > 0) {
      return this.extractResponseContent(response[0])
    }
    
    return JSON.stringify(response, null, 2)
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.sendMessage('test')
      return !!response.content
    } catch (error) {
      console.error('n8n connection test failed:', error)
      return false
    }
  }

  async listWorkflows(): Promise<any[]> {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('n8n API URL and key required for listing workflows')
    }

    try {
      const response = await fetch(`${this.apiUrl}/workflows`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Failed to list n8n workflows:', error)
      throw error
    }
  }

  async executeWorkflow(workflowId: string, data: any): Promise<any> {
    if (!this.apiUrl || !this.apiKey) {
      throw new Error('n8n API URL and key required for executing workflows')
    }

    try {
      const response = await fetch(`${this.apiUrl}/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Failed to execute workflow: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to execute n8n workflow:', error)
      throw error
    }
  }
}