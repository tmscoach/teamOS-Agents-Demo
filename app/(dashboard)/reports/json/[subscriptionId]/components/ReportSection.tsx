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
  const hasVisualization = section.visualization || section.visualizations
  const hasContent = section.content && (
    section.content.text || 
    section.content.subsections || 
    section.content.paragraphs ||
    section.content.points ||
    section.content.introduction ||
    section.content.explanation ||
    section.content.analysis ||
    section.content.mainText ||
    section.content.userData
  )

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
          {/* Single Visualization */}
          {section.visualization && (
            <div className="mt-6">
              <ReportVisualization visualization={section.visualization} />
            </div>
          )}

          {/* Multiple Visualizations (for Work Preference Measures, Individual Summary) */}
          {section.visualizations && Array.isArray(section.visualizations) && (
            <div className="mt-6 space-y-6">
              {section.visualizations.map((viz: any, index: number) => (
                <div key={index}>
                  {viz.dimension && (
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      {viz.dimension}: {viz.description}
                    </h4>
                  )}
                  <ReportVisualization visualization={viz} />
                </div>
              ))}
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

          {/* Paragraphs (for Overview, Leadership Strengths, etc.) */}
          {hasContent && section.content.paragraphs && (
            <div className="mt-6 prose prose-gray max-w-none space-y-4">
              {section.content.paragraphs.map((paragraph: string, index: number) => (
                <p key={index} className="text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {/* Points (for Key Points, Areas for Self-Assessment) */}
          {hasContent && section.content.points && (
            <div className="mt-6 space-y-2">
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                {section.content.points.map((point: any, index: number) => (
                  <li key={index}>
                    {typeof point === 'string' ? point : point.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Introduction text */}
          {hasContent && section.content.introduction && (
            <div className="mt-6 prose prose-gray max-w-none">
              <p className="text-gray-700 font-medium">{section.content.introduction}</p>
            </div>
          )}

          {/* Main text */}
          {hasContent && section.content.mainText && (
            <div className="mt-6 prose prose-gray max-w-none">
              <p className="text-gray-700">{section.content.mainText}</p>
            </div>
          )}

          {/* User data */}
          {hasContent && section.content.userData && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <dl className="space-y-2">
                {Object.entries(section.content.userData).map(([key, value]) => (
                  <div key={key} className="flex">
                    <dt className="font-medium text-gray-600 capitalize w-40">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </dt>
                    <dd className="text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Nine Activities (for Introduction section) */}
          {hasContent && section.content.nineActivities && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                {section.content.nineActivities.introduction}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {section.content.nineActivities.activities?.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" 
                      style={{ backgroundColor: activity.color }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile Explanation */}
          {hasContent && section.content.profileExplanation && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-gray-700">{section.content.profileExplanation}</p>
            </div>
          )}

          {/* Explanation text */}
          {hasContent && section.content.explanation && (
            <div className="mt-4 text-gray-700">
              <p>{section.content.explanation}</p>
            </div>
          )}

          {/* Analysis text */}
          {hasContent && section.content.analysis && (
            <div className="mt-4 text-gray-700">
              <p>{section.content.analysis}</p>
            </div>
          )}

          {/* Balance text */}
          {hasContent && section.content.balance && (
            <div className="mt-4 text-gray-700">
              <p>{section.content.balance}</p>
            </div>
          )}

          {/* Interpretation Guide */}
          {hasContent && section.content.interpretationGuide && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <p className="text-gray-700">{section.content.interpretationGuide}</p>
            </div>
          )}

          {/* Conclusion */}
          {hasContent && section.content.conclusion && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-gray-700">{section.content.conclusion}</p>
            </div>
          )}

          {/* Guidance (for Linking section) */}
          {hasContent && section.content.guidance && (
            <div className="mt-6 text-gray-700">
              <p>{section.content.guidance}</p>
            </div>
          )}

          {/* Pacing Points (for Linking section) */}
          {hasContent && section.content.pacingPoints && (
            <div className="mt-6">
              {section.content.pacingPoints.introduction && (
                <p className="text-gray-700 font-medium mb-4">
                  {section.content.pacingPoints.introduction}
                </p>
              )}
              {section.content.pacingPoints.points && (
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  {section.content.pacingPoints.points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              )}
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