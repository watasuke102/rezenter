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
      pointer_updated_at INTEGER
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
