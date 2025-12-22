import axios from 'axios';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';
import type { EmbeddingProvider, Vector } from '../../types/embedding.types';

export interface EmbeddingResult {
  vector: Vector;
  dimensions: number;
}

export class EmbeddingService {
  private provider: EmbeddingProvider;
  private cache: Map<string, EmbeddingResult> = new Map();

  constructor() {
    this.provider = config.embedding.provider;
  }

  async getEmbedding(text: string): Promise<EmbeddingResult> {
    const cacheKey = `${this.provider}:${text}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    let result: EmbeddingResult;
    
    switch (this.provider) {
      case 'openai':
        result = await this.getOpenAIEmbedding(text);
        break;
      case 'huggingface':
        result = await this.getHuggingFaceEmbedding(text);
        break;
      case 'mock':
      default:
        result = this.getMockEmbedding(text);
        break;
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  private async getOpenAIEmbedding(text: string): Promise<EmbeddingResult> {
    if (!config.embedding.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: config.embedding.model || 'text-embedding-3-small'
        },
        {
          headers: {
            'Authorization': `Bearer ${config.embedding.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const vector = response.data.data[0].embedding;
      logger.debug(`Generated OpenAI embedding for text (${text.length} chars)`);
      
      return {
        vector,
        dimensions: vector.length
      };
    } catch (error: any) {
      logger.error('OpenAI embedding error:', error.message);
      throw new Error(`OpenAI embedding failed: ${error.message}`);
    }
  }

  private async getHuggingFaceEmbedding(text: string): Promise<EmbeddingResult> {
    if (!config.embedding.apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    try {
      const response = await axios.post(
        'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${config.embedding.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const vector = response.data;
      logger.debug(`Generated HuggingFace embedding for text (${text.length} chars)`);
      
      return {
        vector,
        dimensions: vector.length
      };
    } catch (error: any) {
      logger.error('HuggingFace embedding error:', error.message);
      throw new Error(`HuggingFace embedding failed: ${error.message}`);
    }
  }

  private getMockEmbedding(text: string): EmbeddingResult {
    // Generate deterministic mock embedding based on text
    const dimensions = config.embedding.dimensions;
    const vector: number[] = [];
    
    for (let i = 0; i < dimensions; i++) {
      const seed = text.charCodeAt(i % text.length) + i;
      vector.push(Math.sin(seed) * 0.5);
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    const normalizedVector = vector.map(val => val / magnitude);
    
    logger.debug(`Generated mock embedding for text (${text.length} chars, ${dimensions}D)`);
    
    return {
      vector: normalizedVector,
      dimensions
    };
  }

  cosineSimilarity(vectorA: Vector, vectorB: Vector): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async findSimilar(queryText: string, candidates: Array<{ text: string; id: string }>, topK: number = 10): Promise<Array<{ id: string; similarity: number }>> {
    const queryEmbedding = await this.getEmbedding(queryText);
    const results: Array<{ id: string; similarity: number }> = [];

    for (const candidate of candidates) {
      const candidateEmbedding = await this.getEmbedding(candidate.text);
      const similarity = this.cosineSimilarity(queryEmbedding.vector, candidateEmbedding.vector);
      results.push({ id: candidate.id, similarity });
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
}

export const embeddingService = new EmbeddingService();