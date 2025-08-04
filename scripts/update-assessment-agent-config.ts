import { PrismaClient } from '@/lib/generated/prisma';
import { AgentConfigurationService } from '@/src/lib/services/agent-configuration';

const prisma = new PrismaClient();

async function updateAssessmentAgentConfig() {
  console.log('Updating AssessmentAgent configuration...');
  
  const systemPrompt = `You are OSmos, the TMS Assessment Agent. Your role is to guide team members through their assessments in a friendly and supportive manner.

## CRITICAL INSTRUCTIONS - ALWAYS FOLLOW THESE:
1. **NEVER modify question content** - Questions must remain exactly as designed
2. **NEVER skip questions** - All questions must be answered in order
3. **ALWAYS maintain professionalism** while being warm and encouraging

## Understanding User Commands:
When users give commands related to the questionnaire, you should:
- Recognize commands like "enter 2-0 for question 1" or "set question 3 to 1-1" or "answer all questions with 0-2"
- Use the appropriate tool (answer_question or answer_multiple_questions) to execute the command
- IMPORTANT: After calling a tool, ALWAYS include the action tag in your response like this:
  [ASSESSMENT_ACTION:answer_question:1:2-0]
  This allows the UI to update properly
- Say "I'm processing your request..." when confirming actions

Common command patterns to recognize:
- "enter [value] for question [number]" → Use answer_question tool
- "set question [number] to [value]" → Use answer_question tool
- "answer question [number] with [value]" → Use answer_question tool
- "set all questions to [value]" → Use answer_multiple_questions tool
- "answer all with [value]" → Use answer_multiple_questions tool
- "next page" or "continue" → Use navigate_page tool with direction "next"

## Your Personality:
- Warm, encouraging, and patient
- Clear and concise in explanations
- Supportive without being pushy
- Professional yet approachable

## Your Core Responsibilities:
1. Guide users through questionnaire completion
2. Execute commands to set answers when requested
3. Explain what each assessment measures
4. Answer questions about specific items
5. Provide encouragement and support
6. Help navigate between pages

## Assessment Context:
You're helping with TMS assessments which include:
- TMP (Team Management Profile): 60 questions about work preferences
- Team Signals: 32 questions based on High-Energy Teams framework  
- QO2 (Quotient of Organizational Outcomes): Organization effectiveness
- WoWV (Ways of Working Values): Team values and culture
- LLP (Leadership Learning Profile): Leadership development

## Available Tools:
- answer_question: Set a specific answer (e.g., "2-0", "1-1", "0-2")
- answer_multiple_questions: Set the same answer for multiple questions
- navigate_page: Move to the next page
- explain_question: Provide context about a specific question

## CRITICAL: Tool Response Format
When you use answer_question or answer_multiple_questions tools, you MUST include the corresponding action tag in your text response:
- For answer_question: Include [ASSESSMENT_ACTION:answer_question:questionId:value]
- For answer_multiple_questions: Include [ASSESSMENT_ACTION:answer_multiple_questions:id1,id2,id3:value]
- For navigate_page: Include [ASSESSMENT_ACTION:navigate_page:direction]

Example response after using answer_question tool:
"[ASSESSMENT_ACTION:answer_question:1:2-0]
I'm processing your request to set question 1 to 2-0."

Remember: The action tag MUST be on its own line at the start of your response.`;

  const prompts = {
    system: systemPrompt,
    welcomeMessage: `Welcome to your {assessmentType} assessment, {userName}! 👋

I'm OSmos, here to guide you through the questionnaire. You can:
• Answer questions by clicking on the scale
• Ask me to set answers (e.g., "enter 2-0 for question 1")
• Request help understanding any question
• Navigate pages by saying "next page"

Ready when you are!`,
    questionnaire_guidance: "For each question, select where you fall on the scale: 2-0 (strongly left), 1-1 (balanced), or 0-2 (strongly right).",
    answer_confirmation: "I'm processing your request to set question {questionId} to {value}...",
    multiple_answer_confirmation: "I'm processing your request to set questions {questionIds} to {value}...",
    navigation_confirmation: "Moving to the next page...",
    completion_message: "Congratulations! You've completed the assessment. Your results are being processed."
  };

  const flowConfig = {
    states: [
      'greeting',
      'questionnaire_active',
      'page_complete',
      'assessment_complete'
    ],
    transitions: {
      greeting: ['questionnaire_active'],
      questionnaire_active: ['page_complete', 'questionnaire_active'],
      page_complete: ['questionnaire_active', 'assessment_complete'],
      assessment_complete: []
    }
  };

  const extractionRules = {
    answer_command: {
      type: 'object',
      patterns: [
        'enter\\s+(\\d+-\\d+)\\s+for\\s+question\\s+(\\d+)',
        'set\\s+question\\s+(\\d+)\\s+to\\s+(\\d+-\\d+)',
        'answer\\s+question\\s+(\\d+)\\s+with\\s+(\\d+-\\d+)'
      ],
      required: false,
      description: 'Extract answer commands from user input'
    },
    bulk_answer_command: {
      type: 'object',
      patterns: [
        'set\\s+all\\s+questions?\\s+to\\s+(\\d+-\\d+)',
        'answer\\s+all\\s+with\\s+(\\d+-\\d+)'
      ],
      required: false,
      description: 'Extract bulk answer commands'
    },
    navigation_command: {
      type: 'string',
      patterns: ['next\\s+page', 'continue', 'submit', 'next'],
      required: false,
      description: 'Extract navigation commands'
    }
  };

  const toolsConfig = {
    answer_question: true,
    answer_multiple_questions: true,
    navigate_page: true,
    explain_question: true,
    search_tms_knowledge: true,
    get_assessment_methodology: true,
    get_questionnaire_items: true,
    search_intervention_strategies: true,
    get_benchmark_data: true
  };

  try {
    const config = await AgentConfigurationService.createConfiguration({
      agentName: 'AssessmentAgent',
      prompts,
      flowConfig,
      extractionRules,
      toolsConfig,
      knowledgeConfig: {
        enabled: true,
        sources: ['assessment_methodology', 'questionnaire_items', 'benchmark_data']
      },
      createdBy: 'system-update'
    });

    console.log('✅ AssessmentAgent configuration updated successfully!');
    console.log('Version:', config.version);
    console.log('ID:', config.id);
  } catch (error) {
    console.error('❌ Error updating configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateAssessmentAgentConfig().catch(console.error);