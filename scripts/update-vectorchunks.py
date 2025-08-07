#!/usr/bin/env python3
import json

# Read the complete JSON
with open('/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-complete.json', 'r') as f:
    data = json.load(f)

# Process each section
for section in data['data']['sections']:
    # Only keep vectorChunk if section has visualization(s)
    if section['type'] in ['text']:
        # Remove vectorChunk from text-only sections
        if 'vectorChunk' in section:
            del section['vectorChunk']
    elif section['type'] in ['visual', 'mixed', 'visual_series', 'visual_composite']:
        # Keep vectorChunk for sections with visualizations
        pass

# Write updated file
with open('/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-complete.json', 'w') as f:
    json.dump(data, f, indent=2)

# Count sections with vectorChunks
sections_with_chunks = sum(1 for s in data['data']['sections'] if 'vectorChunk' in s)
total_sections = len(data['data']['sections'])

print(f"Updated: {sections_with_chunks} of {total_sections} sections now have vectorChunks")
print("Sections with vectorChunks (visualization sections only):")
for s in data['data']['sections']:
    if 'vectorChunk' in s:
        print(f"  - {s['id']} ({s['type']})")