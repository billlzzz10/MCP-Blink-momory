// Public API surface for Explicit Agent Protocol + KG Memory
// ES6 Module imports for available modules
import * as MemoryGraph from "./modules/memory_graph/index.js";
import * as Memory0 from "./modules/memory0_service/index.js";
import * as System from "./modules/system/index.js";
import fs from 'fs/promises';
import path from 'path';

// Mock implementations for missing modules (จะ scaffold จริงในขั้นตอนถัดไป)
const Embedding = {
  // Mock embedding service - สร้าง vector representations จาก text
  async embedTexts(texts) {
    console.log("⚠️  Embedding service: Mock mode (ใช้ random vectors)");
    
    // สร้าง mock vectors ขนาด 384 dimensions (standard for many embedding models)
    const mockVectors = texts.map((text, index) => {
      const vector = new Array(384).fill(0);
      // สร้าง pseudo-random values จาก text length และ index
      const seed = text.length + index * 17;
      for (let i = 0; i < 384; i++) {
        vector[i] = (Math.sin(seed + i * 0.1) + 1) / 2 * 0.5; // 0-0.5 range
      }
      return vector;
    });
    
    console.log(`📊 สร้าง ${mockVectors.length} mock vectors สำหรับ ${texts.length} texts`);
    return mockVectors;
  }
};

const AutoTag = {
  // Mock auto-tagging service - แยก keywords พื้นฐาน
  async autoTagOnObservations(observations) {
    console.log("⚠️  Auto-tagging service: Mock mode (keyword extraction)");
    
    const taggedObservations = observations.map(obs => {
      const { entityName, contents } = obs;
      const allText = contents.join(' ');
      
      // Simple keyword extraction (mock implementation)
      const words = allText.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && word.length < 15);
      
      const uniqueWords = [...new Set(words)].slice(0, 5); // Top 5 keywords
      
      return {
        ...obs,
        autoTags: uniqueWords,
        tagConfidence: Array(uniqueWords.length).fill(0.7) // Mock confidence
      };
    });
    
    console.log(`🏷️  สร้าง auto-tags สำหรับ ${taggedObservations.length} observations`);
    return taggedObservations;
  }
};

const Lineage = {
  // Lineage logging system - บันทึก operations ใน JSON log
  async log(action, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      data: { ...data, user: process.env.USER || 'system' },
      ip: process.env.NODE_ENV === 'production' ? 'remote' : 'localhost'
    };
    
    const logPath = path.join(process.cwd(), 'memory', 'lineage_log.json');
    let logs = [];
    
    try {
      const logData = await fs.readFile(logPath, 'utf8');
      if (logData.trim()) {
        logs = JSON.parse(logData);
      }
    } catch (error) {
      console.log("📝 เริ่มต้น lineage log ใหม่");
    }
    
    // เก็บ logs ล่าสุด 1000 entries
    logs.unshift(logEntry);
    logs = logs.slice(0, 1000);
    
    try {
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2), 'utf8');
      console.log(`📝 Lineage: ${action} (${data.count || data.entities?.length || 1} items)`);
    } catch (writeError) {
      console.error("⚠️  ไม่สามารถบันทึก lineage log:", writeError.message);
    }
    
    return logEntry;
  }
};

// 🏗️ Initialization - เตรียมระบบให้พร้อมใช้งาน
export async function ensureInitialized() {
  console.log("🚀 เริ่มต้น Explicit Agent Protocol + KG Memory...");
  
  try {
    // 1. ตรวจสอบโครงสร้างโปรเจ็กต์
    await System.validateStructure();
    console.log("✅ โครงสร้างโปรเจ็กต์ผ่านการตรวจสอบ");
    
    // 2. สร้าง baseline configuration
    await System.ensureBaseline();
    console.log("✅ Baseline configuration สร้างเรียบร้อย");
    
    // 3. เตรียม memory graph store
    await MemoryGraph.ensureStore();
    console.log("✅ Memory Graph store พร้อมใช้งาน");
    
    // 4. สร้าง Root memory node (#0)
    const rootMemory = await Memory0.ensureRoot();
    console.log(`✅ Root Memory Node (${rootMemory?.name || 'memory0'}) พร้อมใช้งาน`);
    
    // 5. Test basic functionality
    console.log("🧪 ทดสอบ basic functionality...");
    const testEntity = await createEntities([{
      name: "test-system",
      type: "system",
      observations: ["Test entity for initialization"]
    }], { autoTag: false, linkToMemory0: true });
    
    console.log(`✅ ระบบพร้อมใช้งาน - สร้าง ${testEntity.length} test entities`);
    
  } catch (error) {
    console.error("❌ Error during system initialization:", error);
    throw new Error(`Initialization failed: ${error.message}`);
  }
}

// 🧠 Core Memory Operations - ฟังก์ชันหลักสำหรับจัดการความจำ

export async function createEntities(entities, options = {}) {
  const { autoTag = true, linkToMemory0 = true } = options;
  
  console.log(`🆕 สร้าง ${entities.length} entities`);
  
  try {
    // 1. สร้าง entities ใน memory graph
    const created = await MemoryGraph.createEntities(entities);
    
    // 2. บันทึก lineage
    await Lineage.log("create_entities", { 
      count: created.length, 
      types: [...new Set(created.map(e => e.type))]
    });
    
    // 3. เชื่อมต่อกับ Root memory (ถ้าต้องการ)
    if (linkToMemory0 && created.length > 0) {
      const entityNames = created.map(e => e.name);
      await Memory0.linkToRoot(entityNames);
      console.log(`🔗 เชื่อมต่อ ${entityNames.length} entities กับ Root`);
    }
    
    // 4. Auto-tagging (ถ้าต้องการ)
    let finalResult = created;
    if (autoTag) {
      finalResult = await AutoTag.autoTagOnObservations(created);
      await Lineage.log("auto_tagging", { 
        count: finalResult.length, 
        newTags: finalResult.flatMap(r => r.autoTags || []).length 
      });
    }
    
    return finalResult;
    
  } catch (error) {
    console.error("❌ Error creating entities:", error);
    await Lineage.log("create_entities_error", { error: error.message, count: entities.length });
    throw error;
  }
}

export async function addObservations(observations, options = {}) {
  const { autoTag = true } = options;
  
  console.log(`📝 เพิ่ม ${observations.length} observations`);
  
  try {
    // 1. เพิ่ม observations ใน memory graph
    const result = await MemoryGraph.addObservations(observations);
    
    // 2. บันทึก lineage
    await Lineage.log("add_observations", { 
      count: observations.length,
      entities: observations.map(o => o.entityName).slice(0, 10) // Log first 10
    });
    
    // 3. Auto-tagging (ถ้าต้องการ)
    let finalResult = result;
    if (autoTag) {
      finalResult = await AutoTag.autoTagOnObservations(observations);
      await Lineage.log("auto_tag_observations", { 
        count: finalResult.length,
        taggedEntities: finalResult.map(r => r.entityName)
      });
    }
    
    return finalResult;
    
  } catch (error) {
    console.error("❌ Error adding observations:", error);
    await Lineage.log("add_observations_error", { error: error.message });
    throw error;
  }
}

export async function createRelations(relations, options = {}) {
  const { linkToMemory0 = false } = options;
  
  console.log(`🔗 สร้าง ${relations.length} relations`);
  
  try {
    // 1. สร้าง relations ใน memory graph
    const created = await MemoryGraph.createRelations(relations);
    
    // 2. บันทึก lineage
    await Lineage.log("create_relations", { 
      count: created.length,
      types: [...new Set(created.map(r => r.relationType))]
    });
    
    // 3. เชื่อมต่อ entities ที่เกี่ยวข้องกับ Root (ถ้าต้องการ)
    if (linkToMemory0) {
      const allNames = new Set();
      relations.forEach(r => {
        allNames.add(r.from);
        allNames.add(r.to);
      });
      
      if (allNames.size > 0) {
        await Memory0.linkToRoot([...allNames]);
        console.log(`🔗 เชื่อมต่อ ${allNames.size} unique entities กับ Root`);
      }
    }
    
    return created;
    
  } catch (error) {
    console.error("❌ Error creating relations:", error);
    await Lineage.log("create_relations_error", { error: error.message });
    throw error;
  }
}

// 🔍 Semantic Search - ค้นหาด้วย semantic similarity
export async function semanticSearch(query, options = {}) {
  const { topK = 8, tagFilter = [], threshold = 0.3 } = options;
  
  console.log(`🔍 Semantic search: "${query}" (top ${topK})`);
  
  try {
    // 1. สร้าง embedding สำหรับ query
    const queryVectors = await Embedding.embedTexts([query]);
    const queryVector = queryVectors[0];
    
    // 2. ค้นหาใน memory graph
    const results = await MemoryGraph.semanticSearch(queryVector, { 
      topK, 
      tagFilter, 
      threshold 
    });
    
    // 3. บันทึก lineage
    await Lineage.log("semantic_search", { 
      query: query.substring(0, 50) + '...', 
      topK, 
      results: results.length,
      threshold 
    });
    
    console.log(`✅ พบ ${results.length} ผลลัพธ์ (threshold: ${threshold})`);
    return results;
    
  } catch (error) {
    console.error("❌ Error in semantic search:", error);
    await Lineage.log("semantic_search_error", { error: error.message, query });
    throw error;
  }
}

// 🏷️ Tag Management - จัดการ tags และ metadata
export async function getAllTags() {
  try {
    const tags = await MemoryGraph.getAllTags();
    await Lineage.log("get_all_tags", { total: tags.length });
    return tags;
  } catch (error) {
    console.error("❌ Error getting all tags:", error);
    throw error;
  }
}

export async function searchByTag(tag, options = {}) {
  const { exact = false, limit = 50 } = options;
  
  try {
    const results = await MemoryGraph.searchByTag(tag, { exact, limit });
    await Lineage.log("search_by_tag", { tag, exact, results: results.length });
    return results;
  } catch (error) {
    console.error("❌ Error searching by tag:", error);
    throw error;
  }
}

// 📊 Graph Operations - จัดการ Knowledge Graph
export const readGraph = async () => {
  try {
    const graph = await MemoryGraph.readGraph();
    await Lineage.log("read_graph", { nodes: graph.entities?.length || 0 });
    return graph;
  } catch (error) {
    console.error("❌ Error reading graph:", error);
    throw error;
  }
};

export const openNodes = async (names) => {
  try {
    const nodes = await MemoryGraph.openNodes(names);
    await Lineage.log("open_nodes", { names: names.length });
    return nodes;
  } catch (error) {
    console.error("❌ Error opening nodes:", error);
    throw error;
  }
};

export const searchNodes = async (query) => {
  try {
    const nodes = await MemoryGraph.searchNodes(query);
    await Lineage.log("search_nodes", { query, results: nodes.length });
    return nodes;
  } catch (error) {
    console.error("❌ Error searching nodes:", error);
    throw error;
  }
};

// 🗑️ Deletion Operations - ลบข้อมูล (ต้องระวัง)
export const deleteEntities = async (entityNames) => {
  try {
    console.log(`🗑️ ลบ ${entityNames.length} entities (ระวัง: ไม่สามารถย้อนกลับได้)`);
    const result = await MemoryGraph.deleteEntities(entityNames);
    await Lineage.log("delete_entities", { names: entityNames, count: result.deleted });
    return result;
  } catch (error) {
    console.error("❌ Error deleting entities:", error);
    throw error;
  }
};

export const deleteRelations = async (relations) => {
  try {
    const result = await MemoryGraph.deleteRelations(relations);
    await Lineage.log("delete_relations", { count: relations.length });
    return result;
  } catch (error) {
    console.error("❌ Error deleting relations:", error);
    throw error;
  }
};

export const deleteObservations = async (deletions) => {
  try {
    const result = await MemoryGraph.deleteObservations(deletions);
    await Lineage.log("delete_observations", { deletions: deletions.length });
    return result;
  } catch (error) {
    console.error("❌ Error deleting observations:", error);
    throw error;
  }
};

// ⚙️ System Utilities - จัดการระบบ
export const validateStructure = async () => {
  try {
    const isValid = await System.validateStructure();
    await Lineage.log("validate_structure", { valid: isValid });
    return isValid;
  } catch (error) {
    console.error("❌ Error validating structure:", error);
    throw error;
  }
};

export const selfDescribe = async () => {
  try {
    const description = await System.selfDescribe();
    await Lineage.log("self_describe", {});
    return description;
  } catch (error) {
    console.error("❌ Error self-describing:", error);
    throw error;
  }
};

// 🔌 Export Submodules - สำหรับการใช้งานแบบ granular
export {
  MemoryGraph,
  Memory0,
  System,
  Embedding,  // Mock - จะ implement จริงต่อไป
  AutoTag,    // Mock - จะ implement จริงต่อไป
  Lineage
};

// 🧪 Utility Functions - ฟังก์ชันช่วยเหลือ
export function generateEntityId(name, type) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}_${type}_${timestamp}_${random}`;
}

export function validateEntity(entity) {
  const required = ['name', 'type'];
  const missing = required.filter(field => !entity[field]);
  
  if (missing.length > 0) {
    throw new Error(`Entity missing required fields: ${missing.join(', ')}`);
  }
  
  if (!entity.name || typeof entity.name !== 'string' || entity.name.trim().length === 0) {
    throw new Error('Entity name must be a non-empty string');
  }
  
  return true;
}

export function validateRelation(relation) {
  const required = ['from', 'to', 'relationType'];
  const missing = required.filter(field => !relation[field]);
  
  if (missing.length > 0) {
    throw new Error(`Relation missing required fields: ${missing.join(', ')}`);
  }
  
  return true;
}

// 📈 Health Check - ตรวจสอบสถานะระบบ
export async function healthCheck() {
  const status = {
    timestamp: new Date().toISOString(),
    modules: {
      memoryGraph: 'ready',
      memory0: 'ready',
      system: 'ready',
      embedding: 'mock',  // ยังไม่ implement จริง
      autoTag: 'mock',    // ยังไม่ implement จริง
      lineage: 'ready'
    },
    storage: {
      memoryStore: false,
      lineageLog: false
    }
  };
  
  try {
    await fs.access(path.join(process.cwd(), 'memory', 'memory_store.json'));
    status.storage.memoryStore = true;
  } catch {}
  
  try {
    await fs.access(path.join(process.cwd(), 'memory', 'lineage_log.json'));
    status.storage.lineageLog = true;
  } catch {}
  
  // Test basic connectivity
  try {
    const root = await Memory0.getRootMemory();
    status.rootMemory = root ? 'exists' : 'missing';
  } catch {
    status.rootMemory = 'error';
  }
  
  console.log("🏥 Health check:", status);
  return status;
}
