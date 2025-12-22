import type { JSONRPCResponse, JSONRPCError } from '../types/rpc.types';
import { logger } from '../utils/logger';

export class ErrorHandler {
  formatError(error: any, id: string | number | null): JSONRPCResponse {
    let rpcError: JSONRPCError;

    if (error.code && error.message) {
      // Already a JSON-RPC error
      rpcError = error;
    } else if (error instanceof Error) {
      // Convert standard Error to JSON-RPC error
      rpcError = {
        code: this.getErrorCode(error),
        message: error.message,
        data: {
          stack: error.stack,
          name: error.name
        }
      };
    } else {
      // Unknown error type
      rpcError = {
        code: -32603, // Internal error
        message: 'Internal server error',
        data: { originalError: error }
      };
    }

    logger.error('JSON-RPC Error:', rpcError);

    return {
      jsonrpc: '2.0',
      error: rpcError,
      id
    };
  }

  private getErrorCode(error: Error): number {
    // Map common error types to JSON-RPC error codes
    switch (error.name) {
      case 'ValidationError':
      case 'ZodError':
        return -32602; // Invalid params
      case 'NotFoundError':
        return -32601; // Method not found (repurposed for entity not found)
      case 'AuthenticationError':
        return -32001; // Custom: Authentication failed
      case 'AuthorizationError':
        return -32002; // Custom: Authorization failed
      case 'RateLimitError':
        return -32003; // Custom: Rate limit exceeded
      case 'StorageError':
        return -32004; // Custom: Storage error
      case 'EmbeddingError':
        return -32005; // Custom: Embedding service error
      default:
        return -32603; // Internal error
    }
  }

  // Predefined error creators
  static validationError(message: string, data?: any): JSONRPCError {
    return {
      code: -32602,
      message: `Validation error: ${message}`,
      data
    };
  }

  static notFoundError(resource: string, id: string): JSONRPCError {
    return {
      code: -32601,
      message: `${resource} not found: ${id}`
    };
  }

  static internalError(message: string, data?: any): JSONRPCError {
    return {
      code: -32603,
      message: `Internal error: ${message}`,
      data
    };
  }

  static embeddingError(message: string, data?: any): JSONRPCError {
    return {
      code: -32005,
      message: `Embedding service error: ${message}`,
      data
    };
  }
}

export const errorHandler = new ErrorHandler();