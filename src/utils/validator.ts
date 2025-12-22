import { z } from 'zod';
import type { EntityInput, RelationInput } from '../types/memory.types';

// Entity validation schema
export const EntityInputSchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  type: z.string().min(1, 'Entity type is required'),
  observations: z.array(z.string()).optional().default([]),
  metadata: z.record(z.any()).optional(),
  autoTags: z.array(z.string()).optional()
});

// Relation validation schema
export const RelationInputSchema = z.object({
  from: z.string().min(1, 'From entity is required'),
  to: z.string().min(1, 'To entity is required'),
  relationType: z.string().min(1, 'Relation type is required'),
  properties: z.record(z.any()).optional()
});

// Search options validation schema
export const SearchOptionsSchema = z.object({
  topK: z.number().min(1).max(50).optional().default(10),
  threshold: z.number().min(0).max(1).optional().default(0.3),
  tagFilter: z.array(z.string()).optional()
});

export class Validator {
  static validateEntityInput(data: unknown): EntityInput {
    return EntityInputSchema.parse(data);
  }

  static validateEntityInputArray(data: unknown): EntityInput[] {
    const arraySchema = z.array(EntityInputSchema);
    return arraySchema.parse(data);
  }

  static validateRelationInput(data: unknown): RelationInput {
    return RelationInputSchema.parse(data);
  }

  static validateRelationInputArray(data: unknown): RelationInput[] {
    const arraySchema = z.array(RelationInputSchema);
    return arraySchema.parse(data);
  }

  static validateSearchOptions(data: unknown) {
    return SearchOptionsSchema.parse(data || {});
  }

  static validateId(id: unknown): string {
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid ID: must be a non-empty string');
    }
    return id.trim();
  }

  static validateQuery(query: unknown): string {
    if (typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Invalid query: must be a non-empty string');
    }
    return query.trim();
  }
}