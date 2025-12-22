// Memory System Type Definitions
export interface Entity {
  id: string;
  name: string;
  type: string;
  observations: Observation[];
  metadata?: Record<string, any>;
  autoTags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EntityInput {
  name: string;
  type: string;
  observations?: string[];
  metadata?: Record<string, any>;
  autoTags?: string[];
}

export interface Observation {
  id: string;
  content: string;
  embedding?: number[];
  tags?: string[];
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Relation {
  id: string;
  from: string;
  to: string;
  relationType: string;
  properties?: Record<string, any>;
  createdAt: string;
}

export interface RelationInput {
  from: string;
  to: string;
  relationType: string;
  properties?: Record<string, any>;
}

export interface SearchResult {
  entity: Entity;
  similarity: number;
  matchedTags: string[];
  observations: Observation[];
}

export interface GraphStats {
  entities: number;
  relations: number;
  observations: number;
  tags: number;
  lastUpdated: string;
}

export interface LineageEntry {
  id: string;
  entityId: string;
  operation: string;
  timestamp: string;
  details: Record<string, any>;
}

// Memory0 (Root Memory Node) Types
export interface Memory0Node {
  id: '0';
  name: 'System Memory Root';
  type: 'system';
  observations: Observation[];
  connections: string[];
  createdAt: string;
  updatedAt: string;
}