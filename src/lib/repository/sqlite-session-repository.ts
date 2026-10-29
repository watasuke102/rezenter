import 'server-only';

import {nanoid} from 'nanoid';
import type {Database} from 'better-sqlite3';
import {getDb} from '@/lib/db';
import type {
  NoteEntry,
  SessionRecord,
  SessionSummary,
  SessionWithNotes,
  ViewerSettings,
} from '@/lib/types';
import type {
  CreateSessionInput,
  PageChangeOptions,
  SessionRepository,
  SlideReloadInput,
} from '@/lib/repository/session-repository';

type SessionRow = {
  id: string;
  title: string;
  source_type: string;
  pdf_path: string | null;
  pdf_url: string | null;
  typst_path: string | null;
  svg_dir: string | null;
  created_at: number;
  slides_updated_at: number;
  current_page: number;
  total_pages: number | null;
  timer_elapsed_ms: number;
  timer_running: number;
  timer_started_at: number | null;
  pointer_x: number;
  pointer_y: number;
  pointer_updated_at: number | null;
  viewer_scale: number;
  viewer_offset_x: number;
  viewer_offset_y: number;
  disable_scale_reset_on_page_change: number;
  viewer_settings: string | null;
};

type PageStateRow = Pick<
  SessionRow,
  'current_page' | 'total_pages' | 'disable_scale_reset_on_page_change'
>;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clampPage(page: number, totalPages: number | null): number {
  const base = Math.max(0, Math.floor(page));
  if (totalPages === null) {
    return base;
  }
  const maxPage = Math.max(0, totalPages - 1);
  return Math.min(base, maxPage);
}

function mapSession(row: SessionRow): SessionRecord {
  return {
    id: row.id,
    title: row.title,
    sourceType: row.source_type as SessionRecord['sourceType'],
    pdfPath: row.pdf_path,
    pdfUrl: row.pdf_url,
    typstPath: row.typst_path,
    svgDir: row.svg_dir,
    createdAt: row.created_at,
    slidesUpdatedAt: row.slides_updated_at,
    currentPage: row.current_page,
    totalPages: row.total_pages,
    timerElapsedMs: row.timer_elapsed_ms,
    timerRunning: row.timer_running === 1,
    timerStartedAt: row.timer_started_at,
    pointerX: row.pointer_x,
    pointerY: row.pointer_y,
    pointerUpdatedAt: row.pointer_updated_at,
    viewerScale: row.viewer_scale,
    viewerOffsetX: row.viewer_offset_x,
    viewerOffsetY: row.viewer_offset_y,
    disableScaleResetOnPageChange: row.disable_scale_reset_on_page_change === 1,
    viewerSettings: row.viewer_settings
      ? JSON.parse(row.viewer_settings)
      : undefined,
  };
}

function computeElapsed(row: SessionRow, now: number): number {
  if (row.timer_running !== 1 || row.timer_started_at === null) {
    return row.timer_elapsed_ms;
  }
  return row.timer_elapsed_ms + (now - row.timer_started_at);
}

export class SqliteSessionRepository implements SessionRepository {
  private readonly db: Database;

  constructor() {
    this.db = getDb();
  }

  list(): SessionSummary[] {
    const rows = this.db
      .prepare(
        `SELECT id, title, source_type, created_at, current_page, total_pages
         FROM sessions
         ORDER BY created_at DESC`,
      )
      .all() as Array<
      Pick<
        SessionRow,
        | 'id'
        | 'title'
        | 'source_type'
        | 'created_at'
        | 'current_page'
        | 'total_pages'
      >
    >;

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      sourceType: row.source_type as SessionSummary['sourceType'],
      createdAt: row.created_at,
      currentPage: row.current_page,
      totalPages: row.total_pages,
    }));
  }

  create(input: CreateSessionInput): SessionRecord {
    const id = nanoid(10);
    const createdAt = Date.now();

    this.db
      .prepare(
        `INSERT INTO sessions (
          id, title, source_type, pdf_path, pdf_url, typst_path, svg_dir,
          created_at, slides_updated_at, total_pages,
          viewer_scale, viewer_offset_x, viewer_offset_y,
          disable_scale_reset_on_page_change, viewer_settings
        ) VALUES (
          @id, @title, @sourceType, @pdfPath, @pdfUrl, @typstPath, @svgDir,
          @createdAt, @slidesUpdatedAt, @totalPages,
          @viewerScale, @viewerOffsetX, @viewerOffsetY, @disableScaleReset, @viewerSettings
        )`,
      )
      .run({
        id,
        title: input.title,
        sourceType: input.sourceType,
        pdfPath: input.pdfPath ?? null,
        pdfUrl: input.pdfUrl ?? null,
        typstPath: input.typstPath ?? null,
        svgDir: input.svgDir ?? null,
        createdAt,
        slidesUpdatedAt: createdAt,
        totalPages: input.totalPages ?? null,
        viewerScale: 1,
        viewerOffsetX: 0,
        viewerOffsetY: 0,
        disableScaleReset: 0,
        viewerSettings: null,
      });

    if (input.notes && input.notes.length > 0) {
      this.replaceNotes(id, input.notes);
    }

    const session = this.findById(id);
    if (!session) {
      throw new Error('Failed to create session');
    }
    return session;
  }

  findById(sessionId: string): SessionWithNotes | null {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId) as SessionRow | undefined;

    if (!row) {
      return null;
    }

    const notes = this.db
      .prepare(
        `SELECT page, note FROM notes WHERE session_id = ? ORDER BY page ASC`,
      )
      .all(sessionId) as NoteEntry[];

    return {
      ...mapSession(row),
      timerElapsedMs: computeElapsed(row, Date.now()),
      notes,
    };
  }

  delete(sessionId: string): boolean {
    const result = this.db
      .prepare(`DELETE FROM sessions WHERE id = ?`)
      .run(sessionId);
    return result.changes > 0;
  }

  replaceNotes(sessionId: string, notes: NoteEntry[]): void {
    const tx = this.db.transaction((items: NoteEntry[]) => {
      this.db.prepare(`DELETE FROM notes WHERE session_id = ?`).run(sessionId);
      const stmt = this.db.prepare(
        `INSERT INTO notes (session_id, page, note) VALUES (@sessionId, @page, @note)`,
      );
      for (const item of items) {
        stmt.run({sessionId, page: item.page, note: item.note});
      }
    });

    tx(notes);
  }

  nextPage(
    sessionId: string,
    options?: PageChangeOptions,
  ): SessionRecord | null {
    return this.changePage(sessionId, currentPage => currentPage + 1, options);
  }

  prevPage(
    sessionId: string,
    options?: PageChangeOptions,
  ): SessionRecord | null {
    return this.changePage(sessionId, currentPage => currentPage - 1, options);
  }

  setPage(
    sessionId: string,
    page: number,
    options?: PageChangeOptions,
  ): SessionRecord | null {
    return this.changePage(sessionId, () => page, options);
  }

  private changePage(
    sessionId: string,
    getTargetPage: (currentPage: number) => number,
    options?: PageChangeOptions,
  ): SessionRecord | null {
    const row = this.db
      .prepare(
        `SELECT current_page, total_pages, disable_scale_reset_on_page_change FROM sessions WHERE id = ?`,
      )
      .get(sessionId) as PageStateRow | undefined;
    if (!row) {
      return null;
    }

    const target = clampPage(getTargetPage(row.current_page), row.total_pages);
    if (target === row.current_page) {
      return this.fetchSession(sessionId);
    }
    const resetScale =
      options?.resetScale ?? row.disable_scale_reset_on_page_change !== 1;
    this.db
      .prepare(
        resetScale
          ? `UPDATE sessions SET current_page = @page, viewer_scale = 1, viewer_offset_x = 0, viewer_offset_y = 0 WHERE id = @sessionId`
          : `UPDATE sessions SET current_page = @page WHERE id = @sessionId`,
      )
      .run({sessionId, page: target});
    return this.fetchSession(sessionId);
  }

  setTimerRunning(sessionId: string, running: boolean): SessionRecord | null {
    const now = Date.now();
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId) as SessionRow | undefined;
    if (!row) {
      return null;
    }

    if (running) {
      if (row.timer_running !== 1) {
        this.db
          .prepare(
            `UPDATE sessions SET timer_running = 1, timer_started_at = @now WHERE id = @sessionId`,
          )
          .run({now, sessionId});
      }
      return this.fetchSession(sessionId);
    }

    if (row.timer_running === 1 && row.timer_started_at !== null) {
      const elapsedMs = row.timer_elapsed_ms + (now - row.timer_started_at);
      this.db
        .prepare(
          `UPDATE sessions SET timer_running = 0, timer_elapsed_ms = @elapsedMs, timer_started_at = NULL WHERE id = @sessionId`,
        )
        .run({elapsedMs, sessionId});
    }

    return this.fetchSession(sessionId);
  }

  resetTimer(sessionId: string): SessionRecord | null {
    this.db
      .prepare(
        `UPDATE sessions SET timer_elapsed_ms = 0, timer_running = 0, timer_started_at = NULL WHERE id = ?`,
      )
      .run(sessionId);
    return this.fetchSession(sessionId);
  }

  setDisableScaleResetOnPageChange(
    sessionId: string,
    disable: boolean,
  ): SessionRecord | null {
    this.db
      .prepare(
        `UPDATE sessions
         SET disable_scale_reset_on_page_change = @disable
         WHERE id = @sessionId`,
      )
      .run({sessionId, disable: disable ? 1 : 0});
    return this.fetchSession(sessionId);
  }

  setViewerSettings(
    sessionId: string,
    settings: NonNullable<SessionRecord['viewerSettings']>,
  ): boolean {
    const result = this.db
      .prepare(
        `UPDATE sessions SET viewer_settings = @settings WHERE id = @sessionId`,
      )
      .run({sessionId, settings: JSON.stringify(settings)});
    return result.changes > 0;
  }

  updateSlides(
    sessionId: string,
    input: SlideReloadInput,
  ): SessionRecord | null {
    const current = this.db
      .prepare(`SELECT slides_updated_at FROM sessions WHERE id = ?`)
      .get(sessionId) as Pick<SessionRow, 'slides_updated_at'> | undefined;
    if (!current) {
      return null;
    }

    const totalPages = Math.max(1, Math.floor(input.totalPages));
    const slidesUpdatedAt = Math.max(Date.now(), current.slides_updated_at + 1);
    this.db
      .prepare(
        input.svgDir
          ? `UPDATE sessions
             SET svg_dir = @svgDir,
                 total_pages = @totalPages,
                 current_page = MIN(current_page, @totalPages - 1),
                 slides_updated_at = @slidesUpdatedAt
             WHERE id = @sessionId`
          : `UPDATE sessions
             SET total_pages = @totalPages,
                 current_page = MIN(current_page, @totalPages - 1),
                 slides_updated_at = @slidesUpdatedAt
             WHERE id = @sessionId`,
      )
      .run({
        sessionId,
        totalPages,
        slidesUpdatedAt,
        ...(input.svgDir ? {svgDir: input.svgDir} : {}),
      });
    return this.fetchSession(sessionId);
  }

  updatePointer(sessionId: string, x: number, y: number): SessionRecord | null {
    const now = Date.now();
    this.db
      .prepare(
        `UPDATE sessions SET pointer_x = @x, pointer_y = @y, pointer_updated_at = @now WHERE id = @sessionId`,
      )
      .run({sessionId, x, y, now});
    return this.fetchSession(sessionId);
  }

  updateViewerTransform(
    sessionId: string,
    scaleMultiplier: number,
    offsetDeltaX: number,
    offsetDeltaY: number,
  ): SessionRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId) as SessionRow | undefined;
    if (!row) {
      return null;
    }

    const safeMultiplier =
      Number.isFinite(scaleMultiplier) && scaleMultiplier > 0
        ? scaleMultiplier
        : 1;
    const safeOffsetDeltaX = Number.isFinite(offsetDeltaX) ? offsetDeltaX : 0;
    const safeOffsetDeltaY = Number.isFinite(offsetDeltaY) ? offsetDeltaY : 0;
    const nextScale = Math.max(1, row.viewer_scale * safeMultiplier);
    const concatenatedMode =
      row.viewer_settings !== null &&
      (JSON.parse(row.viewer_settings) as Partial<ViewerSettings>)
        .concatenatedMode === true;

    // Adjust offsets so that the point under the pointer stays at the same
    // position on screen while zooming (see ViewerScreen for offset semantics)
    let nextOffsetX = row.viewer_offset_x;
    let nextOffsetY = row.viewer_offset_y;
    if (nextScale !== row.viewer_scale) {
      const scale = row.viewer_scale;
      const pointerX = clamp(row.pointer_x, -1, 1);
      const pointerY = clamp(row.pointer_y, -1, 1);
      if (concatenatedMode) {
        const limitX = (nextScale - 1) / 2;
        nextOffsetX = clamp(
          nextOffsetX + (pointerX * (scale - nextScale)) / 2,
          -limitX,
          limitX,
        );
        nextOffsetY = clamp(
          nextOffsetY + ((1 + pointerY) * (scale - nextScale)) / 2,
          -nextScale,
          0,
        );
      } else if (nextScale > 1) {
        nextOffsetX = clamp(
          (nextOffsetX * (scale - 1) + pointerX * (scale - nextScale)) /
            (nextScale - 1),
          -1,
          1,
        );
        nextOffsetY = clamp(
          (nextOffsetY * (scale - 1) + pointerY * (scale - nextScale)) /
            (nextScale - 1),
          -1,
          1,
        );
      } else {
        nextOffsetX = 0;
        nextOffsetY = 0;
      }
    }

    let nextPointerX = row.pointer_x;
    let nextPointerY = row.pointer_y;
    if (concatenatedMode) {
      // offsetY is in units of the whole document height;
      // convert the pan delta (in units of the screen height) roughly per page
      const pannedOffsetX = clamp(
        nextOffsetX + safeOffsetDeltaX,
        -(nextScale - 1) / 2,
        (nextScale - 1) / 2,
      );
      const pannedOffsetY = clamp(
        nextOffsetY + safeOffsetDeltaY / Math.max(1, row.total_pages ?? 1),
        -nextScale,
        0,
      );
      // Move the pointer in the opposite direction of the pan so that it stays
      // at the same position relative to the screen
      nextPointerX = clamp(
        nextPointerX - (2 * (pannedOffsetX - nextOffsetX)) / nextScale,
        -1,
        1,
      );
      nextPointerY = clamp(
        nextPointerY - (2 * (pannedOffsetY - nextOffsetY)) / nextScale,
        -1,
        1,
      );
      nextOffsetX = pannedOffsetX;
      nextOffsetY = pannedOffsetY;
    } else {
      nextOffsetX += safeOffsetDeltaX;
      nextOffsetY += safeOffsetDeltaY;
    }

    if (
      nextScale === row.viewer_scale &&
      nextOffsetX === row.viewer_offset_x &&
      nextOffsetY === row.viewer_offset_y
    ) {
      return this.fetchSession(sessionId);
    }

    this.db
      .prepare(
        `UPDATE sessions
         SET viewer_scale = @viewerScale,
             viewer_offset_x = @viewerOffsetX,
             viewer_offset_y = @viewerOffsetY,
             pointer_x = @pointerX,
             pointer_y = @pointerY
         WHERE id = @sessionId`,
      )
      .run({
        sessionId,
        viewerScale: nextScale,
        viewerOffsetX: nextOffsetX,
        viewerOffsetY: nextOffsetY,
        pointerX: nextPointerX,
        pointerY: nextPointerY,
      });

    return this.fetchSession(sessionId);
  }

  private fetchSession(sessionId: string): SessionRecord | null {
    const row = this.db
      .prepare(`SELECT * FROM sessions WHERE id = ?`)
      .get(sessionId) as SessionRow | undefined;
    if (!row) {
      return null;
    }
    return {
      ...mapSession(row),
      timerElapsedMs: computeElapsed(row, Date.now()),
    };
  }
}
