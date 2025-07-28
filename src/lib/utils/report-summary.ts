import { ParsedReport } from './report-parser';

export interface ProfileSummary {
  title: string;
  role: string;
  bullets: string[];
}

export interface SuggestedAction {
  id: string;
  label: string;
  question: string;
}

export function generateProfileSummary(report: ParsedReport | undefined): ProfileSummary {
  if (!report) {
    return {
      title: "Your Profile",
      role: "Loading...",
      bullets: [
        "Analyzing your assessment results",
        "Preparing personalized insights",
        "Chat with OSmos for deeper understanding"
      ]
    };
  }

  // Extract role from report data - check sections if profile is empty
  let role = report.profile.majorRole || report.profile.tagline;
  
  if (!role && report.sections) {
    // Look for role in introduction section
    const introSection = report.sections.find(s => s.id === 'introduction');
    if (introSection) {
      const majorRoleMatch = introSection.content.match(/Major Role(.+?)(?:\n|$)/);
      if (majorRoleMatch) {
        role = majorRoleMatch[1].trim();
      }
    }
  }
  
  role = role || "Professional";
  const bullets: string[] = [];

  if (report.type === 'TMP') {
    // For TMP reports, look in the Key Points section first
    const keyPointsSection = report.sections?.find(s => s.id === 'keypoints');
    if (keyPointsSection) {
      // Extract bullet points from key points section
      const keyPoints = keyPointsSection.content
        .split('\n')
        .filter(line => line.trim().startsWith('You'))
        .map(line => {
          // Ensure each line ends with proper punctuation
          const trimmed = line.trim();
          return trimmed.match(/[.!?]$/) ? trimmed : trimmed + '.';
        })
        .slice(0, 3);
      
      if (keyPoints.length > 0) {
        bullets.push(...keyPoints);
      }
    }
    
    // If not enough, check overview section
    if (bullets.length < 3) {
      const overviewSection = report.sections?.find(s => s.id === 'overview');
      if (overviewSection) {
        const sentences = overviewSection.content
          .split(/[.!?]+/)
          .map(s => s.trim())
          .filter(s => s.length > 30 && !s.includes('Upholder-Maintainer'))
          .slice(0, 3 - bullets.length);
        bullets.push(...sentences);
      }
    }
    
    // Fallback to profile description if available
    if (bullets.length < 3 && report.profile.description) {
      const sentences = report.profile.description
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20)
        .slice(0, 3 - bullets.length);
      bullets.push(...sentences);
    }
  } else if (report.type === 'QO2') {
    // For QO2 reports, focus on leadership style
    bullets.push(
      `Leadership style: ${report.profile.tagline || 'Balanced Leader'}`,
      `Operational focus: ${report.profile.majorRole || 'Strategic Excellence'}`,
      report.profile.description?.split('.')[0] || 'Comprehensive leadership assessment completed'
    );
  } else if (report.type === 'TeamSignals') {
    // For TeamSignals, focus on team dynamics
    bullets.push(
      'Team dynamics assessment completed',
      'Collaboration patterns identified',
      'Actionable insights ready for review'
    );
  }

  // Ensure we have exactly 3 bullets
  while (bullets.length < 3) {
    bullets.push('Additional insights available in full report');
  }

  return {
    title: "Your Profile",
    role: role,
    bullets: bullets.slice(0, 3).map(b => b.trim())
  };
}

export function generateSuggestedActions(report: ParsedReport | undefined): SuggestedAction[] {
  const baseActions: SuggestedAction[] = [
    {
      id: 'osmos-help',
      label: 'What can Osmos do for me?',
      question: 'What can Osmos do for me?'
    },
    {
      id: 'highlights',
      label: '3 highlights about me',
      question: 'What are my top 3 strengths and highlights from my profile?'
    },
    {
      id: 'support',
      label: 'Areas I need support with',
      question: 'What areas should I focus on for development based on my profile?'
    },
    {
      id: 'communication',
      label: 'How should others communicate with me?',
      question: 'What\'s the best way for others to communicate and work with me?'
    }
  ];

  if (!report) return baseActions.slice(0, 4);

  // For report-specific actions, we'll replace the last base action
  // This keeps us at exactly 4 suggestions total
  const coreActions = baseActions.slice(0, 3); // Take first 3 base actions
  
  // Add report-type specific action as the 4th
  if (report.type === 'TMP' && report.profile.majorRole) {
    coreActions.push({
      id: 'role-meaning',
      label: `Understanding my ${report.profile.majorRole} role`,
      question: `What does it mean to be a ${report.profile.majorRole} and how can I leverage this?`
    });
  } else if (report.type === 'QO2') {
    coreActions.push({
      id: 'leadership',
      label: 'My leadership strengths',
      question: 'What are my key leadership strengths according to my QO² assessment?'
    });
  } else if (report.type === 'TeamSignals') {
    coreActions.push({
      id: 'team-dynamics',
      label: 'Our team dynamics',
      question: 'What are the key dynamics and patterns in our team?'
    });
  } else {
    // If no specific action, use the 4th base action
    coreActions.push(baseActions[3]);
  }

  return coreActions;
}