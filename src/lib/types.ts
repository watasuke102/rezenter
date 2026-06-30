export type PdfSourceType = 'upload' | 'url';

export type NoteEntry = {
  page: number;
  note: string;
};

export type SessionRecord = {
  id: string;
  title: string;
  sourceType: PdfSourceType;
  pdfPath: string | null;
  pdfUrl: string | null;
  createdAt: number;
  currentPage: number;
  totalPages: number | null;
  timerElapsedMs: number;
  timerRunning: boolean;
  timerStartedAt: number | null;
  pointerX: number;
  pointerY: number;
  pointerUpdatedAt: number | null;
  viewerScale: number;
  viewerOffsetX: number;
  viewerOffsetY: number;
  disableScaleResetOnPageChange: boolean;
  viewerSettings?: {
    concatenatedMode: boolean;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
  };
};

export type SessionWithNotes = SessionRecord & {
  notes: NoteEntry[];
};

export type SessionSummary = Pick<
  SessionRecord,
  'id' | 'title' | 'sourceType' | 'createdAt' | 'currentPage' | 'totalPages'
>;
