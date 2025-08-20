'use client'

interface ModelSelectorProps {
  model: string
  onChange: (model: string) => void
}

interface ModelOption {
  value: string
  label: string
  description: string
}

interface ModelGroup {
  label: string
  models: ModelOption[]
}

export default function ModelSelector({ model, onChange }: ModelSelectorProps) {
  const modelGroups: ModelGroup[] = [
    {
      label: 'Latest Models (2025)',
      models: [
        {
          value: 'gpt-5',
          label: 'GPT-5',
          description: 'Most advanced OpenAI model with unified reasoning'
        },
        {
          value: 'gpt-4.1',
          label: 'GPT-4.1',
          description: 'Flagship API model with improved coding and instruction following'
        },
        {
          value: 'gpt-4.1-mini',
          label: 'GPT-4.1 Mini',
          description: 'Fast, affordable variant of GPT-4.1 at ⅕th the price'
        }
      ]
    },
    {
      label: 'GPT-4o Series (Multimodal)',
      models: [
        {
          value: 'gpt-4o',
          label: 'GPT-4o',
          description: 'High-intelligence flagship model with vision capabilities'
        },
        {
          value: 'gpt-4o-mini',
          label: 'GPT-4o Mini',
          description: 'Affordable and intelligent small model'
        },
        {
          value: 'gpt-4o-realtime-preview',
          label: 'GPT-4o Realtime',
          description: 'Low-latency real-time audio interactions'
        }
      ]
    },
    {
      label: 'Reasoning Models (o-series)',
      models: [
        {
          value: 'o3-mini',
          label: 'o3-mini',
          description: 'Latest reasoning model with enhanced problem-solving (2025-01-31)'
        },
        {
          value: 'o4-mini',
          label: 'o4-mini',
          description: 'Enhanced reasoning capabilities for complex tasks'
        }
      ]
    },
    {
      label: 'Legacy Models',
      models: [
        {
          value: 'gpt-4-turbo',
          label: 'GPT-4 Turbo',
          description: 'Legacy high-performance model optimized for chat'
        },
        {
          value: 'gpt-4',
          label: 'GPT-4',
          description: 'Original GPT-4 model'
        },
        {
          value: 'gpt-3.5-turbo',
          label: 'GPT-3.5 Turbo',
          description: 'Fast and efficient legacy model'
        }
      ]
    }
  ]

  // Flatten all models for description lookup
  const allModels = modelGroups.flatMap(group => group.models)
  const selectedModelDescription = allModels.find(m => m.value === model)?.description

  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Model
      </label>
      <select
        value={model}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                 bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {modelGroups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {selectedModelDescription}
      </p>
    </div>
  )
}