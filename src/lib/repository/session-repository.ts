import type {
  NoteEntry,
  PdfSourceType,
  SessionRecord,
  SessionSummary,
  SessionWithNotes,
} from '@/lib/types';

export type CreateSessionInput = {
  title: string;
  sourceType: PdfSourceType;
  pdfPath?: string;
  pdfUrl?: string;
  totalPages?: number;
  notes?: NoteEntry[];
};

export interface SessionRepository {
  list(): SessionSummary[];
  create(input: CreateSessionInput): SessionRecord;
  findById(sessionId: string): SessionWithNotes | null;
  delete(sessionId: string): boolean;
  replaceNotes(sessionId: string, notes: NoteEntry[]): void;
  nextPage(sessionId: string): SessionRecord | null;
  prevPage(sessionId: string): SessionRecord | null;
  setPage(sessionId: string, page: number): SessionRecord | null;
  setTimerRunning(sessionId: string, running: boolean): SessionRecord | null;
  resetTimer(sessionId: string): SessionRecord | null;
  updatePointer(sessionId: string, x: number, y: number): SessionRecord | null;
  updateViewerTransform(
    sessionId: string,
    scaleMultiplier: number,
    offsetDeltaX: number,
    offsetDeltaY: number,
  ): SessionRecord | null;
}
