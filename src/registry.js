import { config } from './config.js';

export function listRegistry() {
  return config.embedding.registry || [];
}

export function resolveModel(name) {
  const list = listRegistry();
  const lower = name.toLowerCase();
  const model = list.find(m => m.name.toLowerCase() === lower || (m.alias || []).some(a => a.toLowerCase() === lower));
  if (model) return model;
  const suggestions = list.map(m => m.name);
  const err = new Error(`Model "${name}" not found. Suggestions: ${suggestions.slice(0, 5).join(', ') || 'none'}`);
  err.code = 'MODELNOTFOUND';
  throw err;
}
