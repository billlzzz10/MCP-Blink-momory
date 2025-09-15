// modules/embedding_service/index.js - Text Embedding Service for Semantic Search
// แปลงข้อความเป็น vector representations สำหรับ Knowledge Graph semantic search
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// 🔧 Configuration
const CONFIG = {
  mode: process.env.EMBEDDING_MODE || 'mock',
  model: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002',
  dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS) || 384,
  maxTokens: 8191,
  batchSize: 10,
  cache: process.env.EMBEDDING_CACHE !== 'false',
  openaiApiKey: process.env.OPENAI_API_KEY,
  huggingfaceApiKey: process.env.HUGGINGFACE_API_KEY,
  timeout: 30000
};

// 📁 Storage paths
const EMBEDDING_CACHE_PATH = path.join(process.cwd(), 'memory', 'embedding_cache.json');
const MODEL_METADATA_PATH = path.join(process.cwd(), 'memory', 'embedding_metadata.json');

// 🗄️ In-memory cache
const embeddingCache = new Map();
let cacheStats = {
  total: 0,
  hits: 0,
  misses: 0,
  size: 0
};

// 🏗️ Initialization
export async function initialize() {
  console.log(`🔗 เริ่มต้น Embedding Service (mode: ${CONFIG.mode}, dimensions: ${CONFIG.dimensions})`);
  
  try {
    const cacheDir = path.dirname(EMBEDDING_CACHE_PATH);
    await fs.mkdir(cacheDir, { recursive: true });
    
    await loadCache();
    await ensureMetadata();
    validateConfig();
    
    console.log(`✅ Embedding service พร้อมใช้งาน - Cache: ${cacheStats.total} embeddings`);
    return {
      status: 'ready',
      mode: CONFIG.mode,
      cacheSize: cacheStats.total,
      dimensions: CONFIG.dimensions
    };
  } catch (error) {
    console.error("❌ Error initializing embedding service:", error);
    throw new Error(`Embedding service initialization failed: ${error.message}`);
  }
}

// 🔄 Load cache
async function loadCache() {
  try {
    const data = await fs.readFile(EMBEDDING_CACHE_PATH, 'utf8');
    if (data.trim()) {
      const cache = JSON.parse(data);
      cacheStats.total = Object.keys(cache).length;
      
      const recentEntries = Object.entries(cache)
        .sort(([,a], [,b]) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10000);
        
      recentEntries.forEach(([text, entry]) => {
        embeddingCache.set(text, entry.vector);
      });
      
      console.log(`📂 โหลด ${recentEntries.length}/${cacheStats.total} embeddings จาก cache`);
    }
  } catch (error) {
    console.log("📝 เริ่มต้น embedding cache ใหม่");
  }
}

// 🔄 Save cache
async function saveCache() {
  if (!CONFIG.cache) return;
  
  try {
    const cacheData = Array.from(embeddingCache.entries()).map(([text, vector]) => ({
      text: text.substring(0, 100),
      vector,
      timestamp: new Date().toISOString(),
      model: CONFIG.model,
      dimensions: CONFIG.dimensions
    }));
    
    cacheData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentCache = cacheData.slice(0, 5000);
    
    await fs.writeFile(EMBEDDING_CACHE_PATH, JSON.stringify(recentCache, null, 2), 'utf8');
    cacheStats.size = JSON.stringify(recentCache).length / 1024;
    
    console.log(`💾 บันทึก cache: ${recentCache.length} embeddings (${cacheStats.size.toFixed(1)} KB)`);
  } catch (error) {
    console.error("⚠️  ไม่สามารถบันทึก embedding cache:", error.message);
  }
}

// 🔄 Ensure metadata
async function ensureMetadata() {
  try {
    let metadata = {
      model: CONFIG.model,
      dimensions: CONFIG.dimensions,
      mode: CONFIG.mode,
      initializedAt: new Date().toISOString(),
      version: "1.0.0",
      cacheEnabled: CONFIG.cache
    };
    
    try {
      const data = await fs.readFile(MODEL_METADATA_PATH, 'utf8');
      if (data.trim()) {
        const existing = JSON.parse(data);
        metadata = { ...existing, ...metadata, updatedAt: new Date().toISOString() };
      }
    } catch (error) {
      // No existing metadata
    }
    
    await fs.writeFile(MODEL_METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf8');
    return metadata;
  } catch (error) {
    console.error("⚠️  ไม่สามารถบันทึก model metadata:", error);
  }
}

// 🔍 Validate config
function validateConfig() {
  if (CONFIG.mode === 'openai' && !CONFIG.openaiApiKey) {
    console.warn("⚠️  OpenAI mode: API key ไม่ได้ตั้งค่า (EMBEDDING_MODE=openai, OPENAI_API_KEY)");
  }
  
  if (CONFIG.mode === 'huggingface' && !CONFIG.huggingfaceApiKey) {
    console.warn("⚠️  HuggingFace mode: API key ไม่ได้ตั้งค่า (EMBEDDING_MODE=huggingface, HUGGINGFACE_API_KEY)");
  }
  
  if (CONFIG.dimensions < 1 || CONFIG.dimensions > 4096) {
    console.warn(`⚠️  Dimensions ${CONFIG.dimensions} อยู่นอกช่วงที่แนะนำ (1-4096)`);
  }
}

// 🎯 Main API: Embed texts
export async function embedTexts(texts, options = {}) {
  const { 
    useCache = CONFIG.cache, 
    batchSize = CONFIG.batchSize,
    normalize = true,
    truncate = true 
  } = options;
  
  console.log(`🔄 Embedding ${texts.length} texts (batch: ${batchSize}, cache: ${useCache})`);
  
  try {
    // Preprocess texts
    const processedTexts = texts.map(text => {
      if (typeof text !== 'string') {
        console.warn("⚠️  Non-string text detected, converting to string");
        text = String(text);
      }
      
      if (truncate && text.length > CONFIG.maxTokens * 4) {
        const truncated = text.substring(0, CONFIG.maxTokens * 4);
        console.log(`✂️  Truncate text จาก ${text.length} เป็น ${truncated.length} chars`);
        return truncated;
      }
      
      return text.trim();
    }).filter(text => text.length > 0);
    
    if (processedTexts.length === 0) {
      return [];
    }
    
    // Check cache
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
    
    console.log(`📊 Cache: ${cacheHits.length} hits, ${cacheMisses.length} misses`);
    
    // Generate embeddings for cache misses
    const newEmbeddings = await generateEmbeddings(cacheMisses, { batchSize, normalize });
    
    // Update cache
    newEmbeddings.forEach(({ text, vector }) => {
      embeddingCache.set(text, vector);
      cacheStats.total++;
    });
    
    // Combine results
    const allEmbeddings = [
      ...cacheHits.map(hit => ({ text: hit.text, vector: hit.vector, source: 'cache' })),
      ...newEmbeddings.map(emb => ({ text: emb.text, vector: emb.vector, source: 'generated' }))
    ];
    
    // Save cache periodically
    if (newEmbeddings.length > 0 && cacheStats.total % 100 === 0) {
      await saveCache();
    }
    
    // Return vectors
    const vectors = allEmbeddings.map(emb => emb.vector);
    
    console.log(`✅ สร้าง embeddings: ${vectors.length} vectors (${CONFIG.dimensions} dims)`);
    return vectors;
    
  } catch (error) {
    console.error("❌ Error generating embeddings:", error);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }
}

// 🎯 Batch embedding processing
async function generateEmbeddings(texts, options = {}) {
  const { batchSize = CONFIG.batchSize, normalize = true } = options;
  const results = [];
  
  // Process in batches
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`📦 ประมวลผล batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)} (${batch.length} texts)`);
    
    try {
      const batchVectors = await generateBatchEmbeddings(batch);
      const processedVectors = normalize ? batchVectors.map(vec => normalizeVector(vec)) : batchVectors;
      
      batch.forEach((text, index) => {
        results.push({
          text,
          vector: processedVectors[index],
          dimensions: CONFIG.dimensions,
          model: CONFIG.model
        });
      });
      
    } catch (batchError) {
      console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, batchError);
      
      // Fallback to mock vectors
      if (CONFIG.mode === 'mock' || CONFIG.mode === 'production') {
        console.log("🔄 ใช้ fallback mock vectors สำหรับ batch นี้");
        batch.forEach(text => {
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

// 🎯 Generate batch embeddings
async function generateBatchEmbeddings(texts) {
  switch (CONFIG.mode) {
    case 'openai':
      return await callOpenAIEmbeddings(texts);
      
    case 'huggingface':
      return await callHuggingFaceEmbeddings(texts);
      
    case 'mock':
    default:
      return texts.map(text => generateMockVector(text));
  }
}

// 🌐 OpenAI API
async function callOpenAIEmbeddings(texts) {
  if (!CONFIG.openaiApiKey) {
    throw new Error('OPENAI_API_KEY ไม่ได้ตั้งค่า');
  }
  
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: CONFIG.openaiApiKey,
      timeout: CONFIG.timeout
    });
    
    const response = await openai.embeddings.create({
      model: CONFIG.model,
      input: texts,
      encoding_format: 'float'
    });
    
    return response.data.map((data, index) => ({
      text: texts[index],
      vector: data.embedding,
      dimensions: data.embedding.length
    }));
    
  } catch (error) {
    console.error("❌ OpenAI API error:", error);
    
    if (error.status === 429) {
      console.log("⏳ Rate limit - ใช้ fallback mock");
      return texts.map(text => generateMockVector(text));
    }
    
    throw new Error(`OpenAI embedding failed: ${error.message}`);
  }
}

// 🤗 HuggingFace API
async function callHuggingFaceEmbeddings(texts) {
  if (!CONFIG.huggingfaceApiKey) {
    throw new Error('HUGGINGFACE_API_KEY ไม่ได้ตั้งค่า');
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
    
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.huggingfaceApiKey}`,
        'Content-Type': 'application/json'
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
    console.error("❌ HuggingFace API error:", error);
    
    if (error.name === 'AbortError') {
      console.log("⏳ API timeout - ใช้ fallback mock");
      return texts.map(text => generateMockVector(text));
    }
    
    throw new Error(`HuggingFace embedding failed: ${error.message}`);
  }
}

// 🎭 Mock vector generation
function generateMockVector(text) {
  const dimensions = CONFIG.dimensions;
  const vector = new Float32Array(dimensions);
  
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed += text.charCodeAt(i);
  }
  
  for (let i = 0; i < dimensions; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const value = (seed / 0x7fffffff) * 2 - 1;
    const textInfluence = Math.min(text.length / 1000, 1.0);
    vector[i] = value * (0.1 + textInfluence * 0.9);
  }
  
  return Array.from(vector);
}

// 🔢 Vector math utilities
export function normalizeVector(vector) {
  if (!vector || !Array.isArray(vector)) {
    throw new Error('Invalid vector for normalization');
  }
  
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  
  if (magnitude === 0) {
    return vector.map(() => 0);
  }
  
  return vector.map(val => val / magnitude);
}

export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
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

// 🧹 Cache management
export async function clearCache() {
  console.log("🧹 เคลียร์ embedding cache");
  
  try {
    embeddingCache.clear();
    cacheStats = { total: 0, hits: 0, misses: 0, size: 0 };
    
    try {
      await fs.unlink(EMBEDDING_CACHE_PATH);
      console.log("💾 ลบ disk cache");
    } catch (error) {
      // File may not exist
    }
    
    console.log("✅ Embedding cache cleared");
    return true;
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    throw error;
  }
}

export async function getCacheStats() {
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

// 🏥 Health check
export async function healthCheck() {
  return {
    module: 'embedding_service',
    status: 'ready',
    mode: CONFIG.mode,
    model: CONFIG.model,
    dimensions: CONFIG.dimensions,
    cache: {
      total: cacheStats.total,
      hitRate: cacheStats.total > 0 ? (cacheStats.hits / cacheStats.total).toFixed(4) : 'N/A',
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

// 🔌 Export main API