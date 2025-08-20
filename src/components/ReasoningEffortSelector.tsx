'use client'

import { ReasoningEffort } from '@/types/chat'

interface ReasoningEffortSelectorProps {
  reasoningEffort: ReasoningEffort
  onChange: (effort: ReasoningEffort) => void
}

export default function ReasoningEffortSelector({ reasoningEffort, onChange }: ReasoningEffortSelectorProps) {
  const efforts: { value: ReasoningEffort; label: string; description: string }[] = [
    {
      value: 'minimal',
      label: 'Minimal',
      description: 'Fastest responses with basic reasoning'
    },
    {
      value: 'low',
      label: 'Low',
      description: 'Quick responses with light reasoning'
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Balanced speed and reasoning depth'
    },
    {
      value: 'high',
      label: 'High',
      description: 'Thorough reasoning, slower responses'
    }
  ]

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Reasoning Effort
      </label>
      <select
        value={reasoningEffort}
        onChange={(e) => onChange(e.target.value as ReasoningEffort)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {efforts.map((effort) => (
          <option key={effort.value} value={effort.value}>
            {effort.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {efforts.find(e => e.value === reasoningEffort)?.description}
      </p>
    </div>
  )
}