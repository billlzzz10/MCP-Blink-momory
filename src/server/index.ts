import { createServer, Server } from 'http';
import { logger } from '../utils/logger';
import { config } from '../utils/config';
import { router } from './router';
import { errorHandler } from './error-handler';
import { memoryStore } from '../storage/memory-store';
import { memory0Service } from '../core/memory0-service/index';
import { systemService } from '../core/system/index';
import type { JSONRPCRequest, JSONRPCResponse } from '../types/rpc.types';

export class MCPBlinkMemoryServer {
  private httpServer: Server;
  private port: number;
  private host: string;

  constructor() {
    this.port = config.server.port;
    this.host = config.server.host;
    this.httpServer = createServer(this.handleRequest.bind(this));
  }

  private async handleRequest(req: any, res: any): Promise<void> {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const jsonRPCRequest = JSON.parse(body) as JSONRPCRequest;
        
        logger.debug('Received JSON-RPC request:', {
          method: jsonRPCRequest.method,
          id: jsonRPCRequest.id
        });

        const jsonRPCResponse = await this.handleJSONRPCRequest(jsonRPCRequest);
        
        if (jsonRPCResponse) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(jsonRPCResponse));
        } else {
          res.writeHead(204);
          res.end();
        }
        
      } catch (error) {
        logger.error('Error handling JSON-RPC request:', error);
        const errorResponse = errorHandler.formatError(error, null);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(errorResponse));
      }
    });
  }

  async handleJSONRPCRequest(request: JSONRPCRequest): Promise<JSONRPCResponse | null> {
    const responseId = request.id ?? null;

    try {
      const result = await router.handleMethod(request.method, request.params || {});
      
      return {
        jsonrpc: '2.0',
        result,
        id: responseId
      };
    } catch (error: any) {
      return errorHandler.formatError(error, responseId);
    }
  }

  async start(): Promise<void> {
    // Initialize core services
    await memory0Service.initializeRootMemory();
    await memoryStore.initialize();
    
    // Log system startup
    await systemService.logAuditEntry('system_startup', {
      version: '2.0.0',
      config: {
        port: this.port,
        host: this.host,
        embeddingProvider: config.embedding.provider
      }
    });
    
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.port, this.host, () => {
        logger.info(`MCP Blink Memory Server listening on ${this.host}:${this.port}`);
        logger.info(`JSON-RPC endpoint: http://${this.host}:${this.port}/`);
        resolve();
      });

      this.httpServer.on('error', (error) => {
        logger.error('Server error:', error);
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    // Log system shutdown
    await systemService.logAuditEntry('system_shutdown', {
      uptime: systemService.getUptime()
    });
    
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        logger.info('MCP Blink Memory Server stopped');
        resolve();
      });
    });
  }
}
