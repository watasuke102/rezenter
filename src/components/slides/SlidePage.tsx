'use client';

import type {CSSProperties} from 'react';
import {PdfPageCanvas} from '@/components/pdf/PdfPageCanvas';
import {SvgPage} from '@/components/svg/SvgPage';

export type SlideSource =
  | {kind: 'pdf'; src: string}
  | {kind: 'svg'; baseUrl: string};

type Props = {
  source: SlideSource;
  page: number;
  totalPages?: number;
  className?: string;
  fullscreen?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onViewportChange?: (viewport: {width: number; height: number}) => void;
  style?: CSSProperties;
};

export function SlidePage({source, totalPages, ...props}: Props) {
  if (source.kind === 'svg') {
    return (
      <SvgPage baseUrl={source.baseUrl} totalPages={totalPages} {...props} />
    );
  }
  return <PdfPageCanvas src={source.src} {...props} />;
}
