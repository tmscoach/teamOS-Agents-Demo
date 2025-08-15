'use client'

interface TMPVisualizationProps {
  type: string
  params?: any
  data?: any
}

// Helper function to check if base64 is likely placeholder content
function isPlaceholderImage(base64: string): boolean {
  // Check if the base64 is very short (likely placeholder)
  // Real TMP wheel images are typically much larger
  return !base64 || base64.length < 1000 || base64.includes('placeholder')
}

// TMP Wheel colors matching the official color scheme
const TMP_COLORS = {
  'Reporter Adviser': '#009a67',
  'Creator Innovator': '#9bcd66', 
  'Explorer Promoter': '#fff200',
  'Assessor Developer': '#f9a13a',
  'Thruster Organiser': '#ec008c',
  'Concluder Producer': '#9b5ba4',
  'Controller Inspector': '#007ac2',
  'Upholder Maintainer': '#00aee5'
}

export function TMPVisualization({ type, params, data }: TMPVisualizationProps) {
  // TMP Wheel visualization
  if (type === 'CreateTMPQWheel' || type === 'CreateTMPQIntroWheel') {
    const majorRole = data?.majorRole
    const relatedRoles = data?.relatedRoles || []
    const allSegments = data?.allSegments || []
    const wheelImage = data?.image
    
    // Check if we should show the image or recreate the wheel
    const shouldShowImage = wheelImage?.base64 && !isPlaceholderImage(wheelImage.base64)
    
    return (
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Team Management Wheel</h3>
        </div>
        
        {/* Display the wheel image if available and not placeholder */}
        {shouldShowImage ? (
          <div className="flex justify-center mb-6">
            <img 
              src={`data:${wheelImage.format || 'image/png'};base64,${wheelImage.base64}`}
              alt="Team Management Wheel"
              className="max-w-full h-auto rounded-lg shadow-lg"
              style={{ 
                maxHeight: wheelImage.height || 400,
                maxWidth: wheelImage.width || 400 
              }}
              onError={(e) => {
                // Hide the image if it fails to load
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        ) : (
          /* Recreate the wheel visualization using the data */
          <div className="flex justify-center mb-6">
            <div className="relative w-80 h-80">
              {/* SVG Wheel */}
              <svg viewBox="0 0 320 320" className="w-full h-full">
                {/* Background circle */}
                <circle cx="160" cy="160" r="150" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="2"/>
                
                {/* Render segments */}
                {allSegments.length > 0 && allSegments.map((segment: any, index: number) => {
                  const segmentCount = allSegments.length
                  const angleStep = 360 / segmentCount
                  const startAngle = index * angleStep - 90 // Start from top
                  const endAngle = (index + 1) * angleStep - 90
                  
                  // Convert to radians
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  
                  // Calculate path
                  const largeArcFlag = angleStep > 180 ? 1 : 0
                  const x1 = 160 + 150 * Math.cos(startRad)
                  const y1 = 160 + 150 * Math.sin(startRad)
                  const x2 = 160 + 150 * Math.cos(endRad)
                  const y2 = 160 + 150 * Math.sin(endRad)
                  
                  // Determine if this is major role or related role
                  const isMajor = segment.name === majorRole?.name
                  const isRelated = relatedRoles.some((r: any) => r.name === segment.name)
                  const radius = isMajor ? 150 : (isRelated ? 140 : 130)
                  
                  const pathData = `
                    M 160 160
                    L ${x1} ${y1}
                    A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
                    Z
                  `
                  
                  return (
                    <g key={index}>
                      <path
                        d={pathData}
                        fill={segment.color || TMP_COLORS[segment.name] || '#ccc'}
                        stroke="white"
                        strokeWidth="2"
                        opacity={isMajor ? 1 : (isRelated ? 0.8 : 0.6)}
                      />
                      {/* Add text label */}
                      <text
                        x={160 + (radius - 40) * Math.cos((startRad + endRad) / 2)}
                        y={160 + (radius - 40) * Math.sin((startRad + endRad) / 2)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-xs font-medium fill-white"
                        style={{ 
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          pointerEvents: 'none'
                        }}
                      >
                        {segment.percentage}%
                      </text>
                    </g>
                  )
                })}
                
                {/* Center circle */}
                <circle cx="160" cy="160" r="50" fill="white" stroke="#e5e7eb" strokeWidth="2"/>
                
                {/* Center text */}
                <text x="160" y="160" textAnchor="middle" dominantBaseline="middle" className="text-sm font-semibold fill-gray-700">
                  TMP Wheel
                </text>
              </svg>
              
              {/* Legend for segment names */}
              <div className="absolute -right-4 top-0 text-xs space-y-1">
                {allSegments.slice(0, 4).map((segment: any) => (
                  <div key={segment.name} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color || TMP_COLORS[segment.name] || '#ccc' }}
                    />
                    <span className="text-gray-600">{segment.code}</span>
                  </div>
                ))}
              </div>
              <div className="absolute -left-4 top-0 text-xs space-y-1">
                {allSegments.slice(4).map((segment: any) => (
                  <div key={segment.name} className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: segment.color || TMP_COLORS[segment.name] || '#ccc' }}
                    />
                    <span className="text-gray-600">{segment.code}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
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
    const wheelImage = data?.image
    const shouldShowImage = wheelImage?.base64 && !isPlaceholderImage(wheelImage.base64)
    
    // Extract distribution data from allSegments or use distribution
    const distribution = data?.distribution || []
    const allSegments = data?.allSegments || []
    const highest = data?.analysis?.highest
    const lowest = data?.analysis?.lowest
    
    // If we have allSegments data but no distribution, create distribution from segments
    const displayData = distribution.length > 0 ? distribution : allSegments
    
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Work Preference Distribution</h3>
        
        {shouldShowImage ? (
          <div className="flex justify-center mb-4">
            <img 
              src={`data:${wheelImage.format || 'image/png'};base64,${wheelImage.base64}`}
              alt="Work Preference Distribution"
              className="max-w-full h-auto rounded-lg"
              style={{ 
                maxHeight: wheelImage.height || 300,
                maxWidth: wheelImage.width || 300 
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        ) : displayData.length > 0 ? (
          <>
            {/* Circular chart representation */}
            <div className="flex justify-center mb-6">
              <div className="relative w-64 h-64">
                <svg viewBox="0 0 256 256" className="w-full h-full">
                  {displayData.map((item: any, index: number) => {
                    // Calculate angles for pie chart
                    const total = 100
                    let currentAngle = -90 // Start from top
                    for (let i = 0; i < index; i++) {
                      currentAngle += (displayData[i].percentage / total) * 360
                    }
                    const itemAngle = (item.percentage / total) * 360
                    const endAngle = currentAngle + itemAngle
                    
                    // Convert to radians
                    const startRad = (currentAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    
                    // Calculate path
                    const largeArcFlag = itemAngle > 180 ? 1 : 0
                    const x1 = 128 + 100 * Math.cos(startRad)
                    const y1 = 128 + 100 * Math.sin(startRad)
                    const x2 = 128 + 100 * Math.cos(endRad)
                    const y2 = 128 + 100 * Math.sin(endRad)
                    
                    const pathData = `
                      M 128 128
                      L ${x1} ${y1}
                      A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2}
                      Z
                    `
                    
                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={item.color || TMP_COLORS[item.name || item.type] || '#3b82f6'}
                          stroke="white"
                          strokeWidth="2"
                        />
                        {/* Add percentage label */}
                        <text
                          x={128 + 60 * Math.cos((startRad + endRad) / 2)}
                          y={128 + 60 * Math.sin((startRad + endRad) / 2)}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="text-xs font-medium fill-white"
                          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
                        >
                          {item.percentage}%
                        </text>
                      </g>
                    )
                  })}
                </svg>
              </div>
            </div>
            
            {/* Bar chart as supplementary */}
            <div className="space-y-3">
              {displayData.map((item: any) => (
                <div key={item.type || item.name} className="flex items-center">
                  <div className="w-32 text-sm text-gray-700">{item.type || item.name}</div>
                  <div className="flex-1 mx-3">
                    <div className="relative h-6 bg-gray-100 rounded">
                      <div 
                        className="absolute left-0 top-0 h-full rounded transition-all"
                        style={{ 
                          width: `${item.percentage * 5}%`,
                          backgroundColor: item.color || TMP_COLORS[item.name || item.type] || '#3b82f6'
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-12 text-sm text-gray-700 text-right">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Fallback if no data available */
          <div className="text-center text-gray-500 py-8">
            <p>Work preference distribution data not available</p>
          </div>
        )}
        
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