'use client'

import { useState, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSubmit = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
            className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     resize-none min-h-[50px] max-h-32"
            rows={1}
            style={{
              height: 'auto',
              minHeight: '50px',
              maxHeight: '128px',
              resize: 'none'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement
              target.style.height = 'auto'
              target.style.height = Math.min(target.scrollHeight, 128) + 'px'
            }}
            disabled={isLoading}
          />
          
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 
                     bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                     text-white p-2 rounded-md transition-colors duration-200"
            title="Send message"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  )
}