import { NextRequest, NextResponse } from 'next/server'
import { OpenAIAssistantService } from '@/services/openai-assistant'

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const service = new OpenAIAssistantService(apiKey)
    const assistants = await service.listAssistants()

    return NextResponse.json({ assistants })

  } catch (error: any) {
    console.error('Assistants API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch assistants' },
      { status: 500 }
    )
  }
}