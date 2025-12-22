import type { CreateEntitiesRequest, CreateEntitiesResponse } from '../../types/rpc.types';
import { Validator } from '../../utils/validator';
import { logger } from '../../utils/logger';
import { memoryStore } from '../../storage/memory-store';
import { autoTagService } from '../../core/auto-tag-service/index';
import { memory0Service } from '../../core/memory0-service/index';
import { systemService } from '../../core/system/index';

export class EntityHandler {
  async createEntities(params: CreateEntitiesRequest): Promise<CreateEntitiesResponse> {
    logger.debug('Create entities requested', { count: params.entities?.length });
    
    const entities = Validator.validateEntityInputArray(params.entities);
    const createdEntities = [];
    
    for (const entityInput of entities) {
      // Generate auto tags if enabled
      if (params.options?.autoTag) {
        const tagResult = autoTagService.generateTags(
          [entityInput.name, ...(entityInput.observations || [])].join(' '),
          entityInput.type
        );
        
        // Attach generated tags to the entity input
        entityInput.autoTags = tagResult.tags;
        
        entityInput.metadata = {
          ...entityInput.metadata,
          autoTagConfidence: tagResult.confidence
        };
      }
      
      const entity = await memoryStore.createEntity(entityInput);
      
      // Link to Memory0 if requested
      if (params.options?.linkToMemory0) {
        await memory0Service.linkEntityToRoot(entity.id, 'Auto-linked during creation');
      }
      
      // Log audit entry
      await systemService.logAuditEntry('create_entity', {
        entityId: entity.id,
        name: entity.name,
        type: entity.type,
        autoTagged: !!params.options?.autoTag,
        tagsGenerated: entity.autoTags?.length || 0,
        linkedToRoot: !!params.options?.linkToMemory0
      }, entity.id);
      
      createdEntities.push(entity);
    }
    
    return {
      success: true,
      count: createdEntities.length,
      data: createdEntities
    };
  }

  async getEntity(params: { entityId: string }): Promise<any> {
    const entityId = Validator.validateId(params.entityId);
    logger.debug('Get entity requested', { entityId });
    
    const entity = await memoryStore.getEntity(entityId);
    if (!entity) {
      throw new Error(`Entity not found: ${entityId}`);
    }
    
    return { success: true, data: entity };
  }

  async updateEntity(params: { entityId: string; updates: any }): Promise<any> {
    const entityId = Validator.validateId(params.entityId);
    logger.debug('Update entity requested', { entityId });
    
    throw new Error('Method not implemented yet');
  }

  async deleteEntity(params: { entityId: string }): Promise<any> {
    const entityId = Validator.validateId(params.entityId);
    logger.debug('Delete entity requested', { entityId });
    
    throw new Error('Method not implemented yet');
  }

  async addObservations(params: { entityId: string; observations: string[]; options?: any }): Promise<any> {
    const entityId = Validator.validateId(params.entityId);
    logger.debug('Add observations requested', { entityId, count: params.observations?.length });
    
    throw new Error('Method not implemented yet');
  }
}

export const entityHandler = new EntityHandler();