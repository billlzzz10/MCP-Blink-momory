import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const COLLECTION_ROOT = path.join(process.cwd(), 'memory', 'collections');
const MAX_COLLECTION_NAME_LENGTH = 64;

fs.mkdirSync(COLLECTION_ROOT, { recursive: true });

const defaultCollection = { items: [], updatedAt: new Date(0).toISOString() };

function sanitizeName(name) {
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('collection name is required');
  }
  const cleaned = name.trim().toLowerCase().replace(/[^a-z0-9-_]+/g, '-');
  if (!cleaned) {
    throw new Error('collection name is invalid');
  }
  return cleaned.slice(0, MAX_COLLECTION_NAME_LENGTH);
}

function collectionPath(name) {
  return path.join(COLLECTION_ROOT, `${sanitizeName(name)}.json`);
}

function loadCollection(name) {
  try {
    const file = collectionPath(name);
    if (!fs.existsSync(file)) {
      return { ...defaultCollection, name: sanitizeName(name) };
    }
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.items)) {
      return { ...defaultCollection, name: sanitizeName(name) };
    }
    const items = parsed.items
      .filter((item) => item && typeof item === 'object')
      .map((item) => sanitizeItem(item));
    const updatedAt = typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString();
    return { items, updatedAt, name: sanitizeName(name) };
  } catch (error) {
    return { ...defaultCollection, name: sanitizeName(name) };
  }
}

function persistCollection(name, data) {
  const file = collectionPath(name);
  const payload = {
    items: data.items,
    updatedAt: data.updatedAt ?? new Date().toISOString(),
  };
  try {
    fs.writeFileSync(file, JSON.stringify(payload, null, 2), 'utf8');
  } catch (error) {
    throw new Error(`Failed to persist collection: ${error.message}`);
  }
  return payload;
}

function sanitizeItem(item) {
  const now = new Date().toISOString();
  const base = {
    id: typeof item.id === 'string' && item.id.trim() ? item.id.trim() : randomUUID(),
    text: typeof item.text === 'string' ? item.text : '',
    metadata: sanitizeMetadata(item.metadata),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : now,
    updatedAt: now,
  };

  if (Array.isArray(item.embedding)) {
    const embedding = item.embedding.map((value) => Number(value)).filter((value) => Number.isFinite(value));
    if (embedding.length > 0) {
      base.embedding = embedding;
    }
  }

  if (typeof item.source === 'string' && item.source.trim()) {
    base.source = item.source.trim();
  }

  return base;
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof key !== 'string') continue;
    const safeKey = key.replace(/[^a-zA-Z0-9-_]+/g, '_');
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      clean[safeKey] = value;
    }
  }
  return clean;
}

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .match(/[\p{L}\p{N}][\p{L}\p{N}_-]*/gu)
    ?.slice(0, 4096) ?? [];
}

function toFrequency(tokens) {
  const frequencies = new Map();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  }
  return frequencies;
}

function cosineSimilarityFromMaps(aMap, bMap) {
  if (!aMap.size || !bMap.size) return 0;
  let dot = 0;
  let aMagnitude = 0;
  let bMagnitude = 0;
  for (const [, value] of aMap) {
    aMagnitude += value * value;
  }
  for (const [, value] of bMap) {
    bMagnitude += value * value;
  }
  for (const [token, aValue] of aMap) {
    if (bMap.has(token)) {
      dot += aValue * bMap.get(token);
    }
  }
  if (!aMagnitude || !bMagnitude) return 0;
  return dot / (Math.sqrt(aMagnitude) * Math.sqrt(bMagnitude));
}

function scoreTextSimilarity(query, candidate) {
  const qTokens = tokenize(query);
  const cTokens = tokenize(candidate);
  const qMap = toFrequency(qTokens);
  const cMap = toFrequency(cTokens);
  return cosineSimilarityFromMaps(qMap, cMap);
}

export function upsert(collection, items) {
  if (!Array.isArray(items)) {
    throw new Error('items must be an array');
  }
  if (!items.length) {
    throw new Error('at least one item is required');
  }

  const name = sanitizeName(collection);
  const existing = loadCollection(name);
  const index = new Map(existing.items.map((item) => [item.id, item]));
  const now = new Date().toISOString();
  const storedItems = [];

  for (const item of items) {
    const sanitized = sanitizeItem(item);
    const previous = index.get(sanitized.id);
    sanitized.createdAt = previous?.createdAt ?? sanitized.createdAt;
    sanitized.updatedAt = now;
    index.set(sanitized.id, sanitized);
    storedItems.push(sanitized);
  }

  const nextItems = Array.from(index.values());
  persistCollection(name, { items: nextItems, updatedAt: now });
  return { collection: name, items: storedItems };
}

export function query(collection, q, k = 5) {
  if (typeof q !== 'string' || !q.trim()) {
    throw new Error('query must be a non-empty string');
  }
  const name = sanitizeName(collection);
  const { items } = loadCollection(name);
  const limit = Number.isInteger(k) ? Math.min(Math.max(k, 1), 50) : 5;
  const queryText = q.trim();

  const scored = items
    .map((item) => {
      const score = scoreTextSimilarity(queryText, item.text);
      return { ...item, score };
    })
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    collection: name,
    query: queryText,
    k: limit,
    results: scored,
  };
}

export function stats(collection) {
  const name = sanitizeName(collection);
  const data = loadCollection(name);
  return {
    collection: name,
    totalItems: data.items.length,
    updatedAt: data.updatedAt,
  };
}

export function listCollections() {
  const entries = fs.readdirSync(COLLECTION_ROOT, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name.replace(/\.json$/, ''))
    .sort();
}

export function removeCollection(collection) {
  const name = sanitizeName(collection);
  const file = collectionPath(name);
  if (!fs.existsSync(file)) {
    return false;
  }
  fs.unlinkSync(file);
  return true;
}

export function getById(collection, id) {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('id is required');
  }
  const name = sanitizeName(collection);
  const { items } = loadCollection(name);
  const match = items.find((item) => item.id === id.trim());
  if (!match) {
    throw new Error('document not found');
  }
  return { collection: name, item: match };
}
