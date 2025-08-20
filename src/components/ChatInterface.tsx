'use client'

import { useState, useEffect } from 'react'
import { ChatMessage, ChatProvider, OpenAIAssistant, ReasoningEffort, VerbosityLevel } from '@/types/chat'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import ProviderSelector from './ProviderSelector'
import AssistantSelector from './AssistantSelector'
import ModelSelector from './ModelSelector'
import ReasoningEffortSelector from './ReasoningEffortSelector'
import VerbositySelector from './VerbositySelector'

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [provider, setProvider] = useState<ChatProvider>('openai-chat')
  const [threadId, setThreadId] = useState<string>()
  const [assistants, setAssistants] = useState<OpenAIAssistant[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string>()
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini')
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium')
  const [verbosity, setVerbosity] = useState<VerbosityLevel>('medium')

  useEffect(() => {
    if (provider === 'openai-assistant') {
      fetchAssistants()
    }
  }, [provider])

  useEffect(() => {
    // Check for template-initialized conversation
    loadTemplateInitializedChat()
  }, [])

  const loadTemplateInitializedChat = () => {
    const templateChatData = sessionStorage.getItem('template-chat-init')
    if (templateChatData) {
      try {
        const data = JSON.parse(templateChatData)
        setMessages(data.messages || [])
        setProvider(data.provider || 'openai-chat')
        setThreadId(data.threadId)
        setSelectedAssistant(data.assistantId)
        setSelectedModel(data.model || 'gpt-4o-mini')
        setReasoningEffort(data.reasoningEffort || 'medium')
        setVerbosity(data.verbosity || 'medium')
        
        // Clear the session storage to prevent re-loading
        sessionStorage.removeItem('template-chat-init')
      } catch (error) {
        console.error('Failed to load template chat data:', error)
        sessionStorage.removeItem('template-chat-init')
      }
    }
  }

  // Helper functions for model type detection
  const isReasoningModel = (model: string) => {
    return model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')
  }

  const isGPT5Model = (model: string) => {
    return model.startsWith('gpt-5')
  }

  const showReasoningControls = provider === 'openai-chat' && isReasoningModel(selectedModel)
  const showVerbosityControl = showReasoningControls && isGPT5Model(selectedModel)

  const fetchAssistants = async () => {
    try {
      const response = await fetch('/api/assistants')
      const data = await response.json()
      if (data.assistants) {
        setAssistants(data.assistants)
        if (data.assistants.length > 0) {
          setSelectedAssistant(data.assistants[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch assistants:', error)
    }
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return

    if (provider === 'openai-assistant' && !selectedAssistant) {
      alert('Please select an assistant first')
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      provider
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(provider === 'openai-chat' && messages.length > 0 && {
            'x-conversation-history': JSON.stringify(messages)
          })
        },
        body: JSON.stringify({
          message: content,
          provider,
          threadId,
          assistantId: selectedAssistant,
          model: provider === 'openai-chat' ? selectedModel : undefined,
          ...(showReasoningControls && { reasoningEffort }),
          ...(showVerbosityControl && { verbosity })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      if (provider === 'openai-assistant' && data.threadId) {
        setThreadId(data.threadId)
      }

      setMessages(prev => [...prev, data.message])

    } catch (error: any) {
      console.error('Failed to send message:', error)
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Error: ${error.message}`,
        timestamp: new Date(),
        provider
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearMessages = () => {
    setMessages([])
    setThreadId(undefined)
  }

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Multi-Provider Chat
            </h1>
            <button
              onClick={clearMessages}
              className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              Clear Chat
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <ProviderSelector
              provider={provider}
              onChange={setProvider}
            />
            
            {provider === 'openai-assistant' && (
              <AssistantSelector
                assistants={assistants}
                selectedAssistant={selectedAssistant}
                onChange={setSelectedAssistant}
                isLoading={assistants.length === 0}
              />
            )}
            
            {provider === 'openai-chat' && (
              <ModelSelector
                model={selectedModel}
                onChange={setSelectedModel}
              />
            )}
            
            {showReasoningControls && (
              <ReasoningEffortSelector
                reasoningEffort={reasoningEffort}
                onChange={setReasoningEffort}
              />
            )}
            
            {showVerbosityControl && (
              <VerbositySelector
                verbosity={verbosity}
                onChange={setVerbosity}
              />
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
        />
        
        <MessageInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}