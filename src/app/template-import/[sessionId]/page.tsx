'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TemplateSession, ChatProvider, OpenAIAssistant, ReasoningEffort, VerbosityLevel } from '@/types/chat'
import ModelSelector from '@/components/ModelSelector'
import ProviderSelector from '@/components/ProviderSelector'
import AssistantSelector from '@/components/AssistantSelector'
import ReasoningEffortSelector from '@/components/ReasoningEffortSelector'
import VerbositySelector from '@/components/VerbositySelector'

export default function TemplateImportPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string
  
  const [session, setSession] = useState<TemplateSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  
  // Chat configuration state
  const [provider, setProvider] = useState<ChatProvider>('openai-chat')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini')
  const [assistants, setAssistants] = useState<OpenAIAssistant[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string>()
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium')
  const [verbosity, setVerbosity] = useState<VerbosityLevel>('medium')
  const [initMessage, setInitMessage] = useState('')

  // Helper functions for model type detection
  const isReasoningModel = (model: string) => {
    return model.startsWith('gpt-5') || model.startsWith('o3-') || model.startsWith('o4-')
  }

  const isGPT5Model = (model: string) => {
    return model.startsWith('gpt-5')
  }

  const showReasoningControls = provider === 'openai-chat' && isReasoningModel(selectedModel)
  const showVerbosityControl = showReasoningControls && isGPT5Model(selectedModel)

  const fetchSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/template-import/${sessionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Template session not found or expired')
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const sessionData = await response.json()
      setSession(sessionData)
      
    } catch (err) {
      console.error('Error fetching session:', err)
      setError(err instanceof Error ? err.message : 'Failed to load template session')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  const extractMustacheVariables = (template: string): string[] => {
    const matches = template.match(/\{\{([^}]+)\}\}/g) || []
    return [...new Set(matches.map(match => match.slice(2, -2).trim()))]
  }

  const generateInitMessage = useCallback(() => {
    if (!session) return

    let message = `I'm working with a legal document template. Here are the details:

**Document:** ${session.data.documentName}

**Notes:**
${session.data.notes || 'No additional notes provided.'}

**Template Structure:**
The template uses mustache syntax with the following variables:
${extractMustacheVariables(session.data.mustache).map(v => `- {{${v}}}`).join('\n')}

**Document Schema:**
\`\`\`json
${session.data.docSchema}
\`\`\`

Please help me understand this template and assist with processing it.`

    setInitMessage(message)
  }, [session])

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

  useEffect(() => {
    fetchSession()
  }, [sessionId, fetchSession])

  useEffect(() => {
    if (provider === 'openai-assistant') {
      fetchAssistants()
    }
  }, [provider])

  useEffect(() => {
    if (session) {
      generateInitMessage()
    }
  }, [session, generateInitMessage])

  const handleStartChat = async () => {
    if (!session || !initMessage.trim()) return

    if (provider === 'openai-assistant' && !selectedAssistant) {
      alert('Please select an assistant first')
      return
    }

    setProcessing(true)

    try {
      // Send the initialization message
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: initMessage,
          provider,
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

      // Store the initial conversation in sessionStorage for the main chat page
      const initialConversation = [
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: initMessage,
          timestamp: new Date(),
          provider
        },
        data.message
      ]

      sessionStorage.setItem('template-chat-init', JSON.stringify({
        messages: initialConversation,
        provider,
        threadId: data.threadId,
        assistantId: selectedAssistant,
        model: selectedModel,
        reasoningEffort,
        verbosity,
        templateData: session.data
      }))

      // Navigate to main chat page
      router.push('/')

    } catch (error: any) {
      console.error('Failed to start chat:', error)
      setError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Template Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {error || 'The template session has expired or is invalid.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go to Chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Template Import
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure your AI model and customize the initialization message
            </p>
          </div>

          {/* Template Preview */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Template: {session.data.documentName}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notes */}
              {session.data.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap">
                      {session.data.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Mustache Variables */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Variables ({extractMustacheVariables(session.data.mustache).length})
                </h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex flex-wrap gap-2">
                    {extractMustacheVariables(session.data.mustache).map((variable, index) => (
                      <span
                        key={index}
                        className="inline-block bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded text-xs font-mono"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Configuration
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Initialization Message */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Initialization Message
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This message will be sent to the AI to start the conversation. You can customize it as needed.
            </p>
            
            <textarea
              value={initMessage}
              onChange={(e) => setInitMessage(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your initialization message..."
            />
            
            <div className="flex justify-between items-center mt-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleStartChat}
                disabled={processing || !initMessage.trim()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {processing && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}