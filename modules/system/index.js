import fs from 'fs/promises';
import path from 'path';
import yaml from 'js-yaml';

const REQUIRED_DIRS = ['memory', 'modules', 'config'];
const REQUIRED_FILES = ['package.json', 'manifest.yaml', 'index.js'];

/**
 * Reads and parses the manifest.yaml file.
 * @returns {Promise<object>} The parsed manifest object.
 */
export async function selfDescribe() {
  const manifestPath = path.join(process.cwd(), 'manifest.yaml');
  try {
    const fileContents = await fs.readFile(manifestPath, 'utf8');
    const manifest = yaml.load(fileContents);
    return {
      system_name: manifest.system_name,
      version: manifest.version,
      modules: (manifest.modules || []).map(m => m.name),
      audit_ready: !!manifest.audit_ready
    };
  } catch (error) {
    console.error('❌ Could not read or parse manifest.yaml:', error);
    throw new Error('Failed to self-describe system.');
  }
}

/**
 * Validates that the project has the required directory structure.
 * @returns {Promise<boolean>} True if the structure is valid.
 */
export async function validateStructure() {
  console.log('⚙️ Validating project structure...');
  try {
    for (const dir of REQUIRED_DIRS) {
      await fs.access(path.join(process.cwd(), dir));
    }
    for (const file of REQUIRED_FILES) {
      await fs.access(path.join(process.cwd(), file));
    }
    console.log('✅ Project structure is valid.');
    return true;
  } catch (error) {
    console.error(`❌ Invalid project structure. Missing: ${error.path}`);
    throw new Error(`Project structure validation failed. Missing: ${error.path}`);
  }
}

/**
 * Ensures that the baseline directories for data storage exist.
 * @returns {Promise<void>}
 */
export async function ensureBaseline() {
  console.log('⚙️ Ensuring baseline configuration...');
  try {
    const memoryDir = path.join(process.cwd(), 'memory');
    await fs.mkdir(memoryDir, { recursive: true });
    console.log('✅ Baseline directories are in place.');
  } catch (error) {
    console.error('❌ Failed to create baseline directories:', error);
    throw new Error('Baseline configuration failed.');
  }
}
