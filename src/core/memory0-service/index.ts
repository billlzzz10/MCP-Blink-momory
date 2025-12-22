import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import type { Entity, Observation } from '../../types/memory.types';

export interface Memory0Node extends Entity {
  isRoot: true;
  systemVersion: string;
  initializationTime: string;
  linkedEntities: Set<string>;
}

export class Memory0Service {
  private rootNode: Memory0Node | null = null;
  private readonly ROOT_ID = '00000000-0000-0000-0000-000000000000';

  async initializeRootMemory(): Promise<Memory0Node> {
    if (this.rootNode) {
      return this.rootNode;
    }

    const now = new Date().toISOString();
    
    this.rootNode = {
      id: this.ROOT_ID,
      name: 'System Root Memory',
      type: 'system',
      isRoot: true,
      systemVersion: '2.0.0',
      initializationTime: now,
      linkedEntities: new Set(),
      observations: [
        {
          id: uuidv4(),
          content: 'MCP Blink Memory system initialized',
          createdAt: now
        },
        {
          id: uuidv4(),
          content: 'Root memory node (#0) created for system baseline',
          createdAt: now
        }
      ],
      autoTags: ['system', 'root', 'baseline', 'mcp'],
      metadata: {
        systemInfo: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        capabilities: [
          'knowledge-graph',
          'semantic-search',
          'auto-tagging',
          'audit-logging'
        ]
      },
      createdAt: now,
      updatedAt: now
    };

    logger.info('Root memory node (#0) initialized');
    return this.rootNode;
  }

  getRootMemory(): Memory0Node | null {
    return this.rootNode;
  }

  async linkEntityToRoot(entityId: string, linkReason?: string): Promise<void> {
    if (!this.rootNode) {
      await this.initializeRootMemory();
    }

    this.rootNode!.linkedEntities.add(entityId);
    
    // Add observation about the link
    const observation: Observation = {
      id: uuidv4(),
      content: `Linked entity ${entityId} to root memory${linkReason ? `: ${linkReason}` : ''}`,
      createdAt: new Date().toISOString()
    };
    
    this.rootNode!.observations.push(observation);
    this.rootNode!.updatedAt = new Date().toISOString();
    
    logger.debug(`Entity ${entityId} linked to root memory`);
  }

  async unlinkEntityFromRoot(entityId: string): Promise<void> {
    if (!this.rootNode) return;

    this.rootNode.linkedEntities.delete(entityId);
    
    // Add observation about the unlink
    const observation: Observation = {
      id: uuidv4(),
      content: `Unlinked entity ${entityId} from root memory`,
      createdAt: new Date().toISOString()
    };
    
    this.rootNode.observations.push(observation);
    this.rootNode.updatedAt = new Date().toISOString();
    
    logger.debug(`Entity ${entityId} unlinked from root memory`);
  }

  getLinkedEntities(): string[] {
    return this.rootNode ? Array.from(this.rootNode.linkedEntities) : [];
  }

  async addSystemObservation(content: string, metadata?: any): Promise<void> {
    if (!this.rootNode) {
      await this.initializeRootMemory();
    }

    const observation: Observation = {
      id: uuidv4(),
      content,
      createdAt: new Date().toISOString(),
      metadata
    };

    this.rootNode!.observations.push(observation);
    this.rootNode!.updatedAt = new Date().toISOString();
    
    logger.debug('Added system observation to root memory:', content);
  }

  getSystemStats() {
    if (!this.rootNode) return null;

    return {
      rootId: this.rootNode.id,
      systemVersion: this.rootNode.systemVersion,
      initializationTime: this.rootNode.initializationTime,
      linkedEntitiesCount: this.rootNode.linkedEntities.size,
      observationsCount: this.rootNode.observations.length,
      lastUpdated: this.rootNode.updatedAt,
      uptime: Date.now() - new Date(this.rootNode.initializationTime).getTime()
    };
  }

  async performSystemMaintenance(): Promise<void> {
    if (!this.rootNode) return;

    // Clean up old observations (keep last 100)
    if (this.rootNode.observations.length > 100) {
      const keepCount = 100;
      const removed = this.rootNode.observations.length - keepCount;
      this.rootNode.observations = this.rootNode.observations.slice(-keepCount);
      
      await this.addSystemObservation(`System maintenance: Cleaned up ${removed} old observations`);
    }

    // Update system metadata
    this.rootNode.metadata = {
      ...this.rootNode.metadata,
      lastMaintenance: new Date().toISOString(),
      maintenanceCount: (this.rootNode.metadata?.maintenanceCount || 0) + 1
    };

    this.rootNode.updatedAt = new Date().toISOString();
    
    logger.info('System maintenance completed for root memory');
  }

  isEntityLinkedToRoot(entityId: string): boolean {
    return this.rootNode?.linkedEntities.has(entityId) || false;
  }

  async resetRootMemory(): Promise<Memory0Node> {
    logger.warn('Resetting root memory - all system history will be lost');
    this.rootNode = null;
    return this.initializeRootMemory();
  }
}

export const memory0Service = new Memory0Service();