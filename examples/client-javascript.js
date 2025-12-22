// JavaScript Client Example for MCP Blink Memory JSON-RPC 2.0
const axios = require('axios');

class MCPBlinkMemoryClient {
  constructor(endpoint = 'http://localhost:7071') {
    this.endpoint = endpoint;
    this.requestId = 1;
  }

  async request(method, params = {}) {
    const payload = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId++
    };

    try {
      const response = await axios.post(this.endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      if (response.data.error) {
        throw new Error(`RPC Error: ${response.data.error.message}`);
      }
      
      return response.data.result;
    } catch (error) {
      if (error.response) {
        throw new Error(`API Error: ${error.response.data.error?.message || error.message}`);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  async healthCheck() {
    return this.request('healthCheck');
  }

  async createEntities(entities, options = {}) {
    return this.request('createEntities', { entities, options });
  }

  async semanticSearch(query, options = {}) {
    return this.request('semanticSearch', { query, options });
  }

  async createRelations(relations) {
    return this.request('createRelations', { relations });
  }

  async getGraphStats() {
    return this.request('getGraphStats');
  }

  async selfDescribe() {
    return this.request('selfDescribe');
  }
}

// Usage Example
async function main() {
  const client = new MCPBlinkMemoryClient();

  try {
    // Health check
    const health = await client.healthCheck();
    console.log('Server status:', health.status);
    console.log('Version:', health.version);

    // Create entities
    const result = await client.createEntities([
      {
        name: "AI Research Lab",
        type: "organization",
        observations: [
          "Laboratory focused on artificial intelligence research",
          "Located in Bangkok, Thailand"
        ],
        metadata: {
          founded: 2020,
          employees: 25
        }
      }
    ], { autoTag: true, linkToMemory0: true });

    console.log(`Created ${result.count} entities`);
    result.data.forEach(entity => {
      console.log(`- ${entity.name}: ${entity.autoTags.join(', ') || 'no tags'}`);
    });

    // Graph stats
    const stats = await client.getGraphStats();
    console.log('Graph stats:', stats);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (require.main === module) {
  main();
}

module.exports = MCPBlinkMemoryClient;