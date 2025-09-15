import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

export const paths = {
  rootDir,
  storeBase: path.join(rootDir, 'store'),
  cacheDir: path.join(rootDir, 'cache')
};

export const config = {
  embedding: {
    provider: 'mock',
    model: 'all-MiniLM-L6-v2',
    normalize: false,
    registry: [
      { name: 'all-MiniLM-L6-v2', alias: ['mini'], source: 'local', version: '1.0.0' }
    ]
  },
  server: {
    port: 7070
  }
};

for (const p of [paths.storeBase, paths.cacheDir]) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
