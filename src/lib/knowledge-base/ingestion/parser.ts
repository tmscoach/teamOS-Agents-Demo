import fs from 'fs/promises';
import path from 'path';
import { DocumentMetadata, ProcessedDocument, QuestionnaireData } from '../types';

export class DocumentParser {
  async parseDocument(filePath: string): Promise<ProcessedDocument> {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const dirName = path.basename(path.dirname(filePath));
    
    const metadata = this.extractMetadata(content, fileName, dirName);
    
    return {
      title: metadata.title,
      sourcePath: filePath,
      documentType: metadata.documentType,
      content,
      metadata,
      chunks: []
    };
  }
  
  private extractMetadata(content: string, fileName: string, dirName: string): DocumentMetadata {
    const lines = content.split('\n');
    const title = this.extractTitle(lines) || fileName;
    const documentType = this.determineDocumentType(fileName, dirName, content);
    
    const metadata: DocumentMetadata = {
      title,
      sourcePath: fileName,
      documentType
    };
    
    if (documentType === 'QUESTIONNAIRE') {
      const assessmentType = this.extractAssessmentType(fileName, content);
      if (assessmentType) {
        metadata.assessmentType = assessmentType;
      }
    }
    
    const headers = this.extractHeaders(lines);
    if (headers.length > 0) {
      metadata.sections = headers;
    }
    
    return metadata;
  }
  
  private extractTitle(lines: string[]): string | null {
    for (const line of lines) {
      if (line.startsWith('# ')) {
        return line.substring(2).trim();
      }
    }
    return null;
  }
  
  private determineDocumentType(
    fileName: string, 
    dirName: string, 
    content: string
  ): 'HANDBOOK' | 'QUESTIONNAIRE' | 'REPORT' | 'RESEARCH' {
    const lowerFileName = fileName.toLowerCase();
    const lowerDirName = dirName.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerDirName.includes('handbook') || lowerFileName.includes('handbook') || 
        lowerContent.includes('accreditation handbook')) {
      return 'HANDBOOK';
    }
    
    if (lowerDirName.includes('questionnaire') || lowerFileName.includes('questionnaire') ||
        lowerContent.includes('questionnaire content')) {
      return 'QUESTIONNAIRE';
    }
    
    if (lowerDirName.includes('report') || lowerFileName.includes('report') ||
        lowerContent.includes('finished report')) {
      return 'REPORT';
    }
    
    if (lowerDirName.includes('research') || lowerFileName.includes('research') ||
        lowerContent.includes('research manual')) {
      return 'RESEARCH';
    }
    
    return 'HANDBOOK';
  }
  
  private extractAssessmentType(fileName: string, content: string): string | null {
    const assessmentTypes = ['TMP', 'QO2', 'WoWV', 'WoW', 'LLP', 'HET'];
    
    for (const type of assessmentTypes) {
      if (fileName.includes(type) || content.includes(type)) {
        return type === 'WoW' ? 'WoWV' : type;
      }
    }
    
    return null;
  }
  
  private extractHeaders(lines: string[]): string[] {
    const headers: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^#{1,6}\s+/)) {
        const headerText = line.replace(/^#{1,6}\s+/, '').trim();
        headers.push(headerText);
      }
    }
    
    return headers;
  }
  
  extractQuestionnaires(content: string, assessmentType: string): QuestionnaireData[] {
    const questionnaires: QuestionnaireData[] = [];
    const lines = content.split('\n');
    
    let currentQuestion: Partial<QuestionnaireData> | null = null;
    let questionNumber = 1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^\d+\.\s+|^Q\d+:|^Question\s+\d+:/i)) {
        if (currentQuestion?.questionText) {
          questionnaires.push({
            questionId: `${assessmentType}-${questionNumber}`,
            questionText: currentQuestion.questionText,
            category: currentQuestion.category,
            assessmentType,
            responseOptions: currentQuestion.responseOptions,
            scoringFormula: currentQuestion.scoringFormula,
            metadata: currentQuestion.metadata
          });
          questionNumber++;
        }
        
        const questionText = line.replace(/^\d+\.\s+|^Q\d+:\s*|^Question\s+\d+:\s*/i, '').trim();
        currentQuestion = { questionText };
      } else if (currentQuestion && line && !line.startsWith('#')) {
        if (line.includes('Category:') || line.includes('Section:')) {
          currentQuestion.category = line.split(':')[1].trim();
        } else if (line.includes('Scoring:') || line.includes('Formula:')) {
          currentQuestion.scoringFormula = line.split(':')[1].trim();
        } else if (line.match(/^[a-e]\)|^\d\)/)) {
          if (!currentQuestion.responseOptions) {
            currentQuestion.responseOptions = [];
          }
          currentQuestion.responseOptions.push(line);
        }
      }
    }
    
    if (currentQuestion?.questionText) {
      questionnaires.push({
        questionId: `${assessmentType}-${questionNumber}`,
        questionText: currentQuestion.questionText,
        category: currentQuestion.category,
        assessmentType,
        responseOptions: currentQuestion.responseOptions,
        scoringFormula: currentQuestion.scoringFormula,
        metadata: currentQuestion.metadata
      });
    }
    
    return questionnaires;
  }
}