#!/bin/bash
# Build script for MCP Blink Memory

echo "🔨 Building MCP Blink Memory..."

# Clean previous build
rm -rf dist/

# Build TypeScript
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi