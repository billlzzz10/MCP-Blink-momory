// Embedding Service Type Definitions
export type Vector = number[];

export interface EmbeddingVector {
  dimensions: number;
  values: number[];
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  model: string;
  dimensions: number;
}

export type EmbeddingProvider = 'openai' | 'huggingface' | 'mock';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  apiKey?: string;
  model?: string;
  dimensions?: number;
  maxTokens?: number;
}

export interface SimilarityResult {
  similarity: number;
  threshold: number;
  matched: boolean;
}

// OpenAI Embedding Types
export interface OpenAIEmbeddingRequest {
  input: string | string[];
  model: string;
  encoding_format?: 'float' | 'base64';
  dimensions?: number;
  user?: string;
}

export interface OpenAIEmbeddingResponse {
  object: 'list';
  data: Array<{
    object: 'embedding';
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

// HuggingFace Embedding Types
export interface HuggingFaceEmbeddingRequest {
  inputs: string | string[];
  options?: {
    wait_for_model?: boolean;
    use_cache?: boolean;
  };
}

export interface HuggingFaceEmbeddingResponse {
  embeddings?: number[][];
  error?: string;
}