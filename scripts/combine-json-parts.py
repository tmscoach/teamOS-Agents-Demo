#!/usr/bin/env python3
import json
import os

# Read part 1 (base structure)
with open('/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-part1.json', 'r') as f:
    combined = json.load(f)

# Read subsequent parts and append sections
for i in range(2, 7):
    part_file = f'/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-part{i}.json'
    with open(part_file, 'r') as f:
        part_data = json.load(f)
        if 'sections_continued' in part_data:
            combined['data']['sections'].extend(part_data['sections_continued'])

# Write combined file
output_file = '/Users/rowanmccann/Documents/Development/teamOS-Agents-Demo/docs/tms-api-spec/examples/tmp-report-response-complete.json'
with open(output_file, 'w') as f:
    json.dump(combined, f, indent=2)

print(f"Combined JSON created with {len(combined['data']['sections'])} sections")
print(f"Output: {output_file}")