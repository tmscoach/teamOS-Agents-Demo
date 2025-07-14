# LLM Extraction by Default

## Overview

Based on real-world testing, the system now uses LLM (Language Model) extraction as the default method for extracting information from user messages. This provides significantly better accuracy compared to regex patterns, especially for natural conversational language.

## Why LLM Extraction?

### Problems with Regex Extraction

1. **Rigid Patterns** - Regex requires exact pattern matching, missing variations in how people express information
2. **Context Blindness** - Can't understand context (e.g., "I'm fine" vs "I'm John")  
3. **Over-extraction** - Often captures too much text (e.g., "ctually 'BHP' and I'm a CTO t" instead of just "CTO")
4. **Maintenance Burden** - Complex regex patterns are hard to maintain and debug

### Benefits of LLM Extraction

1. **Natural Language Understanding** - Understands context and intent
2. **Flexible Recognition** - Handles variations in expression naturally
3. **Accurate Extraction** - Extracts only the relevant information
4. **Easy to Configure** - Simple prompts instead of complex regex patterns

## How It Works

### Default Behavior

When `ENABLE_LLM_EXTRACTION_FALLBACK=true` is set in environment variables:
- All fields use LLM extraction by default
- Regex is only used if explicitly configured or as a fallback

### Field Configuration

```javascript
// In extraction rules
{
  "manager_name": {
    "type": "string",
    "description": "The manager's full name",
    "required": true,
    // preferLLM is now assumed true by default
    // Set preferLLM: false to force regex-only extraction
  }
}
```

### Extraction Process

1. **LLM First** - System attempts LLM extraction for all fields
2. **Smart Prompts** - Field-specific prompts guide accurate extraction
3. **Optional Fallback** - Regex can be used as fallback if configured

## Field-Specific Prompts

The system uses intelligent prompts for different field types:

### Name Fields
- Distinguishes between actual names and phrases like "I'm fine"
- Handles lowercase names with proper capitalization
- Examples: "I'm john" → "John", "Hi I'm Sarah" → "Sarah"

### Role Fields  
- Extracts job titles without company names
- Maintains proper capitalization (CTO, VP, etc.)
- Examples: "I'm a CTO at BHP" → "CTO"

### Team Size
- Recognizes various patterns ("team of 5", "manage 10 people")
- Handles ranges by taking the average
- Examples: "I have 10-15 reports" → "12"

### Challenges
- Extracts the core problem, not entire explanations
- Identifies pain points and goals
- Examples: "We struggle with communication" → "Poor communication"

## Configuration Options

### Environment Variables
```bash
# Enable LLM extraction (required)
ENABLE_LLM_EXTRACTION_FALLBACK=true

# OpenAI API key (required for LLM)
OPENAI_API_KEY=your-api-key
```

### Per-Field Options
```javascript
{
  "field_name": {
    // ... other config
    "preferLLM": false,        // Force regex-only (not recommended)
    "useRegexFallback": true,  // Try regex if LLM fails
    "useLLMFallback": true     // Try LLM if regex fails (legacy)
  }
}
```

## Best Practices

1. **Keep LLM Enabled** - Better accuracy for natural conversations
2. **Simple Descriptions** - Clear field descriptions help LLM understand intent
3. **Test Extraction** - Use logs to verify extraction accuracy
4. **Monitor Costs** - LLM calls have API costs, but accuracy improvement is worth it

## Migration Guide

If upgrading from regex-based extraction:

1. Ensure `ENABLE_LLM_EXTRACTION_FALLBACK=true` is set
2. Remove complex regex patterns (they're now optional)
3. Add clear descriptions to extraction rules
4. Test with real user messages
5. Adjust prompts if needed for specific fields

## Debugging

Enable logging to see extraction in action:
```
[Extraction] Processing manager_name: preferLLM=true, enableLLMFallback=true
[LLM Extraction] Starting extraction for manager_name from: "I'm john and i manage a team of 3"
[LLM Extraction] manager_name from "I'm john and i manage a team of 3" → "John"
[Extraction] LLM result for manager_name: John
```

## Future Enhancements

- Confidence scoring for extractions
- Multi-language support
- Custom prompt templates per agent
- Extraction validation rules