import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import type { Entity, Relation, GraphStats } from '../types/memory.types';

interface MemoryData {
  entities: Map<string, Entity>;
  relations: Map<string, Relation>;
  entityNameIndex: Map<string, string>; // name -> id
}

export class MemoryStore {
  private data: MemoryData;
  private filePath: string;

  constructor() {
    this.filePath = `${config.storage.path}/memory_store.json`;
    this.data = {
      entities: new Map(),
      relations: new Map(),
      entityNameIndex: new Map()
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(config.storage.path, { recursive: true });
      await this.load();
    } catch (error) {
      logger.warn('Failed to load memory store, starting fresh:', error);
    }
  }

  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      this.data.entities = new Map(parsed.entities || []);
      this.data.relations = new Map(parsed.relations || []);
      this.data.entityNameIndex = new Map(parsed.entityNameIndex || []);
      
      logger.info(`Loaded ${this.data.entities.size} entities and ${this.data.relations.size} relations`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private async save(): Promise<void> {
    const serializable = {
      entities: Array.from(this.data.entities.entries()),
      relations: Array.from(this.data.relations.entries()),
      entityNameIndex: Array.from(this.data.entityNameIndex.entries())
    };
    
    await fs.writeFile(this.filePath, JSON.stringify(serializable, null, 2));
  }

  async createEntity(input: { name: string; type: string; observations?: string[]; metadata?: any; autoTags?: string[] }): Promise<Entity> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const entity: Entity = {
      id,
      name: input.name,
      type: input.type,
      observations: (input.observations || []).map(content => ({
        id: uuidv4(),
        content,
        createdAt: now
      })),
      metadata: input.metadata,
      autoTags: input.autoTags || [],
      createdAt: now,
      updatedAt: now
    };

    this.data.entities.set(id, entity);
    this.data.entityNameIndex.set(input.name, id);
    
    await this.save();
    logger.debug(`Created entity: ${input.name} (${id})`);
    
    return entity;
  }

  async getEntity(id: string): Promise<Entity | null> {
    return this.data.entities.get(id) || null;
  }

  async getEntityByName(name: string): Promise<Entity | null> {
    const id = this.data.entityNameIndex.get(name);
    return id ? this.data.entities.get(id) || null : null;
  }

  async createRelation(input: { from: string; to: string; relationType: string; properties?: any }): Promise<Relation> {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const relation: Relation = {
      id,
      from: input.from,
      to: input.to,
      relationType: input.relationType,
      properties: input.properties,
      createdAt: now
    };

    this.data.relations.set(id, relation);
    await this.save();
    
    logger.debug(`Created relation: ${input.from} -> ${input.to} (${input.relationType})`);
    return relation;
  }

  async getGraphStats(): Promise<GraphStats> {
    const totalObservations = Array.from(this.data.entities.values())
      .reduce((sum, entity) => sum + entity.observations.length, 0);
    
    const allTags = new Set<string>();
    Array.from(this.data.entities.values()).forEach(entity => {
      entity.autoTags?.forEach(tag => allTags.add(tag));
    });

    return {
      entities: this.data.entities.size,
      relations: this.data.relations.size,
      observations: totalObservations,
      tags: allTags.size,
      lastUpdated: new Date().toISOString()
    };
  }

  async searchEntities(query: string): Promise<Entity[]> {
    const results: Entity[] = [];
    const queryLower = query.toLowerCase();
    
    for (const entity of this.data.entities.values()) {
      if (entity.name.toLowerCase().includes(queryLower) ||
          entity.observations.some(obs => obs.content.toLowerCase().includes(queryLower))) {
        results.push(entity);
      }
    }
    
    return results;
  }
}

export const memoryStore = new MemoryStore();