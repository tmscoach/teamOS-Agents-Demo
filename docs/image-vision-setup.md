# Image Vision Analysis Setup

## Overview

We've implemented AI-powered image understanding for the debrief agent, allowing it to analyze and describe the visual content in TMS reports (wheels, graphs, charts).

## What Was Built

### 1. VisionAnalysisService
- Uses OpenAI's GPT-4 Vision to analyze report images
- Extracts structured data from wheels and graphs
- Generates detailed descriptions and insights
- Creates vector embeddings for semantic search

### 2. Enhanced Database Schema
- Added `detailedDescription` - AI-generated description of image content
- Added `extractedData` - Structured data (percentages, data points)
- Added `insights` - Key insights from the image
- Added `embedding` - Vector embedding for similarity search

### 3. Updated Report Processing
- Images are now analyzed during report storage
- Vision analysis happens automatically when reports are generated
- Fallback to basic alt text if vision analysis fails

### 4. New Debrief Agent Tool
- `search_report_images` - Search and retrieve information from images
- Returns detailed descriptions and extracted data
- Can filter by image type (wheel, graph, asset)

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration to add new columns
psql $DATABASE_URL < prisma/migrations/add_image_vision_fields.sql

# Generate Prisma client
npm run db:generate
```

### 2. Environment Variables

Ensure you have the OpenAI API key configured:
```bash
OPENAI_API_KEY=your-api-key-here
```

### 3. Test the Feature

1. Generate a new report via `/admin/tms-api-test`
2. Check the logs for vision analysis messages
3. Use the debrief agent and ask about images:
   - "Describe my wheel"
   - "What do the graphs show?"
   - "Tell me about my work preference distribution"

## How It Works

When a report is generated:
1. Images are downloaded from the TMS API
2. Each image is analyzed by GPT-4 Vision
3. The AI extracts:
   - For wheels: Work preference percentages, dominant sectors, patterns
   - For graphs: Data points, trends, chart types
4. Descriptions and data are stored in the database
5. Vector embeddings are generated for semantic search

When the debrief agent is asked about images:
1. The `search_report_images` tool searches for relevant images
2. Returns AI-generated descriptions and extracted data
3. The agent can provide detailed insights about visual elements

## Example Responses

**User**: "Describe my wheel"
**Agent**: "Looking at your Team Management Wheel, I can see your work preferences are strongly concentrated in the Maintaining sector at 19%, followed by Inspecting at 15% and Organizing and Producing both at 14%. This pattern shows a preference for structured, systematic work with a focus on quality control and maintaining standards. The distribution suggests you excel in roles that require attention to detail and ensuring processes run smoothly."

**User**: "What trends do the graphs show?"
**Agent**: "The graphs in your report show several key trends:
1. Your preference scores indicate a strong bias toward structured organization (S score)
2. The work preference distribution graph highlights your concentration in the controlling and organizing sectors
3. Your scores show a balanced approach between practical and creative information processing..."

## Troubleshooting

If vision analysis isn't working:
1. Check OpenAI API key is configured
2. Verify GPT-4 Vision access on your OpenAI account
3. Check logs for vision analysis errors
4. Images will still be stored with basic alt text as fallback

## Future Enhancements

Potential improvements:
- Batch process multiple images for efficiency
- Add caching for vision analysis results
- Support for comparing images across reports
- Generate insights by correlating image data with text content