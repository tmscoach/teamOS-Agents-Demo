# TMP Report API Examples

This directory contains complete examples of the new TMS API request/response format for reports.

## Files

### Request
- `tmp-report-request.md` - Shows the API request format

### Response
- `tmp-report-response-complete.json` - Full TMP report response with all 14 sections

### Documentation
- `tmp-report-example-summary.md` - Overview and explanation

## Key Features

The complete JSON response includes:

1. **14 Sections** covering the full TMP report
2. **5 Visualizations** with parameters and data
3. **Pre-computed vectorChunks** for visualization sections only
4. **Complete text content** from the original HTML report
5. **Structured data** ready for React components

## Section Types

- `visual` - Primarily visualization (e.g., cover wheel)
- `text` - Text content only (e.g., overview, leadership)
- `mixed` - Both text and visualization (e.g., introduction)
- `visual_series` - Multiple related visualizations (e.g., RIDO measures)
- `visual_composite` - Multiple diverse visualizations (e.g., summary)

## Usage

Share `tmp-report-response-complete.json` with the TMS Global developer as the target format for the new API endpoint.

The file shows exactly what data structure TeamOS expects to receive when requesting:
```
GET /api/v2/reports/{subscriptionId}
```

## File Size

- Complete JSON: ~48KB
- Contains all text, visualization params, and metadata
- Base64 images are truncated in example (would be full in production)