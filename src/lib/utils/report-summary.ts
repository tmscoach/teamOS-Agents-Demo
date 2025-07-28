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

  const role = report.profile.majorRole || report.profile.tagline || "Professional";
  const bullets: string[] = [];

  if (report.type === 'TMP') {
    // For TMP reports, extract key characteristics
    if (report.profile.description) {
      // Split description into sentences and take the most relevant ones
      const sentences = report.profile.description
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20); // Filter out very short sentences
      
      // Prioritize sentences with key phrases
      const priorityPhrases = ['excel', 'strong', 'ideal for', 'innovative', 'creative', 'analytical'];
      const prioritizedSentences = sentences.sort((a, b) => {
        const aScore = priorityPhrases.filter(phrase => 
          a.toLowerCase().includes(phrase)
        ).length;
        const bScore = priorityPhrases.filter(phrase => 
          b.toLowerCase().includes(phrase)
        ).length;
        return bScore - aScore;
      });
      
      bullets.push(...prioritizedSentences.slice(0, 3));
    }
    
    // If we don't have enough bullets from description, use insights
    if (bullets.length < 3 && report.insights) {
      bullets.push(...report.insights.slice(0, 3 - bullets.length));
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

  if (!report) return baseActions;

  // Add report-type specific actions
  if (report.type === 'TMP' && report.profile.majorRole) {
    baseActions.push({
      id: 'role-meaning',
      label: `Understanding my ${report.profile.majorRole} role`,
      question: `What does it mean to be a ${report.profile.majorRole} and how can I leverage this?`
    });
  } else if (report.type === 'QO2') {
    baseActions.push({
      id: 'leadership',
      label: 'My leadership strengths',
      question: 'What are my key leadership strengths according to my QO² assessment?'
    });
  } else if (report.type === 'TeamSignals') {
    baseActions.push({
      id: 'team-dynamics',
      label: 'Our team dynamics',
      question: 'What are the key dynamics and patterns in our team?'
    });
  }

  return baseActions.slice(0, 4); // Return max 4 actions
}