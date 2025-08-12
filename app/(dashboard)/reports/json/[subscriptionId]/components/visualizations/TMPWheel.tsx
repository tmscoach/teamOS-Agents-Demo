'use client'

interface TMPWheelProps {
  params: {
    mr?: string
    rr1?: string
    rr2?: string
  }
  data: {
    majorRole?: {
      name: string
      code: string
      position: number
      score: number
      color: string
      percentage?: number
    }
    relatedRoles?: Array<{
      name: string
      code: string
      position: number
      score: number
      color: string
      percentage?: number
    }>
  }
}

export function TMPWheel({ params, data }: TMPWheelProps) {
  const { majorRole, relatedRoles = [] } = data || {}

  // Define all TMP roles with their positions and colors
  const allRoles = [
    { position: 1, code: 'CR', name: 'Creator', color: '#FF6B6B' },
    { position: 2, code: 'AD', name: 'Advancer', color: '#4ECDC4' },
    { position: 3, code: 'RF', name: 'Refiner', color: '#45B7D1' },
    { position: 4, code: 'EX', name: 'Executor', color: '#96CEB4' },
    { position: 5, code: 'FX', name: 'Flexor', color: '#FFEAA7' },
    { position: 6, code: 'UM', name: 'Upholder Maintainer', color: '#00AEE5' },
    { position: 7, code: 'CI', name: 'Controller Inspector', color: '#DDA0DD' },
    { position: 8, code: 'CL', name: 'Concluder', color: '#98D8C8' }
  ]

  return (
    <div className="p-6">
      {/* Main Role Display */}
      {majorRole && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Major Role</h3>
          <div 
            className="p-6 rounded-lg border-2"
            style={{ 
              borderColor: majorRole.color,
              backgroundColor: `${majorRole.color}10`
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: majorRole.color }}
                  >
                    {majorRole.code}
                  </span>
                  <h4 className="text-xl font-semibold">{majorRole.name}</h4>
                </div>
                <div className="mt-2 text-gray-600">
                  <span>Position: {majorRole.position}</span>
                  <span className="mx-2">•</span>
                  <span>Score: {majorRole.score}</span>
                  {majorRole.percentage && (
                    <>
                      <span className="mx-2">•</span>
                      <span>{majorRole.percentage}%</span>
                    </>
                  )}
                </div>
              </div>
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
                style={{ backgroundColor: majorRole.color }}
              >
                {majorRole.score}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Roles */}
      {relatedRoles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Related Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relatedRoles.map((role, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border"
                style={{ 
                  borderColor: role.color,
                  backgroundColor: `${role.color}10`
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-xl font-bold"
                        style={{ color: role.color }}
                      >
                        {role.code}
                      </span>
                      <h5 className="font-medium">{role.name}</h5>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Score: {role.score}
                      {role.percentage && <span> • {role.percentage}%</span>}
                    </div>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: role.color }}
                  >
                    {role.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Wheel Representation */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Role Distribution</h3>
        <div className="flex justify-center">
          <div className="relative w-64 h-64">
            {/* SVG Wheel */}
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {allRoles.map((role, index) => {
                const angle = (index * 45) - 90 // 8 roles, 45 degrees each, start from top
                const angleRad = (angle * Math.PI) / 180
                const isActive = majorRole?.code === role.code || 
                               relatedRoles.some(r => r.code === role.code)
                const score = majorRole?.code === role.code ? majorRole.score :
                            relatedRoles.find(r => r.code === role.code)?.score || 0
                const radius = 60 + (score * 4) // Base radius + score-based extension

                const x = 100 + radius * Math.cos(angleRad)
                const y = 100 + radius * Math.sin(angleRad)

                return (
                  <g key={role.code}>
                    {/* Line from center */}
                    <line
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke={isActive ? role.color : '#E5E5E5'}
                      strokeWidth={isActive ? 2 : 1}
                      opacity={isActive ? 1 : 0.3}
                    />
                    {/* Role circle */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isActive ? 20 : 15}
                      fill={isActive ? role.color : '#F3F3F3'}
                      stroke={isActive ? role.color : '#E5E5E5'}
                      strokeWidth="2"
                    />
                    {/* Role code */}
                    <text
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={isActive ? 'white' : '#999'}
                      fontSize={isActive ? '12' : '10'}
                      fontWeight={isActive ? 'bold' : 'normal'}
                    >
                      {role.code}
                    </text>
                  </g>
                )
              })}
              {/* Center circle */}
              <circle
                cx="100"
                cy="100"
                r="10"
                fill="#333"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Parameters (if provided) */}
      {params && Object.keys(params).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Assessment Parameters</p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {params.mr && (
              <div>
                <span className="text-gray-500">Major Role:</span>
                <span className="ml-2 font-medium">{params.mr}</span>
              </div>
            )}
            {params.rr1 && (
              <div>
                <span className="text-gray-500">Related Role 1:</span>
                <span className="ml-2 font-medium">{params.rr1}</span>
              </div>
            )}
            {params.rr2 && (
              <div>
                <span className="text-gray-500">Related Role 2:</span>
                <span className="ml-2 font-medium">{params.rr2}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}