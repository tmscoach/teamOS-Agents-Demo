import { VoiceCommand } from './types';

export class VoiceCommandProcessor {
  private commandPatterns = {
    navigation: [
      { pattern: /^(next|continue|forward)(\s+question)?$/i, action: 'navigate', target: 'next' },
      { pattern: /^(previous|back|go back)(\s+question)?$/i, action: 'navigate', target: 'previous' },
      { pattern: /^(skip|pass)(\s+this)?(\s+question)?$/i, action: 'navigate', target: 'skip' },
      { pattern: /^go to question (\d+)$/i, action: 'navigate', extractTarget: 1 },
      { pattern: /^question (\d+)$/i, action: 'navigate', extractTarget: 1 },
    ],
    answers: [
      // Seesaw answers with various phrasings
      { pattern: /^(answer\s+)?(two\s*zero|2\s*0|strongly\s+left|definitely\s+left|much\s+more\s+left)$/i, action: 'answer', value: '20' },
      { pattern: /^(answer\s+)?(two\s*one|2\s*1|slightly\s+left|somewhat\s+left|a\s+bit\s+more\s+left)$/i, action: 'answer', value: '21' },
      { pattern: /^(answer\s+)?(one\s*two|1\s*2|slightly\s+right|somewhat\s+right|a\s+bit\s+more\s+right)$/i, action: 'answer', value: '12' },
      { pattern: /^(answer\s+)?(zero\s*two|0\s*2|strongly\s+right|definitely\s+right|much\s+more\s+right)$/i, action: 'answer', value: '02' },
      
      // Natural seesaw preferences
      { pattern: /^(strongly|definitely|much more) prefer(s)? (the )?(left|first)( one| option| statement)?$/i, action: 'answer', value: '20' },
      { pattern: /^(slightly|somewhat|a bit more) prefer(s)? (the )?(left|first)( one| option| statement)?$/i, action: 'answer', value: '21' },
      { pattern: /^(slightly|somewhat|a bit more) prefer(s)? (the )?(right|second)( one| option| statement)?$/i, action: 'answer', value: '12' },
      { pattern: /^(strongly|definitely|much more) prefer(s)? (the )?(right|second)( one| option| statement)?$/i, action: 'answer', value: '02' },
      
      // Yes/No answers
      { pattern: /^(answer\s+)?(yes|yep|yeah|correct|affirmative|true)$/i, action: 'answer', value: 'yes' },
      { pattern: /^(answer\s+)?(no|nope|nah|negative|false)$/i, action: 'answer', value: 'no' },
      
      // Multiple choice
      { pattern: /^(answer\s+)?([a-d])$/i, action: 'answer', extractValue: 2 },
      { pattern: /^(select|choose)\s+([a-d])$/i, action: 'answer', extractValue: 2 },
    ],
    actions: [
      { pattern: /^(repeat|say again|what was that|pardon)(\s+the)?(\s+question)?$/i, action: 'repeat' },
      { pattern: /^(pause|stop|wait)(\s+assessment)?$/i, action: 'pause' },
      { pattern: /^(resume|continue|start)(\s+assessment)?$/i, action: 'resume' },
      { pattern: /^(save|save progress|save my answers)$/i, action: 'save' },
      { pattern: /^(help|what can i say|commands)$/i, action: 'help' },
      { pattern: /^(exit voice|stop voice|text mode)$/i, action: 'exitVoice' },
    ],
  };

  parse(transcript: string): VoiceCommand {
    const cleanedTranscript = transcript.trim().toLowerCase();
    
    // Check navigation commands
    for (const pattern of this.commandPatterns.navigation) {
      const match = cleanedTranscript.match(pattern.pattern);
      if (match) {
        return {
          type: 'navigation',
          command: transcript,
          parameters: {
            target: pattern.extractTarget ? match[pattern.extractTarget] : pattern.target,
          },
        };
      }
    }
    
    // Check answer commands
    for (const pattern of this.commandPatterns.answers) {
      const match = cleanedTranscript.match(pattern.pattern);
      if (match) {
        return {
          type: 'answer',
          command: transcript,
          parameters: {
            value: pattern.extractValue ? match[pattern.extractValue] : pattern.value,
          },
        };
      }
    }
    
    // Check action commands
    for (const pattern of this.commandPatterns.actions) {
      const match = cleanedTranscript.match(pattern.pattern);
      if (match) {
        return {
          type: 'action',
          command: transcript,
          parameters: {
            target: pattern.action,
          },
        };
      }
    }
    
    // If no pattern matches, return unknown
    return {
      type: 'unknown',
      command: transcript,
    };
  }

  // Helper method to suggest similar commands
  getSuggestions(transcript: string): string[] {
    const suggestions: string[] = [];
    const words = transcript.toLowerCase().split(' ');
    
    // Check for partial matches
    if (words.includes('next') || words.includes('forward')) {
      suggestions.push('Say "next question" to continue');
    }
    if (words.includes('back') || words.includes('previous')) {
      suggestions.push('Say "go back" for previous question');
    }
    if (words.includes('answer') || words.includes('select')) {
      suggestions.push('For seesaw: "strongly left", "slightly right", etc.');
      suggestions.push('For yes/no: just say "yes" or "no"');
    }
    
    return suggestions;
  }

  // Get contextual help based on question type
  getContextualHelp(questionType: string): string[] {
    switch (questionType) {
      case 'seesaw':
        return [
          'Say "strongly left" or "two-zero" for strong preference to the left',
          'Say "slightly left" or "two-one" for slight preference to the left',
          'Say "slightly right" or "one-two" for slight preference to the right',
          'Say "strongly right" or "zero-two" for strong preference to the right',
        ];
      case 'yesno':
        return [
          'Say "yes" or "no" to answer',
          'You can also say "correct" for yes or "negative" for no',
        ];
      case 'multiplechoice':
        return [
          'Say the letter of your choice (A, B, C, or D)',
          'You can also say "select A" or "choose B"',
        ];
      default:
        return [
          'Say "next question" to continue',
          'Say "repeat" to hear the question again',
          'Say "help" for more commands',
        ];
    }
  }
}