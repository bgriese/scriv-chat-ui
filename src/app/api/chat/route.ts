import { NextRequest, NextResponse } from 'next/server'
import { OpenAIAssistantService } from '@/services/openai-assistant'
import { OpenAIChatService } from '@/services/openai-chat'
import { N8nService } from '@/services/n8n'
import { ChatRequest, ChatResponse, ChatMessage } from '@/types/chat'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, provider, threadId, assistantId, model } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey && (provider === 'openai-assistant' || provider === 'openai-chat')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    let responseMessage: ChatMessage
    let responseThreadId: string | undefined = threadId

    switch (provider) {
      case 'openai-assistant': {
        if (!assistantId) {
          return NextResponse.json(
            { error: 'Assistant ID is required for OpenAI Assistant provider' },
            { status: 400 }
          )
        }

        const service = new OpenAIAssistantService(apiKey!)
        const result = await service.sendMessage(message, assistantId, threadId)
        
        const messages = result.messages
        responseMessage = messages[messages.length - 1]
        responseThreadId = result.threadId
        break
      }

      case 'openai-chat': {
        const service = new OpenAIChatService(apiKey!)
        
        let conversationHistory: ChatMessage[] = []
        if (threadId) {
          const historyData = request.headers.get('x-conversation-history')
          if (historyData) {
            try {
              conversationHistory = JSON.parse(historyData)
            } catch (error) {
              console.warn('Failed to parse conversation history:', error)
            }
          }
        }

        responseMessage = await service.sendMessage(
          message,
          conversationHistory,
          model || 'gpt-4o-mini'
        )
        break
      }

      case 'n8n': {
        const webhookUrl = process.env.N8N_WEBHOOK_URL
        if (!webhookUrl) {
          return NextResponse.json(
            { error: 'n8n webhook URL not configured' },
            { status: 500 }
          )
        }

        const service = new N8nService(
          webhookUrl,
          process.env.N8N_API_URL,
          process.env.N8N_API_KEY
        )

        responseMessage = await service.sendMessage(message, threadId, { model })
        break
      }

      default:
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        )
    }

    const response: ChatResponse = {
      message: responseMessage,
      threadId: responseThreadId
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    providers: ['openai-assistant', 'openai-chat', 'n8n'],
    status: 'Chat API is running'
  })
}