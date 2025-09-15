import express from 'express';
import { config } from './config.js';

// Import the new modules and core functions
// Note: cache_manager, runlog_manager, and stats_manager will be created in later steps.
// For now, we will use placeholder objects.
import * as MemoryGraph from '../modules/memory_graph/index.js';
import * as CacheManager from '../modules/cache_manager.js';
import * as RunlogManager from '../modules/runlog_manager.js';
import * as StatsManager from '../modules/stats_manager.js';

// All real modules are now imported.


const app = express();
app.use(express.json({ limit: '2mb' })); // Increased limit for rich content

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: config.version });
});

// === Memory Endpoints ===

app.post('/memory/put', async (req, res) => {
  try {
    const memoryItem = req.body;
    // Basic validation based on spec
    if (!memoryItem.type || !memoryItem.scope || (!memoryItem.text && !memoryItem.rich)) {
      return res.status(400).json({ ok: false, error: 'Missing required fields: type, scope, and text/rich' });
    }
    // In a real implementation, we'd adapt this to the MemoryGraph's entity structure
    const result = await MemoryGraph.createEntities([memoryItem]);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/memory/batch_put', async (req, res) => {
    try {
        const { items } = req.body;
        if (!Array.isArray(items)) {
            return res.status(400).json({ ok: false, error: '`items` must be an array' });
        }
        const result = await MemoryGraph.createEntities(items);
        res.json({ ok: true, result: { count: result.length } });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/memory/search', async (req, res) => {
  try {
    const { query, topK, filters, hybrid } = req.body;
    if (!query) {
      return res.status(400).json({ ok: false, error: 'Missing required field: query' });
    }
    const results = await MemoryGraph.semanticSearch(query, { topK, filters, hybrid });
    res.json({ ok: true, results });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// === Cache Endpoints ===

app.post('/cache/get', async (req, res) => {
    try {
        const { key, scope } = req.body;
        if (!key || !scope) return res.status(400).json({ ok: false, error: '`key` and `scope` are required' });
        const result = await CacheManager.get(key, scope);
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/cache/set', async (req, res) => {
    try {
        const cacheRecord = req.body;
        if (!cacheRecord.key || !cacheRecord.scope || !cacheRecord.output) {
            return res.status(400).json({ ok: false, error: '`key`, `scope`, and `output` are required' });
        }
        const result = await CacheManager.set(cacheRecord);
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.post('/cache/evict', async (req, res) => {
    try {
        const options = req.body;
        const result = await CacheManager.evict(options);
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// === Runlog Endpoint ===

app.post('/runlog/put', async (req, res) => {
    try {
        const runlogItem = req.body;
        if (!runlogItem.phase || !runlogItem.status) {
            return res.status(400).json({ ok: false, error: '`phase` and `status` are required' });
        }
        const result = await RunlogManager.put(runlogItem);
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// === Stats Endpoint ===

app.post('/stats/query', async (req, res) => {
    try {
        const query = req.body;
        const result = await StatsManager.query(query);
        res.json({ ok: true, result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});


const port = process.env.PORT ? Number(process.env.PORT) : (config.server?.port || 7070);
app.listen(port, () => {
  console.log(`[mcp-memory] server listening on http://localhost:${port}`);
  // For integration testing, signal that the server is ready
  if (process.send) {
    process.send('listening');
  }
});
