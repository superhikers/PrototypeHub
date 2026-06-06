import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

export default {
  port: parseInt(process.env.PORT || '3001', 10),
  dbPath: process.env.DB_PATH || resolve(root, 'data', 'prototypehub.db'),
  uploadDir: process.env.UPLOAD_DIR || resolve(root, 'data', 'html'),
  uploadLimit: 5 * 1024 * 1024, // 5MB
};
