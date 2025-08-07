#!/usr/bin/env python3
import json

# Read the complete JSON
with open('/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-complete.json', 'r') as f:
    data = json.load(f)

# Track what we're removing
removed_count = 0

# Process each section
for section in data['data']['sections']:
    # Remove vectorChunk from text-only sections
    if section['type'] == 'text' and 'vectorChunk' in section:
        del section['vectorChunk']
        removed_count += 1
        print(f"Removed vectorChunk from: {section['id']}")

# Write updated file
with open('/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-complete.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"\nRemoved {removed_count} vectorChunks from text-only sections")

# Verify the results
print("\nFinal status:")
for s in data['data']['sections']:
    has_chunk = 'vectorChunk' in s
    status = "✓ has vectorChunk" if has_chunk else "✗ no vectorChunk"
    print(f"  {s['id']:30} ({s['type']:20}) - {status}")