'use client'

import { TMPWheel } from './visualizations/TMPWheel'
import { QO2Model } from './visualizations/QO2Model'
import { BarChart } from './visualizations/BarChart'
import { LineChart } from './visualizations/LineChart'

interface ReportVisualizationProps {
  visualization: any
}

export function ReportVisualization({ visualization }: ReportVisualizationProps) {
  if (!visualization) return null

  const { type, params, data } = visualization

  // Route to appropriate visualization component based on type
  switch (type) {
    case 'CreateTMPQWheel':
      return <TMPWheel params={params} data={data} />
    
    case 'CreateQO2Model':
      return <QO2Model params={params} data={data} />
    
    case 'BarChart':
      return <BarChart data={data} />
    
    case 'LineChart':
      return <LineChart data={data} />
    
    default:
      // Fallback for unknown visualization types
      return (
        <div className="p-6 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            Visualization Type: <strong>{type}</strong>
          </p>
          {params && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-1">Parameters:</p>
              <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto">
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>
          )}
          {data && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Data:</p>
              <pre className="text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto max-h-64 overflow-y-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )
  }
}