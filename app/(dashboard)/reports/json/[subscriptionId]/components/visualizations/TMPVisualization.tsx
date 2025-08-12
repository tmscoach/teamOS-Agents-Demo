'use client'

interface TMPVisualizationProps {
  type: string
  params?: any
  data?: any
}

export function TMPVisualization({ type, params, data }: TMPVisualizationProps) {
  // TMP Wheel visualization
  if (type === 'CreateTMPQWheel' || type === 'CreateTMPQIntroWheel') {
    const majorRole = data?.majorRole
    const relatedRoles = data?.relatedRoles || []
    const allSegments = data?.allSegments || []
    
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Team Management Wheel</h3>
        </div>
        
        {/* Major Role Display */}
        {majorRole && (
          <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Major Role</p>
                <p className="text-xl font-bold text-gray-900">{majorRole.name}</p>
                <p className="text-sm text-gray-500">Code: {majorRole.code}</p>
              </div>
              <div className="text-right">
                <div 
                  className="inline-block px-4 py-2 rounded-full text-white font-bold"
                  style={{ backgroundColor: majorRole.color || '#00aee5' }}
                >
                  {majorRole.percentage}%
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Related Roles */}
        {relatedRoles.length > 0 && (
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">Related Roles</p>
            <div className="space-y-2">
              {relatedRoles.map((role: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{role.name}</p>
                    <p className="text-xs text-gray-500">Code: {role.code}</p>
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: role.color || '#007ac2' }}
                  >
                    {role.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* All Segments Grid */}
        {allSegments.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">All Work Preferences</p>
            <div className="grid grid-cols-2 gap-2">
              {allSegments.map((segment: any) => (
                <div 
                  key={segment.position}
                  className="p-2 bg-white rounded text-xs"
                  style={{ borderLeft: `4px solid ${segment.color || '#ccc'}` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{segment.name}</span>
                    <span className="text-gray-600">{segment.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // RIDO (Work Preference Measures) visualization
  if (type === 'CreateTMPQRido' || type === 'CreateTMPQRidoSummary') {
    const leftScore = data?.leftScore || params?.lv
    const rightScore = data?.rightScore || params?.rv
    const leftLabel = params?.lt || params?.ll
    const rightLabel = params?.rt || params?.rl
    const netScore = data?.netScore
    const netDirection = data?.netDirection
    const interpretation = data?.interpretation
    
    return (
      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="mb-4">
          {/* Score bars */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700 w-24">{leftLabel}</div>
            <div className="flex-1 mx-4">
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                {/* Left score */}
                <div 
                  className="absolute left-0 top-0 h-full bg-blue-500 opacity-70"
                  style={{ width: `${(parseInt(leftScore) / 30) * 50}%` }}
                />
                {/* Right score */}
                <div 
                  className="absolute right-0 top-0 h-full bg-green-500 opacity-70"
                  style={{ width: `${(parseInt(rightScore) / 30) * 50}%` }}
                />
                {/* Center line */}
                <div className="absolute left-1/2 top-0 w-0.5 h-full bg-gray-400" />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-700 w-24 text-right">{rightLabel}</div>
          </div>
          
          {/* Scores */}
          <div className="flex justify-between text-xs text-gray-600">
            <span>Score: {leftScore}</span>
            <span>Score: {rightScore}</span>
          </div>
        </div>
        
        {/* Net result */}
        {netScore !== undefined && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Net Score:</span>
              <span className="font-semibold text-gray-900">
                {netDirection} ({netScore})
              </span>
            </div>
            {interpretation && (
              <p className="mt-2 text-xs text-gray-600 italic">{interpretation}</p>
            )}
          </div>
        )}
      </div>
    )
  }
  
  // Preference Wheel visualization
  if (type === 'CreateTMPQPreferenceWheel') {
    const distribution = data?.distribution || []
    const highest = data?.analysis?.highest
    const lowest = data?.analysis?.lowest
    
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Preference Distribution</h3>
        
        {/* Bar chart */}
        <div className="space-y-3">
          {distribution.map((item: any) => (
            <div key={item.type} className="flex items-center">
              <div className="w-28 text-sm text-gray-700">{item.type}</div>
              <div className="flex-1 mx-3">
                <div className="relative h-6 bg-gray-100 rounded">
                  <div 
                    className="absolute left-0 top-0 h-full rounded transition-all"
                    style={{ 
                      width: `${item.percentage * 5}%`,
                      backgroundColor: item.color || '#3b82f6'
                    }}
                  />
                </div>
              </div>
              <div className="w-12 text-sm text-gray-700 text-right">{item.percentage}%</div>
            </div>
          ))}
        </div>
        
        {/* Analysis */}
        {(highest || lowest) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              {highest && (
                <div>
                  <span className="text-gray-600">Highest: </span>
                  <span className="font-semibold text-green-700">
                    {highest.type} ({highest.percentage}%)
                  </span>
                </div>
              )}
              {lowest && (
                <div>
                  <span className="text-gray-600">Lowest: </span>
                  <span className="font-semibold text-red-700">
                    {lowest.type} ({lowest.percentage}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  
  // Default fallback
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-sm text-gray-600">
        Visualization: {type}
      </p>
      {params && Object.keys(params).length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Parameters: {JSON.stringify(params)}
        </div>
      )}
    </div>
  )
}