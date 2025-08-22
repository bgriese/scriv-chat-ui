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
import ExportConfirmationDialog from './ExportConfirmationDialog'

const LEGAL_DOCUMENT_SYSTEM_PROMPT = `### Legal Document Assistant System Prompt

**Objective**: You are a legal document assistant designed to facilitate the completion of documents using JSON schemas and Mustache templates. Your tasks include interpreting schemas, prompting users for necessary information, and generating completed documents and data summaries.

#### Core Responsibilities:
- **Interpret JSON Schema**: Analyze the JSON schema to determine the required, optional, and conditionally required fields for document fulfillment.
- **Parse Mustache Template**: Understand the structure and required variables in the accompanying Mustache template.
- **Interactive Data Collection**: Engage with users in a concise, professional, and direct manner to collect necessary data. Continue prompting until all mandatory fields are filled and conditionally required fields are appropriately addressed.
- **Validation**: Check user input for validity against the expected data types and present constraints (e.g., date format, numerical range).
- **Dynamic Requirements Handling**: Manage optional and conditionally required fields, using logical rules from the document's context to determine necessity.
- **Output Generation**:
  - Produce a completed document with embedded user data in the Mustache template.
  - Generate a data summary that aligns with the JSON schema.

#### Interaction Guidelines:
- Maintain a professional tone, being concise yet informative.
- Prompt users clearly for each required piece of information, providing context and examples where needed.
- For incomplete or invalid responses, gently remind users of the requirements and offer examples for clarification.

#### Error Handling:
- Gracefully handle incorrect input by re-prompting the user, clarifying the mistake, and providing examples of valid entries.
- For logic-based conditional fields, clearly explain why additional information is needed based on previous inputs.`

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
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [selectedMessages, setSelectedMessages] = useState<ChatMessage[]>([])
  const [exportStartIndex, setExportStartIndex] = useState<number>(0)

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: content,
          provider,
          threadId,
          assistantId: selectedAssistant,
          model: provider === 'openai-chat' ? selectedModel : undefined,
          ...(showReasoningControls && { reasoningEffort }),
          ...(showVerbosityControl && { verbosity }),
          ...(provider === 'openai-chat' && { 
            systemPrompt: LEGAL_DOCUMENT_SYSTEM_PROMPT,
            conversationHistory: messages
          })
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

  const handleExportFromMessage = (messageIndex: number) => {
    // Export from this message onwards (include all subsequent messages)
    const messagesToExport = messages.slice(messageIndex)
    setSelectedMessages(messagesToExport)
    setExportStartIndex(messageIndex)
    setIsExportDialogOpen(true)
  }

  const handleConfirmExport = async (content: string, title: string, format: 'pdf' | 'docx' | 'markdown' | 'html') => {
    setIsExporting(true)

    try {
      // Get template data from session storage if available
      const templateChatData = sessionStorage.getItem('template-chat-init')
      let templateData = undefined
      
      if (templateChatData) {
        try {
          const data = JSON.parse(templateChatData)
          templateData = data.templateData
        } catch (error) {
          console.warn('Could not parse template data:', error)
        }
      }

      // Create a custom message structure for the formatted content
      const customMessage: ChatMessage = {
        id: `custom-export-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        provider: 'export'
      }

      const formatRequest = {
        messages: [customMessage].map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        templateData,
        format,
        title,
        options: {
          includeSystemMessages: false,
          includeTimestamps: false,
          useMarkdownStyling: true
        }
      }

      const response = await fetch('http://localhost:3003/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to format document')
      }

      const result = await response.json()
      
      // Download the document
      const downloadUrl = `http://localhost:3003${result.downloadUrl}?format=${format}`
      window.open(downloadUrl, '_blank')

    } catch (error: any) {
      console.error('Export error:', error)
      alert(`Failed to export document: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  const exportDocument = async (format: 'pdf' | 'docx' | 'markdown' | 'html') => {
    if (messages.length === 0) {
      alert('No messages to export')
      return
    }

    setIsExporting(true)

    try {
      // Get template data from session storage if available
      const templateChatData = sessionStorage.getItem('template-chat-init')
      let templateData = undefined
      
      if (templateChatData) {
        try {
          const data = JSON.parse(templateChatData)
          templateData = data.templateData
        } catch (error) {
          console.warn('Could not parse template data:', error)
        }
      }

      const formatRequest = {
        messages: messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })),
        templateData,
        format,
        title: templateData?.documentName || `Chat_Document_${new Date().toISOString().split('T')[0]}`,
        options: {
          includeSystemMessages: false,
          includeTimestamps: true,
          useMarkdownStyling: true
        }
      }

      const response = await fetch('http://localhost:3003/api/format', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formatRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to format document')
      }

      const result = await response.json()
      
      // Download the document
      const downloadUrl = `http://localhost:3003${result.downloadUrl}?format=${format}`
      window.open(downloadUrl, '_blank')

    } catch (error: any) {
      console.error('Export error:', error)
      alert(`Failed to export document: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar with Multi-Provider Chat Controls */}
      <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Multi-Provider Chat
            </h1>
            <button
              onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label={isHeaderCollapsed ? 'Expand controls' : 'Collapse controls'}
            >
              <svg className={`w-4 h-4 transform transition-transform ${isHeaderCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isHeaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-none opacity-100'
          }`}>
            <div className="flex flex-col gap-4">
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
        </div>
        
        <div className="mt-auto pt-4 space-y-3">
          {/* Export Document Section */}
          {messages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Document
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => exportDocument('pdf')}
                  disabled={isExporting}
                  className="px-3 py-2 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {isExporting ? '...' : 'PDF'}
                </button>
                <button
                  onClick={() => exportDocument('docx')}
                  disabled={isExporting}
                  className="px-3 py-2 text-xs bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {isExporting ? '...' : 'DOCX'}
                </button>
                <button
                  onClick={() => exportDocument('markdown')}
                  disabled={isExporting}
                  className="px-3 py-2 text-xs bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {isExporting ? '...' : 'MD'}
                </button>
                <button
                  onClick={() => exportDocument('html')}
                  disabled={isExporting}
                  className="px-3 py-2 text-xs bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  {isExporting ? '...' : 'HTML'}
                </button>
              </div>
            </div>
          )}
          
          <button
            onClick={clearMessages}
            className="w-full px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <MessageList 
          messages={messages} 
          isLoading={isLoading}
          onExportFromMessage={handleExportFromMessage}
        />
        
        <MessageInput 
          onSendMessage={sendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Export Confirmation Dialog */}
      <ExportConfirmationDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        onConfirm={handleConfirmExport}
        selectedMessages={selectedMessages}
        defaultTitle={`Export_from_message_${exportStartIndex + 1}_${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  )
}