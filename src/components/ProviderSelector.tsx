'use client'

import { ChatProvider } from '@/types/chat'

interface ProviderSelectorProps {
  provider: ChatProvider
  onChange: (provider: ChatProvider) => void
}

export default function ProviderSelector({ provider, onChange }: ProviderSelectorProps) {
  const providers: { value: ChatProvider; label: string; description: string }[] = [
    {
      value: 'openai-chat',
      label: 'OpenAI Chat',
      description: 'Direct OpenAI chat completions'
    },
    {
      value: 'openai-assistant',
      label: 'OpenAI Assistant',
      description: 'Stateful OpenAI assistants with threads'
    },
    {
      value: 'n8n',
      label: 'n8n Workflow',
      description: 'Custom n8n automation workflows'
    }
  ]

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Provider
      </label>
      <select
        value={provider}
        onChange={(e) => onChange(e.target.value as ChatProvider)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {providers.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {providers.find(p => p.value === provider)?.description}
      </p>
    </div>
  )
}