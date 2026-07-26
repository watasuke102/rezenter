export type SessionSourceType = 'upload' | 'url' | 'typst';

export type NoteEntry = {
  page: number;
  note: string;
};

export type ViewerSettings = {
  concatenatedMode: boolean;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
};

export type MarginPreset = Omit<ViewerSettings, 'concatenatedMode'> & {
  name: string;
};

export type SessionRecord = {
  id: string;
  title: string;
  sourceType: SessionSourceType;
  pdfPath: string | null;
  pdfUrl: string | null;
  typstPath: string | null;
  svgDir: string | null;
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
  viewerSettings?: ViewerSettings;
};

export type SessionWithNotes = SessionRecord & {
  notes: NoteEntry[];
};

export type SessionSummary = Pick<
  SessionRecord,
  'id' | 'title' | 'sourceType' | 'createdAt' | 'currentPage' | 'totalPages'
>;
