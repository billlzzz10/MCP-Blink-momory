#!/bin/bash
# Development server script

echo "🚀 Starting MCP Blink Memory development server..."

# Set development environment
export NODE_ENV=development
export MCP_LOG_LEVEL=debug

# Start with hot reload
npm run dev