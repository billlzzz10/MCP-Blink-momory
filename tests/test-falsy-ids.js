const axios = require('axios');

async function testFalsyIds() {
  const baseURL = 'http://localhost:7071';
  
  console.log('🧪 Testing Falsy JSON-RPC IDs...\n');

  const testCases = [
    { id: 0, description: 'ID = 0' },
    { id: '', description: 'ID = empty string' },
    { id: false, description: 'ID = false' },
    { id: null, description: 'ID = null' },
    { description: 'No ID (undefined)' }
  ];

  for (const testCase of testCases) {
    try {
      const payload = {
        jsonrpc: '2.0',
        method: 'healthCheck',
        params: {}
      };
      
      if (testCase.hasOwnProperty('id')) {
        payload.id = testCase.id;
      }

      const response = await axios.post(baseURL, payload);
      
      console.log(`✅ ${testCase.description}:`);
      console.log(`   Request ID: ${JSON.stringify(testCase.id)}`);
      console.log(`   Response ID: ${JSON.stringify(response.data.id)}`);
      console.log(`   Match: ${JSON.stringify(testCase.id) === JSON.stringify(response.data.id)}\n`);
      
    } catch (error) {
      console.log(`❌ ${testCase.description} Failed: ${error.message}\n`);
    }
  }
}

testFalsyIds();