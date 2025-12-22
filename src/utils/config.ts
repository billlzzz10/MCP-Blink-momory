import { config as dotenvConfig } from 'dotenv';
import type { EmbeddingProvider } from '../types/embedding.types';

// Load environment variables
dotenvConfig();

export interface Config {
  server: {
    port: number;
    host: string;
    logLevel: string;
  };
  embedding: {
    provider: EmbeddingProvider;
    apiKey?: string;
    model?: string;
    dimensions: number;
  };
  tagging: {
    mode: 'basic' | 'advanced' | 'ml';
    language: 'th' | 'en';
  };
  storage: {
    path: string;
    enableAuditLog: boolean;
  };
}

export const config: Config = {
  server: {
    port: parseInt(process.env.MCP_PORT || '7070', 10),
    host: process.env.MCP_HOST || 'localhost',
    logLevel: process.env.MCP_LOG_LEVEL || 'info'
  },
  embedding: {
    provider: (process.env.EMBEDDING_MODE as EmbeddingProvider) || 'mock',
    apiKey: process.env.OPENAI_API_KEY || process.env.HUGGINGFACE_API_KEY,
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '384', 10)
  },
  tagging: {
    mode: (process.env.TAG_MODE as 'basic' | 'advanced' | 'ml') || 'advanced',
    language: (process.env.TAG_LANGUAGE as 'th' | 'en') || 'th'
  },
  storage: {
    path: process.env.STORAGE_PATH || './memory',
    enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true'
  }
};