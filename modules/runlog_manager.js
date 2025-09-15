// modules/runlog_manager.js - Manages the structured run logs for the system.

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Using uuid for unique log IDs, more standard than ulid for this case

const RUNLOG_PATH = path.join(process.cwd(), 'memory', 'runlog.jsonl'); // Using .jsonl for line-delimited JSON

/**
 * Ensures the runlog file exists.
 */
async function ensureLogFile() {
  try {
    await fs.access(RUNLOG_PATH);
  } catch (error) {
    // File doesn't exist, create it
    await fs.writeFile(RUNLOG_PATH, '', 'utf8');
  }
}

/**
 * Adds a new run log item to the store.
 * @param {object} logItem - The log item to add, based on the spec.
 * @returns {Promise<object>} The full log item that was stored.
 */
export async function put(logItem) {
  await ensureLogFile();

  const fullLogItem = {
    id: `run_${uuidv4()}`,
    ...logItem,
    createdAt: logItem.createdAt || Date.now(),
  };

  const logLine = JSON.stringify(fullLogItem) + '\n';

  await fs.appendFile(RUNLOG_PATH, logLine, 'utf8');

  return fullLogItem;
}

/**
 * Retrieves the last N log entries.
 * @param {number} limit - The number of recent logs to retrieve.
 * @returns {Promise<object[]>} An array of log items.
 */
export async function getLogs({ limit = 100 } = {}) {
    await ensureLogFile();
    const data = await fs.readFile(RUNLOG_PATH, 'utf8');
    const lines = data.trim().split('\n');
    const logs = lines.map(line => JSON.parse(line));

    // Sort by date descending to be sure, and then take the limit
    logs.sort((a, b) => b.createdAt - a.createdAt);

    return logs.slice(0, limit);
}
