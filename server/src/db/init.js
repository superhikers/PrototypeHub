import { getDb } from './connection.js';

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL CHECK(length(name) > 0 AND length(name) <= 100),
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prototype_versions (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      version_number INTEGER NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'upload' CHECK(source IN ('upload', 'ai')),
      html_file_path TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL REFERENCES prototype_versions(id) ON DELETE CASCADE,
      x REAL NOT NULL CHECK(x >= 0 AND x <= 100),
      y REAL NOT NULL CHECK(y >= 0 AND y <= 100),
      color TEXT NOT NULL DEFAULT '#FFD700',
      content TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      annotation_id TEXT NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
      author TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_versions_project ON prototype_versions(project_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_version ON annotations(version_id);
    CREATE INDEX IF NOT EXISTS idx_comments_annotation ON comments(annotation_id);
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
      allow_comment INTEGER NOT NULL DEFAULT 1,
      allow_annotate INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL CHECK(length(name) > 0 AND length(name) <= 100),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_project ON settings(project_id);
    CREATE INDEX IF NOT EXISTS idx_folders_project ON folders(project_id);

    CREATE TABLE IF NOT EXISTS prototypes (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prototypes_project ON prototypes(project_id);
    CREATE INDEX IF NOT EXISTS idx_prototypes_folder ON prototypes(folder_id);
  `);

  try { db.exec('ALTER TABLE prototype_versions ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL'); } catch (e) { /* column may already exist */ }
  try { db.exec('ALTER TABLE prototype_versions ADD COLUMN prototype_id TEXT REFERENCES prototypes(id) ON DELETE CASCADE'); } catch (e) { /* may already exist */ }
  try { db.exec('DROP INDEX IF EXISTS idx_versions_project_number'); } catch (e) { /* may not exist */ }
  try { db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_prototype_number ON prototype_versions(prototype_id, version_number)'); } catch (e) { /* may fail if data has null prototype_id */ }
}
