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
  aiProvider: process.env.AI_PROVIDER || 'claude',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
  aiMaxTokens: process.env.AI_MAX_TOKENS || '8192',
};
