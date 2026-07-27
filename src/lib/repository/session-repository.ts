import type {
  NoteEntry,
  SessionSourceType,
  SessionRecord,
  SessionSummary,
  SessionWithNotes,
} from '@/lib/types';

export type CreateSessionInput = {
  title: string;
  sourceType: SessionSourceType;
  pdfPath?: string;
  pdfUrl?: string;
  typstPath?: string;
  svgDir?: string;
  totalPages?: number;
  notes?: NoteEntry[];
};

export type PageChangeOptions = {
  resetScale?: boolean;
};

export type SlideReloadInput = {
  totalPages: number;
  svgDir?: string;
};

export interface SessionRepository {
  list(): SessionSummary[];
  create(input: CreateSessionInput): SessionRecord;
  findById(sessionId: string): SessionWithNotes | null;
  delete(sessionId: string): boolean;
  replaceNotes(sessionId: string, notes: NoteEntry[]): void;
  nextPage(
    sessionId: string,
    options?: PageChangeOptions,
  ): SessionRecord | null;
  prevPage(
    sessionId: string,
    options?: PageChangeOptions,
  ): SessionRecord | null;
  setPage(
    sessionId: string,
    page: number,
    options?: PageChangeOptions,
  ): SessionRecord | null;
  setTimerRunning(sessionId: string, running: boolean): SessionRecord | null;
  resetTimer(sessionId: string): SessionRecord | null;
  setDisableScaleResetOnPageChange(
    sessionId: string,
    disable: boolean,
  ): SessionRecord | null;
  setViewerSettings(
    sessionId: string,
    settings: NonNullable<SessionRecord['viewerSettings']>,
  ): boolean;
  updateSlides(
    sessionId: string,
    input: SlideReloadInput,
  ): SessionRecord | null;
  updatePointer(sessionId: string, x: number, y: number): SessionRecord | null;
  updateViewerTransform(
    sessionId: string,
    scaleMultiplier: number,
    offsetDeltaX: number,
    offsetDeltaY: number,
  ): SessionRecord | null;
}
