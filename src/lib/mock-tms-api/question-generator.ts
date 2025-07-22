/**
 * Question Generator for TMS Assessments
 * Generates realistic questions based on assessment type and recorded API patterns
 */

import { 
  AssessmentDefinition,
  TMP_QUESTION_PAIRS,
  QO2_QUESTIONS,
  TEAM_SIGNALS_QUESTIONS
} from './assessment-definitions';

export interface TMSQuestion {
  ID: number;
  QuestionID: number;
  IsForm: boolean;
  Description: string;
  Prompt: string;
  Number: string;
  StatementA?: string; // For TMP seesaw questions
  StatementB?: string; // For TMP seesaw questions
  Index: number;
  SortOrder: number;
  IsEnabled: boolean;
  AllowMultipleSelections: boolean;
  ForceUpperCase: boolean;
  Type: number;
  AnswerBoolean: boolean;
  AnswerMultiple: any[];
  AnswerString?: string;
  Validation: string;
  IsRequired: boolean;
  AllowNegative: boolean;
  KeepWithNext: boolean;
  KeepWithNextItemised: boolean;
  UseHorizontalLayout: boolean;
  QuestionGroupHeader?: string;
  QuestionAreaColumnWidth?: number;
  AnswerAreaColumnWidth?: number;
  ListValues?: string[];
  ListOptions?: string[];
}

export class QuestionGenerator {
  /**
   * Generate questions for a specific page
   */
  static generateQuestionsForPage(
    assessment: AssessmentDefinition,
    pageNumber: number,
    pageId: number
  ): TMSQuestion[] {
    switch (assessment.assessmentType) {
      case 'TMP':
        return this.generateTMPQuestions(pageNumber, pageId);
      case 'QO2':
        return this.generateQO2Questions(pageNumber, pageId);
      case 'TeamSignals':
        return this.generateTeamSignalsQuestions(pageNumber, pageId);
      default:
        return [];
    }
  }

  /**
   * Generate TMP seesaw questions
   */
  private static generateTMPQuestions(pageNumber: number, pageId: number): TMSQuestion[] {
    const questions: TMSQuestion[] = [];
    const questionsPerPage = 5;
    const startQuestionNumber = (pageNumber - 1) * questionsPerPage + 1;

    for (let i = 0; i < questionsPerPage; i++) {
      const questionNumber = startQuestionNumber + i;
      const questionPairIndex = (questionNumber - 1) % TMP_QUESTION_PAIRS.length;
      const questionPair = TMP_QUESTION_PAIRS[questionPairIndex];
      
      // Generate unique question ID based on page and question number
      const questionId = pageId * 10 + i;

      questions.push({
        ID: 0,
        QuestionID: questionId,
        IsForm: false,
        Description: `Question ${questionNumber}`,
        Prompt: `${questionNumber})`,
        Number: questionNumber.toString(),
        StatementA: questionPair.statementA,
        StatementB: questionPair.statementB,
        Index: 0,
        SortOrder: questionNumber - 1,
        IsEnabled: true,
        AllowMultipleSelections: false,
        ForceUpperCase: false,
        Type: 18, // Seesaw type
        AnswerBoolean: false,
        AnswerMultiple: [],
        Validation: "||||Seesaw|False",
        IsRequired: true,
        AllowNegative: false,
        KeepWithNext: false,
        KeepWithNextItemised: false,
        UseHorizontalLayout: false
      });
    }

    // Add organization question on first page
    if (pageNumber === 1) {
      questions.push({
        ID: 0,
        QuestionID: 1041,
        IsForm: false,
        Description: "Organisation",
        Prompt: "Please enter your organisation name:",
        Number: "",
        Index: 0,
        SortOrder: 100,
        IsEnabled: true,
        AllowMultipleSelections: false,
        ForceUpperCase: false,
        Type: 1, // Text input
        AnswerBoolean: false,
        AnswerMultiple: [],
        AnswerString: "",
        Validation: "||||Text|False",
        IsRequired: true,
        AllowNegative: false,
        KeepWithNext: false,
        KeepWithNextItemised: false,
        UseHorizontalLayout: false
      });
    }

    return questions;
  }

  /**
   * Generate QO2 multiple choice questions
   */
  private static generateQO2Questions(pageNumber: number, pageId: number): TMSQuestion[] {
    const questions: TMSQuestion[] = [];
    const questionsPerPage = 5;
    const startQuestionNumber = (pageNumber - 1) * questionsPerPage + 1;

    for (let i = 0; i < questionsPerPage; i++) {
      const questionNumber = startQuestionNumber + i;
      const questionIndex = (questionNumber - 1) % QO2_QUESTIONS.length;
      const questionText = QO2_QUESTIONS[questionIndex];
      
      // Generate unique question ID
      const questionId = 300 + pageId * 10 + i;

      questions.push({
        ID: 0,
        QuestionID: questionId,
        IsForm: false,
        Description: `Q${questionNumber}`,
        Prompt: questionText,
        Number: questionNumber.toString(),
        Index: 0,
        SortOrder: questionNumber - 1,
        IsEnabled: true,
        AllowMultipleSelections: false,
        ForceUpperCase: false,
        Type: 16, // Multiple choice
        AnswerBoolean: false,
        AnswerMultiple: [],
        Validation: "||||MultipleChoice|False",
        IsRequired: true,
        AllowNegative: false,
        KeepWithNext: true,
        KeepWithNextItemised: false,
        UseHorizontalLayout: true,
        QuestionGroupHeader: "Statement",
        QuestionAreaColumnWidth: 8,
        AnswerAreaColumnWidth: 2,
        ListValues: [],
        ListOptions: [
          "Strongly Agree",
          "Mostly Agree", 
          "Slightly Agree",
          "Slightly Disagree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      });
    }

    return questions;
  }

  /**
   * Generate Team Signals Likert scale questions
   */
  private static generateTeamSignalsQuestions(pageNumber: number, pageId: number): TMSQuestion[] {
    const questions: TMSQuestion[] = [];
    const questionsPerPage = 5;
    const startQuestionNumber = (pageNumber - 1) * questionsPerPage + 1;

    for (let i = 0; i < questionsPerPage; i++) {
      const questionNumber = startQuestionNumber + i;
      const questionIndex = (questionNumber - 1) % TEAM_SIGNALS_QUESTIONS.length;
      const questionText = TEAM_SIGNALS_QUESTIONS[questionIndex];
      
      // Generate unique question ID (matches recorded pattern)
      const questionId = 528 + (pageNumber - 1) * questionsPerPage + i;

      questions.push({
        ID: 0,
        QuestionID: questionId,
        IsForm: false,
        Description: `Q${questionNumber}`,
        Prompt: questionText,
        Number: `${startQuestionNumber}-${Math.min(startQuestionNumber + 4, 32)}`, // e.g., "6-10"
        Index: 0,
        SortOrder: questionNumber - 1,
        IsEnabled: true,
        AllowMultipleSelections: false,
        ForceUpperCase: false,
        Type: 16, // Multiple choice
        AnswerBoolean: false,
        AnswerMultiple: [],
        Validation: "||||MultipleChoice|False",
        IsRequired: true,
        AllowNegative: false,
        KeepWithNext: true,
        KeepWithNextItemised: false,
        QuestionGroupHeader: "Statement",
        UseHorizontalLayout: true,
        QuestionAreaColumnWidth: 5,
        AnswerAreaColumnWidth: 4,
        ListValues: [],
        ListOptions: [
          "Strongly Agree",
          "Mostly Agree",
          "Mostly Disagree",
          "Strongly Disagree"
        ]
      });
    }

    return questions;
  }

  /**
   * Generate overview HTML for page headers
   */
  static generatePageOverview(
    assessment: AssessmentDefinition,
    pageNumber: number,
    totalPages: number
  ): string {
    switch (assessment.assessmentType) {
      case 'TMP':
        return `<div style="margin-left: 0px;"><h6><img src="https://localhost:5001/Asset/Get/PB_${pageNumber}of${totalPages}" height="20px">&nbsp; &nbsp;<strong>Page ${pageNumber}</strong> of ${totalPages}</h6><p></p><h4><strong>Answer according to the way you prefer to work</strong></h4><p>If you definitely prefer the statement on the left, select 2-0<br>If you definitely prefer the statement on the right, select 0-2<br>If you find it difficult to decide which statement you prefer, select 2-1 or 1-2 to the left or right of the preferred statement</p></div>`;
      
      case 'QO2':
        if (pageNumber === 1) {
          return `<div class="d-md-none"><p></p><div class="alert alert-danger" role="alert"><p align="center"><b>!! CAUTION !!</b></p><p align="center">For an optimized mobile experience and to ensure the accuracy of your results, please download the TMS Global app.</p><p align="center"><a href="https://play.google.com/store/apps/details?id=global.tms.aicoach.prod"><img alt="Get it on Google Play" src="https://tms.global/asset/Get/googleplaybadge.png" width="200"></a></p><p align="center"><a href="https://apple.co/3tNCMCr"><img alt="Download on App Store" src="https://tms.global/asset/Get/appstorebadge.png" width="200"></a></p></div></div><div style="display:block;"><div class="spacer50"></div><div><h4>Opportunities-Obstacles Quotient Profile Questionnaire Instructions</h4><div class="spacer25"></div><div><p>The Opportunities-Obstacles Quotient Profile Questionnaire is designed to measure the different ways in which people focus their energy at work.</p><div class="spacer25"></div><div><p><b>Please read these instructions carefully before you begin your questionnaire</b></p><ul><li>Please note that this is <b>not a test</b> - there are no right or wrong answers</li><li>Complete <b>ALL</b>&nbsp;50 questions in <b>one sitting</b></li><li>There is <b>no set time limit for completion</b></li><li>Most people take no longer than 15 minutes</li></ul></div><div class="spacer25"></div><div><p></p><b>How to answer the questions:</b><p></p></div><div><ul><li>Read each statement and decide whether you agree or disagree</li><li>Decide how strongly you agree or disagree</li><li>If you are unsure whether you agree or disagree, try to think of specific instances at work where the question might apply then choose either of the centre circles.</li></ul></div></div></div></div>`;
        }
        return `<div><h6><strong>Page ${pageNumber}</strong> of ${totalPages}</h6><p></p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>`;
      
      case 'TeamSignals':
        return `<div style="margin-left:20px"><h6><img src="https://localhost:5001/Asset/Get/PB_${pageNumber}of${totalPages}" height="20px">&nbsp; &nbsp;<b>Page ${pageNumber}</b> of ${totalPages}</h6><p>&nbsp;</p><h4><strong>Read each statement and decide how strongly you agree or disagree</strong></h4></div>`;
      
      default:
        return '';
    }
  }
}