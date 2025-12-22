@echo off
REM Development server script for Windows

echo 🚀 Starting MCP Blink Memory development server...

REM Set development environment
set NODE_ENV=development
set MCP_LOG_LEVEL=debug

REM Start with hot reload
npm run dev