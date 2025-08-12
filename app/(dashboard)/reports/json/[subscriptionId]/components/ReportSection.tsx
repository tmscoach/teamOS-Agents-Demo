'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { ReportVisualization } from './ReportVisualization'

interface ReportSectionProps {
  section: any
  isExpanded: boolean
  onToggle: () => void
  isActive: boolean
}

export function ReportSection({ section, isExpanded, onToggle, isActive }: ReportSectionProps) {
  const hasVisualization = section.visualization && section.type === 'visual'
  const hasContent = section.content && (section.content.text || section.content.subsections)

  return (
    <div 
      className={`bg-white rounded-lg border transition-all ${
        isActive ? 'border-blue-400 shadow-lg' : 'border-gray-200 shadow'
      }`}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <h2 className="text-lg font-semibold text-gray-900 text-left">
          {section.title}
        </h2>
        <div className="flex items-center gap-2">
          {section.type && (
            <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
              {section.type}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Section Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Visualization */}
          {hasVisualization && (
            <div className="mt-6">
              <ReportVisualization visualization={section.visualization} />
            </div>
          )}

          {/* Text Content */}
          {hasContent && section.content.text && (
            <div className="mt-6 prose prose-gray max-w-none">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(section.content.text) 
                }}
              />
            </div>
          )}

          {/* Subsections */}
          {hasContent && section.content.subsections && (
            <div className="mt-6 space-y-4">
              {section.content.subsections.map((subsection: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  {subsection.title && (
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {subsection.title}
                    </h3>
                  )}
                  {subsection.content && (
                    <div className="text-gray-600">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: formatContent(subsection.content) 
                        }}
                      />
                    </div>
                  )}
                  {/* Handle bullet points */}
                  {subsection.items && Array.isArray(subsection.items) && (
                    <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                      {subsection.items.map((item: string, i: number) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tables */}
          {section.content?.table && (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {section.content.table.headers?.map((header: string, i: number) => (
                      <th
                        key={i}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {section.content.table.rows?.map((row: any[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: any, cellIndex: number) => (
                        <td
                          key={cellIndex}
                          className="px-4 py-2 text-sm text-gray-900"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vector Chunk (if present) */}
          {section.vectorChunk && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {section.vectorChunk}
              </p>
            </div>
          )}

          {/* Metadata */}
          {section.metadata && Object.keys(section.metadata).length > 0 && (
            <div className="mt-6 text-xs text-gray-500">
              <details className="cursor-pointer">
                <summary>Metadata</summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
                  {JSON.stringify(section.metadata, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper function to format content (convert newlines to <br>, etc.)
function formatContent(text: string): string {
  if (!text) return ''
  
  // Convert markdown-style formatting
  let formatted = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />')
    
  // Wrap in paragraph tags if not already
  if (!formatted.startsWith('<p>')) {
    formatted = `<p>${formatted}</p>`
  }
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')
  
  return formatted
}