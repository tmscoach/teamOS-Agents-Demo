import { DocumentParser } from '../ingestion/parser';
import fs from 'fs/promises';

jest.mock('fs/promises');

describe('DocumentParser', () => {
  let parser: DocumentParser;
  
  beforeEach(() => {
    parser = new DocumentParser();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('parseDocument', () => {
    it('should parse a markdown document correctly', async () => {
      const mockContent = `# TMP Accreditation Handbook

## Introduction
This is the introduction section.

## Chapter 1: Team Management Profile
Content about TMP methodology.

### 1.1 Overview
Detailed overview of TMP.`;
      
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);
      
      const result = await parser.parseDocument('/test/TMP-Handbook.md');
      
      expect(result.title).toBe('TMP Accreditation Handbook');
      expect(result.documentType).toBe('HANDBOOK');
      expect(result.content).toBe(mockContent);
      expect(result.metadata.sections).toContain('Introduction');
      expect(result.metadata.sections).toContain('Chapter 1: Team Management Profile');
    });
    
    it('should correctly identify document types', async () => {
      const testCases = [
        { file: '/questionnaire/TMP-Questionnaire.md', type: 'QUESTIONNAIRE' },
        { file: '/reports/Finished-Report-Example.md', type: 'REPORT' },
        { file: '/research/Research-Manual.md', type: 'RESEARCH' },
        { file: '/handbooks/QO2-Handbook.md', type: 'HANDBOOK' }
      ];
      
      for (const testCase of testCases) {
        (fs.readFile as jest.Mock).mockResolvedValue('# Test Document');
        
        const result = await parser.parseDocument(testCase.file);
        expect(result.documentType).toBe(testCase.type);
      }
    });
  });
  
  describe('extractQuestionnaires', () => {
    it('should extract questionnaire items from content', () => {
      const content = `# TMP Questionnaire

## Section 1: Leadership

1. How effectively does the leader communicate the vision?
   a) Very effectively
   b) Somewhat effectively
   c) Not effectively
   Category: Leadership
   Scoring: a=3, b=2, c=1

2. Does the team have clear goals?
   a) Yes, very clear
   b) Somewhat clear
   c) Not clear
   Category: Goal Setting`;
      
      const items = parser.extractQuestionnaires(content, 'TMP');
      
      expect(items).toHaveLength(2);
      expect(items[0].questionId).toBe('TMP-1');
      expect(items[0].questionText).toBe('How effectively does the leader communicate the vision?');
      expect(items[0].category).toBe('Leadership');
      expect(items[0].scoringFormula).toBe('a=3, b=2, c=1');
      expect(items[0].responseOptions).toHaveLength(3);
    });
  });
});