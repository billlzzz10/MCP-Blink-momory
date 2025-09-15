import express from 'express';
import { config } from './config.js';
import { upsert, query, stats, listCollections, removeCollection, getById } from './vectorStore.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/upsert', (req, res) => {
  try {
    const { collection, items } = req.body;
    const result = upsert(collection, items);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.post('/query', (req, res) => {
  try {
    const { collection, query: q, k } = req.body;
    const result = query(collection, q, k);
    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.get('/stats', (req, res) => {
  try {
    const { collection } = req.query;
    const result = stats(collection);
    res.json({ ok: true, stats: result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

app.get('/collections', (req, res) => res.json({ ok: true, collections: listCollections() }));

app.delete('/collections/:name', (req, res) => {
  const { name } = req.params;
  const result = removeCollection(name);
  res.json(result);
});

// Fetch single document by id (for MCP fetch)
app.get('/doc', (req, res) => {
  const { collection, id } = req.query;
  if (!collection || !id) return res.status(400).json({ ok: false, error: 'collection and id required' });
  const it = getById(collection, id);
  if (!it) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, doc: { id: it.id, title: it.metadata?.title || `doc:${it.id}`, text: it.text, url: null, metadata: it.metadata || {} } });
});

const port = process.env.PORT ? Number(process.env.PORT) : (config.server?.port || 7070);
app.listen(port, () => {
  console.log(`[mcp-memory] server listening on http://localhost:${port}`);
});
