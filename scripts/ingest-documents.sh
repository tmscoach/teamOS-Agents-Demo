#!/bin/bash

# Run document ingestion with increased memory
echo "🚀 Running document ingestion with optimized memory settings..."
echo ""

# Run with 4GB heap size
NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/ingest-documents.ts