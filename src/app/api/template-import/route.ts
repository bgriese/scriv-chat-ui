import { NextRequest, NextResponse } from 'next/server'
import { TemplateImportRequest, TemplateImportResponse } from '@/types/chat'
import { createSession } from '@/utils/session-manager'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    const body: TemplateImportRequest = await request.json()
    const { documentName, notes, mustache, docSchema, threadId } = body

    // Validate required fields
    if (!documentName?.trim()) {
      return NextResponse.json(
        { error: 'Document name is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    if (!mustache?.trim()) {
      return NextResponse.json(
        { error: 'Mustache template is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    if (!docSchema?.trim()) {
      return NextResponse.json(
        { error: 'Document schema is required' },
        { 
          status: 400,
          headers: corsHeaders
        }
      )
    }

    // Create session with template data
    const session = createSession({
      documentName: documentName.trim(),
      notes: notes?.trim() || '',
      mustache: mustache.trim(),
      docSchema: docSchema.trim(),
      threadId
    })

    console.log(`Created session: ${session.id}`)

    const response: TemplateImportResponse = {
      sessionId: session.id,
      expiresAt: session.expiresAt
    }

    return NextResponse.json(response, {
      headers: corsHeaders
    })

  } catch (error: any) {
    console.error('Template import API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Template Import API is running',
    endpoint: '/api/template-import',
    method: 'POST'
  }, {
    headers: corsHeaders
  })
}