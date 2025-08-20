import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/utils/session-manager'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const { sessionId } = resolvedParams

    if (!sessionId?.trim()) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log(`Attempting to fetch session: ${sessionId}`)
    const session = getSession(sessionId)

    if (!session) {
      console.log(`Session not found: ${sessionId}`)
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      )
    }

    console.log(`Session found: ${sessionId}`)
    return NextResponse.json(session)

  } catch (error: any) {
    console.error('Template session fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const { sessionId } = resolvedParams

    if (!sessionId?.trim()) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const deleted = getSession(sessionId) !== null
    
    if (deleted) {
      const { deleteSession } = await import('@/utils/session-manager')
      deleteSession(sessionId)
    }

    return NextResponse.json({ 
      success: deleted,
      message: deleted ? 'Session deleted' : 'Session not found'
    })

  } catch (error: any) {
    console.error('Template session delete error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}