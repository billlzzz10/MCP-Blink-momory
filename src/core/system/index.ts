import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../../utils/config';
import { logger } from '../../utils/logger';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  storage: {
    available: boolean;
    path: string;
  };
  services: {
    embedding: boolean;
    tagging: boolean;
    graph: boolean;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operation: string;
  entityId?: string;
  userId?: string;
  details: any;
  success: boolean;
}

export class SystemService {
  private startTime: number = Date.now();
  private auditLog: AuditLogEntry[] = [];

  async checkHealth(): Promise<SystemHealth> {
    const memUsage = process.memoryUsage();
    
    const health: SystemHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      storage: {
        available: await this.checkStorageHealth(),
        path: config.storage.path
      },
      services: {
        embedding: await this.checkEmbeddingService(),
        tagging: true, // Auto-tagging is always available
        graph: true   // Graph operations are always available
      }
    };

    // Determine overall health status
    if (health.memory.percentage > 90 || !health.storage.available) {
      health.status = 'unhealthy';
    } else if (health.memory.percentage > 70 || !health.services.embedding) {
      health.status = 'degraded';
    }

    return health;
  }

  private async checkStorageHealth(): Promise<boolean> {
    try {
      await fs.access(config.storage.path);
      return true;
    } catch {
      return false;
    }
  }

  private async checkEmbeddingService(): Promise<boolean> {
    try {
      // Simple check - if we have API key for configured provider
      if (config.embedding.provider === 'mock') return true;
      return !!config.embedding.apiKey;
    } catch {
      return false;
    }
  }

  async logAuditEntry(operation: string, details: any, entityId?: string, userId?: string): Promise<void> {
    if (!config.storage.enableAuditLog) return;

    const entry: AuditLogEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      operation,
      entityId,
      userId,
      details,
      success: true
    };

    this.auditLog.push(entry);
    
    // Keep only last 1000 entries in memory
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Persist to file
    await this.persistAuditLog(entry);
    
    logger.debug(`Audit log entry created: ${operation}`);
  }

  private async persistAuditLog(entry: AuditLogEntry): Promise<void> {
    try {
      const logPath = `${config.storage.path}/lineage_log.json`;
      
      // Read existing log
      let existingLog: AuditLogEntry[] = [];
      try {
        const data = await fs.readFile(logPath, 'utf8');
        existingLog = JSON.parse(data);
      } catch {
        // File doesn't exist or is invalid, start fresh
      }

      // Append new entry
      existingLog.push(entry);
      
      // Keep only last 10000 entries in file
      if (existingLog.length > 10000) {
        existingLog = existingLog.slice(-10000);
      }

      // Write back to file
      await fs.writeFile(logPath, JSON.stringify(existingLog, null, 2));
    } catch (error) {
      logger.error('Failed to persist audit log:', error);
    }
  }

  getAuditLog(limit: number = 100): AuditLogEntry[] {
    return this.auditLog.slice(-limit);
  }

  async getSystemInfo() {
    const health = await this.checkHealth();
    
    return {
      name: 'MCP Blink Memory',
      version: '2.0.0',
      description: 'Knowledge Graph Memory System with MCP Support',
      protocol_version: '2024-11-05',
      health,
      capabilities: {
        tools: [
          {
            name: 'create_entities',
            description: 'Create new entities in the knowledge graph'
          },
          {
            name: 'semantic_search',
            description: 'Search entities by semantic similarity'
          },
          {
            name: 'create_relations',
            description: 'Create relations between entities'
          },
          {
            name: 'get_graph_stats',
            description: 'Get knowledge graph statistics'
          }
        ]
      },
      features: {
        semanticSearch: health.services.embedding,
        autoTagging: health.services.tagging,
        auditLogging: config.storage.enableAuditLog,
        memory0Support: true,
        knowledgeGraph: health.services.graph
      },
      configuration: {
        embeddingProvider: config.embedding.provider,
        taggingMode: config.tagging.mode,
        taggingLanguage: config.tagging.language,
        storagePath: config.storage.path
      }
    };
  }

  async performSystemCleanup(): Promise<{ cleaned: number; errors: string[] }> {
    const errors: string[] = [];
    let cleaned = 0;

    try {
      // Clean up old audit logs
      const auditLogPath = `${config.storage.path}/lineage_log.json`;
      try {
        const data = await fs.readFile(auditLogPath, 'utf8');
        const logs = JSON.parse(data);
        
        if (logs.length > 5000) {
          const cleanedLogs = logs.slice(-5000);
          await fs.writeFile(auditLogPath, JSON.stringify(cleanedLogs, null, 2));
          cleaned += logs.length - cleanedLogs.length;
        }
      } catch (error: any) {
        errors.push(`Audit log cleanup failed: ${error.message}`);
      }

      // Clean up cache files
      try {
        const cacheFiles = ['embedding_cache.json', 'tag_cache.json'];
        for (const file of cacheFiles) {
          const filePath = `${config.storage.path}/${file}`;
          try {
            const stats = await fs.stat(filePath);
            // If cache file is larger than 10MB, clear it
            if (stats.size > 10 * 1024 * 1024) {
              await fs.writeFile(filePath, '{}');
              cleaned++;
            }
          } catch {
            // File doesn't exist, skip
          }
        }
      } catch (error: any) {
        errors.push(`Cache cleanup failed: ${error.message}`);
      }

      await this.logAuditEntry('system_cleanup', { cleaned, errors });
      
    } catch (error: any) {
      errors.push(`System cleanup failed: ${error.message}`);
    }

    return { cleaned, errors };
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  async backup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${config.storage.path}/backup-${timestamp}`;
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      
      const files = ['memory_store.json', 'lineage_log.json', 'embedding_cache.json', 'tag_cache.json'];
      
      for (const file of files) {
        try {
          await fs.copyFile(
            `${config.storage.path}/${file}`,
            `${backupPath}/${file}`
          );
        } catch {
          // File might not exist, continue
        }
      }
      
      await this.logAuditEntry('system_backup', { backupPath });
      logger.info(`System backup created: ${backupPath}`);
      
      return backupPath;
    } catch (error: any) {
      logger.error('Backup failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }
}

export const systemService = new SystemService();