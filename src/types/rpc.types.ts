// JSON-RPC 2.0 Type Definitions
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number | null;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: JSONRPCError;
  id: string | number | null;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

// MCP Method Types
export type MCPMethod = 
  | 'healthCheck'
  | 'createEntities'
  | 'getEntity'
  | 'updateEntity'
  | 'deleteEntity'
  | 'addObservations'
  | 'semanticSearch'
  | 'searchByTag'
  | 'createRelations'
  | 'getGraphStats'
  | 'getLineage'
  | 'selfDescribe';

// Request/Response Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  memory?: {
    used: number;
    total: number;
    percentage: number;
  };
  services?: {
    embedding: boolean;
    tagging: boolean;
    graph: boolean;
  };
}

export interface CreateEntitiesRequest {
  entities: any[];
  options?: {
    autoTag?: boolean;
    linkToMemory0?: boolean;
  };
}

export interface CreateEntitiesResponse {
  success: boolean;
  count: number;
  data: any[];
}

export interface SemanticSearchRequest {
  query: string;
  options?: {
    topK?: number;
    threshold?: number;
    tagFilter?: string[];
  };
}

export interface SemanticSearchResponse {
  success: boolean;
  count: number;
  data: any[];
}