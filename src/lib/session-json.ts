import type {SessionWithNotes} from '@/lib/types';

export function toClientSession(session: SessionWithNotes) {
  const pdfSrc =
    session.sourceType === 'upload'
      ? `/api/sessions/${session.id}/pdf`
      : session.pdfUrl;

  return {
    ...session,
    pdfSrc,
  };
}
