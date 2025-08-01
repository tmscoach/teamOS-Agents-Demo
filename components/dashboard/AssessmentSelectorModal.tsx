'use client';

import React, { useState } from 'react';
import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import { Separator } from '@/components/ui/separator';
import { Coins, Rocket, Zap } from 'lucide-react';
import { Oscar1 } from '@/app/chat/components/icons/Oscar1';
import { JourneyPhase } from '@/lib/orchestrator/journey-phases';

interface TMSSubscription {
  SubscriptionID: number;
  WorkflowID: number;
  WorkflowType: string;
  Status: string;
  Progress: number;
  AssessmentType: string;
  AssessmentStatus: string;
}

export interface AssessmentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assessmentType: string, subscriptionId: number) => void;
  userPhase: JourneyPhase;
  completedAssessments: string[];
  availableAssessments: TMSSubscription[];
  loading?: boolean;
}

export function AssessmentSelectorModal({
  isOpen,
  onClose,
  onSelect,
  userPhase,
  completedAssessments = [],
  availableAssessments = [],
  loading = false
}: AssessmentSelectorModalProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<TMSSubscription | null>(null);

  // Find TMP and TeamSignals assessments from available assessments
  const tmpAssessment = availableAssessments.find(a => a.AssessmentType === 'TMP');
  const teamSignalsAssessment = availableAssessments.find(a => a.AssessmentType === 'TeamSignals');

  // Determine which assessment is recommended based on what's available
  const recommendedAssessment = tmpAssessment ? 'TMP' : teamSignalsAssessment ? 'TeamSignals' : null;

  const handleSelect = () => {
    if (selectedAssessment) {
      onSelect(selectedAssessment.AssessmentType, selectedAssessment.SubscriptionID);
      onClose();
    }
  };

  const handleCardClick = (assessment: TMSSubscription) => {
    setSelectedAssessment(assessment);
  };

  return (
    <Headless.Dialog open={isOpen} onClose={onClose} className="relative z-[110]">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 flex w-screen justify-center overflow-y-auto bg-zinc-950/25 px-2 py-2 transition duration-100 focus:outline-0 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:px-6 sm:py-8 lg:px-8 lg:py-16 dark:bg-zinc-950/50 z-[110]"
      />

      <div className="fixed inset-0 w-screen overflow-y-auto pt-6 sm:pt-0 z-[120]">
        <div className="grid min-h-full grid-rows-[1fr_auto] justify-items-center sm:grid-rows-[1fr_auto_3fr] sm:p-4">
          <Headless.DialogPanel
            transition
            className={clsx(
              'sm:max-w-xl',
              'row-start-2 w-full min-w-0 rounded-t-3xl bg-white shadow-lg ring-1 ring-zinc-950/10 sm:mb-auto sm:rounded-2xl dark:bg-zinc-900 dark:ring-white/10 forced-colors:outline',
              'transition duration-100 will-change-transform data-closed:translate-y-12 data-closed:opacity-0 data-enter:ease-out data-leave:ease-in sm:data-closed:translate-y-0 sm:data-closed:data-enter:scale-95'
            )}
          >
            <div className="flex flex-col items-start relative bg-white border border-solid border-gray-200 shadow-sm rounded-lg">
              {/* Header */}
              <div className="flex flex-col items-start gap-1.5 p-6 relative self-stretch w-full">
                <div className="inline-flex items-center gap-2.5 relative">
                  <Oscar1 className="!relative !w-5 !h-5" />
                  <h3 className="font-semibold text-gray-900 text-base">
                    Complete your first Team Leader profile.
                  </h3>
                </div>

                <p className="text-gray-500 text-sm">
                  Choose the profile that you'd like to complete to learn about yourself and your team.
                </p>
              </div>

              {/* Content */}
              <div className="flex flex-col items-start gap-4 pt-0 pb-6 px-6 relative self-stretch w-full">
                {/* Credits Badge - Show if TMP is available */}
                {userPhase === JourneyPhase.ASSESSMENT && tmpAssessment && (
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-md border border-solid border-gray-200 shadow-sm">
                    <Coins className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-500 text-sm">
                      +5000 credits
                    </span>
                  </div>
                )}

                <Separator className="!self-stretch !relative !w-full" />
                
                {/* Show loading state */}
                {loading && (
                  <div className="text-center py-8 w-full">
                    <p className="text-gray-500">Loading available assessments...</p>
                  </div>
                )}
                
                {/* Show message if no assessments available */}
                {!loading && availableAssessments.length === 0 && (
                  <div className="text-center py-8 w-full">
                    <p className="text-gray-500">No assessments available at this time.</p>
                  </div>
                )}
                
                {/* Show available assessments */}
                {!loading && availableAssessments.length > 0 && (
                  <div className="flex flex-col items-start gap-4 relative self-stretch w-full">
                    {/* Team Management Profile Card - Only show if available */}
                    {tmpAssessment && (
                      <div 
                        className={clsx(
                          'flex min-h-[114px] items-center gap-3 p-3 relative self-stretch w-full rounded-md cursor-pointer transition-colors',
                          selectedAssessment?.AssessmentType === 'TMP' ? 'bg-blue-50 border-2 border-blue-500' : '',
                          hoveredCard === 'TMP' ? 'bg-gray-50' : ''
                        )}
                        onMouseEnter={() => setHoveredCard('TMP')}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => handleCardClick(tmpAssessment)}
                  >
                    <Rocket className="w-6 h-6 text-blue-600" />
                    <div className="flex flex-col flex-1 items-start gap-1">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <span className="font-bold text-gray-900 text-sm">
                          Team Management Profile
                        </span>

                        {recommendedAssessment === 'TMP' && (
                          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-blue-100 rounded-md border border-solid border-blue-200">
                            <span className="font-medium text-blue-700 text-xs">
                              Goal-Based Suggestion
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-500 text-sm">
                        <span className="font-bold">60 Questions.</span>
                        {' '}Grounded in psychometric research, it reveals work preferences
                        and clarifies how team roles impact organisational success.
                      </p>
                    </div>
                  </div>
                )}

                {/* Separator between assessments */}
                {tmpAssessment && teamSignalsAssessment && (
                  <Separator className="!self-stretch !relative !w-full" />
                )}
                
                {/* Team Signals Card - Only show if available */}
                {teamSignalsAssessment && (
                  <div 
                    className={clsx(
                      'flex min-h-[114px] items-center gap-3 p-3 relative self-stretch w-full rounded-md cursor-pointer transition-colors',
                      selectedAssessment?.AssessmentType === 'TeamSignals' ? 'bg-purple-50 border-2 border-purple-500' : '',
                      hoveredCard === 'TeamSignals' ? 'bg-gray-50' : ''
                    )}
                    onMouseEnter={() => setHoveredCard('TeamSignals')}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleCardClick(teamSignalsAssessment)}
                  >
                    <Zap className="w-6 h-6 text-purple-600" />
                    <div className="flex flex-col flex-1 items-start gap-1">
                      <div className="inline-flex items-center justify-center gap-2.5">
                        <span className="font-bold text-gray-900 text-sm">
                          Team Signals
                        </span>

                        {recommendedAssessment === 'TeamSignals' && (
                          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-purple-100 rounded-md border border-solid border-purple-200">
                            <span className="font-medium text-purple-700 text-xs">
                              Goal-Based Suggestion
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-500 text-sm">
                        <span className="font-bold">32 Questions.</span>
                        {' '}Grounded in the High-Energy Teams framework, it highlights
                        what's working, what's missing and where to focus first.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

              {/* Footer - Only show if assessments are available */}
              {!loading && availableAssessments.length > 0 && (
                <div className="flex w-full items-center pt-0 pb-6 px-6 relative">
                  <button
                    onClick={handleSelect}
                    disabled={!selectedAssessment}
                    className={clsx(
                      'inline-flex items-center gap-2.5 rounded-md justify-center relative h-10 flex-1 px-4 py-2 transition-colors',
                      selectedAssessment 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    )}
                    onMouseEnter={() => selectedAssessment && setHoveredCard('button')}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <span className="font-medium text-sm whitespace-nowrap">
                      Let's Go
                    </span>
                  </button>
                </div>
              )}
            </div>
          </Headless.DialogPanel>
        </div>
      </div>
    </Headless.Dialog>
  );
}