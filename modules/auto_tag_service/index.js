// modules/auto_tag_service/index.js - Automatic Tagging Service for Knowledge Graph
// วิเคราะห์เนื้อหาและสร้าง tags อัตโนมัติสำหรับ entities และ observations
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// 🔧 Configuration
const CONFIG = {
  mode: process.env.TAG_MODE || 'basic', // 'basic', 'advanced', 'ml'
  minTagLength: 3,
  maxTagsPerEntity: 8,
  minTagFrequency: 2,
  confidenceThreshold: 0.6,
  language: 'th', // Thai language support
  cacheTags: true,
  useStemming: false, // Stemming สำหรับภาษาอังกฤษ
  thaiSupport: true, // รองรับภาษาไทย
  stopWords: {
    en: ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i'],
    th: ['ที่', 'และ', 'เป็น', 'ใน', 'ของ', 'มี', 'จะ', 'ไม่', 'จาก', 'กับ']
  }
};

// 📁 Storage paths
const TAG_MODEL_PATH = path.join(process.cwd(), 'memory', 'tag_model.json');
const TAG_CACHE_PATH = path.join(process.cwd(), 'memory', 'tag_cache.json');

// 🗄️ In-memory caches
const tagCache = new Map(); // entityName -> tags array
const keywordIndex = new Map(); // keyword -> entities array
let modelStats = {
  totalEntitiesTagged: 0,
  totalTagsGenerated: 0,
  uniqueTags: 0,
  accuracy: 0 // Mock value
};

// 🏗️ Initialization - เตรียม auto-tagging service
export async function initialize() {
  console.log(`🏷️ เริ่มต้น Auto-Tagging Service (mode: ${CONFIG.mode}, language: ${CONFIG.language})`);
  
  try {
    // 1. สร้าง directories
    const memoryDir = path.dirname(TAG_MODEL_PATH);
    await fs.mkdir(memoryDir, { recursive: true });
    
    // 2. Load tag model and cache
    await loadTagModel();
    await loadTagCache();
    
    // 3. Build keyword index from existing entities
    await buildKeywordIndex();
    
    // 4. Initialize Thai language support
    if (CONFIG.thaiSupport) {
      console.log("🌏 เปิดใช้งาน Thai language support");
    }
    
    console.log(`✅ Auto-tagging service พร้อมใช้งาน - Cache: ${tagCache.size} entities, Keywords: ${keywordIndex.size}`);
    return {
      status: 'ready',
      mode: CONFIG.mode,
      language: CONFIG.language,
      cacheSize: tagCache.size,
      uniqueKeywords: keywordIndex.size
    };
    
  } catch (error) {
    console.error("❌ Error initializing auto-tagging service:", error);
    throw new Error(`Auto-tagging service initialization failed: ${error.message}`);
  }
}

// 🔄 Load tag model from storage
async function loadTagModel() {
  try {
    const data = await fs.readFile(TAG_MODEL_PATH, 'utf8');
    if (data.trim()) {
      const model = JSON.parse(data);
      modelStats = {
        ...modelStats,
        ...model.stats,
        totalEntitiesTagged: model.totalEntitiesTagged || 0,
        totalTagsGenerated: model.totalTagsGenerated || 0,
        uniqueTags: model.uniqueTags || 0
      };
      
      console.log(`📂 โหลด tag model - ${modelStats.totalEntitiesTagged} entities tagged`);
    }
  } catch (error) {
    console.log("📝 เริ่มต้น tag model ใหม่");
    // Initialize empty model
    await saveTagModel();
  }
}

// 🔄 Load tag cache
async function loadTagCache() {
  try {
    const data = await fs.readFile(TAG_CACHE_PATH, 'utf8');
    if (data.trim()) {
      const cache = JSON.parse(data);
      Object.entries(cache).forEach(([entityName, tags]) => {
        tagCache.set(entityName, tags);
      });
      
      modelStats.totalEntitiesTagged = tagCache.size;
      console.log(`📂 โหลด tag cache - ${tagCache.size} entities`);
    }
  } catch (error) {
    console.log("📝 เริ่มต้น tag cache ใหม่");
  }
}

// 🔄 Save tag model
async function saveTagModel() {
  try {
    const modelData = {
      version: "1.0.0",
      config: CONFIG,
      stats: modelStats,
      lastUpdated: new Date().toISOString(),
      totalEntitiesTagged: modelStats.totalEntitiesTagged,
      totalTagsGenerated: modelStats.totalTagsGenerated,
      uniqueTags: modelStats.uniqueTags
    };
    
    await fs.writeFile(TAG_MODEL_PATH, JSON.stringify(modelData, null, 2), 'utf8');
  } catch (error) {
    console.error("⚠️  ไม่สามารถบันทึก tag model:", error.message);
  }
}

// 🔄 Build keyword index from entities
async function buildKeywordIndex() {
  try {
    // This would integrate with memory_graph to index existing entities
    console.log("🔍 สร้าง keyword index จาก existing entities");
    
    // Mock implementation - in production would scan memory store
    keywordIndex.clear();
    modelStats.uniqueTags = 0;
    
    // For now, use cached tags to build index
    tagCache.forEach((tags, entityName) => {
      tags.forEach(tag => {
        if (!keywordIndex.has(tag)) {
          keywordIndex.set(tag, new Set());
        }
        keywordIndex.get(tag).add(entityName);
        modelStats.uniqueTags++;
      });
    });
    
    console.log(`✅ Keyword index สร้างเรียบร้อย - ${keywordIndex.size} unique tags`);
  } catch (error) {
    console.error("❌ Error building keyword index:", error);
  }
}

// 🎯 Main API: Auto-tag observations - สร้าง tags อัตโนมัติ
export async function autoTagOnObservations(observations, options = {}) {
  const { 
    confidenceThreshold = CONFIG.confidenceThreshold,
    maxTags = CONFIG.maxTagsPerEntity,
    mode = CONFIG.mode 
  } = options;
  
  console.log(`🏷️ Auto-tagging ${observations.length} observations (mode: ${mode}, threshold: ${confidenceThreshold})`);
  
  try {
    const taggedObservations = [];
    let totalNewTags = 0;
    
    for (const obs of observations) {
      const { entityName, contents } = obs;
      const allText = Array.isArray(contents) ? contents.join(' ') : String(contents || '');
      
      if (!allText.trim()) {
        console.warn(`⚠️  ข้อความว่างสำหรับ entity: ${entityName}`);
        taggedObservations.push({ ...obs, autoTags: [], confidence: 0 });
        continue;
      }
      
      // Generate tags based on mode
      let generatedTags = [];
      switch (mode) {
        case 'advanced':
          generatedTags = await advancedTagging(allText, entityName);
          break;
        case 'ml':
          generatedTags = await mlTagging(allText, entityName);
          break;
        case 'basic':
        default:
          generatedTags = basicKeywordExtraction(allText, entityName);
          break;
      }
      
      // Filter and rank tags
      const filteredTags = filterAndRankTags(generatedTags, {
        minLength: CONFIG.minTagLength,
        maxTags,
        threshold: confidenceThreshold,
        entityName
      });
      
      // Update observation with tags
      const taggedObs = {
        ...obs,
        autoTags: filteredTags.tags,
        tagConfidence: filteredTags.confidenceScores,
        totalTags: filteredTags.tags.length,
        processedAt: new Date().toISOString()
      };
      
      taggedObservations.push(taggedObs);
      totalNewTags += filteredTags.tags.length;
      
      console.log(`✅ Tagging สำหรับ ${entityName}: ${filteredTags.tags.length} tags (top: ${filteredTags.tags.slice(0, 3).join(', ')})`);
    }
    
    // Update statistics
    modelStats.totalTagsGenerated += totalNewTags;
    modelStats.totalEntitiesTagged = Math.max(modelStats.totalEntitiesTagged, tagCache.size + observations.length);
    
    // Save cache if enabled
    if (CONFIG.cacheTags) {
      await updateTagCache(taggedObservations);
    }
    
    console.log(`✅ Auto-tagging เสร็จสิ้น - ${totalNewTags} tags ใหม่จาก ${observations.length} observations`);
    return taggedObservations;
    
  } catch (error) {
    console.error("❌ Error in auto-tagging:", error);
    throw new Error(`Auto-tagging failed: ${error.message}`);
  }
}

// 🎯 Basic keyword extraction - การแยก keywords พื้นฐาน
function basicKeywordExtraction(text, entityName) {
  console.log(`🔍 Basic keyword extraction สำหรับ "${entityName}"`);
  
  // 1. Clean text
  let cleanText = text.toLowerCase()
    .replace(/[^\w\sก-ฮ]/g, ' ') // Remove non-word chars (รองรับไทย)
    .replace(/\s+/g, ' ')
    .trim();
  
  // 2. Tokenize - แยกคำ
  const words = cleanText.split(' ');
  
  // 3. Remove stop words
  const languageStopWords = CONFIG.stopWords[CONFIG.language] || [];
  const filteredWords = words.filter(word => 
    word.length >= CONFIG.minTagLength && 
    !languageStopWords.includes(word)
  );
  
  // 4. Count word frequency
  const wordFreq = {};
  filteredWords.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  
  // 5. Extract top keywords as tags
  const sortedWords = Object.entries(wordFreq)
    .filter(([, freq]) => freq >= CONFIG.minTagFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, CONFIG.maxTagsPerEntity)
    .map(([word]) => word);
  
  // 6. Calculate confidence (mock)
  const confidence = Math.min(sortedWords.length / CONFIG.maxTagsPerEntity, 1.0);
  
  return {
    tags: sortedWords,
    confidence: confidence,
    source: 'basic_keyword',
    wordCount: filteredWords.length,
    uniqueWords: new Set(filteredWords).size
  };
}

// 🎯 Advanced tagging - ใช้ NLP techniques
async function advancedTagging(text, entityName) {
  console.log(`🧠 Advanced tagging สำหรับ "${entityName}"`);
  
  try {
    // 1. Basic keyword extraction first
    const basicTags = basicKeywordExtraction(text, entityName);
    
    // 2. Extract noun phrases (mock implementation)
    const nounPhrases = extractNounPhrases(text);
    
    // 3. Entity recognition (mock)
    const entities = extractNamedEntities(text);
    
    // 4. Combine and deduplicate
    const allTags = [
      ...basicTags.tags,
      ...nounPhrases.slice(0, 3),
      ...entities.slice(0, 2)
    ].filter((tag, index, arr) => 
      tag.length >= CONFIG.minTagLength && 
      arr.indexOf(tag) === index
    ).slice(0, CONFIG.maxTagsPerEntity);
    
    // 5. Calculate confidence based on tag types
    const confidence = calculateAdvancedConfidence(allTags, text);
    
    return {
      tags: allTags,
      confidence: confidence,
      source: 'advanced_nlp',
      components: {
        keywords: basicTags.tags.length,
        nounPhrases: nounPhrases.length,
        entities: entities.length
      }
    };
    
  } catch (error) {
    console.error("⚠️  Advanced tagging failed, fallback to basic:", error.message);
    return basicKeywordExtraction(text, entityName);
  }
}

import { pipeline } from '@xenova/transformers';

let classifier = null;

// 🎯 ML-based tagging - ใช้ machine learning model (REAL IMPLEMENTATION)
async function mlTagging(text, entityName) {
  console.log(`🤖 ML-based tagging for "${entityName}" (using @xenova/transformers)`);

  // Initialize the pipeline on first use
  if (!classifier) {
    console.log("🤖 Initializing zero-shot classification pipeline...");
    classifier = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli');
    console.log("✅ Pipeline initialized.");
  }

  // Define candidate labels for classification
  const candidateLabels = ['technology', 'business', 'science', 'health', 'art', 'politics', 'sports', 'education', 'engineering', 'software', 'AI', 'machine learning'];

  try {
    const output = await classifier(text, candidateLabels);

    const mlPredictions = output.labels.map((label, i) => ({
      tag: label,
      confidence: output.scores[i]
    }));

    const filtered = mlPredictions
      .filter(pred => pred.confidence >= CONFIG.confidenceThreshold)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, CONFIG.maxTagsPerEntity);

    const finalTags = filtered.map(pred => pred.tag);
    const avgConfidence = filtered.reduce((sum, pred) => sum + pred.confidence, 0) / (filtered.length || 1);

    return {
      tags: finalTags,
      confidence: avgConfidence,
      source: 'ml_model',
      predictions: filtered.length,
      model: 'Xenova/bart-large-mnli'
    };

  } catch (error) {
    console.error(`❌ Error during ML tagging for "${entityName}":`, error);
    // Fallback to basic tagging in case of error
    return basicKeywordExtraction(text, entityName);
  }
}

// 🔍 Helper: Extract noun phrases (mock)
function extractNounPhrases(text) {
  // Simple noun phrase extraction using regex patterns
  const patterns = [
    /(\w+(?:\s+\w+){0,2})/g, // 1-3 word phrases
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g // Proper nouns
  ];
  
  const phrases = new Set();
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      const phrase = match.trim();
      if (phrase.length >= CONFIG.minTagLength && phrase.length <= 20) {
        phrases.add(phrase.toLowerCase());
      }
    });
  });
  
  return Array.from(phrases).slice(0, 5);
}

// 🔍 Helper: Extract named entities (mock)
function extractNamedEntities(text) {
  // Mock named entity recognition
  const entityPatterns = [
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)?\b/g, // Proper nouns
    /\b[A-Za-z0-9]+(?:-[A-Za-z0-9]+)?\b/g // Technical terms
  ];
  
  const entities = new Set();
  
  entityPatterns.forEach(pattern => {
    const matches = text.match(pattern) || [];
    matches.forEach(match => {
      if (match.length >= 3 && match.length <= 15) {
        entities.add(match);
      }
    });
  });
  
  return Array.from(entities).slice(0, 3);
}

// 📊 Helper: Filter and rank tags
function filterAndRankTags(generatedTags, options = {}) {
  const { 
    minLength = CONFIG.minTagLength, 
    maxTags = CONFIG.maxTagsPerEntity, 
    threshold = CONFIG.confidenceThreshold,
    entityName 
  } = options;
  
  // Filter tags
  let filteredTags = generatedTags.tags.filter(tag => 
    typeof tag === 'string' && 
    tag.length >= minLength && 
    tag.length <= 20 &&
    !CONFIG.stopWords[CONFIG.language].includes(tag.toLowerCase())
  );
  
  // Remove duplicates and rank by length/frequency (mock)
  filteredTags = [...new Set(filteredTags)]
    .sort((a, b) => {
      // Prefer longer tags (more specific)
      if (a.length !== b.length) {
        return b.length - a.length;
      }
      // Then alphabetical
      return a.localeCompare(b);
    })
    .slice(0, maxTags);
  
  // Mock confidence scores
  const confidenceScores = filteredTags.map(tag => {
    const baseScore = Math.min(tag.length / 10, 1.0);
    const randomFactor = 0.7 + Math.random() * 0.3;
    return Math.max(threshold, baseScore * randomFactor);
  });
  
  // Calculate overall confidence
  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  
  return {
    tags: filteredTags,
    confidenceScores,
    overallConfidence: avgConfidence,
    filteredCount: filteredTags.length,
    originalCount: generatedTags.tags.length
  };
}

// 🔍 Helper: Calculate advanced confidence
function calculateAdvancedConfidence(tags, text) {
  if (tags.length === 0) return 0;
  
  // Mock confidence calculation based on tag quality
  const textLength = text.length;
  const avgTagLength = tags.reduce((sum, tag) => sum + tag.length, 0) / tags.length;
  const uniqueness = new Set(tags).size / tags.length;
  
  let confidence = 0.5; // Base
  
  // Length-based scoring
  if (avgTagLength >= 5) confidence += 0.2;
  if (avgTagLength <= 12) confidence += 0.1;
  
  // Uniqueness scoring
  if (uniqueness > 0.8) confidence += 0.15;
  
  // Text coverage (mock)
  const totalTagChars = tags.reduce((sum, tag) => sum + tag.length, 0);
  const coverage = Math.min(totalTagChars / textLength, 1.0);
  confidence += coverage * 0.1;
  
  return Math.min(confidence, 1.0);
}

// 🔗 Integration: Update tag cache
async function updateTagCache(observations) {
  try {
    const updatedCache = new Map(tagCache);
    
    observations.forEach(obs => {
      if (obs.autoTags && obs.autoTags.length > 0) {
        updatedCache.set(obs.entityName, obs.autoTags);
        
        // Update keyword index
        obs.autoTags.forEach(tag => {
          if (!keywordIndex.has(tag)) {
            keywordIndex.set(tag, new Set());
          }
          keywordIndex.get(tag).add(obs.entityName);
        });
      }
    });
    
    // Save to disk
    const cacheData = Object.fromEntries(updatedCache);
    await fs.writeFile(TAG_CACHE_PATH, JSON.stringify(cacheData, null, 2), 'utf8');
    
    modelStats.totalEntitiesTagged = updatedCache.size;
    
  } catch (error) {
    console.error("⚠️  ไม่สามารถอัปเดต tag cache:", error.message);
  }
}

// 🎯 Search tags - ค้นหา entities โดย tags
export async function searchByTags(tags, options = {}) {
  const { 
    exactMatch = true, 
    limit = 50, 
    combine = 'any' // 'any', 'all'
  } = options;
  
  console.log(`🔍 ค้นหาโดย tags: [${tags.join(', ')}] (${combine} match, limit: ${limit})`);
  
  try {
    let results = [];
    
    if (exactMatch) {
      // Exact tag matching
      if (combine === 'all') {
        // All tags must match
        const commonEntities = tags.reduce((common, tag) => {
          if (!keywordIndex.has(tag)) return common;
          return common ? [...new Set([...common, ...keywordIndex.get(tag)])] : keywordIndex.get(tag);
        }, new Set());
        
        results = Array.from(commonEntities).slice(0, limit);
      } else {
        // Any tag match
        const allEntities = new Set();
        tags.forEach(tag => {
          if (keywordIndex.has(tag)) {
            keywordIndex.get(tag).forEach(entity => allEntities.add(entity));
          }
        });
        
        results = Array.from(allEntities).slice(0, limit);
      }
    } else {
      // Fuzzy tag matching (contains)
      results = Array.from(tagCache.entries())
        .filter(([entityName, entityTags]) => 
          tags.some(tag => 
            entityTags.some(eTag => 
              eTag.toLowerCase().includes(tag.toLowerCase())
            )
          )
        )
        .map(([entityName]) => entityName)
        .slice(0, limit);
    }
    
    // Enrich results with tag context
    const enrichedResults = results.map(entityName => {
      const entityTags = tagCache.get(entityName) || [];
      const matchedTags = tags.filter(tag => 
        entityTags.some(eTag => 
          eTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      
      return {
        entityName,
        tags: entityTags,
        matchedTags,
        matchType: exactMatch ? 'exact' : 'fuzzy',
        score: calculateTagMatchScore(entityTags, tags)
      };
    });
    
    console.log(`✅ พบ ${enrichedResults.length} entities ที่ match กับ tags`);
    return enrichedResults;
    
  } catch (error) {
    console.error("❌ Error searching by tags:", error);
    throw error;
  }
}

// 📊 Helper: Calculate tag match score
function calculateTagMatchScore(entityTags, searchTags) {
  if (entityTags.length === 0) return 0;
  
  let score = 0;
  searchTags.forEach(searchTag => {
    entityTags.forEach(entityTag => {
      if (entityTag.toLowerCase().includes(searchTag.toLowerCase())) {
        // Exact match
        if (entityTag.toLowerCase() === searchTag.toLowerCase()) {
          score += 1.0;
        } else {
          // Partial match
          const ratio = searchTag.length / entityTag.length;
          score += ratio * 0.7;
        }
      }
    });
  });
  
  return Math.min(score / searchTags.length, 1.0);
}

// 🧹 Cache management
export async function clearCache() {
  console.log("🧹 เคลียร์ auto-tagging cache");
  
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
      await fs.unlink(TAG_CACHE_PATH);
      await fs.unlink(TAG_MODEL_PATH);
      console.log("💾 ลบ tag cache และ model files");
    } catch (error) {
      // Files may not exist
    }
    
    await buildKeywordIndex();
    console.log("✅ Auto-tagging cache cleared");
    return true;
    
  } catch (error) {
    console.error("❌ Error clearing cache:", error);
    throw error;
  }
}

// 📊 Get tagging statistics
export async function getStats() {
  return {
    module: 'auto_tag_service',
    status: 'ready',
    mode: CONFIG.mode,
    language: CONFIG.language,
    stats: modelStats,
    cache: {
      entitiesTagged: tagCache.size,
      uniqueKeywords: keywordIndex.size,
      avgTagsPerEntity: tagCache.size > 0 ? modelStats.totalTagsGenerated / tagCache.size : 0
    },
    config: {
      maxTagsPerEntity: CONFIG.maxTagsPerEntity,
      confidenceThreshold: CONFIG.confidenceThreshold,
      thaiSupport: CONFIG.thaiSupport
    }
  };
}

// 🏥 Health check
export async function healthCheck() {
  return {
    module: 'auto_tag_service',
    status: 'ready',
    mode: CONFIG.mode,
    entitiesTagged: modelStats.totalEntitiesTagged,
    tagsGenerated: modelStats.totalTagsGenerated,
    uniqueTags: modelStats.uniqueTags,
    cacheSize: tagCache.size,
    keywordIndexSize: keywordIndex.size,
    config: {
      language: CONFIG.language,
      thaiSupport: CONFIG.thaiSupport,
      confidenceThreshold: CONFIG.confidenceThreshold
    },
    lastUpdated: modelStats.lastUpdated || new Date().toISOString()
  };
}

// 🔌 Export main API