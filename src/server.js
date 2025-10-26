import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {
  upsert as vsUpsert,
  query as vsQuery,
  stats as vsStats,
  listCollections,
  removeCollection,
  getById,
} from './vectorStore.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-origin' } }));
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const MAX_ITEM_LENGTH = 50_000;
const MAX_QUERY_LENGTH = 5_000;

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return parsed;
}

function validateItems(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error('collection and items required');
  }
  if (items.some((item) => typeof item !== 'object' || !item)) {
    throw new Error('items must contain objects');
  }
  if (items.some((item) => typeof item.text !== 'string' || !item.text.trim())) {
    throw new Error('each item requires non-empty text');
  }
  if (items.some((item) => item.text.length > MAX_ITEM_LENGTH)) {
    throw new Error('item too large');
  }
}

app.post('/upsert', (req, res) => {
  try {
    const { collection, items } = req.body ?? {};
    if (typeof collection !== 'string' || !collection.trim()) {
      throw new Error('collection and items required');
    }
    validateItems(items);
    const result = vsUpsert(collection, items);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post('/query', (req, res) => {
  try {
    const { collection, query: q, k = 5 } = req.body ?? {};
    if (typeof collection !== 'string' || !collection.trim() || typeof q !== 'string' || !q.trim()) {
      throw new Error('collection and query required');
    }
    if (q.length > MAX_QUERY_LENGTH) {
      throw new Error('query too long');
    }
    const limit = Math.min(Math.max(toInt(k, 5), 1), 50);
    const result = vsQuery(collection, q, limit);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get('/doc', (req, res) => {
  try {
    const { collection, id } = req.query;
    if (typeof collection !== 'string' || !collection.trim() || typeof id !== 'string' || !id.trim()) {
      throw new Error('collection and id required');
    }
    const result = getById(collection, id);
    res.json({ ok: true, result });
  } catch (error) {
    res.status(404).json({ ok: false, error: error.message });
  }
});

app.get('/stats', (req, res) => {
  try {
    const { collection } = req.query;
    if (typeof collection !== 'string' || !collection.trim()) {
      throw new Error('collection is required');
    }
    const result = vsStats(collection);
    res.json({ ok: true, stats: result });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.get('/collections', (_req, res) => {
  try {
    const collections = listCollections();
    res.json({ ok: true, collections });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.delete('/collections/:name', (req, res) => {
  try {
    const { name } = req.params;
    if (typeof name !== 'string' || !name.trim()) {
      throw new Error('name is required');
    }
    const removed = removeCollection(name);
    res.json({ ok: true, removed });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

const PORT = toInt(process.env.PORT, 3000);
const HOST = process.env.HOST || '127.0.0.1';

export function startServer() {
  return app.listen(PORT, HOST, () => {
    console.log(`memory server listening on http://${HOST}:${PORT}`);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
