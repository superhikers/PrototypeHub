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
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_versions_project_number ON prototype_versions(project_id, version_number);
  `);
}
