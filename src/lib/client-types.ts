import type {SessionWithNotes} from '@/lib/types';

export type ClientSession = SessionWithNotes & {
  pdfSrc: string | null;
};
