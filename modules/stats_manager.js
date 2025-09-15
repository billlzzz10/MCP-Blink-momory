// modules/stats_manager.js - Aggregates and queries stats for the system.

import * as RunlogManager from './runlog_manager.js';
import * as CacheManager from './cache_manager.js';

/**
 * Queries system statistics based on the provided query object.
 * @param {object} query - The query specifying what stats to retrieve.
 * @returns {Promise<object>} The resulting statistics.
 */
export async function query(query) {
  const { type, time_window = '1h' } = query;

  // For now, we'll fetch a fixed number of recent logs for calculation.
  // A real implementation would have more sophisticated time window filtering.
  const logs = await RunlogManager.getLogs({ limit: 1000 });

  switch (type) {
    case 'token_usage':
      return calculateTokenUsage(logs);

    case 'cache_performance':
      return await calculateCachePerformance();

    case 'phase_latency':
      return calculatePhaseLatency(logs);

    default:
      throw new Error(`Unknown stats query type: ${type}`);
  }
}

function calculateTokenUsage(logs) {
  const usage = logs.reduce((acc, log) => {
    acc.tokens_in += log.tokens_in || 0;
    acc.tokens_out += log.tokens_out || 0;
    return acc;
  }, { tokens_in: 0, tokens_out: 0, log_count: logs.length });
  return usage;
}

async function calculateCachePerformance() {
  // This can be expanded to include hit/miss rates over time from logs,
  // but for now, we get the live stats from the cache manager.
  const stats = await CacheManager.getStats();
  return stats;
}

function calculatePhaseLatency(logs) {
  const phases = {};
  logs.forEach(log => {
    if (log.phase && log.latency_ms) {
      if (!phases[log.phase]) {
        phases[log.phase] = { total_latency: 0, count: 0 };
      }
      phases[log.phase].total_latency += log.latency_ms;
      phases[log.phase].count++;
    }
  });

  const avgLatencies = {};
  for (const phase in phases) {
    avgLatencies[phase] = {
        average_ms: phases[phase].total_latency / phases[phase].count,
        count: phases[phase].count,
    };
  }
  return avgLatencies;
}
