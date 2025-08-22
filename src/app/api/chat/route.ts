import { NextRequest, NextResponse } from 'next/server'
import { OpenAIAssistantService } from '@/services/openai-assistant'
import { OpenAIChatService } from '@/services/openai-chat'
import { ChatRequest, ChatResponse, ChatMessage } from '@/types/chat'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { message, provider, threadId, assistantId, model, reasoningEffort, verbosity, systemPrompt, conversationHistory } = body

    // Log what we received for verification
    console.log(`Chat API - Provider: ${provider}`)
    if (systemPrompt) {
      console.log('Chat API - System prompt received (length):', systemPrompt.length)
      console.log('Chat API - System prompt preview:', systemPrompt.substring(0, 100) + '...')
    }
    console.log('Chat API - Message preview:', message.substring(0, 100) + '...')

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
        
        const messageHistory = conversationHistory || []
        console.log(`Chat API - Loaded ${messageHistory.length} messages from conversation history`)

        responseMessage = await service.sendMessage(
          message,
          messageHistory,
          model || 'gpt-4o-mini',
          reasoningEffort,
          verbosity,
          systemPrompt
        )
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
    providers: ['openai-assistant', 'openai-chat'],
    status: 'Chat API is running'
  })
}