import 'server-only';
import type {Database} from 'better-sqlite3';
import {getDb} from '@/lib/db';
import type {MarginPreset} from '@/lib/useMarginPresets';

export class MarginPresetRepository {
  private readonly db: Database;

  constructor() {
    this.db = getDb();
  }

  list(): MarginPreset[] {
    const rows = this.db.prepare('SELECT * FROM margin_presets ORDER BY name ASC').all() as Array<{
      name: string;
      margin_top: number;
      margin_bottom: number;
      margin_left: number;
      margin_right: number;
    }>;
    return rows.map(row => ({
      name: row.name,
      marginTop: row.margin_top,
      marginBottom: row.margin_bottom,
      marginLeft: row.margin_left,
      marginRight: row.margin_right,
    }));
  }

  save(preset: MarginPreset) {
    this.db.prepare(`
      INSERT INTO margin_presets (name, margin_top, margin_bottom, margin_left, margin_right)
      VALUES (@name, @marginTop, @marginBottom, @marginLeft, @marginRight)
      ON CONFLICT(name) DO UPDATE SET
        margin_top = excluded.margin_top,
        margin_bottom = excluded.margin_bottom,
        margin_left = excluded.margin_left,
        margin_right = excluded.margin_right
    `).run({
      name: preset.name,
      marginTop: preset.marginTop,
      marginBottom: preset.marginBottom,
      marginLeft: preset.marginLeft,
      marginRight: preset.marginRight,
    });
  }

  delete(name: string) {
    this.db.prepare('DELETE FROM margin_presets WHERE name = ?').run(name);
  }
}

let instance: MarginPresetRepository | null = null;

export function getMarginPresetRepository() {
  if (!instance) {
    instance = new MarginPresetRepository();
  }
  return instance;
}
