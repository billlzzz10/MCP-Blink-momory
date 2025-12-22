import { MCPBlinkMemoryServer } from '../../src/server/index';

describe('MCP Server Integration', () => {
  let server: MCPBlinkMemoryServer;

  beforeAll(async () => {
    server = new MCPBlinkMemoryServer();
  });

  test('should create server instance', () => {
    expect(server).toBeDefined();
  });
});