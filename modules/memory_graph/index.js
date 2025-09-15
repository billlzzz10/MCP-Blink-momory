
// modules/memory_graph/index.js - Knowledge Graph Memory Management System
// จัดการ entities, relations, observations ในรูปแบบ graph structure สำหรับ Explicit Agent Protocol
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

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
    
    // 5. Save initial metadata ถ้าไม่มี
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
    graphCache.relationMap.set(signature