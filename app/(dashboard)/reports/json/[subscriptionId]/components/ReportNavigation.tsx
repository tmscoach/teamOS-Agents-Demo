'use client'

import { FileText, Image, AlignLeft } from 'lucide-react'

interface ReportNavigationProps {
  sections: any[]
  activeSectionId: string | null
  onSectionClick: (sectionId: string) => void
}

export function ReportNavigation({ sections, activeSectionId, onSectionClick }: ReportNavigationProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'visual':
        return <Image className="h-4 w-4" />
      case 'content':
        return <AlignLeft className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
        Report Contents
      </h2>
      
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSectionClick(section.id)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${
              activeSectionId === section.id
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className="opacity-50">
              {getIcon(section.type)}
            </span>
            <span className="text-sm truncate">
              {section.title}
            </span>
          </button>
        ))}
      </nav>

      {/* Section count */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {sections.length} sections
        </p>
      </div>
    </div>
  )
}