import { generateProfileSummary, generateSuggestedActions } from '../report-summary';
import { ParsedReport } from '../report-parser';

describe('report-summary utilities', () => {
  describe('generateProfileSummary', () => {
    const mockReport: ParsedReport = {
      type: 'TMP',
      title: 'Test Report',
      subtitle: 'Test Subtitle',
      profile: {
        name: 'Test User',
        majorRole: 'Upholder-Maintainer',
        tagline: 'Test Tagline',
        description: 'Test description for the user.',
        relatedRoles: ['Controller-Inspector', 'Thruster-Organizer']
      },
      scores: {},
      insights: [],
      recommendations: { reading: '', goals: '' },
      credits: { amount: 0, badge: '' },
      sections: [
        {
          id: 'introduction',
          title: 'Introduction',
          content: 'Major RoleUpholder Maintainer\n1st Related RoleController Inspector',
          html: ''
        },
        {
          id: 'keypoints',
          title: 'Key Points',
          content: 'You are usually quietly confident.\nYou tend to be strong on ideas.\nYou may prefer advisory roles.',
          html: ''
        },
        {
          id: 'overview',
          title: 'Overview',
          content: 'This is an overview section with multiple sentences. It contains detailed information about the profile. This helps understand the person better.',
          html: ''
        }
      ],
      rawHtml: '',
      subscriptionId: '12345',
      reportId: 'test-id',
      isFromCache: false
    };

    it('returns loading state when report is undefined', () => {
      const result = generateProfileSummary(undefined);
      
      expect(result.title).toBe('Your Profile');
      expect(result.role).toBe('Loading...');
      expect(result.bullets).toHaveLength(3);
      expect(result.bullets[0]).toContain('Analyzing');
    });

    it('extracts role from profile.majorRole', () => {
      const result = generateProfileSummary(mockReport);
      
      expect(result.role).toBe('Upholder-Maintainer');
    });

    it('extracts role from introduction section when profile.majorRole is empty', () => {
      const reportWithEmptyProfile = {
        ...mockReport,
        profile: { ...mockReport.profile, majorRole: '', tagline: '' }
      };
      
      const result = generateProfileSummary(reportWithEmptyProfile);
      
      expect(result.role).toBe('Upholder Maintainer');
    });

    it('extracts bullets from key points section for TMP reports', () => {
      const result = generateProfileSummary(mockReport);
      
      expect(result.bullets).toContain('You are usually quietly confident.');
      expect(result.bullets).toContain('You tend to be strong on ideas.');
      expect(result.bullets).toContain('You may prefer advisory roles.');
    });

    it('adds punctuation to bullets if missing', () => {
      const reportWithNoPunctuation = {
        ...mockReport,
        sections: [
          {
            id: 'keypoints',
            title: 'Key Points',
            content: 'You are confident\nYou are creative\nYou are organized',
            html: ''
          }
        ]
      };
      
      const result = generateProfileSummary(reportWithNoPunctuation);
      
      result.bullets.forEach(bullet => {
        expect(bullet).toMatch(/\.$/);
      });
    });

    it('falls back to overview section when key points are insufficient', () => {
      const reportWithShortKeyPoints = {
        ...mockReport,
        sections: [
          {
            id: 'keypoints',
            title: 'Key Points',
            content: 'You are confident.',
            html: ''
          },
          mockReport.sections[2] // overview section
        ]
      };
      
      const result = generateProfileSummary(reportWithShortKeyPoints);
      
      expect(result.bullets).toHaveLength(3);
      expect(result.bullets[0]).toBe('You are confident.');
      expect(result.bullets.some(b => b.includes('overview section'))).toBeTruthy();
    });

    it('handles QO2 report type correctly', () => {
      const qo2Report = {
        ...mockReport,
        type: 'QO2' as const,
        profile: {
          ...mockReport.profile,
          tagline: 'Balanced Leader',
          majorRole: 'Strategic Excellence'
        }
      };
      
      const result = generateProfileSummary(qo2Report);
      
      expect(result.bullets[0]).toContain('Leadership style: Balanced Leader');
      expect(result.bullets[1]).toContain('Operational focus: Strategic Excellence');
    });

    it('handles TeamSignals report type correctly', () => {
      const teamSignalsReport = {
        ...mockReport,
        type: 'TeamSignals' as const
      };
      
      const result = generateProfileSummary(teamSignalsReport);
      
      expect(result.bullets).toContain('Team dynamics assessment completed');
      expect(result.bullets).toContain('Collaboration patterns identified');
      expect(result.bullets).toContain('Actionable insights ready for review');
    });

    it('ensures exactly 3 bullets are returned', () => {
      const reportWithOneBullet = {
        ...mockReport,
        sections: [
          {
            id: 'keypoints',
            title: 'Key Points',
            content: 'You are confident.',
            html: ''
          }
        ]
      };
      
      const result = generateProfileSummary(reportWithOneBullet);
      
      expect(result.bullets).toHaveLength(3);
      expect(result.bullets[2]).toBe('Additional insights available in full report');
    });
  });

  describe('generateSuggestedActions', () => {
    const mockReport: ParsedReport = {
      type: 'TMP',
      title: 'Test Report',
      subtitle: 'Test Subtitle',
      profile: {
        name: 'Test User',
        majorRole: 'Upholder-Maintainer',
        tagline: '',
        description: '',
        relatedRoles: []
      },
      scores: {},
      insights: [],
      recommendations: { reading: '', goals: '' },
      credits: { amount: 0, badge: '' },
      sections: [],
      rawHtml: '',
      subscriptionId: '12345',
      reportId: 'test-id',
      isFromCache: false
    };

    it('returns base actions when report is undefined', () => {
      const result = generateSuggestedActions(undefined);
      
      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('osmos-help');
      expect(result[0].label).toBe('What can Osmos do for me?');
    });

    it('includes TMP-specific action for TMP reports with major role', () => {
      const result = generateSuggestedActions(mockReport);
      
      expect(result).toHaveLength(4);
      const roleAction = result.find(a => a.id === 'role-meaning');
      expect(roleAction).toBeDefined();
      expect(roleAction?.label).toContain('Understanding my Upholder-Maintainer role');
    });

    it('includes QO2-specific action for QO2 reports', () => {
      const qo2Report = { ...mockReport, type: 'QO2' as const };
      const result = generateSuggestedActions(qo2Report);
      
      const leadershipAction = result.find(a => a.id === 'leadership');
      expect(leadershipAction).toBeDefined();
      expect(leadershipAction?.label).toBe('My leadership strengths');
    });

    it('includes TeamSignals-specific action for TeamSignals reports', () => {
      const teamSignalsReport = { ...mockReport, type: 'TeamSignals' as const };
      const result = generateSuggestedActions(teamSignalsReport);
      
      const teamAction = result.find(a => a.id === 'team-dynamics');
      expect(teamAction).toBeDefined();
      expect(teamAction?.label).toBe('Our team dynamics');
    });

    it('falls back to base action when no major role for TMP', () => {
      const reportNoRole = {
        ...mockReport,
        profile: { ...mockReport.profile, majorRole: '' }
      };
      const result = generateSuggestedActions(reportNoRole);
      
      expect(result).toHaveLength(4);
      expect(result[3].id).toBe('communication');
    });

    it('always includes Osmos help as first action', () => {
      const tmpResult = generateSuggestedActions(mockReport);
      const qo2Result = generateSuggestedActions({ ...mockReport, type: 'QO2' as const });
      const teamResult = generateSuggestedActions({ ...mockReport, type: 'TeamSignals' as const });
      
      [tmpResult, qo2Result, teamResult].forEach(result => {
        expect(result[0].id).toBe('osmos-help');
        expect(result[0].question).toBe('What can Osmos do for me?');
      });
    });

    it('provides proper questions for each action', () => {
      const result = generateSuggestedActions(mockReport);
      
      result.forEach(action => {
        expect(action.question).toBeTruthy();
        expect(action.question.length).toBeGreaterThan(10);
        expect(action.label).toBeTruthy();
      });
    });
  });
});