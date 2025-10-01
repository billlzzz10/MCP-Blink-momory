#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

// Create MCP server
const server = new McpServer({
  name: "tools-server",
  version: "0.1.0"
});

// Context7 Tools - resolve-library-id
server.tool(
  "resolve_library_id",
  {
    libraryName: z.string().describe("Library name to search for")
  },
  async ({ libraryName }) => {
    try {
      // Simulate Context7 library resolution - in real implementation would call Context7 API
      const mockLibraries = [
        { id: "/example/library", name: "Example Library", description: "Mock description", snippets: 10, trust: 8.5 },
        { id: "/another/lib", name: "Another Library", description: "Another mock", snippets: 5, trust: 7.0 }
      ];
      
      // Filter based on libraryName
      const filtered = mockLibraries.filter(lib => 
        lib.name.toLowerCase().includes(libraryName.toLowerCase())
      );
      
      const result = {
        content: [{
          type: "text",
          text: JSON.stringify({
            libraryName,
            libraries: filtered,
            selected: filtered.length > 0 ? filtered[0].id : null
          }, null, 2)
        }]
      };
      
      return result;
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error resolving library: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Context7 Tools - get-library-docs
server.tool(
  "get_library_docs",
  {
    context7CompatibleLibraryID: z.string().describe("Context7 library ID"),
    topic: z.string().optional().describe("Specific topic"),
    tokens: z.number().optional().default(5000).describe("Max tokens")
  },
  async ({ context7CompatibleLibraryID, topic, tokens = 5000 }) => {
    try {
      // Simulate documentation retrieval
      const mockDocs = {
        id: context7CompatibleLibraryID,
        topic: topic || "general",
        documentation: `Mock documentation for ${context7CompatibleLibraryID} on topic ${topic}. This would contain real docs from Context7 API.`,
        tokenCount: Math.min(tokens, 5000),
        truncated: tokens > 5000
      };
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify(mockDocs, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Error getting library docs: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Codex Tools - run_code (Python sandbox via e2b simulation)
server.tool(
  "run_python_code",
  {
    code: z.string().describe("Python code to execute")
  },
  async ({ code }) => {
    try {
      // Simulate Python execution - in real implementation would call E2B API
      // For now, use simple evaluation or mock execution
      const safeCode = code.replace(/exec|eval|__import__|open|file/gi, "");
      
      if (code.length > 1000) {
        throw new Error("Code too long - max 1000 characters");
      }
      
      // Simple mock execution for basic print statements
      let output = "";
      if (code.trim().startsWith("print(")) {
        const match = code.match(/print\(['"]([^'"]+)['"]\)/);
        if (match) {
          output = match[1];
        }
      }
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            output,
            logs: { stdout: [output], stderr: [] },
            results: []
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Python execution error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Filesystem Tools - list_directory
server.tool(
  "list_directory",
  {
    path: z.string().describe("Directory path to list")
  },
  async ({ path: dirPath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), dirPath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Directory does not exist: ${fullPath}`);
      }
      
      if (!fs.statSync(fullPath).isDirectory()) {
        throw new Error(`Path is not a directory: ${fullPath}`);
      }
      
      const items = fs.readdirSync(fullPath, { withFileTypes: true });
      const listing = items.map(item => {
        const itemPath = path.join(fullPath, item.name);
        const type = item.isDirectory() ? "[DIR]" : "[FILE]";
        return `${type} ${item.name}`;
      }).join("\n");
      
      return {
        content: [{
          type: "text",
          text: `Directory listing for ${fullPath}:\n${listing}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Directory listing error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Filesystem Tools - read_text_file
server.tool(
  "read_text_file",
  {
    path: z.string().describe("File path to read")
  },
  async ({ path: filePath }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`File does not exist: ${fullPath}`);
      }
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `File content for ${fullPath}:\n\n${content.substring(0, 5000)}${content.length > 5000 ? '\n\n... (truncated)' : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `File read error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Filesystem Tools - write_file
server.tool(
  "write_file",
  {
    path: z.string().describe("File path to write"),
    content: z.string().describe("Content to write")
  },
  async ({ path: filePath, content }) => {
    try {
      const fullPath = path.resolve(process.cwd(), filePath);
      const dir = path.dirname(fullPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(fullPath, content, 'utf-8');
      
      return {
        content: [{
          type: "text",
          text: `File written successfully: ${fullPath}\nSize: ${Buffer.byteLength(content, 'utf8')} bytes`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `File write error: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Tools MCP server running on stdio');