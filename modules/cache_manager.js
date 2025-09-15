// modules/cache_manager.js - Manages the three-layer caching system.

import { LRUCache } from 'lru-cache';

// Configuration for the caches
const options = {
  // Chat Cache: smaller, shorter TTL
  chat: {
    maxSize: 50 * 1024 * 1024, // 50 MB
    ttl: 1000 * 60 * 30, // 30 minutes
    sizeCalculation: (value, key) => Buffer.byteLength(JSON.stringify(value)) + Buffer.byteLength(key),
  },
  // Document Cache: larger, longer TTL
  document: {
    maxSize: 200 * 1024 * 1024, // 200 MB
    ttl: 1000 * 60 * 60 * 2, // 2 hours
    sizeCalculation: (value, key) => Buffer.byteLength(JSON.stringify(value)) + Buffer.byteLength(key),
  },
  // Editor/Board Cache: medium size, medium TTL
  editor: {
    maxSize: 100 * 1024 * 1024, // 100 MB
    ttl: 1000 * 60 * 60 * 1, // 1 hour
    sizeCalculation: (value, key) => Buffer.byteLength(JSON.stringify(value)) + Buffer.byteLength(key),
  },
};

const caches = {
  chat: new LRUCache(options.chat),
  document: new LRUCache(options.document),
  editor: new LRUCache(options.editor),
};

function getCacheByScope(scope) {
    if (!caches[scope]) {
        throw new Error(`Invalid cache scope: ${scope}. Must be one of [chat, document, editor].`);
    }
    return caches[scope];
}

/**
 * Retrieves an item from the cache.
 * @param {string} key - The key of the item to retrieve.
 * @param {string} scope - The cache scope to use.
 * @returns {Promise<object|undefined>} The cached item or undefined if not found.
 */
export async function get(key, scope) {
  const cache = getCacheByScope(scope);
  return cache.get(key);
}

/**
 * Adds an item to the cache.
 * @param {object} record - The cache record to add.
 * @returns {Promise<object>} The result of the operation.
 */
export async function set(record) {
  const { key, scope, output, usage, ttl_ms, version } = record;
  const cache = getCacheByScope(scope);

  const value = { output, usage, version, createdAt: Date.now() };
  const size = options[scope].sizeCalculation(value, key);

  cache.set(key, value, { ttl: ttl_ms, size });

  return { key, status: 'cached', size };
}

/**
 * Evicts items from the cache.
 * @param {object} options - Eviction options (e.g., { key, prefix, scope }).
 * @returns {Promise<object>} The result of the eviction.
 */
export async function evict(options) {
  const { key, prefix, scope } = options;
  if (!scope) throw new Error('`scope` is required for eviction.');
  const cache = getCacheByScope(scope);
  let evictedCount = 0;

  if (key) {
    if (cache.delete(key)) {
      evictedCount = 1;
    }
  } else if (prefix) {
    for (const k of cache.keys()) {
      if (k.startsWith(prefix)) {
        cache.delete(k);
        evictedCount++;
      }
    }
  } else {
    // Evict all from this scope
    evictedCount = cache.size;
    cache.clear();
  }

  return { scope, evicted: evictedCount };
}

/**
 * Gets stats for all caches.
 * @returns {Promise<object>} An object containing stats for each cache.
 */
export async function getStats() {
    const stats = {};
    for (const scope in caches) {
        const cache = caches[scope];
        stats[scope] = {
            size: cache.size,
            maxSize: cache.maxSize,
            ttl: cache.ttl,
            itemCount: cache.size,
        };
    }
    return stats;
}
