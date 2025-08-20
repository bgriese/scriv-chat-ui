import { TemplateSession, TemplateImportData } from '@/types/chat'
import fs from 'fs'
import path from 'path'

// Session expiration time (15 minutes)
const SESSION_EXPIRATION_MS = 15 * 60 * 1000

// Directory to store session files
const SESSIONS_DIR = path.join(process.cwd(), '.sessions')

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true })
}

// Cleanup expired sessions periodically
setInterval(() => {
  cleanupExpiredSessions()
}, 60 * 1000) // Check every minute

function cleanupExpiredSessions() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) return
    
    const now = new Date()
    const files = fs.readdirSync(SESSIONS_DIR)
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      
      const filePath = path.join(SESSIONS_DIR, file)
      try {
        const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const expiresAt = new Date(sessionData.expiresAt)
        
        if (expiresAt < now) {
          fs.unlinkSync(filePath)
          console.log(`Cleaned up expired session: ${file}`)
        }
      } catch (error) {
        console.error(`Error processing session file ${file}:`, error)
        // Delete corrupted files
        fs.unlinkSync(filePath)
      }
    }
  } catch (error) {
    console.error('Error during session cleanup:', error)
  }
}

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
  
  try {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`)
    fs.writeFileSync(filePath, JSON.stringify(session), 'utf8')
    console.log(`Session stored to file: ${sessionId}`)
    return session
  } catch (error) {
    console.error(`Error storing session ${sessionId}:`, error)
    throw new Error('Failed to create session')
  }
}

export function getSession(sessionId: string): TemplateSession | null {
  console.log(`Looking for session file: ${sessionId}`)
  
  try {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`)
    
    if (!fs.existsSync(filePath)) {
      console.log(`Session file ${sessionId} not found`)
      return null
    }
    
    const sessionData = fs.readFileSync(filePath, 'utf8')
    const session: TemplateSession = JSON.parse(sessionData)
    
    // Check if session has expired
    const expiresAt = new Date(session.expiresAt)
    if (expiresAt < new Date()) {
      console.log(`Session ${sessionId} has expired`)
      fs.unlinkSync(filePath)
      return null
    }
    
    console.log(`Session ${sessionId} found and valid`)
    return session
    
  } catch (error) {
    console.error(`Error reading session ${sessionId}:`, error)
    // Try to clean up corrupted file
    try {
      const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (cleanupError) {
      console.error(`Error cleaning up corrupted session file:`, cleanupError)
    }
    return null
  }
}

export function deleteSession(sessionId: string): boolean {
  try {
    const filePath = path.join(SESSIONS_DIR, `${sessionId}.json`)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Session file deleted: ${sessionId}`)
      return true
    }
    return false
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error)
    return false
  }
}

function generateSessionId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getSessionStats() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return { totalSessions: 0, activeSessions: 0 }
    }
    
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'))
    const now = new Date()
    let activeSessions = 0
    
    for (const file of files) {
      try {
        const filePath = path.join(SESSIONS_DIR, file)
        const sessionData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
        const expiresAt = new Date(sessionData.expiresAt)
        
        if (expiresAt > now) {
          activeSessions++
        }
      } catch (error) {
        // Skip corrupted files
      }
    }
    
    return {
      totalSessions: files.length,
      activeSessions
    }
  } catch (error) {
    console.error('Error getting session stats:', error)
    return { totalSessions: 0, activeSessions: 0 }
  }
}