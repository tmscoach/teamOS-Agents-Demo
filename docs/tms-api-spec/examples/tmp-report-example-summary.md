# TMP Report API Example - Complete Overview

## What This Shows

This example demonstrates how the TMS Global API should return a TMP report in the new JSON format instead of HTML.

## Files in This Example

1. **tmp-report-request.md** - Shows the simple GET request
2. **tmp-report-response-part1.json** - First sections (Cover, Introduction)
3. **tmp-report-response-part2.json** - RIDO measures and Overview sections

## Key Differences from Current HTML Approach

### Current (HTML)
```html
<img src="https://api-test.tms.global//GetGraph?CreateTMPQWheel&mr=8&rr1=7&rr2=5"/>
<p>Upholder-Maintainers play an important role...</p>
```

### New (Structured JSON)
```json
{
  "visualization": {
    "type": "CreateTMPQWheel",
    "params": { "mr": "8", "rr1": "7", "rr2": "5" },
    "data": {
      "image": { "base64": "..." },
      "majorRole": { "name": "Upholder Maintainer", "score": 8 },
      "relatedRoles": [...]
    }
  },
  "content": {
    "paragraphs": ["Upholder-Maintainers play an important role..."]
  },
  "vectorChunk": "Pre-computed summary for AI embedding"
}
```

## Complete Report Structure

A full TMP report would contain these sections:

1. **Cover** - Main TMP wheel visualization
2. **Introduction** - Profile overview with intro wheel
3. **Work Preference Measures** - 4 RIDO bar charts
4. **Overview** - Detailed role description (text)
5. **Leadership Strengths** - Text section
6. **Decision-Making** - Text section  
7. **Interpersonal Skills** - Text section
8. **Team-Building** - Text section
9. **Areas for Self-Assessment** - Text with bullet points
10. **Key Points of Note** - Bullet point summary
11. **Related Roles** - Text explaining split wheel
12. **Work Preference Distribution** - Percentage wheel and bars
13. **Linking** - Pacing points for others
14. **Individual Summary** - Composite with 3 visualizations

## What TMS Global Developer Needs to Do

1. **Keep existing logic** - Don't change how reports are generated
2. **Add data extraction** - When generating charts, also return the data
3. **Structure as sections** - Break report into logical sections
4. **Include vector chunks** - Add pre-computed summaries for each section

## Benefits for TeamOS

- **No GPT-4 Vision needed** - All visual data is structured
- **Perfect for vectors** - Each section has a pre-computed chunk
- **Flexible rendering** - Can build any UI from this data
- **Single API call** - Everything in one response

## Example Usage in TeamOS

```javascript
// Fetch report
const response = await fetch('/api/v2/reports/114953', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const report = await response.json();

// Store in Supabase
for (const section of report.data.sections) {
  await supabase.from('report_sections').insert({
    report_id: report.data.reportId,
    section_id: section.id,
    content: section.content,
    visualization_data: section.visualization,
    vector_chunk: section.vectorChunk
  });
}

// Create vector embeddings
for (const section of report.data.sections) {
  const embedding = await openai.createEmbedding(section.vectorChunk);
  await vectorDB.insert(embedding);
}

// Render in React
<ReportLayout>
  {report.data.sections.map(section => (
    <SectionRenderer key={section.id} section={section} />
  ))}
</ReportLayout>
```

## Next Steps

1. Share these examples with TMS Global developer
2. They implement the new endpoints
3. Test with mock data in `/admin/tms-api-test`
4. Build React components in `/app/(dashboard)/reports/`
5. Store in Supabase and create vector embeddings