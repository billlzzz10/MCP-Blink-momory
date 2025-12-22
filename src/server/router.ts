import { entityHandler } from './handlers/entity.handler';
import { searchHandler } from './handlers/search.handler';
import { graphHandler } from './handlers/graph.handler';
import { systemHandler } from './handlers/system.handler';
import { logger } from '../utils/logger';

export class Router {
  private methods: Map<string, (params: any) => Promise<any>>;

  constructor() {
    this.methods = new Map();
    this.registerMethods();
  }

  private registerMethods(): void {
    // System methods
    this.methods.set('healthCheck', systemHandler.healthCheck.bind(systemHandler));
    this.methods.set('selfDescribe', systemHandler.selfDescribe.bind(systemHandler));

    // Entity methods
    this.methods.set('createEntities', entityHandler.createEntities.bind(entityHandler));
    this.methods.set('getEntity', entityHandler.getEntity.bind(entityHandler));
    this.methods.set('updateEntity', entityHandler.updateEntity.bind(entityHandler));
    this.methods.set('deleteEntity', entityHandler.deleteEntity.bind(entityHandler));
    this.methods.set('addObservations', entityHandler.addObservations.bind(entityHandler));

    // Search methods
    this.methods.set('semanticSearch', searchHandler.semanticSearch.bind(searchHandler));
    this.methods.set('searchByTag', searchHandler.searchByTag.bind(searchHandler));

    // Graph methods
    this.methods.set('createRelations', graphHandler.createRelations.bind(graphHandler));
    this.methods.set('getGraphStats', graphHandler.getGraphStats.bind(graphHandler));
    this.methods.set('getLineage', graphHandler.getLineage.bind(graphHandler));

    logger.info('JSON-RPC methods registered successfully');
  }

  async handleMethod(method: string, params: any): Promise<any> {
    const handler = this.methods.get(method);
    
    if (!handler) {
      throw {
        code: -32601,
        message: `Method not found: ${method}`
      };
    }

    return handler(params);
  }
}

export const router = new Router();