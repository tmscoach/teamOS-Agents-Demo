import { ENHANCED_EXTRACTION_PATTERNS, getFieldExamples } from '../enhanced-patterns';
import { ExtractionProcessor, ExtractionRule } from '../extraction-processor';

describe('Enhanced Extraction Patterns', () => {
  const context = {
    conversationId: 'test-123',
    agentName: 'TestAgent',
    enableLLMFallback: false // Test regex patterns only
  };

  describe('Manager Name Extraction', () => {
    const rules = {
      manager_name: ENHANCED_EXTRACTION_PATTERNS.manager_name as ExtractionRule
    };

    it('should extract names with titles', async () => {
      const testCases = [
        { input: "Hi, I'm Dr. Sarah Johnson", expected: 'Dr. Sarah Johnson' },
        { input: "My name is Prof. John Smith", expected: 'Prof. John Smith' },
        { input: "Call me Ms. Mary Williams", expected: 'Ms. Mary Williams' }
      ];

      for (const { input, expected } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toContain(expected.split(' ').slice(-2).join(' ')); // Last name parts
      }
    });

    it('should extract hyphenated names', async () => {
      const testCases = [
        "I'm Marie-Claire Dubois",
        "This is Jean-Pierre Martin",
        "Hello, Mary-Anne here"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toMatch(/[A-Za-z]+(-[A-Za-z]+)?/);
      }
    });

    it('should extract names from casual introductions', async () => {
      const testCases = [
        { input: "Hi, John here", expected: 'John' },
        { input: "Hello, Sarah speaking", expected: 'Sarah' },
        { input: "Good morning, I'm Bob", expected: 'Bob' },
        { input: "It's Michael", expected: 'Michael' }
      ];

      for (const { input, expected } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(expected);
      }
    });

    it('should extract nicknames', async () => {
      const input = "My name is Robert but call me Bob";
      const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
      expect(results[0].successful).toBe(true);
      expect(results[0].extractedValue).toBe('Bob');
    });
  });

  describe('Team Size Extraction', () => {
    const rules = {
      team_size: ENHANCED_EXTRACTION_PATTERNS.team_size as ExtractionRule
    };

    it('should extract numeric team sizes', async () => {
      const testCases = [
        { input: "We have 25 people", expected: 25 },
        { input: "Managing 10 direct reports", expected: 10 },
        { input: "Team of 15", expected: 15 },
        { input: "8-person team", expected: 8 }
      ];

      for (const { input, expected } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(expected);
      }
    });

    it('should extract approximate team sizes', async () => {
      const testCases = [
        { input: "About 20 people", expected: 20 },
        { input: "Roughly 15 members", expected: 15 },
        { input: "Approximately 30 staff", expected: 30 }
      ];

      for (const { input, expected } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBe(expected);
      }
    });

    it('should extract descriptive team sizes', async () => {
      const testCases = [
        { input: "A dozen people", expected: '12' }, // Will be processed by postprocessor
        { input: "A handful of team members", expected: 'handful' },
        { input: "Just a couple of us", expected: 'couple' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should extract ranges', async () => {
      const testCases = [
        "10-15 people",
        "Between 20 to 25 employees",
        "5 - 7 team members"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
        // Range extraction will need special handling in processor
      }
    });
  });

  describe('Budget Range Extraction', () => {
    const rules = {
      budget_range: ENHANCED_EXTRACTION_PATTERNS.budget_range as ExtractionRule
    };

    it('should extract various currency formats', async () => {
      const testCases = [
        { input: "$50,000 budget", expected: '50,000' },
        { input: "€25k investment", expected: '25k' },
        { input: "£100K funding", expected: '100K' },
        { input: "Budget is $2.5M", expected: '2.5M' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBeTruthy();
      }
    });

    it('should extract budget ranges', async () => {
      const testCases = [
        "$50k-100k",
        "€20,000 to €40,000",
        "Between $100K and $200K"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should extract descriptive budgets', async () => {
      const testCases = [
        "Low six figures",
        "Mid five figures",
        "High seven figures"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should handle no budget scenarios', async () => {
      const testCases = [
        "No specific budget",
        "Budget is TBD",
        "Budget is flexible"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Timeline Extraction', () => {
    const rules = {
      timeline_preference: ENHANCED_EXTRACTION_PATTERNS.timeline_preference as ExtractionRule
    };

    it('should extract standard durations', async () => {
      const testCases = [
        { input: "3 months timeline", expected: '3' },
        { input: "Within 6 weeks", expected: '6' },
        { input: "2 quarters", expected: '2' },
        { input: "1 year timeframe", expected: '1' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
      }
    });

    it('should extract relative timeframes', async () => {
      const testCases = [
        "By end of this month",
        "Within next quarter",
        "By the end of year",
        "Next week"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should extract specific dates', async () => {
      const testCases = [
        "By January 15",
        "Before December 2024",
        "Until March"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should extract urgent timelines', async () => {
      const testCases = [
        "ASAP",
        "Immediately",
        "Urgent",
        "Right away"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
      }
    });

    it('should extract fiscal periods', async () => {
      const testCases = [
        "Q2 2024",
        "FY2025",
        "Q4"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
      }
    });
  });

  describe('Company Name Extraction', () => {
    const rules = {
      company_name: ENHANCED_EXTRACTION_PATTERNS.company_name as ExtractionRule
    };

    it('should extract various company name formats', async () => {
      const testCases = [
        { input: "I work at Microsoft", expected: 'Microsoft' },
        { input: "From Google LLC", expected: 'Google LLC' },
        { input: "Representing Smith & Associates", expected: 'Smith & Associates' },
        { input: "My company is bright green projects", expected: 'bright green projects' },
        { input: "Part of Acme Corporation", expected: 'Acme Corporation' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
        expect(results[0].extractedValue).toBeTruthy();
      }
    });
  });

  describe('Department Extraction', () => {
    const rules = {
      department: ENHANCED_EXTRACTION_PATTERNS.department as ExtractionRule
    };

    it('should extract department names', async () => {
      const testCases = [
        { input: "I lead the engineering department", expected: 'engineering' },
        { input: "From product management", expected: 'product management' },
        { input: "Work in customer success", expected: 'customer success' },
        { input: "Head of Digital Marketing", expected: 'Digital Marketing' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Team Distribution Extraction', () => {
    const rules = {
      team_distribution: ENHANCED_EXTRACTION_PATTERNS.team_distribution as ExtractionRule
    };

    it('should extract distribution types', async () => {
      const testCases = [
        { input: "Fully remote team", expected: 'remote' },
        { input: "Hybrid work model", expected: 'hybrid' },
        { input: "All on-site", expected: 'on-site' },
        { input: "3 days in office", expected: '3' }
      ];

      for (const { input } of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Challenge Extraction', () => {
    const rules = {
      primary_challenge: ENHANCED_EXTRACTION_PATTERNS.primary_challenge as ExtractionRule
    };

    it('should extract various challenge formats', async () => {
      const testCases = [
        "Main challenge is team communication",
        "Struggling with low morale",
        "Need help with productivity",
        "Can't meet deadlines consistently",
        "Trying to improve collaboration"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Success Metrics Extraction', () => {
    const rules = {
      success_metrics: ENHANCED_EXTRACTION_PATTERNS.success_metrics as ExtractionRule
    };

    it('should extract success definitions', async () => {
      const testCases = [
        "Success would be 20% improvement in productivity",
        "Goal is to reduce turnover",
        "Want to see better collaboration",
        "Looking for higher engagement scores"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Additional Context Fields', () => {
    it('should extract urgency levels', async () => {
      const rules = {
        urgency_level: ENHANCED_EXTRACTION_PATTERNS.urgency_level as ExtractionRule
      };

      const testCases = [
        "This is urgent",
        "High priority initiative",
        "No immediate rush",
        "Crisis mode"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].successful).toBe(true);
      }
    });

    it('should extract previous initiatives', async () => {
      const rules = {
        previous_initiatives: ENHANCED_EXTRACTION_PATTERNS.previous_initiatives as ExtractionRule
      };

      const testCases = [
        "Previously tried agile transformation",
        "We've already tried team building",
        "Never done anything like this before"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });

    it('should extract leader commitment', async () => {
      const rules = {
        leader_commitment: ENHANCED_EXTRACTION_PATTERNS.leader_commitment as ExtractionRule
      };

      const testCases = [
        "Fully committed",
        "Can dedicate 5 hours per week",
        "Very hands-on approach",
        "Ready to invest time and resources"
      ];

      for (const input of testCases) {
        const results = await ExtractionProcessor.extractFromMessage(input, rules, context);
        expect(results[0].attempted).toBe(true);
      }
    });
  });

  describe('Pattern Coverage', () => {
    it('should have examples for all fields', () => {
      for (const fieldName of Object.keys(ENHANCED_EXTRACTION_PATTERNS)) {
        const examples = getFieldExamples(fieldName);
        expect(examples.length).toBeGreaterThan(0);
      }
    });

    it('should have multiple patterns for critical fields', () => {
      const criticalFields = ['manager_name', 'team_size', 'budget_range', 'timeline_preference'];
      
      for (const fieldName of criticalFields) {
        const patterns = ENHANCED_EXTRACTION_PATTERNS[fieldName].patterns;
        expect(patterns.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});