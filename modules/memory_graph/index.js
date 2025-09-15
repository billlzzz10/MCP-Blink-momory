
// modules/memory_graph/index.js - Knowledge Graph Memory Management System
// จัดการ entities, relations, observations ในรูปแบบ graph structure สำหรับ Explicit Agent Protocol
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { cosineSimilarity, normalizeVector, embedTexts } from '../embedding_service/index.js';
import BM25 from '@basementuniverse/bm25';

// 🔧 Configuration & Paths
const MEMORY_STORE_PATH = path.join(process.cwd(), 'memory', 'memory_store.json');
const GRAPH_METADATA_PATH = path.join(process.cwd(), 'memory', 'graph_metadata.json');

// 📊 In-memory graph cache (สำหรับ performance)
let graphCache = {
  entities: [],
  entityMap: new Map(), // id -> entity, name -> entity for O(1) lookup
  relations: [],
  relationMap: new Map(), // signature -> relation for O(1) lookup
  observations: new Map(), // entityName -> observations array
  tags: new Map(), // tag -> entities array
  metadata: {
    totalEntities: 0,
    totalRelations: 0,
    totalObservations: 0,
    lastUpdated: new Date().toISOString(),
    version: "1.0.0"
  }
};

// 🏗️ Graph Store Management - จัดการ storage layer
export async function ensureStore() {
  console.log("🧠 เตรียม Knowledge Graph Memory Store...");
  
  try {
    // 1. สร้าง memory directory ถ้ายังไม่มี
    const memoryDir = path.dirname(MEMORY_STORE_PATH);
    await fs.mkdir(memoryDir, { recursive: true });
    
    // 2. Initialize หรือ load memory store
    let memoryStore = [];
    try {
      const data = await fs.readFile(MEMORY_STORE_PATH, 'utf8');
      if (data.trim()) {
        memoryStore = JSON.parse(data);
        console.log(`📂 โหลด ${memoryStore.length} entities จาก memory store`);
      }
    } catch (error) {
      console.log("📝 เริ่มต้น memory store ใหม่");
    }
    
    // 3. Initialize graph metadata
    let metadata = graphCache.metadata;
    try {
      const metaData = await fs.readFile(GRAPH_METADATA_PATH, 'utf8');
      if (metaData.trim()) {
        metadata = { ...metadata, ...JSON.parse(metaData) };
      }
    } catch (error) {
      console.log("📊 เริ่มต้น graph metadata ใหม่");
    }
    
    // 4. Rebuild in-memory cache จาก persistent storage
    rebuildCacheFromStore(memoryStore, metadata);

    // 5. Build indices for search
    await buildVectorIndex();
    await buildBm25Index();
    
    // 6. Save initial metadata ถ้าไม่มี
    if (!metadata.createdAt) {
      metadata.createdAt = new Date().toISOString();
      await fs.writeFile(GRAPH_METADATA_PATH, JSON.stringify(metadata, null, 2), 'utf8');
    }
    
    console.log(`✅ Graph store พร้อมใช้งาน - ${graphCache.entities.length} entities, ${graphCache.relations.length} relations`);
    return { success: true, stats: metadata };
    
  } catch (error) {
    console.error("❌ Error setting up graph store:", error);
    throw new Error(`Graph store initialization failed: ${error.message}`);
  }
}

// 🔄 Internal: Rebuild cache from persistent storage
function rebuildCacheFromStore(store, metadata) {
  graphCache.entities = store.filter(item => item.type === 'entity' || item.type === 'memory');
  graphCache.relations = store.filter(item => item.type === 'relation') || [];
  
  // Rebuild entityMap for O(1) lookup
  graphCache.entityMap.clear();
  graphCache.entities.forEach(entity => {
    graphCache.entityMap.set(entity.id, entity);
    if (entity.name) graphCache.entityMap.set(entity.name, entity);
  });
  
  // Rebuild relationMap for O(1) lookup
  graphCache.relationMap.clear();
  graphCache.relations.forEach(relation => {
    const signature = `${relation.from}::${relation.relationType}::${relation.to}`;
    graphCache.relationMap.set(signature, relation);
  });

  // Rebuild observations and tags cache
  graphCache.observations.clear();
  graphCache.tags.clear();
  graphCache.entities.forEach(entity => {
    if (entity.observations && entity.observations.length > 0) {
      graphCache.observations.set(entity.name, entity.observations);
    }
    if (entity.autoTags && entity.autoTags.length > 0) {
      entity.autoTags.forEach(tag => {
        if (!graphCache.tags.has(tag)) {
          graphCache.tags.set(tag, []);
        }
        graphCache.tags.get(tag).push(entity.name);
      });
    }
  });

  graphCache.metadata = metadata;
  console.log('🔄 In-memory cache rebuilt.');
}

// 💾 Persist graph state to disk
async function persistStore() {
  console.log('💾 Persisting graph to disk...');
  try {
    const store = [...graphCache.entities, ...graphCache.relations];
    await fs.writeFile(MEMORY_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');

    graphCache.metadata.lastUpdated = new Date().toISOString();
    graphCache.metadata.totalEntities = graphCache.entities.length;
    graphCache.metadata.totalRelations = graphCache.relations.length;
    await fs.writeFile(GRAPH_METADATA_PATH, JSON.stringify(graphCache.metadata, null, 2), 'utf8');

    console.log(`✅ Graph state saved. ${graphCache.entities.length} entities, ${graphCache.relations.length} relations.`);
  } catch (error) {
    console.error('❌ Error persisting graph state:', error);
  }
}

// 🧠 C-R-U-D Operations for Graph Elements

export async function createEntities(entities) {
  const newEntities = [];
  for (const entityData of entities) {
    // Validation based on the new spec
    if (!entityData.type || !entityData.scope || (!entityData.text && !entityData.rich)) {
      console.warn('Skipping entity with missing required fields (type, scope, text/rich):', entityData);
      continue;
    }
    const id = entityData.id || `ent_${crypto.randomBytes(8).toString('hex')}`;
    const newEntity = {
      id,
      ...entityData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    graphCache.entities.push(newEntity);
    graphCache.entityMap.set(id, newEntity);
    graphCache.entityMap.set(newEntity.name, newEntity);
    newEntities.push(newEntity);
  }
  await persistStore();
  return newEntities;
}

export async function addObservations(observations) {
  for (const obsData of observations) {
    const entity = graphCache.entityMap.get(obsData.entityName);
    if (entity) {
      if (!entity.observations) {
        entity.observations = [];
      }

      // Get embeddings for new observation contents
      const contents = obsData.contents;
      const vectors = await embedTexts(contents);

      const newObservations = contents.map((content, index) => ({
        id: `obs_${crypto.randomBytes(8).toString('hex')}`,
        content,
        embedding: vectors[index], // Add the embedding
        timestamp: new Date().toISOString(),
        source: obsData.source || 'manual',
      }));

      entity.observations.push(...newObservations);
      entity.updatedAt = new Date().toISOString();
    } else {
      console.warn(`Entity not found for observation: ${obsData.entityName}`);
    }
  }

  console.warn("⚠️ New observations added. Vector index is now stale. Please restart to rebuild the index for accurate search.");
  await persistStore();
  return observations; // Returning the input as the function signature in index.js suggests
}

export async function createRelations(relations) {
  const newRelations = [];
  const relationsToAdd = [...relations];

  // Automatically add inverse relations for hierarchies
  for (const relData of relations) {
    if (relData.relationType === 'parent_of') {
      relationsToAdd.push({
        from: relData.to,
        to: relData.from,
        relationType: 'child_of',
        properties: { auto_generated: true }
      });
    }
    if (relData.relationType === 'child_of') {
       relationsToAdd.push({
        from: relData.to,
        to: relData.from,
        relationType: 'parent_of',
        properties: { auto_generated: true }
      });
    }
  }

  for (const relData of relationsToAdd) {
    const fromEntity = graphCache.entityMap.get(relData.from);
    const toEntity = graphCache.entityMap.get(relData.to);
    if (!fromEntity || !toEntity) {
      console.warn('Skipping relation with missing entity:', relData);
      continue;
    }
    const signature = `${relData.from}::${relData.relationType}::${relData.to}`;
    if (graphCache.relationMap.has(signature)) {
        console.log(`Skipping duplicate relation: ${signature}`);
        continue;
    }

    const id = `rel_${crypto.randomBytes(8).toString('hex')}`;
    const newRelation = {
      id,
      ...relData,
      type: 'relation',
      createdAt: new Date().toISOString(),
    };
    graphCache.relations.push(newRelation);
    graphCache.relationMap.set(signature, newRelation);
    newRelations.push(newRelation);
  }
  await persistStore();
  return newRelations;
}

// 🔍 Search and Query Functions

let vectorIndex = new Map();
let centroids = [];
const NUM_CENTROIDS = 10;
let bm25Index;

async function buildBm25Index() {
    console.log("📝 Building BM25 index...");
    const documents = [];
    graphCache.entities.forEach(entity => {
        if (entity.observations) {
            entity.observations.forEach(obs => {
                documents.push({
                    id: obs.id,
                    entityName: entity.name,
                    content: obs.content
                });
            });
        }
    });

    if (documents.length === 0) {
        console.log("⚠️ No documents for BM25 index.");
        return;
    }

    bm25Index = new BM25(
        documents,
        {
            fields: { content: 1 },
            key: 'id'
        }
    );
    console.log(`✅ BM25 index built with ${documents.length} documents.`);
}

async function buildVectorIndex() {
  console.log("🧠 Building vector index...");

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
    console.log(`🧠 Found ${textsToEmbed.length} observations without embeddings. Generating them now...`);
    const vectors = await embedTexts(textsToEmbed);
    observationsWithoutEmbedding.forEach((obs, index) => {
      obs.embedding = vectors[index];
    });
    console.log("✅ Embeddings generated for existing observations.");
    await persistStore(); // Save the newly added embeddings
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
    console.log("⚠️ No vectors to index.");
    return;
  }

  // 1. Initialize centroids (simple random sampling)
  centroids = [];
  const shuffled = observationVectors.sort(() => 0.5 - Math.random());
  for (let i = 0; i < Math.min(NUM_CENTROIDS, shuffled.length); i++) {
    centroids.push(shuffled[i].vector);
  }

  // 2. Assign vectors to nearest centroid
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
  console.log(`✅ Vector index built. ${observationVectors.length} vectors in ${centroids.length} clusters.`);
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

  console.log(`🏷️ Expanded tags from [${tags.join(', ')}] to [${Array.from(expandedTags).join(', ')}]`);
  return Array.from(expandedTags);
}

export async function semanticSearch(query, options = {}) {
  const { topK = 8, filters = {}, hybrid = { bm25: 0.5, cosine: 0.5 } } = options;

  // 1. Vectorize the query for cosine search
  const queryVector = (await embedTexts([query]))[0];

  // 2. Perform Vector Search
  const vectorResults = await vectorSearch(queryVector, { ...options, topK: topK * 2 }); // Get more results to allow for re-ranking

  // 3. Perform BM25 Search
  const bm25Results = await bm25Search(query, { ...options, topK: topK * 2 });

  // 4. Combine and Re-rank
  const combinedScores = new Map();

  // Process vector results
  vectorResults.forEach(res => {
    const key = res.entity.id + '::' + res.observation;
    combinedScores.set(key, {
        score: res.similarity * hybrid.cosine,
        result: res
    });
  });

  // Process BM25 results
  bm25Results.forEach(res => {
    const key = res.entity.id + '::' + res.observation;
    if (combinedScores.has(key)) {
        const existing = combinedScores.get(key);
        existing.score += res.score * hybrid.bm25;
    } else {
        combinedScores.set(key, {
            score: res.score * hybrid.bm25,
            result: res
        });
    }
  });

  // 5. Sort by combined score and return topK
  const finalResults = Array.from(combinedScores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.result);

  return finalResults;
}

async function bm25Search(query) {
    if (!bm25Index) {
        console.warn("⚠️ BM25 Index not built.");
        return [];
    }
    const results = bm25Index.search(query);
    // Normalize BM25 scores (this is a simple normalization, a better one might be needed)
    const maxScore = results.reduce((max, r) => Math.max(max, r.score), 1);

    return results.map(res => ({
        entity: graphCache.entityMap.get(res.doc.entityName),
        score: res.score / maxScore,
        observation: res.doc.content,
        search_method: 'bm25'
    }));
}

function applyTagFilter(entity, filterSet) {
    if (filterSet.size === 0) {
        return true; // No filter, always pass
    }
    const entityTags = new Set(entity.autoTags || []);
    return [...filterSet].some(tag => entityTags.has(tag));
}

async function vectorSearch(queryVector, options) {
    const { topK = 5, threshold = 0.3, tagFilter = [], expandTags: shouldExpand = true } = options;

    if (centroids.length === 0) {
        console.warn("⚠️ Vector index is not built. Search is not possible.");
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
        if (similarity < threshold) continue;

        const entity = graphCache.entityMap.get(obsVector.entityName);
        if (!entity) continue;

        if (!applyTagFilter(entity, filterSet)) continue;

        results.push({
            entity,
            similarity: similarity,
            observation: obsVector.content,
            search_method: 'vector'
        });
    }
    return results;
}

export async function getAllTags() {
  return Array.from(graphCache.tags.keys());
}

export async function searchByTag(tag, options = {}) {
  const { limit = 50 } = options;
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

export async function readGraph() {
  return {
    entities: graphCache.entities,
    relations: graphCache.relations,
    stats: graphCache.metadata,
  };
}

export async function openNodes(names) {
    return names.map(name => graphCache.entityMap.get(name)).filter(Boolean);
}

export async function searchNodes(query) {
    const lowerCaseQuery = query.toLowerCase();
    return graphCache.entities.filter(e => e.name.toLowerCase().includes(lowerCaseQuery));
}


// 🗑️ Deletion Operations
export async function deleteEntities(entityNames) {
  let deletedCount = 0;
  const entitiesToDelete = new Set(entityNames);

  graphCache.entities = graphCache.entities.filter(entity => {
    if (entitiesToDelete.has(entity.name)) {
      deletedCount++;
      graphCache.entityMap.delete(entity.id);
      graphCache.entityMap.delete(entity.name);
      return false;
    }
    return true;
  });

  // Also remove relations connected to deleted entities
  graphCache.relations = graphCache.relations.filter(rel => {
      return !entitiesToDelete.has(rel.from) && !entitiesToDelete.has(rel.to);
  });

  await persistStore();
  return { deleted: deletedCount };
}

export async function deleteRelations(relations) {
  // This is a simplified implementation. A real one would need more robust matching.
  console.warn("deleteRelations is not fully implemented.");
  return { deleted: 0 };
}

export async function deleteObservations(deletions) {
  console.warn("deleteObservations is not fully implemented.");
  return { deleted: 0 };
}

// 🌳 Hierarchy and Lineage Functions

function traverse(startNode, direction) {
  const lineage = { name: startNode, children: [] };
  const relationType = direction === 'descendants' ? 'parent_of' : 'child_of';
  const oppositeRelation = direction === 'descendants' ? 'child_of' : 'parent_of';

  const relationsToFollow = graphCache.relations.filter(r => r.relationType === relationType && r.from === startNode);

  for (const rel of relationsToFollow) {
    lineage.children.push(traverse(rel.to, direction));
  }
  return lineage;
}

export async function getLineage(entityName, options = {}) {
  const { direction = 'descendants' } = options; // 'descendants' or 'ancestors'
  const startNode = graphCache.entityMap.get(entityName);

  if (!startNode) {
    throw new Error(`Entity "${entityName}" not found.`);
  }

  return traverse(entityName, direction);
}