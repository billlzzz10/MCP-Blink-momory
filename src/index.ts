#!/usr/bin/env node

import { config } from 'dotenv';
import { MCPBlinkMemoryServer } from './server/index';
import { logger } from './utils/logger';

// Load environment variables
config();

async function main() {
  try {
    const server = new MCPBlinkMemoryServer();
    
    // Start the server
    await server.start();
    
    logger.info('MCP Blink Memory Server started successfully');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start MCP Blink Memory Server:', error);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Unhandled error in main:', error);
    process.exit(1);
  });
}

export { MCPBlinkMemoryServer } from './server/index';
export * from './types/index';