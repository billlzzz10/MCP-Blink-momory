// MCP Test Automation Script for CI/CD
// Run with: node tests/mcp_test_automation.js
// Requires: npx @modelcontextprotocol/server-memory, npx @upstash/context7-mcp, npx @e2b/mcp-server
// Output: JSON report to stdout for CI/CD integration

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class MCPTestAutomation {
  constructor(reportPath = 'mcp_test_results.json') {
    this.reportPath = reportPath;
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      success: 0,
      total: 0
    };
  }

  logTest(name, status, details = {}) {
    const test = { name, status, details, timestamp: new Date().toISOString() };
    this.results.tests.push(test);
    if (status === 'success') this.results.success++;
    this.results.total++;
    console.log(JSON.stringify(test));
  }

  async runTest(name, fn) {
    try {
      await fn();
      this.logTest(name, 'success');
    } catch (error) {
      this.logTest(name, 'failed', { error: error.message });
    }
  }

  // Helper to execute MCP tool via spawn (simulate Kilo chat trigger)
  async executeTool(server, tool, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('npx', ['-y', `@modelcontextprotocol/server-${server}`, '--json'], { 
        stdio: 'pipe',
        timeout: 10000 // 10s timeout
      });
      proc.stdin.write(JSON.stringify({ tool, args }) + '\n');
      proc.stdin.end();
      let output = '';
      proc.stdout.on('data', (data) => output += data);
      proc.on('close', (code) => {
        if (code === 0) resolve(JSON.parse(output));
        else reject(new Error('Tool execution failed'));
      });
    });
  }

  // Test 1: Basic Memory Entity Creation
  async testMemoryCreate() {
    await this.executeTool('memory', 'create_entities', {
      entities: [{ name: 'CITestUser', entityType: 'user', observations: ['CI test'] }]
    });
    const searchResult = await this.executeTool('memory', 'search_nodes', { query: 'CITestUser' });
    if (searchResult.entities.length > 0) {
      await this.executeTool('memory', 'delete_entities', { entityNames: ['CITestUser'] });
      return true;
    }
    return false;
  }

  // Test 2: Context7 Resolve and Docs
  async testContext7() {
    const libId = await this.executeTool('context7', 'resolve-library-id', { libraryName: 'react' });
    if (libId.length > 0) {
      const docs = await this.executeTool('context7', 'get-library-docs', {
        context7CompatibleLibraryID: libId[0].id,
        topic: 'hooks'
      });
      return docs.length > 0;
    }
    return false;
  }

  // Test 3: e2b Code Execution
  async testE2B() {
    const result = await this.executeTool('e2b', 'run_code', {
      code: "print('CI e2b test')"
    });
    return result.logs.stdout.includes('CI e2b test');
  }

  // Test 4: Filesystem Basic
  async testFilesystem() {
    const writePath = path.join(__dirname, 'ci_temp.txt');
    fs.writeFileSync(writePath, 'CI test');
    const readResult = fs.readFileSync(writePath, 'utf8');
    fs.unlinkSync(writePath);
    return readResult === 'CI test';
  }

  // Integration Test: e2b generate → memory create → search
  async testE2BToMemory() {
    const e2bResult = await this.executeTool('e2b', 'run_code', {
      code: "import random\nprint(random.randint(1,10))"
    });
    const value = parseInt(e2bResult.logs.stdout.trim());
    await this.executeTool('memory', 'create_entities', {
      entities: [{ name: `CITestValue${value}`, entityType: 'number', observations: [`Generated: ${value}`] }]
    });
    const search = await this.executeTool('memory', 'search_nodes', { query: `CITestValue${value}` });
    await this.executeTool('memory', 'delete_entities', { entityNames: [`CITestValue${value}`] });
    return search.entities.length > 0;
  }

  async runAll() {
    await this.runTest('Memory Create & Search', async () => {
      const created = await this.testMemoryCreate();
      if (!created) throw new Error('Memory test failed');
    });

    await this.runTest('Context7 Resolve & Docs', this.testContext7);

    await this.runTest('e2b Execution', this.testE2B);

    await this.runTest('Filesystem Basic', this.testFilesystem);

    await this.runTest('e2b to Memory Integration', this.testE2BToMemory);

    // Write final report
    fs.writeFileSync(this.reportPath, JSON.stringify(this.results, null, 2));
    console.log(`Test run complete. Results saved to ${this.reportPath}`);
    process.exit(this.results.success === this.results.total ? 0 : 1);
  }
}

// Run the tests
const tester = new MCPTestAutomation('tests/mcp_ci_results.json');
tester.runAll().catch(console.error);