# LLM-Based Variable Extraction Improvements

## Problem
The regex-based extraction was incorrectly extracting names from common phrases:
- "I'm fine" → extracted "fine" as the name
- "I just want to understand" → extracted "just" as the name

## Solution
Implemented LLM-first extraction for natural language fields like names. The system now:

### 1. Uses AI Context Understanding
- The LLM understands conversational context
- Distinguishes between actual name introductions and common phrases
- Knows that "I'm fine" is a greeting response, not a name

### 2. Improved Extraction Logic
```typescript
// Check if we should prefer LLM extraction for this field
const preferLLM = rule.preferLLM || 
  (context?.enableLLMFallback && ['manager_name', 'user_name', 'name'].includes(fieldName));
```

### 3. Smart Prompting for Names
The LLM is given specific rules for name extraction:
- Only extract if the person is explicitly introducing themselves
- Common greeting responses ("I'm fine/good/okay") are NOT names
- Look for patterns like "My name is X", "I'm X", "Call me X"
- Don't extract partial words from phrases

## Configuration

### 1. Environment Variables
Add to `.env.local`:
```env
# Enable LLM extraction
ENABLE_LLM_EXTRACTION_FALLBACK=true

# OpenAI API key (required)
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Extraction Rules Update
The extraction rules now include:
```json
{
  "manager_name": {
    "type": "string",
    "patterns": [...],
    "required": true,
    "description": "The manager's full name",
    "useLLMFallback": true,
    "preferLLM": true,  // Use LLM first
    "examples": ["John Smith", "Sarah Johnson", "Michael Chen"]
  }
}
```

## How It Works

1. **LLM-First for Name Fields**: The system checks if LLM should be preferred for a field
2. **Context-Aware Prompts**: Special prompts for name extraction that understand common conversation patterns
3. **Fallback to Regex**: If LLM fails, it falls back to regex patterns
4. **Tracking**: All extractions are tracked with the method used (regex or llm)

## Testing

1. Restart your dev server to load the new environment variables
2. Make sure you've added your OpenAI API key to `.env.local`
3. Test with phrases like:
   - "I'm fine" → Should NOT extract a name
   - "I'm Sarah" → Should extract "Sarah"
   - "My name is John Smith" → Should extract "John Smith"
   - "I just want to get started" → Should NOT extract a name

## Benefits

- **More Accurate**: AI understands context, not just patterns
- **Fewer False Positives**: Won't extract names from common phrases
- **Better User Experience**: Users can speak naturally without worrying about triggering incorrect extractions
- **Future-Proof**: Easy to extend to other fields that need context understanding

## Next Steps

Consider using LLM extraction for other natural language fields like:
- `manager_role`: To better understand job titles
- `primary_challenge`: To extract the actual challenge from conversational text
- `organization`: To handle company name variations

The infrastructure is now in place to easily enable LLM extraction for any field by setting `preferLLM: true` in the extraction rules.