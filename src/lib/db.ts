import 'server-only';

import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'rezenter.sqlite');

let dbInstance: Database.Database | null = null;

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      source_type TEXT NOT NULL,
      pdf_path TEXT,
      pdf_url TEXT,
      created_at INTEGER NOT NULL,
      current_page INTEGER NOT NULL DEFAULT 0,
      total_pages INTEGER,
      timer_elapsed_ms INTEGER NOT NULL DEFAULT 0,
      timer_running INTEGER NOT NULL DEFAULT 0,
      timer_started_at INTEGER,
      pointer_x REAL NOT NULL DEFAULT 0,
      pointer_y REAL NOT NULL DEFAULT 0,
      pointer_updated_at INTEGER,
      viewer_scale REAL NOT NULL DEFAULT 1,
      viewer_offset_x REAL NOT NULL DEFAULT 0,
      viewer_offset_y REAL NOT NULL DEFAULT 0,
      disable_scale_reset_on_page_change INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS notes (
      session_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      note TEXT NOT NULL,
      PRIMARY KEY (session_id, page),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notes_session_id ON notes(session_id);
  `);

  const columns = new Set(
    (
      db.prepare(`PRAGMA table_info(sessions)`).all() as Array<{name: string}>
    ).map(column => column.name),
  );

  if (!columns.has('viewer_scale')) {
    db.prepare(
      `ALTER TABLE sessions ADD COLUMN viewer_scale REAL NOT NULL DEFAULT 1`,
    ).run();
  }

  if (!columns.has('viewer_offset_x')) {
    db.prepare(
      `ALTER TABLE sessions ADD COLUMN viewer_offset_x REAL NOT NULL DEFAULT 0`,
    ).run();
  }

  if (!columns.has('viewer_offset_y')) {
    db.prepare(
      `ALTER TABLE sessions ADD COLUMN viewer_offset_y REAL NOT NULL DEFAULT 0`,
    ).run();
  }

  if (!columns.has('disable_scale_reset_on_page_change')) {
    db.prepare(
      `ALTER TABLE sessions
       ADD COLUMN disable_scale_reset_on_page_change INTEGER NOT NULL DEFAULT 0`,
    ).run();
  }
}

export function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  fs.mkdirSync(DATA_DIR, {recursive: true});
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initSchema(db);
  dbInstance = db;
  return db;
}
