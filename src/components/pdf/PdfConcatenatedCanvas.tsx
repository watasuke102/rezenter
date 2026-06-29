'use client';

import {useEffect, useState} from 'react';
import {getDocument, getRenderedPage} from './PdfPageCanvas';

type Props = {
  src: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  className?: string;
};

export function PdfConcatenatedCanvas({
  src,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  className,
}: Props) {
  const [pages, setPages] = useState<{canvas: HTMLCanvasElement; width: number; height: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function loadAllPages() {
      setLoading(true);
      setError(null);
      try {
        const pdf = await getDocument(src);
        const loadedPages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await getRenderedPage(src, i);
          if (disposed) return;
          loadedPages.push(page);
        }
        setPages(loadedPages);
      } catch {
        if (!disposed) setError('PDFの読み込みに失敗しました');
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    loadAllPages();

    return () => {
      disposed = true;
    };
  }, [src]);

  if (loading) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading concatenated PDF...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pages.map((page, index) => {
        const scale = 2; // Fixed scale from PdfPageCanvas
        // Since the canvas is drawn at scale 2, CSS size should be the original unscaled size.
        // Wait, if canvas intrinsic width is viewport.width (scaled by 2), we can just set CSS width to viewport.width / 2, or keep it 1:1 if we want it large.
        // Let's assume the margins are in the same coordinate space as the canvas' CSS width (which defaults to intrinsic width if not specified).
        // For simplicity, let's say the user margins are in unscaled px. So we multiply by 2 for cropping the scaled canvas.
        const originalWidth = page.width;
        const originalHeight = page.height;
        
        const mTop = marginTop * scale;
        const mBottom = marginBottom * scale;
        const mLeft = marginLeft * scale;
        const mRight = marginRight * scale;

        const croppedWidth = Math.max(0, originalWidth - mLeft - mRight);
        const croppedHeight = Math.max(0, originalHeight - mTop - mBottom);

        return (
          <div
            key={index}
            style={{
              overflow: 'hidden',
              width: `${croppedWidth / scale}px`,
              height: `${croppedHeight / scale}px`,
              position: 'relative',
              backgroundColor: 'white',
            }}
          >
            <img
              src={page.canvas.toDataURL()}
              alt={`Page ${index + 1}`}
              style={{
                position: 'absolute',
                top: `-${mTop / scale}px`,
                left: `-${mLeft / scale}px`,
                width: `${originalWidth / scale}px`,
                height: `${originalHeight / scale}px`,
                maxWidth: 'none',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
