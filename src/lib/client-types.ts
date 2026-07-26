import type {SessionWithNotes} from '@/lib/types';

export type ClientSession = SessionWithNotes & {
  pdfSrc: string | null;
  slideKind: 'pdf' | 'svg';
  svgPageBaseUrl: string | null;
};

export type ClientSlideSource =
  | {kind: 'pdf'; src: string}
  | {kind: 'svg'; baseUrl: string};

export function getClientSlideSource(
  session: ClientSession,
): ClientSlideSource | null {
  if (session.slideKind === 'svg' && session.svgPageBaseUrl) {
    return {kind: 'svg', baseUrl: session.svgPageBaseUrl};
  }
  if (session.pdfSrc) {
    return {kind: 'pdf', src: session.pdfSrc};
  }
  return null;
}
