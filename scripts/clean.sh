#!/bin/bash
# Cleanup script

echo "🧹 Cleaning MCP Blink Memory project..."

# Remove build artifacts
rm -rf dist/
rm -rf node_modules/.cache/
rm -rf .nyc_output/
rm -rf coverage/

# Clean memory files (optional - uncomment if needed)
# rm -f memory/*.json

# Clean logs
rm -f *.log

echo "✅ Cleanup completed"