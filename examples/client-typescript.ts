// TypeScript Client Example for MCP Blink Memory
import axios, { AxiosResponse } from 'axios';

interface HealthResponse {
  success: boolean;
  data: {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
  };
}

interface EntityInput {
  name: string;
  type: string;
  observations?: string[];
  metadata?: Record<string, any>;
}

interface CreateEntitiesResponse {
  success: boolean;
  count: number;
  data: Array<{
    id: string;
    name: string;
    type: string;
    observations: Array<{
      id: string;
      content: string;
      createdAt: string;
    }>;
    autoTags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
}

export class MCPBlinkMemoryClient {
  private baseURL: string;

  constructor(baseURL = 'http://localhost:7071') {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios.post(
        `${this.baseURL}${endpoint}`,
        data,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000
        }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API Error: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async createEntities(
    entities: EntityInput[],
    options?: { autoTag?: boolean; linkToMemory0?: boolean }
  ): Promise<CreateEntitiesResponse> {
    return this.request<CreateEntitiesResponse>('/entities', {
      entities,
      options
    });
  }

  async semanticSearch(
    query: string,
    options?: { topK?: number; threshold?: number; tagFilter?: string[] }
  ): Promise<any> {
    return this.request('/search', { query, options });
  }

  async createRelations(relations: Array<{
    from: string;
    to: string;
    relationType: string;
    properties?: Record<string, any>;
  }>): Promise<any> {
    return this.request('/relations', { relations });
  }

  async getGraphStats(): Promise<any> {
    return this.request('/stats');
  }

  async selfDescribe(): Promise<any> {
    return this.request('/describe');
  }
}

// Usage Example
async function main() {
  const client = new MCPBlinkMemoryClient();

  try {
    // Health check
    const health = await client.healthCheck();
    console.log('Server status:', health.data.status);
    console.log('Version:', health.data.version);
    console.log('Uptime:', health.data.uptime, 'seconds');

    // Create entities
    const entities: EntityInput[] = [
      {
        name: "AI Research Lab",
        type: "organization",
        observations: [
          "Laboratory focused on artificial intelligence research and development",
          "Located in Bangkok, Thailand",
          "Specializes in natural language processing and computer vision"
        ],
        metadata: {
          founded: 2020,
          employees: 25,
          website: "https://ai-lab.th"
        }
      },
      {
        name: "Dr. Somchai Researcher",
        type: "person",
        observations: [
          "Lead researcher at AI Research Lab",
          "PhD in Computer Science from Chulalongkorn University",
          "Expert in machine learning and NLP"
        ],
        metadata: {
          position: "Lead Researcher",
          education: "PhD Computer Science"
        }
      }
    ];

    const createResult = await client.createEntities(entities, {
      autoTag: true,
      linkToMemory0: true
    });

    console.log(`\nCreated ${createResult.count} entities:`);
    createResult.data.forEach((entity, index) => {
      console.log(`${index + 1}. ${entity.name} (${entity.type})`);
      console.log(`   ID: ${entity.id}`);
      console.log(`   Observations: ${entity.observations.length}`);
      console.log(`   Tags: ${entity.autoTags.join(', ') || 'none'}`);
    });

    // Semantic search
    const searchResult = await client.semanticSearch(
      "artificial intelligence research in Thailand",
      {
        topK: 5,
        threshold: 0.3,
        tagFilter: ['ai', 'research', 'thailand']
      }
    );

    console.log('\nSemantic Search Results:', searchResult);

    // Create relations
    const relationResult = await client.createRelations([
      {
        from: "AI Research Lab",
        to: "Dr. Somchai Researcher",
        relationType: "employs",
        properties: {
          role: "lead researcher",
          since: "2020",
          department: "NLP Research"
        }
      }
    ]);

    console.log('\nRelation created:', relationResult);

    // Get graph statistics
    const stats = await client.getGraphStats();
    console.log('\nGraph Statistics:', stats.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  main();
}

export default MCPBlinkMemoryClient;