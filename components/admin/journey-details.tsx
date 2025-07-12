import React from 'react';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JourneyStep {
  id: string;
  name: string;
  description: string;
  order: number;
  completed: boolean;
  completedAt?: Date;
  timeSpent?: number; // in minutes
}

interface JourneyDetailsProps {
  journeyStatus: 'ONBOARDING' | 'ACTIVE' | 'DORMANT';
  completedSteps: string[];
  currentStep: {
    id: string;
    name: string;
    order: number;
  } | null;
  lastActivity: Date;
  onboardingData?: Record<string, any>;
  stateTransitions?: Array<{
    from: string;
    to: string;
    timestamp: Date;
    reason?: string;
  }>;
}

const JOURNEY_STEPS: JourneyStep[] = [
  {
    id: 'welcome',
    name: 'Welcome & Introduction',
    description: 'Introduction to TeamOS and the transformation journey',
    order: 1,
    completed: false
  },
  {
    id: 'team_context',
    name: 'Team Context',
    description: 'Gather information about your team and challenges',
    order: 2,
    completed: false
  },
  {
    id: 'goals_setting',
    name: 'Goals Setting',
    description: 'Define transformation goals and success metrics',
    order: 3,
    completed: false
  },
  {
    id: 'initial_assessment',
    name: 'Initial Assessment',
    description: 'Complete Team Signals baseline assessment',
    order: 4,
    completed: false
  },
  {
    id: 'transformation_plan',
    name: 'Transformation Plan',
    description: 'Review and approve your customized transformation plan',
    order: 5,
    completed: false
  }
];

export function JourneyDetails({
  journeyStatus,
  completedSteps,
  currentStep,
  lastActivity,
  onboardingData,
  stateTransitions = []
}: JourneyDetailsProps) {
  // Map completed steps to journey steps
  const journeySteps = JOURNEY_STEPS.map(step => ({
    ...step,
    completed: completedSteps.includes(step.id),
    completedAt: stateTransitions.find(t => t.to === step.id)?.timestamp,
    timeSpent: calculateTimeSpent(step.id, stateTransitions)
  }));

  const progressPercentage = Math.round((completedSteps.length / JOURNEY_STEPS.length) * 100);

  function calculateTimeSpent(stepId: string, transitions: typeof stateTransitions): number {
    const startTransition = transitions.find(t => t.to === stepId);
    const endTransition = transitions.find(t => t.from === stepId);
    
    if (startTransition && endTransition) {
      return Math.round(
        (new Date(endTransition.timestamp).getTime() - new Date(startTransition.timestamp).getTime()) / 60000
      );
    }
    return 0;
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '20px',
        color: '#111827'
      }}>Journey Progress</h3>

      {/* Journey Status Bar */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: 
                journeyStatus === 'ONBOARDING' ? '#dbeafe' : 
                journeyStatus === 'ACTIVE' ? '#d1fae5' :
                '#fee2e2',
              color: 
                journeyStatus === 'ONBOARDING' ? '#1e40af' : 
                journeyStatus === 'ACTIVE' ? '#065f46' :
                '#991b1b'
            }}>
              {journeyStatus === 'DORMANT' && <AlertCircle style={{ width: '16px', height: '16px' }} />}
              Journey {journeyStatus.toLowerCase()}
            </span>
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Last active {formatDistanceToNow(new Date(lastActivity), { addSuffix: true })}
          </div>
        </div>

        <div style={{
          position: 'relative',
          height: '12px',
          backgroundColor: '#e5e7eb',
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${progressPercentage}%`,
            backgroundColor: progressPercentage > 80 ? '#059669' : 
                           progressPercentage > 50 ? '#3b82f6' : '#f59e0b',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{
          marginTop: '8px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center'
        }}>
          {progressPercentage}% Complete ({completedRequiredSteps.length} of {requiredSteps.length} required steps)
        </div>
      </div>

      {/* Current Phase Indicator */}
      <div style={{
        marginBottom: '24px',
        padding: '16px',
        borderRadius: '8px',
        backgroundColor: PHASE_CONFIG[currentPhase].bgColor,
        border: `1px solid ${PHASE_CONFIG[currentPhase].color}40`
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: PHASE_CONFIG[currentPhase].color,
          marginBottom: '4px'
        }}>
          Current Phase: {PHASE_CONFIG[currentPhase].label}
        </div>
        <div style={{
          fontSize: '13px',
          color: '#4b5563'
        }}>
          {currentPhase === JourneyPhase.ONBOARDING && 'Getting to know you and your team'}
          {currentPhase === JourneyPhase.ASSESSMENT && 'Completing assessments to understand team dynamics'}
          {currentPhase === JourneyPhase.DEBRIEF && 'Reviewing insights and creating action plans'}
          {currentPhase === JourneyPhase.CONTINUOUS_ENGAGEMENT && 'Ongoing monitoring and improvement'}
        </div>
      </div>

      {/* Journey Timeline */}
      <div style={{ position: 'relative' }}>
        {journeySteps.map((step, index) => (
          <div key={step.id} style={{ display: 'flex', marginBottom: '24px' }}>
            {/* Step Indicator */}
            <div style={{ 
              position: 'relative',
              marginRight: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              {step.completed ? (
                <CheckCircle style={{ 
                  width: '24px', 
                  height: '24px',
                  color: '#059669'
                }} />
              ) : currentStep?.id === step.id ? (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: '3px solid #3b82f6',
                  backgroundColor: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#3b82f6'
                  }} />
                </div>
              ) : (
                <Circle style={{ 
                  width: '24px', 
                  height: '24px',
                  color: '#d1d5db'
                }} />
              )}
              
              {/* Connecting Line */}
              {index < journeySteps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '24px',
                  left: '11px',
                  width: '2px',
                  height: '60px',
                  backgroundColor: step.completed ? '#059669' : '#e5e7eb'
                }} />
              )}
            </div>

            {/* Step Content */}
            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '4px'
              }}>
                <div>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: step.completed ? '#059669' : 
                           currentStep?.id === step.id ? '#111827' : '#6b7280',
                    marginBottom: '2px'
                  }}>
                    {step.name}
                  </h4>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '500',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: PHASE_CONFIG[step.phase].bgColor,
                    color: PHASE_CONFIG[step.phase].color
                  }}>
                    {PHASE_CONFIG[step.phase].label}
                  </span>
                </div>
                {step.timeSpent > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    <Clock style={{ width: '12px', height: '12px' }} />
                    {step.timeSpent} min
                  </div>
                )}
              </div>
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {step.description}
              </p>
              {step.completedAt && (
                <p style={{
                  fontSize: '12px',
                  color: '#9ca3af'
                }}>
                  Completed {formatDistanceToNow(new Date(step.completedAt), { addSuffix: true })}
                </p>
              )}
              {currentStep?.id === step.id && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '4px',
                  padding: '2px 8px',
                  backgroundColor: '#dbeafe',
                  color: '#1e40af',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Current Step
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Captured Data Summary */}
      {onboardingData && Object.keys(onboardingData).length > 0 && (
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <h4 style={{
            fontSize: '16px',
            fontWeight: '500',
            marginBottom: '16px',
            color: '#111827'
          }}>Captured Information</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {Object.entries(onboardingData).map(([key, value]) => (
              <div key={key} style={{
                padding: '12px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  textTransform: 'capitalize'
                }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#111827',
                  fontWeight: '500'
                }}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}