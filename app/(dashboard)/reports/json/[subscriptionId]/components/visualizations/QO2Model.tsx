'use client'

interface QO2ModelProps {
  params: any
  data: any
}

export function QO2Model({ params, data }: QO2ModelProps) {
  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">QO2 Model Visualization</h3>
      
      {/* Display parameters */}
      {params && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(params).map(([key, value]) => (
            <div key={key} className="bg-white p-3 rounded shadow-sm">
              <p className="text-xs text-gray-500 uppercase">{key}</p>
              <p className="text-lg font-semibold text-blue-600">{String(value)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Display data if available */}
      {data && (
        <div className="bg-white p-4 rounded shadow-sm">
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}