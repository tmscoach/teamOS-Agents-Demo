'use client'

interface LineChartProps {
  data: any
}

export function LineChart({ data }: LineChartProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">{data?.title || 'Line Chart'}</h3>
      
      {/* Simple placeholder for line chart */}
      <div className="bg-white p-4 rounded border border-gray-200">
        <p className="text-sm text-gray-600">Line chart visualization</p>
        {data && (
          <pre className="text-xs mt-2 overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}