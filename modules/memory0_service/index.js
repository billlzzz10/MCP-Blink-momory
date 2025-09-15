// modules/memory0_service/index.js - จัดการ root memory node สำหรับ Knowledge Graph
import fs from 'fs/promises';
import path from 'path';

// Root memory node structure
const ROOT_MEMORY = {
  id: "memory0",
  name: "Root",
  type: "memory", 
  relationType: "root",
  observations: [
    "Default root memory profile created for Explicit Agent Protocol"
  ],
  links: [],
  data: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sig: "memory0::root::memory0",
  key: "memory0::root::Root"
};

// Path to memory store
const MEMORY_STORE_PATH = path.join(process.cwd(), 'memory', 'memory_store.json');

export async function ensureRoot() {
  try {
    // อ่าน memory store ปัจจุบัน
    let memoryStore = [];
    try {
      const data = await fs.readFile(MEMORY_STORE_PATH, 'utf8');
      memoryStore = JSON.parse(data);
    } catch (error) {
      // ถ้าไฟล์ไม่มี เริ่มต้นใหม่
      console.log("⚠️  Memory store ไม่พบ จะสร้างใหม่");
    }
    
    // ตรวจสอบว่า root memory มีอยู่หรือไม่
    const rootExists = memoryStore.some(entity => entity.id === "memory0");
    
    if (!rootExists) {
      // เพิ่ม root memory เข้า store
      memoryStore.unshift(ROOT_MEMORY);
      
      // เขียนกลับไปยังไฟล์
      await fs.writeFile(MEMORY_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
      console.log("✅ สร้าง Root memory node เรียบร้อย");
      
      // อัปเดต timestamp
      ROOT_MEMORY.updatedAt = new Date().toISOString();
      return ROOT_MEMORY;
    } else {
      console.log("ℹ️  Root memory node มีอยู่แล้ว");
      // คืนค่า root node ที่มีอยู่
      return memoryStore.find(e => e.id === "memory0");
    }
  } catch (error) {
    console.error("❌ Error in ensureRoot:", error);
    throw error;
  }
}

export async function linkToRoot(entityNames) {
  try {
    // อ่าน memory store
    const data = await fs.readFile(MEMORY_STORE_PATH, 'utf8');
    let memoryStore = JSON.parse(data);
    
    // สร้าง relations จาก root ไปยัง entities
    const relations = entityNames.map(name => ({
      from: "memory0",
      to: name,
      relationType: "contains"
    }));
    
    // เพิ่ม links ใน root node
    ROOT_MEMORY.links = [...new Set([...ROOT_MEMORY.links, ...entityNames])];
    ROOT_MEMORY.updatedAt = new Date().toISOString();
    
    // อัปเดต memory store
    const rootIndex = memoryStore.findIndex(e => e.id === "memory0");
    if (rootIndex !== -1) {
      memoryStore[rootIndex] = ROOT_MEMORY;
    }
    
    // บันทึกกลับ
    await fs.writeFile(MEMORY_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
    
    console.log(`🔗 ลิงก์ ${entityNames.length} entities ไปยัง Root memory`);
    return relations;
  } catch (error) {
    console.error("❌ Error in linkToRoot:", error);
    throw error;
  }
}

export async function getRootMemory() {
  try {
    const data = await fs.readFile(MEMORY_STORE_PATH, 'utf8');
    const memoryStore = JSON.parse(data);
    return memoryStore.find(e => e.id === "memory0") || null;
  } catch (error) {
    console.error("❌ Error getting root memory:", error);
    return null;
  }
}

export async function updateRootObservation(observation) {
  try {
    const data = await fs.readFile(MEMORY_STORE_PATH, 'utf8');
    let memoryStore = JSON.parse(data);
    
    const rootIndex = memoryStore.findIndex(e => e.id === "memory0");
    if (rootIndex !== -1) {
      memoryStore[rootIndex].observations.push(observation);
      memoryStore[rootIndex].updatedAt = new Date().toISOString();
      
      await fs.writeFile(MEMORY_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
      console.log("📝 อัปเดต observation ใน Root memory");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error updating root observation:", error);
    throw error;
  }
}

// Export root memory structure สำหรับการใช้งานอื่น
export { ROOT_MEMORY };