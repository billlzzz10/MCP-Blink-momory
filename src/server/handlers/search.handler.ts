import type { SemanticSearchRequest, SemanticSearchResponse } from '../../types/rpc.types';
import { Validator } from '../../utils/validator';
import { logger } from '../../utils/logger';
import { memoryStore } from '../../storage/memory-store';
import { embeddingService } from '../../core/embedding-service/index';

export class SearchHandler {
  async semanticSearch(params: SemanticSearchRequest): Promise<SemanticSearchResponse> {
    const query = Validator.validateQuery(params.query);
    const options = Validator.validateSearchOptions(params.options);
    
    logger.debug('Semantic search requested', { query, options });
    
    try {
      // Get all entities for semantic search
      const entities = await memoryStore.searchEntities(''); // Get all entities
      
      // Prepare candidates for embedding comparison
      const candidates = entities.map(entity => ({
        id: entity.id,
        text: [entity.name, ...entity.observations.map(obs => obs.content)].join(' ')
      }));
      
      // Use embedding service for semantic similarity
      const similarResults = await embeddingService.findSimilar(query, candidates, options.topK);
      
      // Filter by threshold and map to response format
      const results = similarResults
        .filter(result => result.similarity >= options.threshold)
        .map(result => {
          const entity = entities.find(e => e.id === result.id)!;
          return {
            entity,
            similarity: result.similarity,
            matchedTags: entity.autoTags || [],
            observations: entity.observations
          };
        });
      
      return {
        success: true,
        count: results.length,
        data: results
      };
    } catch (error) {
      logger.warn('Semantic search failed, falling back to text search:', error);
      
      // Fallback to simple text search
      const entities = await memoryStore.searchEntities(query);
      const results = entities.slice(0, options.topK).map(entity => ({
        entity,
        similarity: 0.8, // Mock similarity score
        matchedTags: entity.autoTags || [],
        observations: entity.observations
      }));
      
      return {
        success: true,
        count: results.length,
        data: results
      };
    }
  }

  async searchByTag(params: { tags: string[]; options?: any }): Promise<any> {
    logger.debug('Search by tag requested', { tags: params.tags });
    
    throw new Error('Method not implemented yet');
  }
}

export const searchHandler = new SearchHandler();