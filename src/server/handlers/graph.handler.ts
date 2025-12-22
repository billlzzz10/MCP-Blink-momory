import type { RelationInput, GraphStats } from '../../types/memory.types';
import { Validator } from '../../utils/validator';
import { logger } from '../../utils/logger';
import { memoryStore } from '../../storage/memory-store';

export class GraphHandler {
  async createRelations(params: { relations: RelationInput[]; options?: any }): Promise<any> {
    const relations = Validator.validateRelationInputArray(params.relations);
    logger.debug('Create relations requested', { count: relations.length });
    
    const createdRelations = [];
    for (const relationInput of relations) {
      const relation = await memoryStore.createRelation(relationInput);
      createdRelations.push(relation);
    }
    
    return {
      success: true,
      count: createdRelations.length,
      data: createdRelations
    };
  }

  async getGraphStats(): Promise<GraphStats> {
    logger.debug('Get graph stats requested');
    return memoryStore.getGraphStats();
  }

  async getLineage(params: { entityId: string; depth?: number }): Promise<any> {
    const entityId = Validator.validateId(params.entityId);
    logger.debug('Get lineage requested', { entityId, depth: params.depth });
    
    throw new Error('Method not implemented yet');
  }
}

export const graphHandler = new GraphHandler();