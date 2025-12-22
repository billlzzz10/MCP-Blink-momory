const axios = require('axios');

async function testJSONRPC() {
  const baseURL = 'http://localhost:7071';
  
  console.log('🧪 Testing MCP Blink Memory JSON-RPC Server...\n');

  // Test 1: Health Check
  try {
    const healthResponse = await axios.post(baseURL, {
      jsonrpc: '2.0',
      method: 'healthCheck',
      params: {},
      id: 1
    });
    
    console.log('✅ Health Check:', healthResponse.data);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
  }

  // Test 2: Create Entities
  try {
    const entityResponse = await axios.post(baseURL, {
      jsonrpc: '2.0',
      method: 'createEntities',
      params: {
        entities: [{
          name: 'Test Lab',
          type: 'organization',
          observations: ['AI research lab']
        }]
      },
      id: 2
    });
    
    console.log('✅ Create Entities:', entityResponse.data);
  } catch (error) {
    console.log('❌ Create Entities Failed:', error.message);
  }

  // Test 3: Graph Stats
  try {
    const statsResponse = await axios.post(baseURL, {
      jsonrpc: '2.0',
      method: 'getGraphStats',
      params: {},
      id: 3
    });
    
    console.log('✅ Graph Stats:', statsResponse.data);
  } catch (error) {
    console.log('❌ Graph Stats Failed:', error.message);
  }
}

testJSONRPC();