// Jest setup file for TypeScript tests
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MCP_LOG_LEVEL = 'error'; // Reduce log noise in tests

// Global test timeout
jest.setTimeout(30000);