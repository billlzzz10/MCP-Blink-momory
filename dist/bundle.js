var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// modules/memory_graph/index.js
var memory_graph_exports = {};
__export(memory_graph_exports, {
  addObservations: () => addObservations,
  createEntities: () => createEntities,
  createRelations: () => createRelations,
  deleteEntities: () => deleteEntities,
  deleteObservations: () => deleteObservations,
  deleteRelations: () => deleteRelations,
  ensureStore: () => ensureStore,
  getAllTags: () => getAllTags,
  getLineage: () => getLineage,
  openNodes: () => openNodes,
  readGraph: () => readGraph,
  searchByTag: () => searchByTag,
  searchNodes: () => searchNodes,
  semanticSearch: () => semanticSearch
});
import fs2 from "fs/promises";
import path2 from "path";
import crypto from "crypto";

// modules/embedding_service/index.js
var embedding_service_exports = {};
__export(embedding_service_exports, {
  clearCache: () => clearCache,
  cosineSimilarity: () => cosineSimilarity,
  embedTexts: () => embedTexts,
  getCacheStats: () => getCacheStats,
  healthCheck: () => healthCheck,
  initialize: () => initialize,
  normalizeVector: () => normalizeVector
});
import fs from "fs/promises";
import path from "path";
var CONFIG = {
  mode: process.env.EMBEDDING_MODE || "mock",
  model: process.env.EMBEDDING_MODEL || "text-embedding-ada-002",
  dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 384,
  maxTokens: 8191,
  batchSize: 10,
  cache: process.env.EMBEDDING_CACHE !== "false",
  openaiApiKey: process.env.OPENAI_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
  timeout: 3e4
};
var EMBEDDING_CACHE_PATH = path.join(process.cwd(), "memory", "embedding_cache.json");
var MODEL_METADATA_PATH = path.join(process.cwd(), "memory", "embedding_metadata.json");
var embeddingCache = /* @__PURE__ */ new Map();
var cacheStats = {
  total: 0,
  hits: 0,
  misses: 0,
  size: 0
};
async function initialize() {
  console.log(`\u{1F517} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 Embedding Service (mode: ${CONFIG.mode}, dimensions: ${CONFIG.dimensions})`);
  try {
    const cacheDir = path.dirname(EMBEDDING_CACHE_PATH);
    await fs.mkdir(cacheDir, { recursive: true });
    await loadCache();
    await ensureMetadata();
    validateConfig();
    console.log(`\u2705 Embedding service \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 - Cache: ${cacheStats.total} embeddings`);
    return {
      status: "ready",
      mode: CONFIG.mode,
      cacheSize: cacheStats.total,
      dimensions: CONFIG.dimensions
    };
  } catch (error) {
    console.error("\u274C Error initializing embedding service:", error);
    throw new Error(`Embedding service initialization failed: ${error.message}`);
  }
}
async function loadCache() {
  try {
    const data = await fs.readFile(EMBEDDING_CACHE_PATH, "utf8");
    if (data.trim()) {
      const cache = JSON.parse(data);
      cacheStats.total = Object.keys(cache).length;
      const recentEntries = Object.entries(cache).sort(([, a], [, b]) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 1e4);
      recentEntries.forEach(([text, entry]) => {
        embeddingCache.set(text, entry.vector);
      });
      console.log(`\u{1F4C2} \u0E42\u0E2B\u0E25\u0E14 ${recentEntries.length}/${cacheStats.total} embeddings \u0E08\u0E32\u0E01 cache`);
    }
  } catch (error) {
    console.log("\u{1F4DD} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 embedding cache \u0E43\u0E2B\u0E21\u0E48");
  }
}
async function saveCache() {
  if (!CONFIG.cache) return;
  try {
    const cacheData = Array.from(embeddingCache.entries()).map(([text, vector]) => ({
      text: text.substring(0, 100),
      vector,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      model: CONFIG.model,
      dimensions: CONFIG.dimensions
    }));
    cacheData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentCache = cacheData.slice(0, 5e3);
    await fs.writeFile(EMBEDDING_CACHE_PATH, JSON.stringify(recentCache, null, 2), "utf8");
    cacheStats.size = JSON.stringify(recentCache).length / 1024;
    console.log(`\u{1F4BE} \u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 cache: ${recentCache.length} embeddings (${cacheStats.size.toFixed(1)} KB)`);
  } catch (error) {
    console.error("\u26A0\uFE0F  \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 embedding cache:", error.message);
  }
}
async function ensureMetadata() {
  try {
    let metadata = {
      model: CONFIG.model,
      dimensions: CONFIG.dimensions,
      mode: CONFIG.mode,
      initializedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0.0",
      cacheEnabled: CONFIG.cache
    };
    try {
      const data = await fs.readFile(MODEL_METADATA_PATH, "utf8");
      if (data.trim()) {
        const existing = JSON.parse(data);
        metadata = { ...existing, ...metadata, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      }
    } catch (error) {
    }
    await fs.writeFile(MODEL_METADATA_PATH, JSON.stringify(metadata, null, 2), "utf8");
    return metadata;
  } catch (error) {
    console.error("\u26A0\uFE0F  \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 model metadata:", error);
  }
}
function validateConfig() {
  if (CONFIG.mode === "openai" && !CONFIG.openaiApiKey) {
    console.warn("\u26A0\uFE0F  OpenAI mode: API key \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 (EMBEDDING_MODE=openai, OPENAI_API_KEY)");
  }
  if (CONFIG.mode === "huggingface" && !CONFIG.huggingfaceApiKey) {
    console.warn("\u26A0\uFE0F  HuggingFace mode: API key \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32 (EMBEDDING_MODE=huggingface, HUGGINGFACE_API_KEY)");
  }
  if (CONFIG.dimensions < 1 || CONFIG.dimensions > 4096) {
    console.warn(`\u26A0\uFE0F  Dimensions ${CONFIG.dimensions} \u0E2D\u0E22\u0E39\u0E48\u0E19\u0E2D\u0E01\u0E0A\u0E48\u0E27\u0E07\u0E17\u0E35\u0E48\u0E41\u0E19\u0E30\u0E19\u0E33 (1-4096)`);
  }
}
async function embedTexts(texts, options = {}) {
  const {
    useCache = CONFIG.cache,
    batchSize = CONFIG.batchSize,
    normalize = true,
    truncate = true
  } = options;
  console.log(`\u{1F504} Embedding ${texts.length} texts (batch: ${batchSize}, cache: ${useCache})`);
  try {
    const processedTexts = texts.map((text) => {
      if (typeof text !== "string") {
        console.warn("\u26A0\uFE0F  Non-string text detected, converting to string");
        text = String(text);
      }
      if (truncate && text.length > CONFIG.maxTokens * 4) {
        const truncated = text.substring(0, CONFIG.maxTokens * 4);
        console.log(`\u2702\uFE0F  Truncate text \u0E08\u0E32\u0E01 ${text.length} \u0E40\u0E1B\u0E47\u0E19 ${truncated.length} chars`);
        return truncated;
      }
      return text.trim();
    }).filter((text) => text.length > 0);
    if (processedTexts.length === 0) {
      return [];
    }
    const cacheHits = [];
    const cacheMisses = [];
    if (useCache) {
      for (const text of processedTexts) {
        if (embeddingCache.has(text)) {
          cacheHits.push({ text, vector: embeddingCache.get(text) });
          cacheStats.hits++;
        } else {
          cacheMisses.push(text);
          cacheStats.misses++;
        }
      }
    } else {
      cacheMisses.push(...processedTexts);
    }
    console.log(`\u{1F4CA} Cache: ${cacheHits.length} hits, ${cacheMisses.length} misses`);
    const newEmbeddings = await generateEmbeddings(cacheMisses, { batchSize, normalize });
    newEmbeddings.forEach(({ text, vector }) => {
      embeddingCache.set(text, vector);
      cacheStats.total++;
    });
    const allEmbeddings = [
      ...cacheHits.map((hit) => ({ text: hit.text, vector: hit.vector, source: "cache" })),
      ...newEmbeddings.map((emb) => ({ text: emb.text, vector: emb.vector, source: "generated" }))
    ];
    if (newEmbeddings.length > 0 && cacheStats.total % 100 === 0) {
      await saveCache();
    }
    const vectors = allEmbeddings.map((emb) => emb.vector);
    console.log(`\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 embeddings: ${vectors.length} vectors (${CONFIG.dimensions} dims)`);
    return vectors;
  } catch (error) {
    console.error("\u274C Error generating embeddings:", error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}
async function generateEmbeddings(texts, options = {}) {
  const { batchSize = CONFIG.batchSize, normalize = true } = options;
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`\u{1F4E6} \u0E1B\u0E23\u0E30\u0E21\u0E27\u0E25\u0E1C\u0E25 batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} (${batch.length} texts)`);
    try {
      const batchVectors = await generateBatchEmbeddings(batch);
      const processedVectors = normalize ? batchVectors.map((vec) => normalizeVector(vec)) : batchVectors;
      batch.forEach((text, index) => {
        results.push({
          text,
          vector: processedVectors[index],
          dimensions: CONFIG.dimensions,
          model: CONFIG.model
        });
      });
    } catch (batchError) {
      console.error(`\u274C Error in batch ${Math.floor(i / batchSize) + 1}:`, batchError);
      if (CONFIG.mode === "mock" || CONFIG.mode === "production") {
        console.log("\u{1F504} \u0E43\u0E0A\u0E49 fallback mock vectors \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A batch \u0E19\u0E35\u0E49");
        batch.forEach((text) => {
          const mockVector = generateMockVector(text);
          results.push({
            text,
            vector: mockVector,
            dimensions: CONFIG.dimensions,
            model: `${CONFIG.model}-fallback`
          });
        });
      } else {
        throw batchError;
      }
    }
  }
  return results;
}
async function generateBatchEmbeddings(texts) {
  switch (CONFIG.mode) {
    case "openai":
      return await callOpenAIEmbeddings(texts);
    case "huggingface":
      return await callHuggingFaceEmbeddings(texts);
    case "mock":
    default:
      return texts.map((text) => generateMockVector(text));
  }
}
async function callOpenAIEmbeddings(texts) {
  if (!CONFIG.openaiApiKey) {
    throw new Error("OPENAI_API_KEY \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32");
  }
  try {
    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: CONFIG.openaiApiKey,
      timeout: CONFIG.timeout
    });
    const response = await openai.embeddings.create({
      model: CONFIG.model,
      input: texts,
      encoding_format: "float"
    });
    return response.data.map((data, index) => ({
      text: texts[index],
      vector: data.embedding,
      dimensions: data.embedding.length
    }));
  } catch (error) {
    console.error("\u274C OpenAI API error:", error);
    if (error.status === 429) {
      console.log("\u23F3 Rate limit - \u0E43\u0E0A\u0E49 fallback mock");
      return texts.map((text) => generateMockVector(text));
    }
    throw new Error(`OpenAI embedding failed: ${error.message}`);
  }
}
async function callHuggingFaceEmbeddings(texts) {
  if (!CONFIG.huggingfaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY \u0E44\u0E21\u0E48\u0E44\u0E14\u0E49\u0E15\u0E31\u0E49\u0E07\u0E04\u0E48\u0E32");
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    const response = await fetch("https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.huggingfaceApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: texts }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.map((embedding, index) => ({
      text: texts[index],
      vector: embedding,
      dimensions: embedding.length
    }));
  } catch (error) {
    console.error("\u274C HuggingFace API error:", error);
    if (error.name === "AbortError") {
      console.log("\u23F3 API timeout - \u0E43\u0E0A\u0E49 fallback mock");
      return texts.map((text) => generateMockVector(text));
    }
    throw new Error(`HuggingFace embedding failed: ${error.message}`);
  }
}
function generateMockVector(text) {
  const dimensions = CONFIG.dimensions;
  const vector = new Float32Array(dimensions);
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  for (let i = 0; i < dimensions; i++) {
    seed = seed * 1103515245 + 12345 & 2147483647;
    const value = seed / 2147483647 * 2 - 1;
    const textInfluence = Math.min(text.length / 1e3, 1);
    vector[i] = value * (0.1 + textInfluence * 0.9);
  }
  return Array.from(vector);
}
function normalizeVector(vector) {
  if (!vector || !Array.isArray(vector)) {
    throw new Error("Invalid vector for normalization");
  }
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude === 0) {
    return vector.map(() => 0);
  }
  return vector.map((val) => val / magnitude);
}
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimensions");
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const magnitudeA = Math.sqrt(normA);
  const magnitudeB = Math.sqrt(normB);
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }
  return dotProduct / (magnitudeA * magnitudeB);
}
async function clearCache() {
  console.log("\u{1F9F9} \u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C embedding cache");
  try {
    embeddingCache.clear();
    cacheStats = { total: 0, hits: 0, misses: 0, size: 0 };
    try {
      await fs.unlink(EMBEDDING_CACHE_PATH);
      console.log("\u{1F4BE} \u0E25\u0E1A disk cache");
    } catch (error) {
    }
    console.log("\u2705 Embedding cache cleared");
    return true;
  } catch (error) {
    console.error("\u274C Error clearing cache:", error);
    throw error;
  }
}
async function getCacheStats() {
  return {
    totalEmbeddings: cacheStats.total,
    cacheHits: cacheStats.hits,
    cacheMisses: cacheStats.misses,
    hitRate: cacheStats.total > 0 ? (cacheStats.hits / cacheStats.total).toFixed(4) : 0,
    approximateSizeKB: cacheStats.size,
    memoryUsage: process.memoryUsage(),
    config: {
      mode: CONFIG.mode,
      model: CONFIG.model,
      dimensions: CONFIG.dimensions,
      cacheEnabled: CONFIG.cache
    }
  };
}
async function healthCheck() {
  return {
    module: "embedding_service",
    status: "ready",
    mode: CONFIG.mode,
    model: CONFIG.model,
    dimensions: CONFIG.dimensions,
    cache: {
      total: cacheStats.total,
      hitRate: cacheStats.total > 0 ? (cacheStats.hits / cacheStats.total).toFixed(4) : "N/A",
      sizeKB: cacheStats.size.toFixed(1)
    },
    config: {
      cacheEnabled: CONFIG.cache,
      batchSize: CONFIG.batchSize,
      maxTokens: CONFIG.maxTokens
    },
    api: {
      openaiKeySet: !!CONFIG.openaiApiKey,
      huggingfaceKeySet: !!CONFIG.huggingfaceApiKey
    }
  };
}

// modules/memory_graph/index.js
var MEMORY_STORE_PATH = path2.join(process.cwd(), "memory", "memory_store.json");
var GRAPH_METADATA_PATH = path2.join(process.cwd(), "memory", "graph_metadata.json");
var graphCache = {
  entities: [],
  entityMap: /* @__PURE__ */ new Map(),
  // id -> entity, name -> entity for O(1) lookup
  relations: [],
  relationMap: /* @__PURE__ */ new Map(),
  // signature -> relation for O(1) lookup
  observations: /* @__PURE__ */ new Map(),
  // entityName -> observations array
  tags: /* @__PURE__ */ new Map(),
  // tag -> entities array
  metadata: {
    totalEntities: 0,
    totalRelations: 0,
    totalObservations: 0,
    lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
    version: "1.0.0"
  }
};
async function ensureStore() {
  console.log("\u{1F9E0} \u0E40\u0E15\u0E23\u0E35\u0E22\u0E21 Knowledge Graph Memory Store...");
  try {
    const memoryDir = path2.dirname(MEMORY_STORE_PATH);
    await fs2.mkdir(memoryDir, { recursive: true });
    let memoryStore = [];
    try {
      const data = await fs2.readFile(MEMORY_STORE_PATH, "utf8");
      if (data.trim()) {
        memoryStore = JSON.parse(data);
        console.log(`\u{1F4C2} \u0E42\u0E2B\u0E25\u0E14 ${memoryStore.length} entities \u0E08\u0E32\u0E01 memory store`);
      }
    } catch (error) {
      console.log("\u{1F4DD} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 memory store \u0E43\u0E2B\u0E21\u0E48");
    }
    let metadata = graphCache.metadata;
    try {
      const metaData = await fs2.readFile(GRAPH_METADATA_PATH, "utf8");
      if (metaData.trim()) {
        metadata = { ...metadata, ...JSON.parse(metaData) };
      }
    } catch (error) {
      console.log("\u{1F4CA} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 graph metadata \u0E43\u0E2B\u0E21\u0E48");
    }
    rebuildCacheFromStore(memoryStore, metadata);
    await buildVectorIndex();
    if (!metadata.createdAt) {
      metadata.createdAt = (/* @__PURE__ */ new Date()).toISOString();
      await fs2.writeFile(GRAPH_METADATA_PATH, JSON.stringify(metadata, null, 2), "utf8");
    }
    console.log(`\u2705 Graph store \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 - ${graphCache.entities.length} entities, ${graphCache.relations.length} relations`);
    return { success: true, stats: metadata };
  } catch (error) {
    console.error("\u274C Error setting up graph store:", error);
    throw new Error(`Graph store initialization failed: ${error.message}`);
  }
}
function rebuildCacheFromStore(store, metadata) {
  graphCache.entities = store.filter((item) => item.type === "entity" || item.type === "memory");
  graphCache.relations = store.filter((item) => item.type === "relation") || [];
  graphCache.entityMap.clear();
  graphCache.entities.forEach((entity) => {
    graphCache.entityMap.set(entity.id, entity);
    if (entity.name) graphCache.entityMap.set(entity.name, entity);
  });
  graphCache.relationMap.clear();
  graphCache.relations.forEach((relation) => {
    const signature = `${relation.from}::${relation.relationType}::${relation.to}`;
    graphCache.relationMap.set(signature, relation);
  });
  graphCache.observations.clear();
  graphCache.tags.clear();
  graphCache.entities.forEach((entity) => {
    if (entity.observations && entity.observations.length > 0) {
      graphCache.observations.set(entity.name, entity.observations);
    }
    if (entity.autoTags && entity.autoTags.length > 0) {
      entity.autoTags.forEach((tag) => {
        if (!graphCache.tags.has(tag)) {
          graphCache.tags.set(tag, []);
        }
        graphCache.tags.get(tag).push(entity.name);
      });
    }
  });
  graphCache.metadata = metadata;
  console.log("\u{1F504} In-memory cache rebuilt.");
}
async function persistStore() {
  console.log("\u{1F4BE} Persisting graph to disk...");
  try {
    const store = [...graphCache.entities, ...graphCache.relations];
    await fs2.writeFile(MEMORY_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
    graphCache.metadata.lastUpdated = (/* @__PURE__ */ new Date()).toISOString();
    graphCache.metadata.totalEntities = graphCache.entities.length;
    graphCache.metadata.totalRelations = graphCache.relations.length;
    await fs2.writeFile(GRAPH_METADATA_PATH, JSON.stringify(graphCache.metadata, null, 2), "utf8");
    console.log(`\u2705 Graph state saved. ${graphCache.entities.length} entities, ${graphCache.relations.length} relations.`);
  } catch (error) {
    console.error("\u274C Error persisting graph state:", error);
  }
}
async function createEntities(entities) {
  const newEntities = [];
  for (const entityData of entities) {
    if (!entityData.name || !entityData.type) {
      console.warn("Skipping entity with missing name or type:", entityData);
      continue;
    }
    const id = `ent_${crypto.randomBytes(8).toString("hex")}`;
    const newEntity = {
      id,
      ...entityData,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    graphCache.entities.push(newEntity);
    graphCache.entityMap.set(id, newEntity);
    graphCache.entityMap.set(newEntity.name, newEntity);
    newEntities.push(newEntity);
  }
  await persistStore();
  return newEntities;
}
async function addObservations(observations) {
  for (const obsData of observations) {
    const entity = graphCache.entityMap.get(obsData.entityName);
    if (entity) {
      if (!entity.observations) {
        entity.observations = [];
      }
      const contents = obsData.contents;
      const vectors = await embedTexts(contents);
      const newObservations = contents.map((content, index) => ({
        id: `obs_${crypto.randomBytes(8).toString("hex")}`,
        content,
        embedding: vectors[index],
        // Add the embedding
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        source: obsData.source || "manual"
      }));
      entity.observations.push(...newObservations);
      entity.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    } else {
      console.warn(`Entity not found for observation: ${obsData.entityName}`);
    }
  }
  console.warn("\u26A0\uFE0F New observations added. Vector index is now stale. Please restart to rebuild the index for accurate search.");
  await persistStore();
  return observations;
}
async function createRelations(relations) {
  const newRelations = [];
  const relationsToAdd = [...relations];
  for (const relData of relations) {
    if (relData.relationType === "parent_of") {
      relationsToAdd.push({
        from: relData.to,
        to: relData.from,
        relationType: "child_of",
        properties: { auto_generated: true }
      });
    }
    if (relData.relationType === "child_of") {
      relationsToAdd.push({
        from: relData.to,
        to: relData.from,
        relationType: "parent_of",
        properties: { auto_generated: true }
      });
    }
  }
  for (const relData of relationsToAdd) {
    const fromEntity = graphCache.entityMap.get(relData.from);
    const toEntity = graphCache.entityMap.get(relData.to);
    if (!fromEntity || !toEntity) {
      console.warn("Skipping relation with missing entity:", relData);
      continue;
    }
    const signature = `${relData.from}::${relData.relationType}::${relData.to}`;
    if (graphCache.relationMap.has(signature)) {
      console.log(`Skipping duplicate relation: ${signature}`);
      continue;
    }
    const id = `rel_${crypto.randomBytes(8).toString("hex")}`;
    const newRelation = {
      id,
      ...relData,
      type: "relation",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    graphCache.relations.push(newRelation);
    graphCache.relationMap.set(signature, newRelation);
    newRelations.push(newRelation);
  }
  await persistStore();
  return newRelations;
}
var vectorIndex = /* @__PURE__ */ new Map();
var centroids = [];
var NUM_CENTROIDS = 10;
async function buildVectorIndex() {
  console.log("\u{1F9E0} Building vector index...");
  const textsToEmbed = [];
  const observationsWithoutEmbedding = [];
  for (const entity of graphCache.entities) {
    if (entity.observations) {
      for (const obs of entity.observations) {
        if (!obs.embedding) {
          textsToEmbed.push(obs.content);
          observationsWithoutEmbedding.push(obs);
        }
      }
    }
  }
  if (textsToEmbed.length > 0) {
    console.log(`\u{1F9E0} Found ${textsToEmbed.length} observations without embeddings. Generating them now...`);
    const vectors = await embedTexts(textsToEmbed);
    observationsWithoutEmbedding.forEach((obs, index) => {
      obs.embedding = vectors[index];
    });
    console.log("\u2705 Embeddings generated for existing observations.");
    await persistStore();
  }
  const observationVectors = [];
  for (const entity of graphCache.entities) {
    if (entity.observations) {
      for (const obs of entity.observations) {
        if (obs.embedding) {
          observationVectors.push({ vector: obs.embedding, entityName: entity.name, content: obs.content });
        }
      }
    }
  }
  if (observationVectors.length === 0) {
    console.log("\u26A0\uFE0F No vectors to index.");
    return;
  }
  centroids = [];
  const shuffled = observationVectors.sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(NUM_CENTROIDS, shuffled.length); i++) {
    centroids.push(shuffled[i].vector);
  }
  vectorIndex.clear();
  for (let i = 0; i < centroids.length; i++) {
    vectorIndex.set(i, []);
  }
  for (const obsVector of observationVectors) {
    let bestCentroid = -1;
    let maxSimilarity = -Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const similarity = cosineSimilarity(obsVector.vector, centroids[i]);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestCentroid = i;
      }
    }
    if (bestCentroid !== -1) {
      vectorIndex.get(bestCentroid).push(obsVector);
    }
  }
  console.log(`\u2705 Vector index built. ${observationVectors.length} vectors in ${centroids.length} clusters.`);
}
async function expandTags(tags = [], threshold = 0.8) {
  if (tags.length === 0) return [];
  const allKnownTags = Array.from(graphCache.tags.keys());
  if (allKnownTags.length === 0) return tags;
  const tagEmbeddings = await embedTexts(tags);
  const allKnownTagEmbeddings = await embedTexts(allKnownTags);
  const expandedTags = new Set(tags);
  for (let i = 0; i < tagEmbeddings.length; i++) {
    const tagVector = tagEmbeddings[i];
    for (let j = 0; j < allKnownTagEmbeddings.length; j++) {
      const knownTagVector = allKnownTagEmbeddings[j];
      const similarity = cosineSimilarity(tagVector, knownTagVector);
      if (similarity >= threshold) {
        expandedTags.add(allKnownTags[j]);
      }
    }
  }
  console.log(`\u{1F3F7}\uFE0F Expanded tags from [${tags.join(", ")}] to [${Array.from(expandedTags).join(", ")}]`);
  return Array.from(expandedTags);
}
async function semanticSearch(queryVector, options = {}) {
  const { topK = 5, threshold = 0.3, tagFilter = [], expandTags: shouldExpand = true } = options;
  if (centroids.length === 0) {
    console.warn("\u26A0\uFE0F Vector index is not built. Search is not possible.");
    return [];
  }
  let finalTagFilter = tagFilter;
  if (tagFilter.length > 0 && shouldExpand) {
    finalTagFilter = await expandTags(tagFilter);
  }
  const filterSet = new Set(finalTagFilter);
  let bestCentroid = -1;
  let maxSimilarity = -Infinity;
  for (let i = 0; i < centroids.length; i++) {
    const similarity = cosineSimilarity(queryVector, centroids[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestCentroid = i;
    }
  }
  const candidateVectors = vectorIndex.get(bestCentroid) || [];
  const results = [];
  for (const obsVector of candidateVectors) {
    const similarity = cosineSimilarity(queryVector, obsVector.vector);
    if (similarity >= threshold) {
      const entity = graphCache.entityMap.get(obsVector.entityName);
      if (!entity) continue;
      if (filterSet.size > 0) {
        const entityTags = new Set(entity.autoTags || []);
        const hasMatchingTag = [...filterSet].some((tag) => entityTags.has(tag));
        if (!hasMatchingTag) {
          continue;
        }
      }
      results.push({
        entity,
        similarity,
        observation: obsVector.content
      });
    }
  }
  results.sort((a, b) => b.similarity - a.similarity);
  return results.slice(0, topK);
}
async function getAllTags() {
  return Array.from(graphCache.tags.keys());
}
async function searchByTag(tag, options = {}) {
  const { exact = false, limit = 50 } = options;
  const results = [];
  const entityNames = graphCache.tags.get(tag) || [];
  for (let i = 0; i < Math.min(entityNames.length, limit); i++) {
    const entity = graphCache.entityMap.get(entityNames[i]);
    if (entity) {
      results.push(entity);
    }
  }
  return results;
}
async function readGraph() {
  return {
    entities: graphCache.entities,
    relations: graphCache.relations,
    stats: graphCache.metadata
  };
}
async function openNodes(names) {
  return names.map((name) => graphCache.entityMap.get(name)).filter(Boolean);
}
async function searchNodes(query) {
  const lowerCaseQuery = query.toLowerCase();
  return graphCache.entities.filter((e) => e.name.toLowerCase().includes(lowerCaseQuery));
}
async function deleteEntities(entityNames) {
  let deletedCount = 0;
  const entitiesToDelete = new Set(entityNames);
  graphCache.entities = graphCache.entities.filter((entity) => {
    if (entitiesToDelete.has(entity.name)) {
      deletedCount++;
      graphCache.entityMap.delete(entity.id);
      graphCache.entityMap.delete(entity.name);
      return false;
    }
    return true;
  });
  graphCache.relations = graphCache.relations.filter((rel) => {
    return !entitiesToDelete.has(rel.from) && !entitiesToDelete.has(rel.to);
  });
  await persistStore();
  return { deleted: deletedCount };
}
async function deleteRelations(relations) {
  console.warn("deleteRelations is not fully implemented.");
  return { deleted: 0 };
}
async function deleteObservations(deletions) {
  console.warn("deleteObservations is not fully implemented.");
  return { deleted: 0 };
}
function traverse(startNode, direction) {
  const lineage = { name: startNode, children: [] };
  const relationType = direction === "descendants" ? "parent_of" : "child_of";
  const oppositeRelation = direction === "descendants" ? "child_of" : "parent_of";
  const relationsToFollow = graphCache.relations.filter((r) => r.relationType === relationType && r.from === startNode);
  for (const rel of relationsToFollow) {
    lineage.children.push(traverse(rel.to, direction));
  }
  return lineage;
}
async function getLineage(entityName, options = {}) {
  const { direction = "descendants" } = options;
  const startNode = graphCache.entityMap.get(entityName);
  if (!startNode) {
    throw new Error(`Entity "${entityName}" not found.`);
  }
  return traverse(entityName, direction);
}

// modules/memory0_service/index.js
var memory0_service_exports = {};
__export(memory0_service_exports, {
  ROOT_MEMORY: () => ROOT_MEMORY,
  ensureRoot: () => ensureRoot,
  getRootMemory: () => getRootMemory,
  linkToRoot: () => linkToRoot,
  updateRootObservation: () => updateRootObservation
});
import fs3 from "fs/promises";
import path3 from "path";
var ROOT_MEMORY = {
  id: "memory0",
  name: "Root",
  type: "memory",
  relationType: "root",
  observations: [
    "Default root memory profile created for Explicit Agent Protocol"
  ],
  links: [],
  data: {},
  createdAt: (/* @__PURE__ */ new Date()).toISOString(),
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  sig: "memory0::root::memory0",
  key: "memory0::root::Root"
};
var MEMORY_STORE_PATH2 = path3.join(process.cwd(), "memory", "memory_store.json");
async function ensureRoot() {
  try {
    let memoryStore = [];
    try {
      const data = await fs3.readFile(MEMORY_STORE_PATH2, "utf8");
      memoryStore = JSON.parse(data);
    } catch (error) {
      console.log("\u26A0\uFE0F  Memory store \u0E44\u0E21\u0E48\u0E1E\u0E1A \u0E08\u0E30\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E43\u0E2B\u0E21\u0E48");
    }
    const rootExists = memoryStore.some((entity) => entity.id === "memory0");
    if (!rootExists) {
      memoryStore.unshift(ROOT_MEMORY);
      await fs3.writeFile(MEMORY_STORE_PATH2, JSON.stringify(memoryStore, null, 2), "utf8");
      console.log("\u2705 \u0E2A\u0E23\u0E49\u0E32\u0E07 Root memory node \u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
      ROOT_MEMORY.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      return ROOT_MEMORY;
    } else {
      console.log("\u2139\uFE0F  Root memory node \u0E21\u0E35\u0E2D\u0E22\u0E39\u0E48\u0E41\u0E25\u0E49\u0E27");
      return memoryStore.find((e) => e.id === "memory0");
    }
  } catch (error) {
    console.error("\u274C Error in ensureRoot:", error);
    throw error;
  }
}
async function linkToRoot(entityNames) {
  try {
    const data = await fs3.readFile(MEMORY_STORE_PATH2, "utf8");
    let memoryStore = JSON.parse(data);
    const relations = entityNames.map((name) => ({
      from: "memory0",
      to: name,
      relationType: "contains"
    }));
    ROOT_MEMORY.links = [.../* @__PURE__ */ new Set([...ROOT_MEMORY.links, ...entityNames])];
    ROOT_MEMORY.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    const rootIndex = memoryStore.findIndex((e) => e.id === "memory0");
    if (rootIndex !== -1) {
      memoryStore[rootIndex] = ROOT_MEMORY;
    }
    await fs3.writeFile(MEMORY_STORE_PATH2, JSON.stringify(memoryStore, null, 2), "utf8");
    console.log(`\u{1F517} \u0E25\u0E34\u0E07\u0E01\u0E4C ${entityNames.length} entities \u0E44\u0E1B\u0E22\u0E31\u0E07 Root memory`);
    return relations;
  } catch (error) {
    console.error("\u274C Error in linkToRoot:", error);
    throw error;
  }
}
async function getRootMemory() {
  try {
    const data = await fs3.readFile(MEMORY_STORE_PATH2, "utf8");
    const memoryStore = JSON.parse(data);
    return memoryStore.find((e) => e.id === "memory0") || null;
  } catch (error) {
    console.error("\u274C Error getting root memory:", error);
    return null;
  }
}
async function updateRootObservation(observation) {
  try {
    const data = await fs3.readFile(MEMORY_STORE_PATH2, "utf8");
    let memoryStore = JSON.parse(data);
    const rootIndex = memoryStore.findIndex((e) => e.id === "memory0");
    if (rootIndex !== -1) {
      memoryStore[rootIndex].observations.push(observation);
      memoryStore[rootIndex].updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      await fs3.writeFile(MEMORY_STORE_PATH2, JSON.stringify(memoryStore, null, 2), "utf8");
      console.log("\u{1F4DD} \u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 observation \u0E43\u0E19 Root memory");
      return true;
    }
    return false;
  } catch (error) {
    console.error("\u274C Error updating root observation:", error);
    throw error;
  }
}

// modules/system/index.js
var system_exports = {};
__export(system_exports, {
  ensureBaseline: () => ensureBaseline,
  selfDescribe: () => selfDescribe,
  validateStructure: () => validateStructure
});
import fs4 from "fs/promises";
import path4 from "path";

// node_modules/js-yaml/dist/js-yaml.mjs
function isNothing(subject) {
  return typeof subject === "undefined" || subject === null;
}
function isObject(subject) {
  return typeof subject === "object" && subject !== null;
}
function toArray(sequence) {
  if (Array.isArray(sequence)) return sequence;
  else if (isNothing(sequence)) return [];
  return [sequence];
}
function extend(target, source) {
  var index, length, key, sourceKeys;
  if (source) {
    sourceKeys = Object.keys(source);
    for (index = 0, length = sourceKeys.length; index < length; index += 1) {
      key = sourceKeys[index];
      target[key] = source[key];
    }
  }
  return target;
}
function repeat(string, count) {
  var result = "", cycle;
  for (cycle = 0; cycle < count; cycle += 1) {
    result += string;
  }
  return result;
}
function isNegativeZero(number) {
  return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
}
var isNothing_1 = isNothing;
var isObject_1 = isObject;
var toArray_1 = toArray;
var repeat_1 = repeat;
var isNegativeZero_1 = isNegativeZero;
var extend_1 = extend;
var common = {
  isNothing: isNothing_1,
  isObject: isObject_1,
  toArray: toArray_1,
  repeat: repeat_1,
  isNegativeZero: isNegativeZero_1,
  extend: extend_1
};
function formatError(exception2, compact) {
  var where = "", message = exception2.reason || "(unknown reason)";
  if (!exception2.mark) return message;
  if (exception2.mark.name) {
    where += 'in "' + exception2.mark.name + '" ';
  }
  where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
  if (!compact && exception2.mark.snippet) {
    where += "\n\n" + exception2.mark.snippet;
  }
  return message + " " + where;
}
function YAMLException$1(reason, mark) {
  Error.call(this);
  this.name = "YAMLException";
  this.reason = reason;
  this.mark = mark;
  this.message = formatError(this, false);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack || "";
  }
}
YAMLException$1.prototype = Object.create(Error.prototype);
YAMLException$1.prototype.constructor = YAMLException$1;
YAMLException$1.prototype.toString = function toString(compact) {
  return this.name + ": " + formatError(this, compact);
};
var exception = YAMLException$1;
function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
  var head = "";
  var tail = "";
  var maxHalfLength = Math.floor(maxLineLength / 2) - 1;
  if (position - lineStart > maxHalfLength) {
    head = " ... ";
    lineStart = position - maxHalfLength + head.length;
  }
  if (lineEnd - position > maxHalfLength) {
    tail = " ...";
    lineEnd = position + maxHalfLength - tail.length;
  }
  return {
    str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
    pos: position - lineStart + head.length
    // relative position
  };
}
function padStart(string, max) {
  return common.repeat(" ", max - string.length) + string;
}
function makeSnippet(mark, options) {
  options = Object.create(options || null);
  if (!mark.buffer) return null;
  if (!options.maxLength) options.maxLength = 79;
  if (typeof options.indent !== "number") options.indent = 1;
  if (typeof options.linesBefore !== "number") options.linesBefore = 3;
  if (typeof options.linesAfter !== "number") options.linesAfter = 2;
  var re = /\r?\n|\r|\0/g;
  var lineStarts = [0];
  var lineEnds = [];
  var match;
  var foundLineNo = -1;
  while (match = re.exec(mark.buffer)) {
    lineEnds.push(match.index);
    lineStarts.push(match.index + match[0].length);
    if (mark.position <= match.index && foundLineNo < 0) {
      foundLineNo = lineStarts.length - 2;
    }
  }
  if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
  var result = "", i, line;
  var lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
  var maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
  for (i = 1; i <= options.linesBefore; i++) {
    if (foundLineNo - i < 0) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo - i],
      lineEnds[foundLineNo - i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
      maxLineLength
    );
    result = common.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line.str + "\n" + result;
  }
  line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
  result += common.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  result += common.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
  for (i = 1; i <= options.linesAfter; i++) {
    if (foundLineNo + i >= lineEnds.length) break;
    line = getLine(
      mark.buffer,
      lineStarts[foundLineNo + i],
      lineEnds[foundLineNo + i],
      mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
      maxLineLength
    );
    result += common.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line.str + "\n";
  }
  return result.replace(/\n$/, "");
}
var snippet = makeSnippet;
var TYPE_CONSTRUCTOR_OPTIONS = [
  "kind",
  "multi",
  "resolve",
  "construct",
  "instanceOf",
  "predicate",
  "represent",
  "representName",
  "defaultStyle",
  "styleAliases"
];
var YAML_NODE_KINDS = [
  "scalar",
  "sequence",
  "mapping"
];
function compileStyleAliases(map2) {
  var result = {};
  if (map2 !== null) {
    Object.keys(map2).forEach(function(style) {
      map2[style].forEach(function(alias) {
        result[String(alias)] = style;
      });
    });
  }
  return result;
}
function Type$1(tag, options) {
  options = options || {};
  Object.keys(options).forEach(function(name) {
    if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
      throw new exception('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
    }
  });
  this.options = options;
  this.tag = tag;
  this.kind = options["kind"] || null;
  this.resolve = options["resolve"] || function() {
    return true;
  };
  this.construct = options["construct"] || function(data) {
    return data;
  };
  this.instanceOf = options["instanceOf"] || null;
  this.predicate = options["predicate"] || null;
  this.represent = options["represent"] || null;
  this.representName = options["representName"] || null;
  this.defaultStyle = options["defaultStyle"] || null;
  this.multi = options["multi"] || false;
  this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
  if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
    throw new exception('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
  }
}
var type = Type$1;
function compileList(schema2, name) {
  var result = [];
  schema2[name].forEach(function(currentType) {
    var newIndex = result.length;
    result.forEach(function(previousType, previousIndex) {
      if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
        newIndex = previousIndex;
      }
    });
    result[newIndex] = currentType;
  });
  return result;
}
function compileMap() {
  var result = {
    scalar: {},
    sequence: {},
    mapping: {},
    fallback: {},
    multi: {
      scalar: [],
      sequence: [],
      mapping: [],
      fallback: []
    }
  }, index, length;
  function collectType(type2) {
    if (type2.multi) {
      result.multi[type2.kind].push(type2);
      result.multi["fallback"].push(type2);
    } else {
      result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
    }
  }
  for (index = 0, length = arguments.length; index < length; index += 1) {
    arguments[index].forEach(collectType);
  }
  return result;
}
function Schema$1(definition) {
  return this.extend(definition);
}
Schema$1.prototype.extend = function extend2(definition) {
  var implicit = [];
  var explicit = [];
  if (definition instanceof type) {
    explicit.push(definition);
  } else if (Array.isArray(definition)) {
    explicit = explicit.concat(definition);
  } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
    if (definition.implicit) implicit = implicit.concat(definition.implicit);
    if (definition.explicit) explicit = explicit.concat(definition.explicit);
  } else {
    throw new exception("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
  }
  implicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
    if (type$1.loadKind && type$1.loadKind !== "scalar") {
      throw new exception("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
    }
    if (type$1.multi) {
      throw new exception("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }
  });
  explicit.forEach(function(type$1) {
    if (!(type$1 instanceof type)) {
      throw new exception("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    }
  });
  var result = Object.create(Schema$1.prototype);
  result.implicit = (this.implicit || []).concat(implicit);
  result.explicit = (this.explicit || []).concat(explicit);
  result.compiledImplicit = compileList(result, "implicit");
  result.compiledExplicit = compileList(result, "explicit");
  result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
  return result;
};
var schema = Schema$1;
var str = new type("tag:yaml.org,2002:str", {
  kind: "scalar",
  construct: function(data) {
    return data !== null ? data : "";
  }
});
var seq = new type("tag:yaml.org,2002:seq", {
  kind: "sequence",
  construct: function(data) {
    return data !== null ? data : [];
  }
});
var map = new type("tag:yaml.org,2002:map", {
  kind: "mapping",
  construct: function(data) {
    return data !== null ? data : {};
  }
});
var failsafe = new schema({
  explicit: [
    str,
    seq,
    map
  ]
});
function resolveYamlNull(data) {
  if (data === null) return true;
  var max = data.length;
  return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
}
function constructYamlNull() {
  return null;
}
function isNull(object) {
  return object === null;
}
var _null = new type("tag:yaml.org,2002:null", {
  kind: "scalar",
  resolve: resolveYamlNull,
  construct: constructYamlNull,
  predicate: isNull,
  represent: {
    canonical: function() {
      return "~";
    },
    lowercase: function() {
      return "null";
    },
    uppercase: function() {
      return "NULL";
    },
    camelcase: function() {
      return "Null";
    },
    empty: function() {
      return "";
    }
  },
  defaultStyle: "lowercase"
});
function resolveYamlBoolean(data) {
  if (data === null) return false;
  var max = data.length;
  return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
}
function constructYamlBoolean(data) {
  return data === "true" || data === "True" || data === "TRUE";
}
function isBoolean(object) {
  return Object.prototype.toString.call(object) === "[object Boolean]";
}
var bool = new type("tag:yaml.org,2002:bool", {
  kind: "scalar",
  resolve: resolveYamlBoolean,
  construct: constructYamlBoolean,
  predicate: isBoolean,
  represent: {
    lowercase: function(object) {
      return object ? "true" : "false";
    },
    uppercase: function(object) {
      return object ? "TRUE" : "FALSE";
    },
    camelcase: function(object) {
      return object ? "True" : "False";
    }
  },
  defaultStyle: "lowercase"
});
function isHexCode(c) {
  return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
}
function isOctCode(c) {
  return 48 <= c && c <= 55;
}
function isDecCode(c) {
  return 48 <= c && c <= 57;
}
function resolveYamlInteger(data) {
  if (data === null) return false;
  var max = data.length, index = 0, hasDigits = false, ch;
  if (!max) return false;
  ch = data[index];
  if (ch === "-" || ch === "+") {
    ch = data[++index];
  }
  if (ch === "0") {
    if (index + 1 === max) return true;
    ch = data[++index];
    if (ch === "b") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch !== "0" && ch !== "1") return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "x") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isHexCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
    if (ch === "o") {
      index++;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (!isOctCode(data.charCodeAt(index))) return false;
        hasDigits = true;
      }
      return hasDigits && ch !== "_";
    }
  }
  if (ch === "_") return false;
  for (; index < max; index++) {
    ch = data[index];
    if (ch === "_") continue;
    if (!isDecCode(data.charCodeAt(index))) {
      return false;
    }
    hasDigits = true;
  }
  if (!hasDigits || ch === "_") return false;
  return true;
}
function constructYamlInteger(data) {
  var value = data, sign = 1, ch;
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }
  ch = value[0];
  if (ch === "-" || ch === "+") {
    if (ch === "-") sign = -1;
    value = value.slice(1);
    ch = value[0];
  }
  if (value === "0") return 0;
  if (ch === "0") {
    if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
    if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
    if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
  }
  return sign * parseInt(value, 10);
}
function isInteger(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
}
var int = new type("tag:yaml.org,2002:int", {
  kind: "scalar",
  resolve: resolveYamlInteger,
  construct: constructYamlInteger,
  predicate: isInteger,
  represent: {
    binary: function(obj) {
      return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
    },
    octal: function(obj) {
      return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
    },
    decimal: function(obj) {
      return obj.toString(10);
    },
    /* eslint-disable max-len */
    hexadecimal: function(obj) {
      return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
    }
  },
  defaultStyle: "decimal",
  styleAliases: {
    binary: [2, "bin"],
    octal: [8, "oct"],
    decimal: [10, "dec"],
    hexadecimal: [16, "hex"]
  }
});
var YAML_FLOAT_PATTERN = new RegExp(
  // 2.5e4, 2.5 and integers
  "^(?:[-+]?(?:[0-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
);
function resolveYamlFloat(data) {
  if (data === null) return false;
  if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
  // Probably should update regexp & check speed
  data[data.length - 1] === "_") {
    return false;
  }
  return true;
}
function constructYamlFloat(data) {
  var value, sign;
  value = data.replace(/_/g, "").toLowerCase();
  sign = value[0] === "-" ? -1 : 1;
  if ("+-".indexOf(value[0]) >= 0) {
    value = value.slice(1);
  }
  if (value === ".inf") {
    return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else if (value === ".nan") {
    return NaN;
  }
  return sign * parseFloat(value, 10);
}
var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
function representYamlFloat(object, style) {
  var res;
  if (isNaN(object)) {
    switch (style) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
  } else if (Number.POSITIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
  } else if (Number.NEGATIVE_INFINITY === object) {
    switch (style) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
  } else if (common.isNegativeZero(object)) {
    return "-0.0";
  }
  res = object.toString(10);
  return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
}
function isFloat(object) {
  return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
}
var float = new type("tag:yaml.org,2002:float", {
  kind: "scalar",
  resolve: resolveYamlFloat,
  construct: constructYamlFloat,
  predicate: isFloat,
  represent: representYamlFloat,
  defaultStyle: "lowercase"
});
var json = failsafe.extend({
  implicit: [
    _null,
    bool,
    int,
    float
  ]
});
var core = json;
var YAML_DATE_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
);
var YAML_TIMESTAMP_REGEXP = new RegExp(
  "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
);
function resolveYamlTimestamp(data) {
  if (data === null) return false;
  if (YAML_DATE_REGEXP.exec(data) !== null) return true;
  if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
  return false;
}
function constructYamlTimestamp(data) {
  var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
  match = YAML_DATE_REGEXP.exec(data);
  if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
  if (match === null) throw new Error("Date resolve error");
  year = +match[1];
  month = +match[2] - 1;
  day = +match[3];
  if (!match[4]) {
    return new Date(Date.UTC(year, month, day));
  }
  hour = +match[4];
  minute = +match[5];
  second = +match[6];
  if (match[7]) {
    fraction = match[7].slice(0, 3);
    while (fraction.length < 3) {
      fraction += "0";
    }
    fraction = +fraction;
  }
  if (match[9]) {
    tz_hour = +match[10];
    tz_minute = +(match[11] || 0);
    delta = (tz_hour * 60 + tz_minute) * 6e4;
    if (match[9] === "-") delta = -delta;
  }
  date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
  if (delta) date.setTime(date.getTime() - delta);
  return date;
}
function representYamlTimestamp(object) {
  return object.toISOString();
}
var timestamp = new type("tag:yaml.org,2002:timestamp", {
  kind: "scalar",
  resolve: resolveYamlTimestamp,
  construct: constructYamlTimestamp,
  instanceOf: Date,
  represent: representYamlTimestamp
});
function resolveYamlMerge(data) {
  return data === "<<" || data === null;
}
var merge = new type("tag:yaml.org,2002:merge", {
  kind: "scalar",
  resolve: resolveYamlMerge
});
var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
function resolveYamlBinary(data) {
  if (data === null) return false;
  var code, idx, bitlen = 0, max = data.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    code = map2.indexOf(data.charAt(idx));
    if (code > 64) continue;
    if (code < 0) return false;
    bitlen += 6;
  }
  return bitlen % 8 === 0;
}
function constructYamlBinary(data) {
  var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map2 = BASE64_MAP, bits = 0, result = [];
  for (idx = 0; idx < max; idx++) {
    if (idx % 4 === 0 && idx) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    }
    bits = bits << 6 | map2.indexOf(input.charAt(idx));
  }
  tailbits = max % 4 * 6;
  if (tailbits === 0) {
    result.push(bits >> 16 & 255);
    result.push(bits >> 8 & 255);
    result.push(bits & 255);
  } else if (tailbits === 18) {
    result.push(bits >> 10 & 255);
    result.push(bits >> 2 & 255);
  } else if (tailbits === 12) {
    result.push(bits >> 4 & 255);
  }
  return new Uint8Array(result);
}
function representYamlBinary(object) {
  var result = "", bits = 0, idx, tail, max = object.length, map2 = BASE64_MAP;
  for (idx = 0; idx < max; idx++) {
    if (idx % 3 === 0 && idx) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    }
    bits = (bits << 8) + object[idx];
  }
  tail = max % 3;
  if (tail === 0) {
    result += map2[bits >> 18 & 63];
    result += map2[bits >> 12 & 63];
    result += map2[bits >> 6 & 63];
    result += map2[bits & 63];
  } else if (tail === 2) {
    result += map2[bits >> 10 & 63];
    result += map2[bits >> 4 & 63];
    result += map2[bits << 2 & 63];
    result += map2[64];
  } else if (tail === 1) {
    result += map2[bits >> 2 & 63];
    result += map2[bits << 4 & 63];
    result += map2[64];
    result += map2[64];
  }
  return result;
}
function isBinary(obj) {
  return Object.prototype.toString.call(obj) === "[object Uint8Array]";
}
var binary = new type("tag:yaml.org,2002:binary", {
  kind: "scalar",
  resolve: resolveYamlBinary,
  construct: constructYamlBinary,
  predicate: isBinary,
  represent: representYamlBinary
});
var _hasOwnProperty$3 = Object.prototype.hasOwnProperty;
var _toString$2 = Object.prototype.toString;
function resolveYamlOmap(data) {
  if (data === null) return true;
  var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    pairHasKey = false;
    if (_toString$2.call(pair) !== "[object Object]") return false;
    for (pairKey in pair) {
      if (_hasOwnProperty$3.call(pair, pairKey)) {
        if (!pairHasKey) pairHasKey = true;
        else return false;
      }
    }
    if (!pairHasKey) return false;
    if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
    else return false;
  }
  return true;
}
function constructYamlOmap(data) {
  return data !== null ? data : [];
}
var omap = new type("tag:yaml.org,2002:omap", {
  kind: "sequence",
  resolve: resolveYamlOmap,
  construct: constructYamlOmap
});
var _toString$1 = Object.prototype.toString;
function resolveYamlPairs(data) {
  if (data === null) return true;
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    if (_toString$1.call(pair) !== "[object Object]") return false;
    keys = Object.keys(pair);
    if (keys.length !== 1) return false;
    result[index] = [keys[0], pair[keys[0]]];
  }
  return true;
}
function constructYamlPairs(data) {
  if (data === null) return [];
  var index, length, pair, keys, result, object = data;
  result = new Array(object.length);
  for (index = 0, length = object.length; index < length; index += 1) {
    pair = object[index];
    keys = Object.keys(pair);
    result[index] = [keys[0], pair[keys[0]]];
  }
  return result;
}
var pairs = new type("tag:yaml.org,2002:pairs", {
  kind: "sequence",
  resolve: resolveYamlPairs,
  construct: constructYamlPairs
});
var _hasOwnProperty$2 = Object.prototype.hasOwnProperty;
function resolveYamlSet(data) {
  if (data === null) return true;
  var key, object = data;
  for (key in object) {
    if (_hasOwnProperty$2.call(object, key)) {
      if (object[key] !== null) return false;
    }
  }
  return true;
}
function constructYamlSet(data) {
  return data !== null ? data : {};
}
var set = new type("tag:yaml.org,2002:set", {
  kind: "mapping",
  resolve: resolveYamlSet,
  construct: constructYamlSet
});
var _default = core.extend({
  implicit: [
    timestamp,
    merge
  ],
  explicit: [
    binary,
    omap,
    pairs,
    set
  ]
});
var _hasOwnProperty$1 = Object.prototype.hasOwnProperty;
var CONTEXT_FLOW_IN = 1;
var CONTEXT_FLOW_OUT = 2;
var CONTEXT_BLOCK_IN = 3;
var CONTEXT_BLOCK_OUT = 4;
var CHOMPING_CLIP = 1;
var CHOMPING_STRIP = 2;
var CHOMPING_KEEP = 3;
var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
  return Object.prototype.toString.call(obj);
}
function is_EOL(c) {
  return c === 10 || c === 13;
}
function is_WHITE_SPACE(c) {
  return c === 9 || c === 32;
}
function is_WS_OR_EOL(c) {
  return c === 9 || c === 32 || c === 10 || c === 13;
}
function is_FLOW_INDICATOR(c) {
  return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
}
function fromHexCode(c) {
  var lc;
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  lc = c | 32;
  if (97 <= lc && lc <= 102) {
    return lc - 97 + 10;
  }
  return -1;
}
function escapedHexLen(c) {
  if (c === 120) {
    return 2;
  }
  if (c === 117) {
    return 4;
  }
  if (c === 85) {
    return 8;
  }
  return 0;
}
function fromDecimalCode(c) {
  if (48 <= c && c <= 57) {
    return c - 48;
  }
  return -1;
}
function simpleEscapeSequence(c) {
  return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
}
function charFromCodepoint(c) {
  if (c <= 65535) {
    return String.fromCharCode(c);
  }
  return String.fromCharCode(
    (c - 65536 >> 10) + 55296,
    (c - 65536 & 1023) + 56320
  );
}
var simpleEscapeCheck = new Array(256);
var simpleEscapeMap = new Array(256);
for (i = 0; i < 256; i++) {
  simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
  simpleEscapeMap[i] = simpleEscapeSequence(i);
}
var i;
function State$1(input, options) {
  this.input = input;
  this.filename = options["filename"] || null;
  this.schema = options["schema"] || _default;
  this.onWarning = options["onWarning"] || null;
  this.legacy = options["legacy"] || false;
  this.json = options["json"] || false;
  this.listener = options["listener"] || null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.typeMap = this.schema.compiledTypeMap;
  this.length = input.length;
  this.position = 0;
  this.line = 0;
  this.lineStart = 0;
  this.lineIndent = 0;
  this.firstTabInLine = -1;
  this.documents = [];
}
function generateError(state, message) {
  var mark = {
    name: state.filename,
    buffer: state.input.slice(0, -1),
    // omit trailing \0
    position: state.position,
    line: state.line,
    column: state.position - state.lineStart
  };
  mark.snippet = snippet(mark);
  return new exception(message, mark);
}
function throwError(state, message) {
  throw generateError(state, message);
}
function throwWarning(state, message) {
  if (state.onWarning) {
    state.onWarning.call(null, generateError(state, message));
  }
}
var directiveHandlers = {
  YAML: function handleYamlDirective(state, name, args) {
    var match, major, minor;
    if (state.version !== null) {
      throwError(state, "duplication of %YAML directive");
    }
    if (args.length !== 1) {
      throwError(state, "YAML directive accepts exactly one argument");
    }
    match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
    if (match === null) {
      throwError(state, "ill-formed argument of the YAML directive");
    }
    major = parseInt(match[1], 10);
    minor = parseInt(match[2], 10);
    if (major !== 1) {
      throwError(state, "unacceptable YAML version of the document");
    }
    state.version = args[0];
    state.checkLineBreaks = minor < 2;
    if (minor !== 1 && minor !== 2) {
      throwWarning(state, "unsupported YAML version of the document");
    }
  },
  TAG: function handleTagDirective(state, name, args) {
    var handle, prefix;
    if (args.length !== 2) {
      throwError(state, "TAG directive accepts exactly two arguments");
    }
    handle = args[0];
    prefix = args[1];
    if (!PATTERN_TAG_HANDLE.test(handle)) {
      throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
    }
    if (_hasOwnProperty$1.call(state.tagMap, handle)) {
      throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
    }
    if (!PATTERN_TAG_URI.test(prefix)) {
      throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
    }
    try {
      prefix = decodeURIComponent(prefix);
    } catch (err) {
      throwError(state, "tag prefix is malformed: " + prefix);
    }
    state.tagMap[handle] = prefix;
  }
};
function captureSegment(state, start, end, checkJson) {
  var _position, _length, _character, _result;
  if (start < end) {
    _result = state.input.slice(start, end);
    if (checkJson) {
      for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
        _character = _result.charCodeAt(_position);
        if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
          throwError(state, "expected valid JSON character");
        }
      }
    } else if (PATTERN_NON_PRINTABLE.test(_result)) {
      throwError(state, "the stream contains non-printable characters");
    }
    state.result += _result;
  }
}
function mergeMappings(state, destination, source, overridableKeys) {
  var sourceKeys, key, index, quantity;
  if (!common.isObject(source)) {
    throwError(state, "cannot merge mappings; the provided source object is unacceptable");
  }
  sourceKeys = Object.keys(source);
  for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
    key = sourceKeys[index];
    if (!_hasOwnProperty$1.call(destination, key)) {
      destination[key] = source[key];
      overridableKeys[key] = true;
    }
  }
}
function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
  var index, quantity;
  if (Array.isArray(keyNode)) {
    keyNode = Array.prototype.slice.call(keyNode);
    for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
      if (Array.isArray(keyNode[index])) {
        throwError(state, "nested arrays are not supported inside keys");
      }
      if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
        keyNode[index] = "[object Object]";
      }
    }
  }
  if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
    keyNode = "[object Object]";
  }
  keyNode = String(keyNode);
  if (_result === null) {
    _result = {};
  }
  if (keyTag === "tag:yaml.org,2002:merge") {
    if (Array.isArray(valueNode)) {
      for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
        mergeMappings(state, _result, valueNode[index], overridableKeys);
      }
    } else {
      mergeMappings(state, _result, valueNode, overridableKeys);
    }
  } else {
    if (!state.json && !_hasOwnProperty$1.call(overridableKeys, keyNode) && _hasOwnProperty$1.call(_result, keyNode)) {
      state.line = startLine || state.line;
      state.lineStart = startLineStart || state.lineStart;
      state.position = startPos || state.position;
      throwError(state, "duplicated mapping key");
    }
    if (keyNode === "__proto__") {
      Object.defineProperty(_result, keyNode, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: valueNode
      });
    } else {
      _result[keyNode] = valueNode;
    }
    delete overridableKeys[keyNode];
  }
  return _result;
}
function readLineBreak(state) {
  var ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 10) {
    state.position++;
  } else if (ch === 13) {
    state.position++;
    if (state.input.charCodeAt(state.position) === 10) {
      state.position++;
    }
  } else {
    throwError(state, "a line break is expected");
  }
  state.line += 1;
  state.lineStart = state.position;
  state.firstTabInLine = -1;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
  var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    while (is_WHITE_SPACE(ch)) {
      if (ch === 9 && state.firstTabInLine === -1) {
        state.firstTabInLine = state.position;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    if (allowComments && ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 10 && ch !== 13 && ch !== 0);
    }
    if (is_EOL(ch)) {
      readLineBreak(state);
      ch = state.input.charCodeAt(state.position);
      lineBreaks++;
      state.lineIndent = 0;
      while (ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
    } else {
      break;
    }
  }
  if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
    throwWarning(state, "deficient indentation");
  }
  return lineBreaks;
}
function testDocumentSeparator(state) {
  var _position = state.position, ch;
  ch = state.input.charCodeAt(_position);
  if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
    _position += 3;
    ch = state.input.charCodeAt(_position);
    if (ch === 0 || is_WS_OR_EOL(ch)) {
      return true;
    }
  }
  return false;
}
function writeFoldedLines(state, count) {
  if (count === 1) {
    state.result += " ";
  } else if (count > 1) {
    state.result += common.repeat("\n", count - 1);
  }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
  var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
  ch = state.input.charCodeAt(state.position);
  if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
    return false;
  }
  if (ch === 63 || ch === 45) {
    following = state.input.charCodeAt(state.position + 1);
    if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
      return false;
    }
  }
  state.kind = "scalar";
  state.result = "";
  captureStart = captureEnd = state.position;
  hasPendingContent = false;
  while (ch !== 0) {
    if (ch === 58) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
        break;
      }
    } else if (ch === 35) {
      preceding = state.input.charCodeAt(state.position - 1);
      if (is_WS_OR_EOL(preceding)) {
        break;
      }
    } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
      break;
    } else if (is_EOL(ch)) {
      _line = state.line;
      _lineStart = state.lineStart;
      _lineIndent = state.lineIndent;
      skipSeparationSpace(state, false, -1);
      if (state.lineIndent >= nodeIndent) {
        hasPendingContent = true;
        ch = state.input.charCodeAt(state.position);
        continue;
      } else {
        state.position = captureEnd;
        state.line = _line;
        state.lineStart = _lineStart;
        state.lineIndent = _lineIndent;
        break;
      }
    }
    if (hasPendingContent) {
      captureSegment(state, captureStart, captureEnd, false);
      writeFoldedLines(state, state.line - _line);
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
    }
    if (!is_WHITE_SPACE(ch)) {
      captureEnd = state.position + 1;
    }
    ch = state.input.charCodeAt(++state.position);
  }
  captureSegment(state, captureStart, captureEnd, false);
  if (state.result) {
    return true;
  }
  state.kind = _kind;
  state.result = _result;
  return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
  var ch, captureStart, captureEnd;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 39) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 39) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (ch === 39) {
        captureStart = state.position;
        state.position++;
        captureEnd = state.position;
      } else {
        return true;
      }
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a single quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
  var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 34) {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  state.position++;
  captureStart = captureEnd = state.position;
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    if (ch === 34) {
      captureSegment(state, captureStart, state.position, true);
      state.position++;
      return true;
    } else if (ch === 92) {
      captureSegment(state, captureStart, state.position, true);
      ch = state.input.charCodeAt(++state.position);
      if (is_EOL(ch)) {
        skipSeparationSpace(state, false, nodeIndent);
      } else if (ch < 256 && simpleEscapeCheck[ch]) {
        state.result += simpleEscapeMap[ch];
        state.position++;
      } else if ((tmp = escapedHexLen(ch)) > 0) {
        hexLength = tmp;
        hexResult = 0;
        for (; hexLength > 0; hexLength--) {
          ch = state.input.charCodeAt(++state.position);
          if ((tmp = fromHexCode(ch)) >= 0) {
            hexResult = (hexResult << 4) + tmp;
          } else {
            throwError(state, "expected hexadecimal character");
          }
        }
        state.result += charFromCodepoint(hexResult);
        state.position++;
      } else {
        throwError(state, "unknown escape sequence");
      }
      captureStart = captureEnd = state.position;
    } else if (is_EOL(ch)) {
      captureSegment(state, captureStart, captureEnd, true);
      writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
      captureStart = captureEnd = state.position;
    } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
      throwError(state, "unexpected end of the document within a double quoted scalar");
    } else {
      state.position++;
      captureEnd = state.position;
    }
  }
  throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
  var readNext = true, _line, _lineStart, _pos, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = /* @__PURE__ */ Object.create(null), keyNode, keyTag, valueNode, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 91) {
    terminator = 93;
    isMapping = false;
    _result = [];
  } else if (ch === 123) {
    terminator = 125;
    isMapping = true;
    _result = {};
  } else {
    return false;
  }
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(++state.position);
  while (ch !== 0) {
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === terminator) {
      state.position++;
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = isMapping ? "mapping" : "sequence";
      state.result = _result;
      return true;
    } else if (!readNext) {
      throwError(state, "missed comma between flow collection entries");
    } else if (ch === 44) {
      throwError(state, "expected the node content, but found ','");
    }
    keyTag = keyNode = valueNode = null;
    isPair = isExplicitPair = false;
    if (ch === 63) {
      following = state.input.charCodeAt(state.position + 1);
      if (is_WS_OR_EOL(following)) {
        isPair = isExplicitPair = true;
        state.position++;
        skipSeparationSpace(state, true, nodeIndent);
      }
    }
    _line = state.line;
    _lineStart = state.lineStart;
    _pos = state.position;
    composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
    keyTag = state.tag;
    keyNode = state.result;
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if ((isExplicitPair || state.line === _line) && ch === 58) {
      isPair = true;
      ch = state.input.charCodeAt(++state.position);
      skipSeparationSpace(state, true, nodeIndent);
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      valueNode = state.result;
    }
    if (isMapping) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
    } else if (isPair) {
      _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
    } else {
      _result.push(keyNode);
    }
    skipSeparationSpace(state, true, nodeIndent);
    ch = state.input.charCodeAt(state.position);
    if (ch === 44) {
      readNext = true;
      ch = state.input.charCodeAt(++state.position);
    } else {
      readNext = false;
    }
  }
  throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
  var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch === 124) {
    folding = false;
  } else if (ch === 62) {
    folding = true;
  } else {
    return false;
  }
  state.kind = "scalar";
  state.result = "";
  while (ch !== 0) {
    ch = state.input.charCodeAt(++state.position);
    if (ch === 43 || ch === 45) {
      if (CHOMPING_CLIP === chomping) {
        chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
      } else {
        throwError(state, "repeat of a chomping mode identifier");
      }
    } else if ((tmp = fromDecimalCode(ch)) >= 0) {
      if (tmp === 0) {
        throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
      } else if (!detectedIndent) {
        textIndent = nodeIndent + tmp - 1;
        detectedIndent = true;
      } else {
        throwError(state, "repeat of an indentation width identifier");
      }
    } else {
      break;
    }
  }
  if (is_WHITE_SPACE(ch)) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (is_WHITE_SPACE(ch));
    if (ch === 35) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (!is_EOL(ch) && ch !== 0);
    }
  }
  while (ch !== 0) {
    readLineBreak(state);
    state.lineIndent = 0;
    ch = state.input.charCodeAt(state.position);
    while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
      state.lineIndent++;
      ch = state.input.charCodeAt(++state.position);
    }
    if (!detectedIndent && state.lineIndent > textIndent) {
      textIndent = state.lineIndent;
    }
    if (is_EOL(ch)) {
      emptyLines++;
      continue;
    }
    if (state.lineIndent < textIndent) {
      if (chomping === CHOMPING_KEEP) {
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (chomping === CHOMPING_CLIP) {
        if (didReadContent) {
          state.result += "\n";
        }
      }
      break;
    }
    if (folding) {
      if (is_WHITE_SPACE(ch)) {
        atMoreIndented = true;
        state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      } else if (atMoreIndented) {
        atMoreIndented = false;
        state.result += common.repeat("\n", emptyLines + 1);
      } else if (emptyLines === 0) {
        if (didReadContent) {
          state.result += " ";
        }
      } else {
        state.result += common.repeat("\n", emptyLines);
      }
    } else {
      state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
    }
    didReadContent = true;
    detectedIndent = true;
    emptyLines = 0;
    captureStart = state.position;
    while (!is_EOL(ch) && ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, state.position, false);
  }
  return true;
}
function readBlockSequence(state, nodeIndent) {
  var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    if (ch !== 45) {
      break;
    }
    following = state.input.charCodeAt(state.position + 1);
    if (!is_WS_OR_EOL(following)) {
      break;
    }
    detected = true;
    state.position++;
    if (skipSeparationSpace(state, true, -1)) {
      if (state.lineIndent <= nodeIndent) {
        _result.push(null);
        ch = state.input.charCodeAt(state.position);
        continue;
      }
    }
    _line = state.line;
    composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
    _result.push(state.result);
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a sequence entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "sequence";
    state.result = _result;
    return true;
  }
  return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
  var following, allowCompact, _line, _keyLine, _keyLineStart, _keyPos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = /* @__PURE__ */ Object.create(null), keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
  if (state.firstTabInLine !== -1) return false;
  if (state.anchor !== null) {
    state.anchorMap[state.anchor] = _result;
  }
  ch = state.input.charCodeAt(state.position);
  while (ch !== 0) {
    if (!atExplicitKey && state.firstTabInLine !== -1) {
      state.position = state.firstTabInLine;
      throwError(state, "tab characters must not be used in indentation");
    }
    following = state.input.charCodeAt(state.position + 1);
    _line = state.line;
    if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
      if (ch === 63) {
        if (atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        detected = true;
        atExplicitKey = true;
        allowCompact = true;
      } else if (atExplicitKey) {
        atExplicitKey = false;
        allowCompact = true;
      } else {
        throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
      }
      state.position += 1;
      ch = following;
    } else {
      _keyLine = state.line;
      _keyLineStart = state.lineStart;
      _keyPos = state.position;
      if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
        break;
      }
      if (state.line === _line) {
        ch = state.input.charCodeAt(state.position);
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 58) {
          ch = state.input.charCodeAt(++state.position);
          if (!is_WS_OR_EOL(ch)) {
            throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
          }
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = false;
          allowCompact = false;
          keyTag = state.tag;
          keyNode = state.result;
        } else if (detected) {
          throwError(state, "can not read an implicit mapping pair; a colon is missed");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      } else if (detected) {
        throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
      } else {
        state.tag = _tag;
        state.anchor = _anchor;
        return true;
      }
    }
    if (state.line === _line || state.lineIndent > nodeIndent) {
      if (atExplicitKey) {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
      }
      if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
        if (atExplicitKey) {
          keyNode = state.result;
        } else {
          valueNode = state.result;
        }
      }
      if (!atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
        keyTag = keyNode = valueNode = null;
      }
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
    }
    if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
      throwError(state, "bad indentation of a mapping entry");
    } else if (state.lineIndent < nodeIndent) {
      break;
    }
  }
  if (atExplicitKey) {
    storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
  }
  if (detected) {
    state.tag = _tag;
    state.anchor = _anchor;
    state.kind = "mapping";
    state.result = _result;
  }
  return detected;
}
function readTagProperty(state) {
  var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 33) return false;
  if (state.tag !== null) {
    throwError(state, "duplication of a tag property");
  }
  ch = state.input.charCodeAt(++state.position);
  if (ch === 60) {
    isVerbatim = true;
    ch = state.input.charCodeAt(++state.position);
  } else if (ch === 33) {
    isNamed = true;
    tagHandle = "!!";
    ch = state.input.charCodeAt(++state.position);
  } else {
    tagHandle = "!";
  }
  _position = state.position;
  if (isVerbatim) {
    do {
      ch = state.input.charCodeAt(++state.position);
    } while (ch !== 0 && ch !== 62);
    if (state.position < state.length) {
      tagName = state.input.slice(_position, state.position);
      ch = state.input.charCodeAt(++state.position);
    } else {
      throwError(state, "unexpected end of the stream within a verbatim tag");
    }
  } else {
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      if (ch === 33) {
        if (!isNamed) {
          tagHandle = state.input.slice(_position - 1, state.position + 1);
          if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
            throwError(state, "named tag handle cannot contain such characters");
          }
          isNamed = true;
          _position = state.position + 1;
        } else {
          throwError(state, "tag suffix cannot contain exclamation marks");
        }
      }
      ch = state.input.charCodeAt(++state.position);
    }
    tagName = state.input.slice(_position, state.position);
    if (PATTERN_FLOW_INDICATORS.test(tagName)) {
      throwError(state, "tag suffix cannot contain flow indicator characters");
    }
  }
  if (tagName && !PATTERN_TAG_URI.test(tagName)) {
    throwError(state, "tag name cannot contain such characters: " + tagName);
  }
  try {
    tagName = decodeURIComponent(tagName);
  } catch (err) {
    throwError(state, "tag name is malformed: " + tagName);
  }
  if (isVerbatim) {
    state.tag = tagName;
  } else if (_hasOwnProperty$1.call(state.tagMap, tagHandle)) {
    state.tag = state.tagMap[tagHandle] + tagName;
  } else if (tagHandle === "!") {
    state.tag = "!" + tagName;
  } else if (tagHandle === "!!") {
    state.tag = "tag:yaml.org,2002:" + tagName;
  } else {
    throwError(state, 'undeclared tag handle "' + tagHandle + '"');
  }
  return true;
}
function readAnchorProperty(state) {
  var _position, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 38) return false;
  if (state.anchor !== null) {
    throwError(state, "duplication of an anchor property");
  }
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an anchor node must contain at least one character");
  }
  state.anchor = state.input.slice(_position, state.position);
  return true;
}
function readAlias(state) {
  var _position, alias, ch;
  ch = state.input.charCodeAt(state.position);
  if (ch !== 42) return false;
  ch = state.input.charCodeAt(++state.position);
  _position = state.position;
  while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
    ch = state.input.charCodeAt(++state.position);
  }
  if (state.position === _position) {
    throwError(state, "name of an alias node must contain at least one character");
  }
  alias = state.input.slice(_position, state.position);
  if (!_hasOwnProperty$1.call(state.anchorMap, alias)) {
    throwError(state, 'unidentified alias "' + alias + '"');
  }
  state.result = state.anchorMap[alias];
  skipSeparationSpace(state, true, -1);
  return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
  var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, typeList, type2, flowIndent, blockIndent;
  if (state.listener !== null) {
    state.listener("open", state);
  }
  state.tag = null;
  state.anchor = null;
  state.kind = null;
  state.result = null;
  allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
  if (allowToSeek) {
    if (skipSeparationSpace(state, true, -1)) {
      atNewLine = true;
      if (state.lineIndent > parentIndent) {
        indentStatus = 1;
      } else if (state.lineIndent === parentIndent) {
        indentStatus = 0;
      } else if (state.lineIndent < parentIndent) {
        indentStatus = -1;
      }
    }
  }
  if (indentStatus === 1) {
    while (readTagProperty(state) || readAnchorProperty(state)) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        allowBlockCollections = allowBlockStyles;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      } else {
        allowBlockCollections = false;
      }
    }
  }
  if (allowBlockCollections) {
    allowBlockCollections = atNewLine || allowCompact;
  }
  if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
    if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
      flowIndent = parentIndent;
    } else {
      flowIndent = parentIndent + 1;
    }
    blockIndent = state.position - state.lineStart;
    if (indentStatus === 1) {
      if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
        hasContent = true;
      } else {
        if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
          hasContent = true;
        } else if (readAlias(state)) {
          hasContent = true;
          if (state.tag !== null || state.anchor !== null) {
            throwError(state, "alias node should not have any properties");
          }
        } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
          hasContent = true;
          if (state.tag === null) {
            state.tag = "?";
          }
        }
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
      }
    } else if (indentStatus === 0) {
      hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
    }
  }
  if (state.tag === null) {
    if (state.anchor !== null) {
      state.anchorMap[state.anchor] = state.result;
    }
  } else if (state.tag === "?") {
    if (state.result !== null && state.kind !== "scalar") {
      throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
    }
    for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
      type2 = state.implicitTypes[typeIndex];
      if (type2.resolve(state.result)) {
        state.result = type2.construct(state.result);
        state.tag = type2.tag;
        if (state.anchor !== null) {
          state.anchorMap[state.anchor] = state.result;
        }
        break;
      }
    }
  } else if (state.tag !== "!") {
    if (_hasOwnProperty$1.call(state.typeMap[state.kind || "fallback"], state.tag)) {
      type2 = state.typeMap[state.kind || "fallback"][state.tag];
    } else {
      type2 = null;
      typeList = state.typeMap.multi[state.kind || "fallback"];
      for (typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
        if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
          type2 = typeList[typeIndex];
          break;
        }
      }
    }
    if (!type2) {
      throwError(state, "unknown tag !<" + state.tag + ">");
    }
    if (state.result !== null && type2.kind !== state.kind) {
      throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
    }
    if (!type2.resolve(state.result, state.tag)) {
      throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
    } else {
      state.result = type2.construct(state.result, state.tag);
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = state.result;
      }
    }
  }
  if (state.listener !== null) {
    state.listener("close", state);
  }
  return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
  var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
  state.version = null;
  state.checkLineBreaks = state.legacy;
  state.tagMap = /* @__PURE__ */ Object.create(null);
  state.anchorMap = /* @__PURE__ */ Object.create(null);
  while ((ch = state.input.charCodeAt(state.position)) !== 0) {
    skipSeparationSpace(state, true, -1);
    ch = state.input.charCodeAt(state.position);
    if (state.lineIndent > 0 || ch !== 37) {
      break;
    }
    hasDirectives = true;
    ch = state.input.charCodeAt(++state.position);
    _position = state.position;
    while (ch !== 0 && !is_WS_OR_EOL(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    directiveName = state.input.slice(_position, state.position);
    directiveArgs = [];
    if (directiveName.length < 1) {
      throwError(state, "directive name must not be less than one character in length");
    }
    while (ch !== 0) {
      while (is_WHITE_SPACE(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && !is_EOL(ch));
        break;
      }
      if (is_EOL(ch)) break;
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      directiveArgs.push(state.input.slice(_position, state.position));
    }
    if (ch !== 0) readLineBreak(state);
    if (_hasOwnProperty$1.call(directiveHandlers, directiveName)) {
      directiveHandlers[directiveName](state, directiveName, directiveArgs);
    } else {
      throwWarning(state, 'unknown document directive "' + directiveName + '"');
    }
  }
  skipSeparationSpace(state, true, -1);
  if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
    state.position += 3;
    skipSeparationSpace(state, true, -1);
  } else if (hasDirectives) {
    throwError(state, "directives end mark is expected");
  }
  composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
  skipSeparationSpace(state, true, -1);
  if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
    throwWarning(state, "non-ASCII line breaks are interpreted as content");
  }
  state.documents.push(state.result);
  if (state.position === state.lineStart && testDocumentSeparator(state)) {
    if (state.input.charCodeAt(state.position) === 46) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    }
    return;
  }
  if (state.position < state.length - 1) {
    throwError(state, "end of the stream or a document separator is expected");
  } else {
    return;
  }
}
function loadDocuments(input, options) {
  input = String(input);
  options = options || {};
  if (input.length !== 0) {
    if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
      input += "\n";
    }
    if (input.charCodeAt(0) === 65279) {
      input = input.slice(1);
    }
  }
  var state = new State$1(input, options);
  var nullpos = input.indexOf("\0");
  if (nullpos !== -1) {
    state.position = nullpos;
    throwError(state, "null byte is not allowed in input");
  }
  state.input += "\0";
  while (state.input.charCodeAt(state.position) === 32) {
    state.lineIndent += 1;
    state.position += 1;
  }
  while (state.position < state.length - 1) {
    readDocument(state);
  }
  return state.documents;
}
function loadAll$1(input, iterator, options) {
  if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
    options = iterator;
    iterator = null;
  }
  var documents = loadDocuments(input, options);
  if (typeof iterator !== "function") {
    return documents;
  }
  for (var index = 0, length = documents.length; index < length; index += 1) {
    iterator(documents[index]);
  }
}
function load$1(input, options) {
  var documents = loadDocuments(input, options);
  if (documents.length === 0) {
    return void 0;
  } else if (documents.length === 1) {
    return documents[0];
  }
  throw new exception("expected a single document in the stream, but found more");
}
var loadAll_1 = loadAll$1;
var load_1 = load$1;
var loader = {
  loadAll: loadAll_1,
  load: load_1
};
var _toString = Object.prototype.toString;
var _hasOwnProperty = Object.prototype.hasOwnProperty;
var CHAR_BOM = 65279;
var CHAR_TAB = 9;
var CHAR_LINE_FEED = 10;
var CHAR_CARRIAGE_RETURN = 13;
var CHAR_SPACE = 32;
var CHAR_EXCLAMATION = 33;
var CHAR_DOUBLE_QUOTE = 34;
var CHAR_SHARP = 35;
var CHAR_PERCENT = 37;
var CHAR_AMPERSAND = 38;
var CHAR_SINGLE_QUOTE = 39;
var CHAR_ASTERISK = 42;
var CHAR_COMMA = 44;
var CHAR_MINUS = 45;
var CHAR_COLON = 58;
var CHAR_EQUALS = 61;
var CHAR_GREATER_THAN = 62;
var CHAR_QUESTION = 63;
var CHAR_COMMERCIAL_AT = 64;
var CHAR_LEFT_SQUARE_BRACKET = 91;
var CHAR_RIGHT_SQUARE_BRACKET = 93;
var CHAR_GRAVE_ACCENT = 96;
var CHAR_LEFT_CURLY_BRACKET = 123;
var CHAR_VERTICAL_LINE = 124;
var CHAR_RIGHT_CURLY_BRACKET = 125;
var ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
var DEPRECATED_BOOLEANS_SYNTAX = [
  "y",
  "Y",
  "yes",
  "Yes",
  "YES",
  "on",
  "On",
  "ON",
  "n",
  "N",
  "no",
  "No",
  "NO",
  "off",
  "Off",
  "OFF"
];
var DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
function compileStyleMap(schema2, map2) {
  var result, keys, index, length, tag, style, type2;
  if (map2 === null) return {};
  result = {};
  keys = Object.keys(map2);
  for (index = 0, length = keys.length; index < length; index += 1) {
    tag = keys[index];
    style = String(map2[tag]);
    if (tag.slice(0, 2) === "!!") {
      tag = "tag:yaml.org,2002:" + tag.slice(2);
    }
    type2 = schema2.compiledTypeMap["fallback"][tag];
    if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
      style = type2.styleAliases[style];
    }
    result[tag] = style;
  }
  return result;
}
function encodeHex(character) {
  var string, handle, length;
  string = character.toString(16).toUpperCase();
  if (character <= 255) {
    handle = "x";
    length = 2;
  } else if (character <= 65535) {
    handle = "u";
    length = 4;
  } else if (character <= 4294967295) {
    handle = "U";
    length = 8;
  } else {
    throw new exception("code point within a string may not be greater than 0xFFFFFFFF");
  }
  return "\\" + handle + common.repeat("0", length - string.length) + string;
}
var QUOTING_TYPE_SINGLE = 1;
var QUOTING_TYPE_DOUBLE = 2;
function State(options) {
  this.schema = options["schema"] || _default;
  this.indent = Math.max(1, options["indent"] || 2);
  this.noArrayIndent = options["noArrayIndent"] || false;
  this.skipInvalid = options["skipInvalid"] || false;
  this.flowLevel = common.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
  this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
  this.sortKeys = options["sortKeys"] || false;
  this.lineWidth = options["lineWidth"] || 80;
  this.noRefs = options["noRefs"] || false;
  this.noCompatMode = options["noCompatMode"] || false;
  this.condenseFlow = options["condenseFlow"] || false;
  this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
  this.forceQuotes = options["forceQuotes"] || false;
  this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
  this.implicitTypes = this.schema.compiledImplicit;
  this.explicitTypes = this.schema.compiledExplicit;
  this.tag = null;
  this.result = "";
  this.duplicates = [];
  this.usedDuplicates = null;
}
function indentString(string, spaces) {
  var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
  while (position < length) {
    next = string.indexOf("\n", position);
    if (next === -1) {
      line = string.slice(position);
      position = length;
    } else {
      line = string.slice(position, next + 1);
      position = next + 1;
    }
    if (line.length && line !== "\n") result += ind;
    result += line;
  }
  return result;
}
function generateNextLine(state, level) {
  return "\n" + common.repeat(" ", state.indent * level);
}
function testImplicitResolving(state, str2) {
  var index, length, type2;
  for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
    type2 = state.implicitTypes[index];
    if (type2.resolve(str2)) {
      return true;
    }
  }
  return false;
}
function isWhitespace(c) {
  return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
  return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== CHAR_BOM || 65536 <= c && c <= 1114111;
}
function isNsCharOrWhitespace(c) {
  return isPrintable(c) && c !== CHAR_BOM && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
}
function isPlainSafe(c, prev, inblock) {
  var cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
  var cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
  return (
    // ns-plain-safe
    (inblock ? (
      // c = flow-in
      cIsNsCharOrWhitespace
    ) : cIsNsCharOrWhitespace && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && c !== CHAR_SHARP && !(prev === CHAR_COLON && !cIsNsChar) || isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || prev === CHAR_COLON && cIsNsChar
  );
}
function isPlainSafeFirst(c) {
  return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
function isPlainSafeLast(c) {
  return !isWhitespace(c) && c !== CHAR_COLON;
}
function codePointAt(string, pos) {
  var first = string.charCodeAt(pos), second;
  if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
    second = string.charCodeAt(pos + 1);
    if (second >= 56320 && second <= 57343) {
      return (first - 55296) * 1024 + second - 56320 + 65536;
    }
  }
  return first;
}
function needIndentIndicator(string) {
  var leadingSpaceRe = /^\n* /;
  return leadingSpaceRe.test(string);
}
var STYLE_PLAIN = 1;
var STYLE_SINGLE = 2;
var STYLE_LITERAL = 3;
var STYLE_FOLDED = 4;
var STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
  var i;
  var char = 0;
  var prevChar = null;
  var hasLineBreak = false;
  var hasFoldableLine = false;
  var shouldTrackWidth = lineWidth !== -1;
  var previousLineBreak = -1;
  var plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
  if (singleLineOnly || forceQuotes) {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
  } else {
    for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      if (char === CHAR_LINE_FEED) {
        hasLineBreak = true;
        if (shouldTrackWidth) {
          hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
          i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
          previousLineBreak = i;
        }
      } else if (!isPrintable(char)) {
        return STYLE_DOUBLE;
      }
      plain = plain && isPlainSafe(char, prevChar, inblock);
      prevChar = char;
    }
    hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
  }
  if (!hasLineBreak && !hasFoldableLine) {
    if (plain && !forceQuotes && !testAmbiguousType(string)) {
      return STYLE_PLAIN;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  if (indentPerLevel > 9 && needIndentIndicator(string)) {
    return STYLE_DOUBLE;
  }
  if (!forceQuotes) {
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
  }
  return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
}
function writeScalar(state, string, level, iskey, inblock) {
  state.dump = (function() {
    if (string.length === 0) {
      return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
    }
    if (!state.noCompatMode) {
      if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
      }
    }
    var indent = state.indent * Math.max(1, level);
    var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
    var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
    function testAmbiguity(string2) {
      return testImplicitResolving(state, string2);
    }
    switch (chooseScalarStyle(
      string,
      singleLineOnly,
      state.indent,
      lineWidth,
      testAmbiguity,
      state.quotingType,
      state.forceQuotes && !iskey,
      inblock
    )) {
      case STYLE_PLAIN:
        return string;
      case STYLE_SINGLE:
        return "'" + string.replace(/'/g, "''") + "'";
      case STYLE_LITERAL:
        return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
      case STYLE_FOLDED:
        return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
      case STYLE_DOUBLE:
        return '"' + escapeString(string) + '"';
      default:
        throw new exception("impossible error: invalid scalar style");
    }
  })();
}
function blockHeader(string, indentPerLevel) {
  var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
  var clip = string[string.length - 1] === "\n";
  var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
  var chomp = keep ? "+" : clip ? "" : "-";
  return indentIndicator + chomp + "\n";
}
function dropEndingNewline(string) {
  return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
  var lineRe = /(\n+)([^\n]*)/g;
  var result = (function() {
    var nextLF = string.indexOf("\n");
    nextLF = nextLF !== -1 ? nextLF : string.length;
    lineRe.lastIndex = nextLF;
    return foldLine(string.slice(0, nextLF), width);
  })();
  var prevMoreIndented = string[0] === "\n" || string[0] === " ";
  var moreIndented;
  var match;
  while (match = lineRe.exec(string)) {
    var prefix = match[1], line = match[2];
    moreIndented = line[0] === " ";
    result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
    prevMoreIndented = moreIndented;
  }
  return result;
}
function foldLine(line, width) {
  if (line === "" || line[0] === " ") return line;
  var breakRe = / [^ ]/g;
  var match;
  var start = 0, end, curr = 0, next = 0;
  var result = "";
  while (match = breakRe.exec(line)) {
    next = match.index;
    if (next - start > width) {
      end = curr > start ? curr : next;
      result += "\n" + line.slice(start, end);
      start = end + 1;
    }
    curr = next;
  }
  result += "\n";
  if (line.length - start > width && curr > start) {
    result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
  } else {
    result += line.slice(start);
  }
  return result.slice(1);
}
function escapeString(string) {
  var result = "";
  var char = 0;
  var escapeSeq;
  for (var i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
    char = codePointAt(string, i);
    escapeSeq = ESCAPE_SEQUENCES[char];
    if (!escapeSeq && isPrintable(char)) {
      result += string[i];
      if (char >= 65536) result += string[i + 1];
    } else {
      result += escapeSeq || encodeHex(char);
    }
  }
  return result;
}
function writeFlowSequence(state, level, object) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
      if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = "[" + _result + "]";
}
function writeBlockSequence(state, level, object, compact) {
  var _result = "", _tag = state.tag, index, length, value;
  for (index = 0, length = object.length; index < length; index += 1) {
    value = object[index];
    if (state.replacer) {
      value = state.replacer.call(object, String(index), value);
    }
    if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
      if (!compact || _result !== "") {
        _result += generateNextLine(state, level);
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        _result += "-";
      } else {
        _result += "- ";
      }
      _result += state.dump;
    }
  }
  state.tag = _tag;
  state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (_result !== "") pairBuffer += ", ";
    if (state.condenseFlow) pairBuffer += '"';
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level, objectKey, false, false)) {
      continue;
    }
    if (state.dump.length > 1024) pairBuffer += "? ";
    pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
    if (!writeNode(state, level, objectValue, false, false)) {
      continue;
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = "{" + _result + "}";
}
function writeBlockMapping(state, level, object, compact) {
  var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
  if (state.sortKeys === true) {
    objectKeyList.sort();
  } else if (typeof state.sortKeys === "function") {
    objectKeyList.sort(state.sortKeys);
  } else if (state.sortKeys) {
    throw new exception("sortKeys must be a boolean or a function");
  }
  for (index = 0, length = objectKeyList.length; index < length; index += 1) {
    pairBuffer = "";
    if (!compact || _result !== "") {
      pairBuffer += generateNextLine(state, level);
    }
    objectKey = objectKeyList[index];
    objectValue = object[objectKey];
    if (state.replacer) {
      objectValue = state.replacer.call(object, objectKey, objectValue);
    }
    if (!writeNode(state, level + 1, objectKey, true, true, true)) {
      continue;
    }
    explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
    if (explicitPair) {
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += "?";
      } else {
        pairBuffer += "? ";
      }
    }
    pairBuffer += state.dump;
    if (explicitPair) {
      pairBuffer += generateNextLine(state, level);
    }
    if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
      continue;
    }
    if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
      pairBuffer += ":";
    } else {
      pairBuffer += ": ";
    }
    pairBuffer += state.dump;
    _result += pairBuffer;
  }
  state.tag = _tag;
  state.dump = _result || "{}";
}
function detectType(state, object, explicit) {
  var _result, typeList, index, length, type2, style;
  typeList = explicit ? state.explicitTypes : state.implicitTypes;
  for (index = 0, length = typeList.length; index < length; index += 1) {
    type2 = typeList[index];
    if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
      if (explicit) {
        if (type2.multi && type2.representName) {
          state.tag = type2.representName(object);
        } else {
          state.tag = type2.tag;
        }
      } else {
        state.tag = "?";
      }
      if (type2.represent) {
        style = state.styleMap[type2.tag] || type2.defaultStyle;
        if (_toString.call(type2.represent) === "[object Function]") {
          _result = type2.represent(object, style);
        } else if (_hasOwnProperty.call(type2.represent, style)) {
          _result = type2.represent[style](object, style);
        } else {
          throw new exception("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
        }
        state.dump = _result;
      }
      return true;
    }
  }
  return false;
}
function writeNode(state, level, object, block, compact, iskey, isblockseq) {
  state.tag = null;
  state.dump = object;
  if (!detectType(state, object, false)) {
    detectType(state, object, true);
  }
  var type2 = _toString.call(state.dump);
  var inblock = block;
  var tagStr;
  if (block) {
    block = state.flowLevel < 0 || state.flowLevel > level;
  }
  var objectOrArray = type2 === "[object Object]" || type2 === "[object Array]", duplicateIndex, duplicate;
  if (objectOrArray) {
    duplicateIndex = state.duplicates.indexOf(object);
    duplicate = duplicateIndex !== -1;
  }
  if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
    compact = false;
  }
  if (duplicate && state.usedDuplicates[duplicateIndex]) {
    state.dump = "*ref_" + duplicateIndex;
  } else {
    if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
      state.usedDuplicates[duplicateIndex] = true;
    }
    if (type2 === "[object Object]") {
      if (block && Object.keys(state.dump).length !== 0) {
        writeBlockMapping(state, level, state.dump, compact);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowMapping(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object Array]") {
      if (block && state.dump.length !== 0) {
        if (state.noArrayIndent && !isblockseq && level > 0) {
          writeBlockSequence(state, level - 1, state.dump, compact);
        } else {
          writeBlockSequence(state, level, state.dump, compact);
        }
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + state.dump;
        }
      } else {
        writeFlowSequence(state, level, state.dump);
        if (duplicate) {
          state.dump = "&ref_" + duplicateIndex + " " + state.dump;
        }
      }
    } else if (type2 === "[object String]") {
      if (state.tag !== "?") {
        writeScalar(state, state.dump, level, iskey, inblock);
      }
    } else if (type2 === "[object Undefined]") {
      return false;
    } else {
      if (state.skipInvalid) return false;
      throw new exception("unacceptable kind of an object to dump " + type2);
    }
    if (state.tag !== null && state.tag !== "?") {
      tagStr = encodeURI(
        state.tag[0] === "!" ? state.tag.slice(1) : state.tag
      ).replace(/!/g, "%21");
      if (state.tag[0] === "!") {
        tagStr = "!" + tagStr;
      } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
        tagStr = "!!" + tagStr.slice(18);
      } else {
        tagStr = "!<" + tagStr + ">";
      }
      state.dump = tagStr + " " + state.dump;
    }
  }
  return true;
}
function getDuplicateReferences(object, state) {
  var objects = [], duplicatesIndexes = [], index, length;
  inspectNode(object, objects, duplicatesIndexes);
  for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
    state.duplicates.push(objects[duplicatesIndexes[index]]);
  }
  state.usedDuplicates = new Array(length);
}
function inspectNode(object, objects, duplicatesIndexes) {
  var objectKeyList, index, length;
  if (object !== null && typeof object === "object") {
    index = objects.indexOf(object);
    if (index !== -1) {
      if (duplicatesIndexes.indexOf(index) === -1) {
        duplicatesIndexes.push(index);
      }
    } else {
      objects.push(object);
      if (Array.isArray(object)) {
        for (index = 0, length = object.length; index < length; index += 1) {
          inspectNode(object[index], objects, duplicatesIndexes);
        }
      } else {
        objectKeyList = Object.keys(object);
        for (index = 0, length = objectKeyList.length; index < length; index += 1) {
          inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
        }
      }
    }
  }
}
function dump$1(input, options) {
  options = options || {};
  var state = new State(options);
  if (!state.noRefs) getDuplicateReferences(input, state);
  var value = input;
  if (state.replacer) {
    value = state.replacer.call({ "": value }, "", value);
  }
  if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
  return "";
}
var dump_1 = dump$1;
var dumper = {
  dump: dump_1
};
function renamed(from, to) {
  return function() {
    throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
  };
}
var Type = type;
var Schema = schema;
var FAILSAFE_SCHEMA = failsafe;
var JSON_SCHEMA = json;
var CORE_SCHEMA = core;
var DEFAULT_SCHEMA = _default;
var load = loader.load;
var loadAll = loader.loadAll;
var dump = dumper.dump;
var YAMLException = exception;
var types = {
  binary,
  float,
  map,
  null: _null,
  pairs,
  set,
  timestamp,
  bool,
  int,
  merge,
  omap,
  seq,
  str
};
var safeLoad = renamed("safeLoad", "load");
var safeLoadAll = renamed("safeLoadAll", "loadAll");
var safeDump = renamed("safeDump", "dump");
var jsYaml = {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
};
var js_yaml_default = jsYaml;

// modules/system/index.js
var REQUIRED_DIRS = ["memory", "modules", "config"];
var REQUIRED_FILES = ["package.json", "manifest.yaml", "index.js"];
async function selfDescribe() {
  const manifestPath = path4.join(process.cwd(), "manifest.yaml");
  try {
    const fileContents = await fs4.readFile(manifestPath, "utf8");
    const manifest = js_yaml_default.load(fileContents);
    return {
      system_name: manifest.system_name,
      version: manifest.version,
      modules: (manifest.modules || []).map((m) => m.name),
      audit_ready: !!manifest.audit_ready
    };
  } catch (error) {
    console.error("\u274C Could not read or parse manifest.yaml:", error);
    throw new Error("Failed to self-describe system.");
  }
}
async function validateStructure() {
  console.log("\u2699\uFE0F Validating project structure...");
  try {
    for (const dir of REQUIRED_DIRS) {
      await fs4.access(path4.join(process.cwd(), dir));
    }
    for (const file of REQUIRED_FILES) {
      await fs4.access(path4.join(process.cwd(), file));
    }
    console.log("\u2705 Project structure is valid.");
    return true;
  } catch (error) {
    console.error(`\u274C Invalid project structure. Missing: ${error.path}`);
    throw new Error(`Project structure validation failed. Missing: ${error.path}`);
  }
}
async function ensureBaseline() {
  console.log("\u2699\uFE0F Ensuring baseline configuration...");
  try {
    const memoryDir = path4.join(process.cwd(), "memory");
    await fs4.mkdir(memoryDir, { recursive: true });
    console.log("\u2705 Baseline directories are in place.");
  } catch (error) {
    console.error("\u274C Failed to create baseline directories:", error);
    throw new Error("Baseline configuration failed.");
  }
}

// modules/auto_tag_service/index.js
var auto_tag_service_exports = {};
__export(auto_tag_service_exports, {
  autoTagOnObservations: () => autoTagOnObservations,
  clearCache: () => clearCache2,
  getStats: () => getStats,
  healthCheck: () => healthCheck2,
  initialize: () => initialize2,
  searchByTags: () => searchByTags
});
import fs5 from "fs/promises";
import path5 from "path";
import { pipeline } from "@xenova/transformers";
var CONFIG2 = {
  mode: process.env.TAG_MODE || "basic",
  // 'basic', 'advanced', 'ml'
  minTagLength: 3,
  maxTagsPerEntity: 8,
  minTagFrequency: 2,
  confidenceThreshold: 0.6,
  language: "th",
  // Thai language support
  cacheTags: true,
  useStemming: false,
  // Stemming สำหรับภาษาอังกฤษ
  thaiSupport: true,
  // รองรับภาษาไทย
  stopWords: {
    en: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "i"],
    th: ["\u0E17\u0E35\u0E48", "\u0E41\u0E25\u0E30", "\u0E40\u0E1B\u0E47\u0E19", "\u0E43\u0E19", "\u0E02\u0E2D\u0E07", "\u0E21\u0E35", "\u0E08\u0E30", "\u0E44\u0E21\u0E48", "\u0E08\u0E32\u0E01", "\u0E01\u0E31\u0E1A"]
  }
};
var TAG_MODEL_PATH = path5.join(process.cwd(), "memory", "tag_model.json");
var TAG_CACHE_PATH = path5.join(process.cwd(), "memory", "tag_cache.json");
var tagCache = /* @__PURE__ */ new Map();
var keywordIndex = /* @__PURE__ */ new Map();
var modelStats = {
  totalEntitiesTagged: 0,
  totalTagsGenerated: 0,
  uniqueTags: 0,
  accuracy: 0
  // Mock value
};
async function initialize2() {
  console.log(`\u{1F3F7}\uFE0F \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 Auto-Tagging Service (mode: ${CONFIG2.mode}, language: ${CONFIG2.language})`);
  try {
    const memoryDir = path5.dirname(TAG_MODEL_PATH);
    await fs5.mkdir(memoryDir, { recursive: true });
    await loadTagModel();
    await loadTagCache();
    await buildKeywordIndex();
    if (CONFIG2.thaiSupport) {
      console.log("\u{1F30F} \u0E40\u0E1B\u0E34\u0E14\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 Thai language support");
    }
    console.log(`\u2705 Auto-tagging service \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 - Cache: ${tagCache.size} entities, Keywords: ${keywordIndex.size}`);
    return {
      status: "ready",
      mode: CONFIG2.mode,
      language: CONFIG2.language,
      cacheSize: tagCache.size,
      uniqueKeywords: keywordIndex.size
    };
  } catch (error) {
    console.error("\u274C Error initializing auto-tagging service:", error);
    throw new Error(`Auto-tagging service initialization failed: ${error.message}`);
  }
}
async function loadTagModel() {
  try {
    const data = await fs5.readFile(TAG_MODEL_PATH, "utf8");
    if (data.trim()) {
      const model = JSON.parse(data);
      modelStats = {
        ...modelStats,
        ...model.stats,
        totalEntitiesTagged: model.totalEntitiesTagged || 0,
        totalTagsGenerated: model.totalTagsGenerated || 0,
        uniqueTags: model.uniqueTags || 0
      };
      console.log(`\u{1F4C2} \u0E42\u0E2B\u0E25\u0E14 tag model - ${modelStats.totalEntitiesTagged} entities tagged`);
    }
  } catch (error) {
    console.log("\u{1F4DD} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 tag model \u0E43\u0E2B\u0E21\u0E48");
    await saveTagModel();
  }
}
async function loadTagCache() {
  try {
    const data = await fs5.readFile(TAG_CACHE_PATH, "utf8");
    if (data.trim()) {
      const cache = JSON.parse(data);
      Object.entries(cache).forEach(([entityName, tags]) => {
        tagCache.set(entityName, tags);
      });
      modelStats.totalEntitiesTagged = tagCache.size;
      console.log(`\u{1F4C2} \u0E42\u0E2B\u0E25\u0E14 tag cache - ${tagCache.size} entities`);
    }
  } catch (error) {
    console.log("\u{1F4DD} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 tag cache \u0E43\u0E2B\u0E21\u0E48");
  }
}
async function saveTagModel() {
  try {
    const modelData = {
      version: "1.0.0",
      config: CONFIG2,
      stats: modelStats,
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      totalEntitiesTagged: modelStats.totalEntitiesTagged,
      totalTagsGenerated: modelStats.totalTagsGenerated,
      uniqueTags: modelStats.uniqueTags
    };
    await fs5.writeFile(TAG_MODEL_PATH, JSON.stringify(modelData, null, 2), "utf8");
  } catch (error) {
    console.error("\u26A0\uFE0F  \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 tag model:", error.message);
  }
}
async function buildKeywordIndex() {
  try {
    console.log("\u{1F50D} \u0E2A\u0E23\u0E49\u0E32\u0E07 keyword index \u0E08\u0E32\u0E01 existing entities");
    keywordIndex.clear();
    modelStats.uniqueTags = 0;
    tagCache.forEach((tags, entityName) => {
      tags.forEach((tag) => {
        if (!keywordIndex.has(tag)) {
          keywordIndex.set(tag, /* @__PURE__ */ new Set());
        }
        keywordIndex.get(tag).add(entityName);
        modelStats.uniqueTags++;
      });
    });
    console.log(`\u2705 Keyword index \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22 - ${keywordIndex.size} unique tags`);
  } catch (error) {
    console.error("\u274C Error building keyword index:", error);
  }
}
async function autoTagOnObservations(observations, options = {}) {
  const {
    confidenceThreshold = CONFIG2.confidenceThreshold,
    maxTags = CONFIG2.maxTagsPerEntity,
    mode = CONFIG2.mode
  } = options;
  console.log(`\u{1F3F7}\uFE0F Auto-tagging ${observations.length} observations (mode: ${mode}, threshold: ${confidenceThreshold})`);
  try {
    const taggedObservations = [];
    let totalNewTags = 0;
    for (const obs of observations) {
      const { entityName, contents } = obs;
      const allText = Array.isArray(contents) ? contents.join(" ") : String(contents || "");
      if (!allText.trim()) {
        console.warn(`\u26A0\uFE0F  \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E27\u0E48\u0E32\u0E07\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A entity: ${entityName}`);
        taggedObservations.push({ ...obs, autoTags: [], confidence: 0 });
        continue;
      }
      let generatedTags = [];
      switch (mode) {
        case "advanced":
          generatedTags = await advancedTagging(allText, entityName);
          break;
        case "ml":
          generatedTags = await mlTagging(allText, entityName);
          break;
        case "basic":
        default:
          generatedTags = basicKeywordExtraction(allText, entityName);
          break;
      }
      const filteredTags = filterAndRankTags(generatedTags, {
        minLength: CONFIG2.minTagLength,
        maxTags,
        threshold: confidenceThreshold,
        entityName
      });
      const taggedObs = {
        ...obs,
        autoTags: filteredTags.tags,
        tagConfidence: filteredTags.confidenceScores,
        totalTags: filteredTags.tags.length,
        processedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      taggedObservations.push(taggedObs);
      totalNewTags += filteredTags.tags.length;
      console.log(`\u2705 Tagging \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A ${entityName}: ${filteredTags.tags.length} tags (top: ${filteredTags.tags.slice(0, 3).join(", ")})`);
    }
    modelStats.totalTagsGenerated += totalNewTags;
    modelStats.totalEntitiesTagged = Math.max(modelStats.totalEntitiesTagged, tagCache.size + observations.length);
    if (CONFIG2.cacheTags) {
      await updateTagCache(taggedObservations);
    }
    console.log(`\u2705 Auto-tagging \u0E40\u0E2A\u0E23\u0E47\u0E08\u0E2A\u0E34\u0E49\u0E19 - ${totalNewTags} tags \u0E43\u0E2B\u0E21\u0E48\u0E08\u0E32\u0E01 ${observations.length} observations`);
    return taggedObservations;
  } catch (error) {
    console.error("\u274C Error in auto-tagging:", error);
    throw new Error(`Auto-tagging failed: ${error.message}`);
  }
}
function basicKeywordExtraction(text, entityName) {
  console.log(`\u{1F50D} Basic keyword extraction \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "${entityName}"`);
  let cleanText = text.toLowerCase().replace(/[^\w\sก-ฮ]/g, " ").replace(/\s+/g, " ").trim();
  const words = cleanText.split(" ");
  const languageStopWords = CONFIG2.stopWords[CONFIG2.language] || [];
  const filteredWords = words.filter(
    (word) => word.length >= CONFIG2.minTagLength && !languageStopWords.includes(word)
  );
  const wordFreq = {};
  filteredWords.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const sortedWords = Object.entries(wordFreq).filter(([, freq]) => freq >= CONFIG2.minTagFrequency).sort(([, a], [, b]) => b - a).slice(0, CONFIG2.maxTagsPerEntity).map(([word]) => word);
  const confidence = Math.min(sortedWords.length / CONFIG2.maxTagsPerEntity, 1);
  return {
    tags: sortedWords,
    confidence,
    source: "basic_keyword",
    wordCount: filteredWords.length,
    uniqueWords: new Set(filteredWords).size
  };
}
async function advancedTagging(text, entityName) {
  console.log(`\u{1F9E0} Advanced tagging \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A "${entityName}"`);
  try {
    const basicTags = basicKeywordExtraction(text, entityName);
    const nounPhrases = extractNounPhrases(text);
    const entities = extractNamedEntities(text);
    const allTags = [
      ...basicTags.tags,
      ...nounPhrases.slice(0, 3),
      ...entities.slice(0, 2)
    ].filter(
      (tag, index, arr) => tag.length >= CONFIG2.minTagLength && arr.indexOf(tag) === index
    ).slice(0, CONFIG2.maxTagsPerEntity);
    const confidence = calculateAdvancedConfidence(allTags, text);
    return {
      tags: allTags,
      confidence,
      source: "advanced_nlp",
      components: {
        keywords: basicTags.tags.length,
        nounPhrases: nounPhrases.length,
        entities: entities.length
      }
    };
  } catch (error) {
    console.error("\u26A0\uFE0F  Advanced tagging failed, fallback to basic:", error.message);
    return basicKeywordExtraction(text, entityName);
  }
}
var classifier = null;
async function mlTagging(text, entityName) {
  console.log(`\u{1F916} ML-based tagging for "${entityName}" (using @xenova/transformers)`);
  if (!classifier) {
    console.log("\u{1F916} Initializing zero-shot classification pipeline...");
    classifier = await pipeline("zero-shot-classification", "Xenova/bart-large-mnli");
    console.log("\u2705 Pipeline initialized.");
  }
  const candidateLabels = ["technology", "business", "science", "health", "art", "politics", "sports", "education", "engineering", "software", "AI", "machine learning"];
  try {
    const output = await classifier(text, candidateLabels);
    const mlPredictions = output.labels.map((label, i) => ({
      tag: label,
      confidence: output.scores[i]
    }));
    const filtered = mlPredictions.filter((pred) => pred.confidence >= CONFIG2.confidenceThreshold).sort((a, b) => b.confidence - a.confidence).slice(0, CONFIG2.maxTagsPerEntity);
    const finalTags = filtered.map((pred) => pred.tag);
    const avgConfidence = filtered.reduce((sum, pred) => sum + pred.confidence, 0) / (filtered.length || 1);
    return {
      tags: finalTags,
      confidence: avgConfidence,
      source: "ml_model",
      predictions: filtered.length,
      model: "Xenova/bart-large-mnli"
    };
  } catch (error) {
    console.error(`\u274C Error during ML tagging for "${entityName}":`, error);
    return basicKeywordExtraction(text, entityName);
  }
}
function extractNounPhrases(text) {
  const patterns = [
    /(\w+(?:\s+\w+){0,2})/g,
    // 1-3 word phrases
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
    // Proper nouns
  ];
  const phrases = /* @__PURE__ */ new Set();
  patterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      const phrase = match.trim();
      if (phrase.length >= CONFIG2.minTagLength && phrase.length <= 20) {
        phrases.add(phrase.toLowerCase());
      }
    });
  });
  return Array.from(phrases).slice(0, 5);
}
function extractNamedEntities(text) {
  const entityPatterns = [
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)?\b/g,
    // Proper nouns
    /\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?\b/g
    // Technical terms
  ];
  const entities = /* @__PURE__ */ new Set();
  entityPatterns.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((match) => {
      if (match.length >= 3 && match.length <= 15) {
        entities.add(match);
      }
    });
  });
  return Array.from(entities).slice(0, 3);
}
function filterAndRankTags(generatedTags, options = {}) {
  const {
    minLength = CONFIG2.minTagLength,
    maxTags = CONFIG2.maxTagsPerEntity,
    threshold = CONFIG2.confidenceThreshold,
    entityName
  } = options;
  let filteredTags = generatedTags.tags.filter(
    (tag) => typeof tag === "string" && tag.length >= minLength && tag.length <= 20 && !CONFIG2.stopWords[CONFIG2.language].includes(tag.toLowerCase())
  );
  filteredTags = [...new Set(filteredTags)].sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length;
    }
    return a.localeCompare(b);
  }).slice(0, maxTags);
  const confidenceScores = filteredTags.map((tag) => {
    const baseScore = Math.min(tag.length / 10, 1);
    const randomFactor = 0.7 + Math.random() * 0.3;
    return Math.max(threshold, baseScore * randomFactor);
  });
  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  return {
    tags: filteredTags,
    confidenceScores,
    overallConfidence: avgConfidence,
    filteredCount: filteredTags.length,
    originalCount: generatedTags.tags.length
  };
}
function calculateAdvancedConfidence(tags, text) {
  if (tags.length === 0) return 0;
  const textLength = text.length;
  const avgTagLength = tags.reduce((sum, tag) => sum + tag.length, 0) / tags.length;
  const uniqueness = new Set(tags).size / tags.length;
  let confidence = 0.5;
  if (avgTagLength >= 5) confidence += 0.2;
  if (avgTagLength <= 12) confidence += 0.1;
  if (uniqueness > 0.8) confidence += 0.15;
  const totalTagChars = tags.reduce((sum, tag) => sum + tag.length, 0);
  const coverage = Math.min(totalTagChars / textLength, 1);
  confidence += coverage * 0.1;
  return Math.min(confidence, 1);
}
async function updateTagCache(observations) {
  try {
    const updatedCache = new Map(tagCache);
    observations.forEach((obs) => {
      if (obs.autoTags && obs.autoTags.length > 0) {
        updatedCache.set(obs.entityName, obs.autoTags);
        obs.autoTags.forEach((tag) => {
          if (!keywordIndex.has(tag)) {
            keywordIndex.set(tag, /* @__PURE__ */ new Set());
          }
          keywordIndex.get(tag).add(obs.entityName);
        });
      }
    });
    const cacheData = Object.fromEntries(updatedCache);
    await fs5.writeFile(TAG_CACHE_PATH, JSON.stringify(cacheData, null, 2), "utf8");
    modelStats.totalEntitiesTagged = updatedCache.size;
  } catch (error) {
    console.error("\u26A0\uFE0F  \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15 tag cache:", error.message);
  }
}
async function searchByTags(tags, options = {}) {
  const {
    exactMatch = true,
    limit = 50,
    combine = "any"
    // 'any', 'all'
  } = options;
  console.log(`\u{1F50D} \u0E04\u0E49\u0E19\u0E2B\u0E32\u0E42\u0E14\u0E22 tags: [${tags.join(", ")}] (${combine} match, limit: ${limit})`);
  try {
    let results = [];
    if (exactMatch) {
      if (combine === "all") {
        const commonEntities = tags.reduce((common2, tag) => {
          if (!keywordIndex.has(tag)) return common2;
          return common2 ? [.../* @__PURE__ */ new Set([...common2, ...keywordIndex.get(tag)])] : keywordIndex.get(tag);
        }, /* @__PURE__ */ new Set());
        results = Array.from(commonEntities).slice(0, limit);
      } else {
        const allEntities = /* @__PURE__ */ new Set();
        tags.forEach((tag) => {
          if (keywordIndex.has(tag)) {
            keywordIndex.get(tag).forEach((entity) => allEntities.add(entity));
          }
        });
        results = Array.from(allEntities).slice(0, limit);
      }
    } else {
      results = Array.from(tagCache.entries()).filter(
        ([entityName, entityTags]) => tags.some(
          (tag) => entityTags.some(
            (eTag) => eTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      ).map(([entityName]) => entityName).slice(0, limit);
    }
    const enrichedResults = results.map((entityName) => {
      const entityTags = tagCache.get(entityName) || [];
      const matchedTags = tags.filter(
        (tag) => entityTags.some(
          (eTag) => eTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      return {
        entityName,
        tags: entityTags,
        matchedTags,
        matchType: exactMatch ? "exact" : "fuzzy",
        score: calculateTagMatchScore(entityTags, tags)
      };
    });
    console.log(`\u2705 \u0E1E\u0E1A ${enrichedResults.length} entities \u0E17\u0E35\u0E48 match \u0E01\u0E31\u0E1A tags`);
    return enrichedResults;
  } catch (error) {
    console.error("\u274C Error searching by tags:", error);
    throw error;
  }
}
function calculateTagMatchScore(entityTags, searchTags) {
  if (entityTags.length === 0) return 0;
  let score = 0;
  searchTags.forEach((searchTag) => {
    entityTags.forEach((entityTag) => {
      if (entityTag.toLowerCase().includes(searchTag.toLowerCase())) {
        if (entityTag.toLowerCase() === searchTag.toLowerCase()) {
          score += 1;
        } else {
          const ratio = searchTag.length / entityTag.length;
          score += ratio * 0.7;
        }
      }
    });
  });
  return Math.min(score / searchTags.length, 1);
}
async function clearCache2() {
  console.log("\u{1F9F9} \u0E40\u0E04\u0E25\u0E35\u0E22\u0E23\u0E4C auto-tagging cache");
  try {
    tagCache.clear();
    keywordIndex.clear();
    modelStats = {
      totalEntitiesTagged: 0,
      totalTagsGenerated: 0,
      uniqueTags: 0,
      accuracy: 0
    };
    try {
      await fs5.unlink(TAG_CACHE_PATH);
      await fs5.unlink(TAG_MODEL_PATH);
      console.log("\u{1F4BE} \u0E25\u0E1A tag cache \u0E41\u0E25\u0E30 model files");
    } catch (error) {
    }
    await buildKeywordIndex();
    console.log("\u2705 Auto-tagging cache cleared");
    return true;
  } catch (error) {
    console.error("\u274C Error clearing cache:", error);
    throw error;
  }
}
async function getStats() {
  return {
    module: "auto_tag_service",
    status: "ready",
    mode: CONFIG2.mode,
    language: CONFIG2.language,
    stats: modelStats,
    cache: {
      entitiesTagged: tagCache.size,
      uniqueKeywords: keywordIndex.size,
      avgTagsPerEntity: tagCache.size > 0 ? modelStats.totalTagsGenerated / tagCache.size : 0
    },
    config: {
      maxTagsPerEntity: CONFIG2.maxTagsPerEntity,
      confidenceThreshold: CONFIG2.confidenceThreshold,
      thaiSupport: CONFIG2.thaiSupport
    }
  };
}
async function healthCheck2() {
  return {
    module: "auto_tag_service",
    status: "ready",
    mode: CONFIG2.mode,
    entitiesTagged: modelStats.totalEntitiesTagged,
    tagsGenerated: modelStats.totalTagsGenerated,
    uniqueTags: modelStats.uniqueTags,
    cacheSize: tagCache.size,
    keywordIndexSize: keywordIndex.size,
    config: {
      language: CONFIG2.language,
      thaiSupport: CONFIG2.thaiSupport,
      confidenceThreshold: CONFIG2.confidenceThreshold
    },
    lastUpdated: modelStats.lastUpdated || (/* @__PURE__ */ new Date()).toISOString()
  };
}

// modules/workflow_engine/index.js
var workflow_engine_exports = {};
__export(workflow_engine_exports, {
  executeWorkflow: () => executeWorkflow
});
function resolveContextPath(path7, context) {
  return path7.split(".").reduce((acc, part) => {
    if (acc === void 0) return void 0;
    if (/^\d+$/.test(part)) {
      return acc[parseInt(part, 10)];
    }
    return acc[part];
  }, context);
}
function resolveParams(params, context) {
  const resolvedParams = {};
  for (const key in params) {
    const value = params[key];
    if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
      const path7 = value.substring(2, value.length - 2).trim();
      resolvedParams[key] = resolveContextPath(path7, context);
    } else {
      resolvedParams[key] = value;
    }
  }
  return resolvedParams;
}
async function executeWorkflow(workflow) {
  const context = {
    steps: []
  };
  console.log(`\u{1F680} Starting workflow with ${workflow.length} steps.`);
  for (let i = 0; i < workflow.length; i++) {
    const step = workflow[i];
    console.log(`\u25B6\uFE0F Executing step ${i + 1}: ${step.action}`);
    try {
      const params = resolveParams(step.params || {}, context);
      let result;
      switch (step.action) {
        case "semanticSearch":
          result = await semanticSearch2(params.query, params.options);
          break;
        case "createEntity":
          result = await createEntities2([params.entity]);
          break;
        case "createRelation":
          result = await createRelations2([params.relation]);
          break;
        case "getLineage":
          result = await memory_graph_exports.getLineage(params.entityName, params.options);
          break;
        // Add other actions here as needed
        default:
          throw new Error(`Unknown action: ${step.action}`);
      }
      context.steps[i] = {
        action: step.action,
        status: "success",
        results: result
      };
      console.log(`\u2705 Step ${i + 1} successful.`);
    } catch (error) {
      console.error(`\u274C Error in step ${i + 1} (${step.action}):`, error);
      context.steps[i] = {
        action: step.action,
        status: "error",
        error: error.message
      };
      return context;
    }
  }
  console.log("\u{1F3C1} Workflow finished successfully.");
  return context;
}

// index.js
import fs6 from "fs/promises";
import path6 from "path";
var Lineage = {
  // Lineage logging system - บันทึก operations ใน JSON log
  async log(action, data) {
    const logEntry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      data: { ...data, user: process.env.USER || "system" },
      ip: process.env.NODE_ENV === "production" ? "remote" : "localhost"
    };
    const logPath = path6.join(process.cwd(), "memory", "lineage_log.json");
    let logs = [];
    try {
      const logData = await fs6.readFile(logPath, "utf8");
      if (logData.trim()) {
        logs = JSON.parse(logData);
      }
    } catch (error) {
      console.log("\u{1F4DD} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 lineage log \u0E43\u0E2B\u0E21\u0E48");
    }
    logs.unshift(logEntry);
    logs = logs.slice(0, 1e3);
    try {
      await fs6.writeFile(logPath, JSON.stringify(logs, null, 2), "utf8");
      console.log(`\u{1F4DD} Lineage: ${action} (${data.count || data.entities?.length || 1} items)`);
    } catch (writeError) {
      console.error("\u26A0\uFE0F  \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E1A\u0E31\u0E19\u0E17\u0E36\u0E01 lineage log:", writeError.message);
    }
    return logEntry;
  }
};
async function ensureInitialized() {
  console.log("\u{1F680} \u0E40\u0E23\u0E34\u0E48\u0E21\u0E15\u0E49\u0E19 Explicit Agent Protocol + KG Memory...");
  try {
    await validateStructure();
    console.log("\u2705 \u0E42\u0E04\u0E23\u0E07\u0E2A\u0E23\u0E49\u0E32\u0E07\u0E42\u0E1B\u0E23\u0E40\u0E08\u0E47\u0E01\u0E15\u0E4C\u0E1C\u0E48\u0E32\u0E19\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A");
    await ensureBaseline();
    console.log("\u2705 Baseline configuration \u0E2A\u0E23\u0E49\u0E32\u0E07\u0E40\u0E23\u0E35\u0E22\u0E1A\u0E23\u0E49\u0E2D\u0E22");
    await initialize();
    await initialize2();
    await ensureStore();
    console.log("\u2705 Memory Graph store \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19");
    const rootMemory = await ensureRoot();
    console.log(`\u2705 Root Memory Node (${rootMemory?.name || "memory0"}) \u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19`);
    console.log("\u{1F9EA} \u0E17\u0E14\u0E2A\u0E2D\u0E1A basic functionality...");
    const testEntity = await createEntities2([{
      name: "test-system",
      type: "system",
      observations: ["Test entity for initialization"]
    }], { autoTag: false, linkToMemory0: true });
    console.log(`\u2705 \u0E23\u0E30\u0E1A\u0E1A\u0E1E\u0E23\u0E49\u0E2D\u0E21\u0E43\u0E0A\u0E49\u0E07\u0E32\u0E19 - \u0E2A\u0E23\u0E49\u0E32\u0E07 ${testEntity.length} test entities`);
  } catch (error) {
    console.error("\u274C Error during system initialization:", error);
    throw new Error(`Initialization failed: ${error.message}`);
  }
}
async function createEntities2(entities, options = {}) {
  const { autoTag = true, linkToMemory0 = true } = options;
  console.log(`\u{1F195} \u0E2A\u0E23\u0E49\u0E32\u0E07 ${entities.length} entities`);
  try {
    const created = await createEntities(entities);
    await Lineage.log("create_entities", {
      count: created.length,
      types: [...new Set(created.map((e) => e.type))]
    });
    if (linkToMemory0 && created.length > 0) {
      const entityNames = created.map((e) => e.name);
      await linkToRoot(entityNames);
      console.log(`\u{1F517} \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D ${entityNames.length} entities \u0E01\u0E31\u0E1A Root`);
    }
    let finalResult = created;
    if (autoTag) {
      finalResult = await autoTagOnObservations(created);
      await Lineage.log("auto_tagging", {
        count: finalResult.length,
        newTags: finalResult.flatMap((r) => r.autoTags || []).length
      });
    }
    return finalResult;
  } catch (error) {
    console.error("\u274C Error creating entities:", error);
    await Lineage.log("create_entities_error", { error: error.message, count: entities.length });
    throw error;
  }
}
async function addObservations2(observations, options = {}) {
  const { autoTag = true } = options;
  console.log(`\u{1F4DD} \u0E40\u0E1E\u0E34\u0E48\u0E21 ${observations.length} observations`);
  try {
    const result = await addObservations(observations);
    await Lineage.log("add_observations", {
      count: observations.length,
      entities: observations.map((o) => o.entityName).slice(0, 10)
      // Log first 10
    });
    let finalResult = result;
    if (autoTag) {
      finalResult = await autoTagOnObservations(observations);
      await Lineage.log("auto_tag_observations", {
        count: finalResult.length,
        taggedEntities: finalResult.map((r) => r.entityName)
      });
    }
    return finalResult;
  } catch (error) {
    console.error("\u274C Error adding observations:", error);
    await Lineage.log("add_observations_error", { error: error.message });
    throw error;
  }
}
async function createRelations2(relations, options = {}) {
  const { linkToMemory0 = false } = options;
  console.log(`\u{1F517} \u0E2A\u0E23\u0E49\u0E32\u0E07 ${relations.length} relations`);
  try {
    const created = await createRelations(relations);
    await Lineage.log("create_relations", {
      count: created.length,
      types: [...new Set(created.map((r) => r.relationType))]
    });
    if (linkToMemory0) {
      const allNames = /* @__PURE__ */ new Set();
      relations.forEach((r) => {
        allNames.add(r.from);
        allNames.add(r.to);
      });
      if (allNames.size > 0) {
        await linkToRoot([...allNames]);
        console.log(`\u{1F517} \u0E40\u0E0A\u0E37\u0E48\u0E2D\u0E21\u0E15\u0E48\u0E2D ${allNames.size} unique entities \u0E01\u0E31\u0E1A Root`);
      }
    }
    return created;
  } catch (error) {
    console.error("\u274C Error creating relations:", error);
    await Lineage.log("create_relations_error", { error: error.message });
    throw error;
  }
}
async function semanticSearch2(query, options = {}) {
  const { topK = 8, tagFilter = [], threshold = 0.3 } = options;
  console.log(`\u{1F50D} Semantic search: "${query}" (top ${topK})`);
  try {
    const queryVectors = await embedTexts([query]);
    const queryVector = queryVectors[0];
    const results = await semanticSearch(queryVector, {
      topK,
      tagFilter,
      threshold
    });
    await Lineage.log("semantic_search", {
      query: query.substring(0, 50) + "...",
      topK,
      results: results.length,
      threshold
    });
    console.log(`\u2705 \u0E1E\u0E1A ${results.length} \u0E1C\u0E25\u0E25\u0E31\u0E1E\u0E18\u0E4C (threshold: ${threshold})`);
    return results;
  } catch (error) {
    console.error("\u274C Error in semantic search:", error);
    await Lineage.log("semantic_search_error", { error: error.message, query });
    throw error;
  }
}
async function getAllTags2() {
  try {
    const tags = await getAllTags();
    await Lineage.log("get_all_tags", { total: tags.length });
    return tags;
  } catch (error) {
    console.error("\u274C Error getting all tags:", error);
    throw error;
  }
}
async function searchByTag2(tag, options = {}) {
  const { exact = false, limit = 50 } = options;
  try {
    const results = await searchByTag(tag, { exact, limit });
    await Lineage.log("search_by_tag", { tag, exact, results: results.length });
    return results;
  } catch (error) {
    console.error("\u274C Error searching by tag:", error);
    throw error;
  }
}
var readGraph2 = async () => {
  try {
    const graph = await readGraph();
    await Lineage.log("read_graph", { nodes: graph.entities?.length || 0 });
    return graph;
  } catch (error) {
    console.error("\u274C Error reading graph:", error);
    throw error;
  }
};
var openNodes2 = async (names) => {
  try {
    const nodes = await openNodes(names);
    await Lineage.log("open_nodes", { names: names.length });
    return nodes;
  } catch (error) {
    console.error("\u274C Error opening nodes:", error);
    throw error;
  }
};
var searchNodes2 = async (query) => {
  try {
    const nodes = await searchNodes(query);
    await Lineage.log("search_nodes", { query, results: nodes.length });
    return nodes;
  } catch (error) {
    console.error("\u274C Error searching nodes:", error);
    throw error;
  }
};
var deleteEntities2 = async (entityNames) => {
  try {
    console.log(`\u{1F5D1}\uFE0F \u0E25\u0E1A ${entityNames.length} entities (\u0E23\u0E30\u0E27\u0E31\u0E07: \u0E44\u0E21\u0E48\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16\u0E22\u0E49\u0E2D\u0E19\u0E01\u0E25\u0E31\u0E1A\u0E44\u0E14\u0E49)`);
    const result = await deleteEntities(entityNames);
    await Lineage.log("delete_entities", { names: entityNames, count: result.deleted });
    return result;
  } catch (error) {
    console.error("\u274C Error deleting entities:", error);
    throw error;
  }
};
var deleteRelations2 = async (relations) => {
  try {
    const result = await deleteRelations(relations);
    await Lineage.log("delete_relations", { count: relations.length });
    return result;
  } catch (error) {
    console.error("\u274C Error deleting relations:", error);
    throw error;
  }
};
var deleteObservations2 = async (deletions) => {
  try {
    const result = await deleteObservations(deletions);
    await Lineage.log("delete_observations", { deletions: deletions.length });
    return result;
  } catch (error) {
    console.error("\u274C Error deleting observations:", error);
    throw error;
  }
};
var validateStructure2 = async () => {
  try {
    const isValid = await validateStructure();
    await Lineage.log("validate_structure", { valid: isValid });
    return isValid;
  } catch (error) {
    console.error("\u274C Error validating structure:", error);
    throw error;
  }
};
var selfDescribe2 = async () => {
  try {
    const description = await selfDescribe();
    await Lineage.log("self_describe", {});
    return description;
  } catch (error) {
    console.error("\u274C Error self-describing:", error);
    throw error;
  }
};
var executeWorkflow2 = executeWorkflow;
function generateEntityId(name, type2) {
  const timestamp2 = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}_${type2}_${timestamp2}_${random}`;
}
function validateEntity(entity) {
  const required = ["name", "type"];
  const missing = required.filter((field) => !entity[field]);
  if (missing.length > 0) {
    throw new Error(`Entity missing required fields: ${missing.join(", ")}`);
  }
  if (!entity.name || typeof entity.name !== "string" || entity.name.trim().length === 0) {
    throw new Error("Entity name must be a non-empty string");
  }
  return true;
}
function validateRelation(relation) {
  const required = ["from", "to", "relationType"];
  const missing = required.filter((field) => !relation[field]);
  if (missing.length > 0) {
    throw new Error(`Relation missing required fields: ${missing.join(", ")}`);
  }
  return true;
}
async function healthCheck3() {
  const status = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    modules: {
      memoryGraph: "ready",
      memory0: "ready",
      system: "ready",
      embedding: await healthCheck(),
      autoTag: await healthCheck2(),
      lineage: "ready"
    },
    storage: {
      memoryStore: false,
      lineageLog: false
    }
  };
  try {
    await fs6.access(path6.join(process.cwd(), "memory", "memory_store.json"));
    status.storage.memoryStore = true;
  } catch {
  }
  try {
    await fs6.access(path6.join(process.cwd(), "memory", "lineage_log.json"));
    status.storage.lineageLog = true;
  } catch {
  }
  try {
    const root = await getRootMemory();
    status.rootMemory = root ? "exists" : "missing";
  } catch {
    status.rootMemory = "error";
  }
  console.log("\u{1F3E5} Health check:", status);
  return status;
}
export {
  auto_tag_service_exports as AutoTag,
  embedding_service_exports as Embedding,
  Lineage,
  memory0_service_exports as Memory0,
  memory_graph_exports as MemoryGraph,
  system_exports as System,
  workflow_engine_exports as WorkflowEngine,
  addObservations2 as addObservations,
  createEntities2 as createEntities,
  createRelations2 as createRelations,
  deleteEntities2 as deleteEntities,
  deleteObservations2 as deleteObservations,
  deleteRelations2 as deleteRelations,
  ensureInitialized,
  executeWorkflow2 as executeWorkflow,
  generateEntityId,
  getAllTags2 as getAllTags,
  healthCheck3 as healthCheck,
  openNodes2 as openNodes,
  readGraph2 as readGraph,
  searchByTag2 as searchByTag,
  searchNodes2 as searchNodes,
  selfDescribe2 as selfDescribe,
  semanticSearch2 as semanticSearch,
  validateEntity,
  validateRelation,
  validateStructure2 as validateStructure
};
/*! Bundled license information:

js-yaml/dist/js-yaml.mjs:
  (*! js-yaml 4.1.0 https://github.com/nodeca/js-yaml @license MIT *)
*/
