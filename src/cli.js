#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config, paths } from './config.js';
import { listRegistry, resolveModel } from './registry.js';
import { warmup } from './embeddingAdapter.js';
import { listCollections } from './vectorStore.js';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const program = new Command();

program
  .name('mcp-memory')
  .description('MCP-Memory CLI')
  .version('0.2.0');

program
  .command('registry')
  .description('List registered embedding models')
  .action(() => {
    const list = listRegistry();
    list.forEach(m => console.log(`${m.name} [${(m.alias||[]).join(', ')}] v${m.version} ← ${m.source}`));
  });

program
  .command('pull-embed')
  .argument('<model>', 'model name or alias')
  .description('Warm-cache an embedding model into local store')
  .action(async (model) => {
    try {
      const resolved = resolveModel(model);
      process.env.TRANSFORMERS_CACHE = paths.cacheDir;
      const result = await warmup(resolved.name);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.error(`[pull-embed] ${e.message}`);
      process.exit(1);
    }
  });

program
  .command('remove-embed')
  .argument('<partial>', 'partial folder name to remove from cache')
  .description('Remove cached model folder by partial match')
  .action((partial) => {
    const cacheDir = paths.cacheDir;
    if (!fs.existsSync(cacheDir)) return console.log('No cache found.');
    const dirs = fs.readdirSync(cacheDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    const targets = dirs.filter(n => n.toLowerCase().includes(partial.toLowerCase()));
    if (!targets.length) return console.log('No matching cached model');
    targets.forEach(d => {
      fs.rmSync(path.join(cacheDir, d), { recursive: true, force: true });
      console.log(`Removed ${d}`);
    });
  });

program
  .command('run')
  .option('-p, --port <port>', 'port', String(config.server?.port || 7070))
  .description('Run HTTP server')
  .action((opts) => {
    const env = { ...process.env, PORT: opts.port, TRANSFORMERS_CACHE: paths.cacheDir };
    const child = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      stdio: 'inherit',
      env
    });
    child.on('exit', code => process.exit(code ?? 0));
  });

program.parse();
