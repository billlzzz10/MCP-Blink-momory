import fs from 'fs';
import path from 'path';
import { paths } from './config.js';

export function collectionPath(name) {
  return path.join(paths.storeBase, `${name}.json`);
}

export function listCollections() {
  if (!fs.existsSync(paths.storeBase)) return [];
  return fs.readdirSync(paths.storeBase)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
}
