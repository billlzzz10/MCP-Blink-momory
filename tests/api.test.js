import axios from 'axios';
import { fork } from 'child_process';
import { jest } from '@jest/globals';

const PORT = 7071; // Use a different port for testing
const BASE_URL = `http://localhost:${PORT}`;

let serverProcess;

beforeAll((done) => {
  serverProcess = fork('./src/server.js', [], {
    env: { ...process.env, PORT },
    silent: true, // Suppress child process console output
  });

  // Wait for the server to be ready. A better way would be to have the server send a message.
  setTimeout(() => {
    console.log("Server starting for tests...");
    done();
   }, 5000);
});

afterAll(() => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

describe('New API Endpoints', () => {

  const testMemoryItem = {
    type: "note",
    scope: "document",
    text: "This is a test note about hybrid search and BM25.",
    docHash: "doc_hash_123",
    tags: ["testing", "api"]
  };

  test('POST /memory/put - should create a memory item', async () => {
    const response = await axios.post(`${BASE_URL}/memory/put`, testMemoryItem);
    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    // The createEntities function returns an array of created items
    expect(response.data.result[0].text).toBe(testMemoryItem.text);
  });

  test('POST /memory/search - should perform a search', async () => {
    // Ensure the item is there before searching
    await axios.post(`${BASE_URL}/memory/put`, { type: "note", scope: "document", text: "Another item for searching." });

    const response = await axios.post(`${BASE_URL}/memory/search`, {
      query: "hybrid search",
      topK: 1
    });
    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    expect(Array.isArray(response.data.results)).toBe(true);
  });

  const testCacheItem = {
      key: "test:key1",
      scope: "chat",
      output: { message: "hello world" },
      ttl_ms: 60000
  };

  test('POST /cache/set and /cache/get - should set and get a cache item', async () => {
    // Set item
    const setResponse = await axios.post(`${BASE_URL}/cache/set`, testCacheItem);
    expect(setResponse.status).toBe(200);
    expect(setResponse.data.ok).toBe(true);
    expect(setResponse.data.result.status).toBe('cached');

    // Get item
    const getResponse = await axios.post(`${BASE_URL}/cache/get`, { key: testCacheItem.key, scope: testCacheItem.scope });
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.ok).toBe(true);
    expect(getResponse.data.result.output.message).toBe("hello world");
  });

  test('POST /runlog/put - should store a run log', async () => {
    const runlogItem = {
        phase: "generate",
        status: "ok",
        message: "Test log entry"
    };
    const response = await axios.post(`${BASE_URL}/runlog/put`, runlogItem);
    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    expect(response.data.result.id).toBeDefined();
    expect(response.data.result.message).toBe("Test log entry");
  });

  test('POST /stats/query - should retrieve stats', async () => {
    const response = await axios.post(`${BASE_URL}/stats/query`, {
        type: "token_usage"
    });
    expect(response.status).toBe(200);
    expect(response.data.ok).toBe(true);
    expect(response.data.result).toHaveProperty('tokens_in');
    expect(response.data.result).toHaveProperty('tokens_out');
  });

});
