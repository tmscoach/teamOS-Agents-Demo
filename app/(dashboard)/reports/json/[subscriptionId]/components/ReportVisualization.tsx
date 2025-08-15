'use client'

import { TMPWheel } from './visualizations/TMPWheel'
import { QO2Model } from './visualizations/QO2Model'
import { BarChart } from './visualizations/BarChart'
import { LineChart } from './visualizations/LineChart'
import { TMPVisualization } from './visualizations/TMPVisualization'

interface ReportVisualizationProps {
  visualization: any
}

export function ReportVisualization({ visualization }: ReportVisualizationProps) {
  if (!visualization) return null

  const { type, params, data } = visualization

  // Route to appropriate visualization component based on type
  switch (type) {
    case 'CreateTMPQWheel':
    case 'CreateTMPQIntroWheel':
    case 'CreateTMPQRido':
    case 'CreateTMPQRidoSummary':
    case 'CreateTMPQPreferenceWheel':
      // Use our custom TMP visualization component
      return <TMPVisualization type={type} params={params} data={data} />
    
    case 'CreateQO2Model':
      return <QO2Model params={params} data={data} />
    
    case 'BarChart':
    case 'bar':
      return <BarChart data={data} />
    
    case 'LineChart':
    case 'line':
      return <LineChart data={data} />
    
    default:
      // If the visualization has a base64 image and isn't handled above, display the image
      if (data?.image?.base64) {
        return (
          <div className="flex justify-center items-center p-4 bg-white rounded-lg">
            <img 
              src={`data:${data.image.format || 'image/png'};base64,${data.image.base64}`}
              alt={type}
              className="max-w-full h-auto"
              style={{ 
                maxHeight: data.image.height || 400,
                maxWidth: data.image.width || 400 
              }}
            />
          </div>
        )
      }
      
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