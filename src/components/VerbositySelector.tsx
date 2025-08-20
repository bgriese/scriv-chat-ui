'use client'

import { VerbosityLevel } from '@/types/chat'

interface VerbositySelectorProps {
  verbosity: VerbosityLevel
  onChange: (verbosity: VerbosityLevel) => void
}

export default function VerbositySelector({ verbosity, onChange }: VerbositySelectorProps) {
  const levels: { value: VerbosityLevel; label: string; description: string }[] = [
    {
      value: 'low',
      label: 'Low',
      description: 'Concise, to-the-point responses'
    },
    {
      value: 'medium',
      label: 'Medium',
      description: 'Balanced detail and brevity'
    },
    {
      value: 'high',
      label: 'High',
      description: 'Comprehensive, detailed explanations'
    }
  ]

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Verbosity
      </label>
      <select
        value={verbosity}
        onChange={(e) => onChange(e.target.value as VerbosityLevel)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {levels.map((level) => (
          <option key={level.value} value={level.value}>
            {level.label}
          </option>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {levels.find(l => l.value === verbosity)?.description}
      </p>
    </div>
  )
}