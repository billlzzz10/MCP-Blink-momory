@echo off
REM Build script for Windows

echo 🔨 Building MCP Blink Memory...

REM Clean previous build
if exist dist rmdir /s /q dist

REM Build TypeScript
npm run build

if %errorlevel% equ 0 (
    echo ✅ Build completed successfully
) else (
    echo ❌ Build failed
    exit /b 1
)