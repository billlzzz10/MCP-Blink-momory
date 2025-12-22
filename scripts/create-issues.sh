#!/bin/bash
# scripts/create-issues.sh
# Manual script to trigger GitHub Actions workflow

set -e

REPO_OWNER="${1:-.}"
WORKFLOW_FILE="create-issues.yml"
DRY_RUN="${2:-false}"

echo "🚀 Triggering GitHub Actions workflow..."
echo "📁 Repository: $REPO_OWNER"
echo "🔍 Dry run: $DRY_RUN"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI is not installed. Please install it first:"
  echo "   https://cli.github.com/"
  exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Not in a git repository"
  exit 1
fi

# Trigger workflow
gh workflow run "$WORKFLOW_FILE" \
  -f dry_run="$DRY_RUN" \
  --repo "$REPO_OWNER"

echo "✅ Workflow triggered successfully!"
echo ""
echo "📊 View workflow status:"
echo "   gh run list --workflow=$WORKFLOW_FILE"
echo ""
echo "📋 View created issues:"
echo "   gh issue list"