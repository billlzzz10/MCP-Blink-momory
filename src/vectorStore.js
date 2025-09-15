import fs from 'fs';
import path from 'path';
import { paths } from './config.js';
import { L2, cosine } from './utils.js';

function collectionPath(name) {
  return path.join(paths.storeBase, `${name}.json`);
}

function ensureDir() {
  if (!fs.existsSync(paths.storeBase)) fs.mkdirSync(paths.storeBase, { recursive: true });
}

function loadCollection(name) {
  try {
    const p = collectionPath(name);
    if (!fs.existsSync(p)) return { items: [] };
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { items: [] };
  }
}

function saveCollection(name, col) {
  ensureDir();
  const p = collectionPath(name);
  fs.writeFileSync(p, JSON.stringify(col, null, 2));
}

function embed(text = '') {
  const v = [0, 0, 0];
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    v[0] += c;
    v[1] += c * (i + 1);
    v[2] += (c % 7) * (i + 1);
  }
  return L2(v);
}

export function upsert(collection, items) {
  if (!collection || !Array.isArray(items)) throw new Error('collection and items required');
  const col = loadCollection(collection);
  col.items = col.items || [];
  for (const it of items) {
    const idx = col.items.findIndex(x => String(x.id) === String(it.id));
    const doc = {
      id: it.id,
      text: it.text || '',
      vec: embed(it.text || ''),
      metadata: it.metadata || {}
    };
    if (idx >= 0) col.items[idx] = doc; else col.items.push(doc);
  }
  saveCollection(collection, col);
  return { count: items.length };
}

export function query(collection, queryText, k = 5) {
  const col = loadCollection(collection);
  const qv = embed(queryText || '');
  const scored = (col.items || []).map(it => ({
    id: it.id,
    text: it.text,
    metadata: it.metadata,
    score: cosine(qv, it.vec)
  })).sort((a, b) => b.score - a.score).slice(0, k);
  return scored;
}

export function stats(collection) {
  const col = loadCollection(collection);
  return { collection, count: (col.items || []).length };
}

export function listCollections() {
  if (!fs.existsSync(paths.storeBase)) return [];
  return fs.readdirSync(paths.storeBase)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
}

export function removeCollection(name) {
  const p = collectionPath(name);
  if (!fs.existsSync(p)) return { ok: false, error: 'not found' };
  fs.rmSync(p, { force: true });
  return { ok: true };
}

export function getById(collection, id) {
  const col = loadCollection(collection);
  const it = (col.items || []).find(x => String(x.id) === String(id));
  return it || null;
}

export { collectionPath };
