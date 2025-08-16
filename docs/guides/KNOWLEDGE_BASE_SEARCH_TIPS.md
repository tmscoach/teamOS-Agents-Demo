# Knowledge Base Search Tips for Debrief Agent

## Current Issues
The debrief agent sometimes fails to find information in the TMS knowledge base because:
1. It uses `limit: 1` which is too restrictive
2. The search doesn't always find the most relevant chunks first
3. Acronyms like ICAF, ICBS need special handling

## How to Improve Searches

### 1. Use Higher Limits
Instead of `limit: 1`, use `limit: 5` or more to get better results:
```javascript
search_tms_knowledge({ query: "ICAF", limit: 5 })
```

### 2. Search for Related Terms
For TMS acronyms, also search for related concepts:
- ICAF → Search for "Creator-Innovator" or "Introverted Creative"
- ICBS → Search for "Controller-Inspector" or "Introverted Controlling"
- EPBF → Search for "Explorer-Promoter" or "Extroverted Promoting"

### 3. Use the get_assessment_methodology Tool
For handbook-specific information:
```javascript
get_assessment_methodology({ assessment_type: "TMP", section: "roles" })
```

## Known Content in Knowledge Base
- 48 documents total
- 34 handbooks including TMP Accreditation Handbook
- 1000 chunks with embeddings
- 36 chunks containing "ICAF"
- 31 chunks containing "ICBS"

## What ICAF Actually Means
Based on the knowledge base:
- ICAF = Introverted Creative Advising Flexible
- Part of the 16-fold Team Management Wheel coding system
- Related to the Creator-Innovator role
- Appears in comparisons like "ICAF vs. EPBS" in research documents