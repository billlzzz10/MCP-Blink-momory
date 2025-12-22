#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class StructureValidator {
  constructor(schemaPath, projectRoot) {
    this.schemaPath = schemaPath;
    this.projectRoot = projectRoot;
    this.schema = null;
    this.errors = [];
    this.warnings = [];
  }

  loadSchema() {
    try {
      const schemaContent = fs.readFileSync(this.schemaPath, 'utf8');
      this.schema = yaml.load(schemaContent);
      console.log(`✅ Schema loaded: ${this.schema.name} v${this.schema.version}`);
    } catch (error) {
      throw new Error(`Failed to load schema: ${error.message}`);
    }
  }

  validateFolders() {
    console.log('\n📁 Validating folders...');
    
    // Check required folders
    this.schema.required_folders.forEach(folder => {
      const folderPath = path.join(this.projectRoot, folder);
      if (!fs.existsSync(folderPath)) {
        this.errors.push(`Missing required folder: ${folder}`);
      } else {
        console.log(`  ✅ ${folder}`);
      }
    });

    // Check optional folders
    if (this.schema.optional_folders) {
      this.schema.optional_folders.forEach(folder => {
        const folderPath = path.join(this.projectRoot, folder);
        if (fs.existsSync(folderPath)) {
          console.log(`  ✅ ${folder} (optional)`);
        } else {
          console.log(`  ⚠️  ${folder} (optional, missing)`);
        }
      });
    }
  }

  validateFiles() {
    console.log('\n📄 Validating files...');
    
    // Check required files
    this.schema.required_files.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${file}`);
      } else {
        console.log(`  ✅ ${file}`);
      }
    });

    // Check optional files
    if (this.schema.optional_files) {
      this.schema.optional_files.forEach(file => {
        const filePath = path.join(this.projectRoot, file);
        if (fs.existsSync(filePath)) {
          console.log(`  ✅ ${file} (optional)`);
        } else {
          console.log(`  ⚠️  ${file} (optional, missing)`);
        }
      });
    }
  }

  validateRules() {
    console.log('\n🔍 Validating rules...');
    
    if (!this.schema.validation_rules) return;

    // Check memory directory
    if (this.schema.validation_rules.memory) {
      const memoryPath = path.join(this.projectRoot, 'memory');
      if (fs.existsSync(memoryPath)) {
        const rule = this.schema.validation_rules.memory;
        if (rule.should_exist) {
          rule.should_exist.forEach(file => {
            const filePath = path.join(memoryPath, file);
            if (fs.existsSync(filePath)) {
              console.log(`  ✅ memory/${file} exists`);
            } else {
              this.warnings.push(`Memory file missing: ${file}`);
            }
          });
        }
      }
    }

    // Check file sizes
    if (this.schema.validation_rules.file_size_limits) {
      Object.entries(this.schema.validation_rules.file_size_limits).forEach(([file, limit]) => {
        const filePath = path.join(this.projectRoot, 'memory', file);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          const sizeInMB = stats.size / (1024 * 1024);
          const limitInMB = parseInt(limit.replace('MB', ''));
          
          if (sizeInMB > limitInMB) {
            this.warnings.push(`File ${file} (${sizeInMB.toFixed(2)}MB) exceeds limit (${limit})`);
          } else {
            console.log(`  ✅ ${file} size OK (${sizeInMB.toFixed(2)}MB < ${limit})`);
          }
        }
      });
    }
  }

  checkCoreServices() {
    console.log('\n🧠 Checking core services...');
    
    const coreServices = [
      'memory-graph/index.ts',
      'embedding-service/index.ts', 
      'auto-tag-service/index.ts',
      'memory0-service/index.ts',
      'system/index.ts'
    ];

    coreServices.forEach(service => {
      const servicePath = path.join(this.projectRoot, 'src/core', service);
      if (fs.existsSync(servicePath)) {
        const content = fs.readFileSync(servicePath, 'utf8');
        if (content.length > 100) { // Basic check for implementation
          console.log(`  ✅ ${service} implemented`);
        } else {
          this.warnings.push(`Core service ${service} appears empty`);
        }
      } else {
        this.errors.push(`Missing core service: ${service}`);
      }
    });
  }

  checkBuildOutput() {
    console.log('\n🔨 Checking build output...');
    
    const distPath = path.join(this.projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      const indexJs = path.join(distPath, 'index.js');
      if (fs.existsSync(indexJs)) {
        console.log('  ✅ Build output exists (dist/index.js)');
      } else {
        this.warnings.push('Build output missing - run npm run build');
      }
    } else {
      this.warnings.push('Dist folder missing - run npm run build');
    }
  }

  generateReport() {
    console.log('\n📊 VALIDATION REPORT');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All validations passed! Project structure is compliant.');
    } else {
      if (this.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        this.errors.forEach(error => console.log(`  • ${error}`));
      }
      
      if (this.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        this.warnings.forEach(warning => console.log(`  • ${warning}`));
      }
    }

    console.log(`\n📈 Summary: ${this.errors.length} errors, ${this.warnings.length} warnings`);
    
    return this.errors.length === 0;
  }

  validate() {
    try {
      this.loadSchema();
      this.validateFolders();
      this.validateFiles();
      this.validateRules();
      this.checkCoreServices();
      this.checkBuildOutput();
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }
}

// Run validation
const schemaPath = path.join(__dirname, 'structure.schema.yaml');
const projectRoot = __dirname;

const validator = new StructureValidator(schemaPath, projectRoot);
const isValid = validator.validate();

process.exit(isValid ? 0 : 1);