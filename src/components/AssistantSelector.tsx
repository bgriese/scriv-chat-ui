'use client'

import { OpenAIAssistant } from '@/types/chat'

interface AssistantSelectorProps {
  assistants: OpenAIAssistant[]
  selectedAssistant?: string
  onChange: (assistantId: string) => void
  isLoading: boolean
}

export default function AssistantSelector({ 
  assistants, 
  selectedAssistant, 
  onChange, 
  isLoading 
}: AssistantSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assistant
        </label>
        <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            Loading assistants...
          </div>
        </div>
      </div>
    )
  }

  if (assistants.length === 0) {
    return (
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assistant
        </label>
        <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                      bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
          No assistants found
        </div>
        <p className="text-xs text-red-500 mt-1">
          Please check your OpenAI API key and create some assistants
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Assistant
      </label>
      <select
        value={selectedAssistant || ''}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select an assistant...</option>
        {assistants.map((assistant) => (
          <option key={assistant.id} value={assistant.id}>
            {assistant.name} ({assistant.model})
          </option>
        ))}
      </select>
      
      {selectedAssistant && (
        <div className="mt-2">
          {(() => {
            const selected = assistants.find(a => a.id === selectedAssistant)
            if (!selected) return null
            
            return (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <div className="font-medium">{selected.name}</div>
                {selected.description && (
                  <div className="mt-1">{selected.description}</div>
                )}
                <div className="mt-1 text-gray-500">Model: {selected.model}</div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}