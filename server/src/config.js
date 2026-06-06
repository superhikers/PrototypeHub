import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

config({ path: resolve(root, '.env') });

const uploadDir = process.env.UPLOAD_DIR || resolve(root, 'data', 'html');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

export default {
  port: parseInt(process.env.PORT || '3001', 10),
  dbPath: process.env.DB_PATH || resolve(root, 'data', 'prototypehub.db'),
  uploadDir,
  uploadLimit: parseInt(process.env.UPLOAD_LIMIT || (5 * 1024 * 1024).toString(), 10),
};
