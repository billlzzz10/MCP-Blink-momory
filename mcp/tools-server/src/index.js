#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mock MCP Server Implementation for Tools (JavaScript version)
process.stdin.setEncoding('utf8');

let buffer = '';
process.stdin.on('data', (data) => {
  buffer += data;
  if (buffer.includes('\n')) {
    const line = buffer.split('\n')[0];
    buffer = buffer.substring(line.length + 1);
    try {
      const request = JSON.parse(line);
      if (request.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {},
              session: {}
            },
            serverInfo: {
              name: 'tools-server',
              version: '0.1.0'
            }
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (request.method === 'tools/list') {
        const tools = [
          {
            name: 'resolve_library_id',
            description: 'Resolve library ID for Context7',
            inputSchema: {
              type: 'object',
              properties: {
                libraryName: { type: 'string' }
              },
              required: ['libraryName']
            }
          },
          {
            name: 'get_library_docs',
            description: 'Get library documentation from Context7',
            inputSchema: {
              type: 'object',
              properties: {
                context7CompatibleLibraryID: { type: 'string' },
                topic: { type: 'string' },
                tokens: { type: 'number' }
              },
              required: ['context7CompatibleLibraryID']
            }
          },
          {
            name: 'run_python_code',
            description: 'Run Python code in sandbox (Codex)',
            inputSchema: {
              type: 'object',
              properties: {
                code: { type: 'string' }
              },
              required: ['code']
            }
          },
          {
            name: 'list_directory',
            description: 'List directory contents (Filesystem)',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string' }
              },
              required: ['path']
            }
          },
          {
            name: 'read_text_file',
            description: 'Read text file (Filesystem)',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string' }
              },
              required: ['path']
            }
          },
          {
            name: 'write_file',
            description: 'Write file (Filesystem)',
            inputSchema: {
              type: 'object',
              properties: {
                path: { type: 'string' },
                content: { type: 'string' }
              },
              required: ['path', 'content']
            }
          }
        ];
        
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (request.method === 'tools/call') {
        const { name, arguments: args } = request.params;
        let result;
        
        try {
          if (name === 'resolve_library_id') {
            const mockLibraries = [
              { id: '/example/library', name: 'Example Library', description: 'Mock description', snippets: 10, trust: 8.5 },
              { id: '/another/lib', name: 'Another Library', description: 'Another mock', snippets: 5, trust: 7.0 }
            ];
            const filtered = mockLibraries.filter(lib => 
              lib.name.toLowerCase().includes(args.libraryName.toLowerCase())
            );
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  libraryName: args.libraryName,
                  libraries: filtered,
                  selected: filtered.length > 0 ? filtered[0].id : null
                }, null, 2)
              }]
            };
          } else if (name === 'get_library_docs') {
            const mockDocs = {
              id: args.context7CompatibleLibraryID,
              topic: args.topic || 'general',
              documentation: `Mock documentation for ${args.context7CompatibleLibraryID} on topic ${args.topic}.`,
              tokenCount: Math.min(args.tokens || 5000, 5000),
              truncated: (args.tokens || 5000) > 5000
            };
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify(mockDocs, null, 2)
              }]
            };
          } else if (name === 'run_python_code') {
            const safeCode = args.code.replace(/exec|eval|__import__|open|file/gi, '');
            let output = '';
            if (args.code.trim().startsWith('print(')) {
              const match = args.code.match(/print\(['"]([^'"]+)['"]\)/);
              if (match) {
                output = match[1];
              }
            }
            result = {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  code: args.code,
                  output,
                  logs: { stdout: [output], stderr: [] },
                  results: []
                }, null, 2)
              }]
            };
          } else if (name === 'list_directory') {
            const fullPath = path.resolve(process.cwd(), args.path);
            if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
              throw new Error(`Invalid directory: ${fullPath}`);
            }
            const items = fs.readdirSync(fullPath, { withFileTypes: true });
            const listing = items.map(item => {
              const type = item.isDirectory() ? '[DIR]' : '[FILE]';
              return `${type} ${item.name}`;
            }).join('\n');
            result = {
              content: [{
                type: 'text',
                text: `Directory listing for ${fullPath}:\n${listing}`
              }]
            };
          } else if (name === 'read_text_file') {
            const fullPath = path.resolve(process.cwd(), args.path);
            if (!fs.existsSync(fullPath)) {
              throw new Error(`File not found: ${fullPath}`);
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            result = {
              content: [{
                type: 'text',
                text: `File content for ${fullPath}:\n\n${content.substring(0, 5000)}${content.length > 5000 ? '\n\n... (truncated)' : ''}`
              }]
            };
          } else if (name === 'write_file') {
            const fullPath = path.resolve(process.cwd(), args.path);
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, args.content, 'utf-8');
            result = {
              content: [{
                type: 'text',
                text: `File written successfully: ${fullPath}\nSize: ${Buffer.byteLength(args.content, 'utf8')} bytes`
              }]
            };
          } else {
            throw new Error(`Unknown tool: ${name}`);
          }
          
          const response = {
            jsonrpc: '2.0',
            id: request.id,
            result
          };
          process.stdout.write(JSON.stringify(response) + '\n');
        } catch (error) {
          const errorResponse = {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32603,
              message: error.message
            }
          };
          process.stdout.write(JSON.stringify(errorResponse) + '\n');
        }
      } else {
        // Unknown method
        const errorResponse = {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    } catch (error) {
      const errorResponse = {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32700,
          message: 'Parse error'
        }
      };
      process.stdout.write(JSON.stringify(errorResponse) + '\n');
    }
  }
});

console.error('Tools MCP Server running on stdio (JavaScript Implementation)');