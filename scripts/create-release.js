#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

function createRelease(version = 'v2.0.0') {
  try {
    console.log(`🚀 Creating release ${version}...`);
    
    // Check if we're in a git repository
    try {
      execSync('git status', { stdio: 'ignore' });
    } catch (error) {
      console.log('📝 Initializing git repository...');
      execSync('git init');
      execSync('git add .');
      execSync('git commit -m "Initial commit - MCP Blink Memory v2.0.0"');
    }
    
    // Run pre-release checks
    console.log('🔍 Running pre-release checks...');
    execSync('npm run build', { stdio: 'inherit' });
    execSync('npm test', { stdio: 'inherit' });
    execSync('npm run validate', { stdio: 'inherit' });
    
    // Check if tag already exists
    try {
      execSync(`git rev-parse ${version}`, { stdio: 'ignore' });
      console.log(`⚠️  Tag ${version} already exists. Deleting...`);
      execSync(`git tag -d ${version}`, { stdio: 'ignore' });
    } catch (error) {
      // Tag doesn't exist, which is good
    }
    
    // Create and push tag
    console.log(`🏷️  Creating tag ${version}...`);
    execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' });
    
    // Create package
    console.log('📦 Creating package...');
    execSync('npm pack', { stdio: 'inherit' });
    
    console.log(`✅ Release ${version} created successfully!`);
    console.log('\n📋 Next steps:');
    console.log(`   1. Push tag: git push origin ${version}`);
    console.log('   2. GitHub Actions will automatically create the release');
    console.log('   3. Or manually trigger release workflow in GitHub');
    
    return true;
  } catch (error) {
    console.error('❌ Release creation failed:', error.message);
    return false;
  }
}

// Get version from command line or use default
const version = process.argv[2] || 'v2.0.0';
const success = createRelease(version);
process.exit(success ? 0 : 1);