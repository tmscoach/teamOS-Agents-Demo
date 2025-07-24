#!/bin/bash

# Run document ingestion with increased memory
echo "🚀 Running document ingestion with optimized memory settings..."
echo ""

# Run with 6GB heap size and pass all arguments
NODE_OPTIONS="--max-old-space-size=6144" npx tsx scripts/ingest-documents.ts "$@"