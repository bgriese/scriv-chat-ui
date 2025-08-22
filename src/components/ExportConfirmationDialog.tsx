'use client'

import { useState, useEffect } from 'react'
import { ChatMessage } from '@/types/chat'

interface ExportConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (content: string, title: string, format: 'pdf' | 'docx' | 'markdown' | 'html') => void
  selectedMessages: ChatMessage[]
  defaultTitle: string
}

export default function ExportConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedMessages,
  defaultTitle
}: ExportConfirmationDialogProps) {
  const [editableContent, setEditableContent] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx' | 'markdown' | 'html'>('pdf')

  useEffect(() => {
    if (isOpen && selectedMessages.length > 0) {
      // Generate the content preview from selected messages
      const content = selectedMessages
        .map(msg => {
          const role = msg.role === 'user' ? 'User' : 'Assistant'
          const timestamp = new Date(msg.timestamp).toLocaleString()
          return `### ${role} - ${timestamp}\n\n${msg.content}\n\n---\n`
        })
        .join('\n')
      
      setEditableContent(content)
      setDocumentTitle(defaultTitle)
    }
  }, [isOpen, selectedMessages, defaultTitle])

  const handleConfirm = () => {
    onConfirm(editableContent, documentTitle, selectedFormat)
    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Export Document Confirmation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review and edit the content before exporting ({selectedMessages.length} message{selectedMessages.length !== 1 ? 's' : ''})
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col space-y-4">
          {/* Document Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Title
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter document title..."
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex gap-2">
              {(['pdf', 'docx', 'markdown', 'html'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-3 py-2 text-xs rounded-md transition-colors ${
                    selectedFormat === format
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Document Content
            </label>
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              placeholder="Edit the document content..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!editableContent.trim() || !documentTitle.trim()}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
          >
            Export Document
          </button>
        </div>
      </div>
    </div>
  )
}