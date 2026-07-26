import type {SessionWithNotes} from '@/lib/types';

export function toClientSession(session: SessionWithNotes) {
  const pdfSrc =
    session.sourceType === 'upload'
      ? `/api/sessions/${session.id}/pdf`
      : session.pdfUrl;

  return {
    ...session,
    pdfSrc,
    slideKind:
      session.sourceType === 'typst' ? ('svg' as const) : ('pdf' as const),
    svgPageBaseUrl:
      session.sourceType === 'typst'
        ? `/api/sessions/${session.id}/slides`
        : null,
  };
}
