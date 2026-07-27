import type {SessionWithNotes} from '@/lib/types';

export function toClientSession(session: SessionWithNotes) {
  const revision = encodeURIComponent(session.slidesUpdatedAt);
  const pdfSrc =
    session.sourceType === 'typst'
      ? null
      : `/api/sessions/${session.id}/pdf?revision=${revision}`;

  return {
    ...session,
    pdfSrc,
    slideKind:
      session.sourceType === 'typst' ? ('svg' as const) : ('pdf' as const),
    svgPageBaseUrl:
      session.sourceType === 'typst'
        ? `/api/sessions/${session.id}/slides?revision=${revision}`
        : null,
  };
}
