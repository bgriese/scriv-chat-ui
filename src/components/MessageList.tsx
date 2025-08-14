'use client'

import { useEffect, useRef } from 'react'
import { ChatMessage } from '@/types/chat'

interface MessageListProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProviderColor = (provider?: string) => {
    switch (provider) {
      case 'openai-assistant':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'openai-chat':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'n8n':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'openai-assistant':
        return 'Assistant'
      case 'openai-chat':
        return 'OpenAI'
      case 'n8n':
        return 'n8n'
      default:
        return 'Unknown'
    }
  }

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <p className="text-xl mb-2">Start a conversation</p>
          <p className="text-sm">Choose a provider and send your first message</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[70%] rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </span>
              {message.provider && message.role === 'assistant' && (
                <span className={`text-xs px-2 py-1 rounded-full ${getProviderColor(message.provider)}`}>
                  {getProviderName(message.provider)}
                </span>
              )}
              <span className="text-xs opacity-70">
                {formatTime(message.timestamp)}
              </span>
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
            {message.metadata?.usage && (
              <div className="text-xs opacity-50 mt-2">
                Tokens: {message.metadata.usage.total_tokens}
              </div>
            )}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 max-w-[70%]">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  )
}