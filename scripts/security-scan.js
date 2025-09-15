#!/usr/bin/env node

/**
 * Security Scan Script for Knowledge Graph Memory Project
 * 
 * This script performs comprehensive security checks to ensure
 * the project is safe for production deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting security scan...');

// Security checks to perform
const securityChecks = [
    {
        name: 'BOM Detection',
        check: checkForBOM,
        severity: 'HIGH'
    },
    {
        name: 'Secret Detection',
        check: checkForSecrets,
        severity: 'CRITICAL'
    },
    {
        name: 'Malicious Code Patterns',
        check: checkForMaliciousPatterns,
        severity: 'CRITICAL'
    },
    {
        name: 'File Permissions',
        check: checkFilePermissions,
        severity: 'MEDIUM'
    },
    {
        name: 'Dependency Security',
        check: checkDependencySecurity,
        severity: 'HIGH'
    }
];

// Track results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
};

// Run all security checks
securityChecks.forEach(check => {
    console.log(`\n🔍 Running: ${check.name}`);
    try {
        const result = check.check();
        if (result.passed) {
            console.log(`✅ ${check.name}: PASSED`);
            results.passed++;
        } else {
            console.log(`❌ ${check.name}: FAILED`);
            results.failed++;
            result.issues.forEach(issue => {
                results.issues.push({
                    check: check.name,
                    severity: check.severity,
                    ...issue
                });
            });
        }
    } catch (error) {
        console.log(`⚠️  ${check.name}: ERROR - ${error.message}`);
        results.warnings++;
        results.issues.push({
            check: check.name,
            severity: check.severity,
            message: `Error running check: ${error.message}`,
            file: 'N/A'
        });
    }
});

// Summary
console.log('\n📊 Security Scan Summary:');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

if (results.issues.length > 0) {
    console.log('\n🚨 Security Issues Found:');
    results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.check}`);
        console.log(`   File: ${issue.file}`);
        console.log(`   Issue: ${issue.message}`);
        if (issue.suggestion) {
            console.log(`   Suggestion: ${issue.suggestion}`);
        }
        console.log('');
    });
}

// Exit with appropriate code
if (results.failed > 0) {
    console.log('🚨 Security scan FAILED - Critical issues found');
    process.exit(1);
} else if (results.warnings > 0) {
    console.log('⚠️  Security scan PASSED - Warnings found');
    process.exit(0);
} else {
    console.log('🎉 Security scan PASSED - All checks passed');
    process.exit(0);
}

// Security check functions

function checkForBOM() {
    const issues = [];
    const projectFiles = getProjectFiles();
    
    projectFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            if (content.charCodeAt(0) === 0xFEFF) {
                issues.push({
                    file: file,
                    message: 'File contains BOM (Byte Order Mark)',
                    suggestion: 'Remove BOM and save file as UTF-8 without BOM'
                });
            }
        } catch (error) {
            // Skip files that can't be read as text
        }
    });
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}

function checkForSecrets() {
    const issues = [];
    const secretPatterns = [
        /api[_-]?key\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /secret\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /password\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /token\s*[:=]\s*['"][^'"]{10,}['"]/i,
        /private[_-]?key\s*[:=]\s*['"][^'"]{20,}['"]/i,
        /access[_-]?token\s*[:=]\s*['"][^'"]{20,}['"]/i
    ];
    
    const projectFiles = getProjectFiles(['*.js', '*.json', '*.yaml', '*.yml', '*.md']);
    
    projectFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            secretPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    issues.push({
                        file: file,
                        message: `Potential secret found: ${matches[0]}`,
                        suggestion: 'Move secrets to environment variables or secure configuration'
                    });
                }
            });
        } catch (error) {
            // Skip files that can't be read
        }
    });
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}

function checkForMaliciousPatterns() {
    const issues = [];
    const maliciousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\([^,]*,0/,
        /setInterval\s*\([^,]*,0/,
        /document\.write\s*\(/,
        /innerHTML\s*=/,
        /exec\s*\(/,
        /system\s*\(/,
        /exec\s*\(/,
        /spawn\s*\(/,
        /fork\s*\(/,
        /require\s*\(['"][^'"]*['"]\s*\+\s*['"][^'"]*['"]/
    ];
    
    const projectFiles = getProjectFiles(['*.js', '*.json']);
    
    projectFiles.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            maliciousPatterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    issues.push({
                        file: file,
                        message: `Potential malicious code pattern found: ${matches[0]}`,
                        suggestion: 'Review and remove potentially dangerous code patterns'
                    });
                }
            });
        } catch (error) {
            // Skip files that can't be read
        }
    });
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}

function checkFilePermissions() {
    const issues = [];
    const projectFiles = getProjectFiles();
    
    projectFiles.forEach(file => {
        try {
            const stats = fs.statSync(file);
            const mode = stats.mode;
            
            // Check if world-writable
            if ((mode & 0o002) !== 0) {
                issues.push({
                    file: file,
                    message: 'File is world-writable',
                    suggestion: 'Remove world-write permissions'
                });
            }
            
            // Check if executable and contains secrets
            if ((mode & 0o111) !== 0) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('key') || content.includes('secret') || content.includes('password')) {
                    issues.push({
                        file: file,
                        message: 'Executable file contains sensitive information',
                        suggestion: 'Move sensitive data to separate configuration files'
                    });
                }
            }
        } catch (error) {
            // Skip files that can't be accessed
        }
    });
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}

function checkDependencySecurity() {
    const issues = [];
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Check for known vulnerable packages (simplified check)
        const vulnerablePackages = [
            'lodash@<4.17.15',
            'moment@<2.29.1',
            'axios@<0.21.1'
        ];
        
        Object.keys(dependencies).forEach(pkg => {
            const version = dependencies[pkg];
            vulnerablePackages.forEach(vulnerable => {
                if (pkg.startsWith(vulnerable.split('@')[0])) {
                    issues.push({
                        file: 'package.json',
                        message: `Potentially vulnerable package: ${pkg}@${version}`,
                        suggestion: 'Update to latest stable version'
                    });
                }
            });
        });
    } catch (error) {
        issues.push({
            file: 'package.json',
            message: 'Could not analyze dependencies',
            suggestion: 'Ensure package.json is valid JSON'
        });
    }
    
    return {
        passed: issues.length === 0,
        issues: issues
    };
}

// Helper function to get project files
function getProjectFiles(extensions = ['*']) {
    const files = [];
    const projectRoot = process.cwd();
    
    function scanDirectory(dir) {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Skip node_modules and .git
                if (item !== 'node_modules' && item !== '.git' && item !== 'dist') {
                    scanDirectory(fullPath);
                }
            } else {
                // Check file extension
                const ext = path.extname(fullPath);
                if (extensions.includes('*') || extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        });
    }
    
    scanDirectory(projectRoot);
    return files;
}