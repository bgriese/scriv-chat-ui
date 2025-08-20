import { TemplateSession, TemplateImportData } from '@/types/chat'

// In-memory storage for template sessions
const sessions = new Map<string, TemplateSession>()

// Session expiration time (15 minutes)
const SESSION_EXPIRATION_MS = 15 * 60 * 1000

// Cleanup expired sessions periodically
setInterval(() => {
  const now = new Date()
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId)
    }
  }
}, 60 * 1000) // Check every minute

export function createSession(data: TemplateImportData): TemplateSession {
  const sessionId = generateSessionId()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_MS)
  
  const session: TemplateSession = {
    id: sessionId,
    data,
    expiresAt,
    createdAt: now
  }
  
  sessions.set(sessionId, session)
  return session
}

export function getSession(sessionId: string): TemplateSession | null {
  const session = sessions.get(sessionId)
  
  if (!session) {
    return null
  }
  
  // Check if session has expired
  if (session.expiresAt < new Date()) {
    sessions.delete(sessionId)
    return null
  }
  
  return session
}

export function deleteSession(sessionId: string): boolean {
  return sessions.delete(sessionId)
}

function generateSessionId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getSessionStats() {
  return {
    totalSessions: sessions.size,
    activeSessions: Array.from(sessions.values()).filter(s => s.expiresAt > new Date()).length
  }
}