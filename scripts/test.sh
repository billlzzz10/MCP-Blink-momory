#!/bin/bash
# Test runner script

echo "🧪 Running MCP Blink Memory tests..."

# Run all tests with coverage
npm run test:coverage

if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "❌ Some tests failed"
    exit 1
fi