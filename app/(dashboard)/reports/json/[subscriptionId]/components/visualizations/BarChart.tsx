'use client'

interface BarChartProps {
  data: any
}

export function BarChart({ data }: BarChartProps) {
  const items = data?.items || []
  const maxValue = Math.max(...items.map((item: any) => item.value || 0), 1)

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">{data?.title || 'Bar Chart'}</h3>
      
      <div className="space-y-3">
        {items.map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-4">
            <div className="w-24 text-sm text-gray-600 text-right">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            <div className="w-12 text-sm font-medium">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}