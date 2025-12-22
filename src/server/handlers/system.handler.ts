import type { HealthCheckResponse } from '../../types/rpc.types';
import { logger } from '../../utils/logger';
import { systemService } from '../../core/system/index';

export class SystemHandler {
  async healthCheck(): Promise<HealthCheckResponse> {
    logger.debug('Health check requested');
    
    const health = await systemService.checkHealth();
    
    return {
      status: health.status === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: health.timestamp,
      version: '2.0.0',
      uptime: health.uptime / 1000, // Convert to seconds
      memory: health.memory,
      services: health.services
    };
  }

  async selfDescribe(): Promise<any> {
    logger.debug('Self describe requested');
    return systemService.getSystemInfo();
  }
}

export const systemHandler = new SystemHandler();