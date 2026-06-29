'use client';

import {useEffect, useState, useRef} from 'react';
import {getDocument, getRenderedPage} from './PdfPageCanvas';

type Props = {
  src: string;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  className?: string;
  style?: React.CSSProperties;
  onViewportChange?: (viewport: {width: number; height: number}) => void;
};

export function PdfConcatenatedCanvas({
  src,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  className,
  style,
  onViewportChange,
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

  useEffect(() => {
    if (pages.length > 0 && onViewportChange) {
      const scale = 2; // Fixed scale from PdfPageCanvas
      let totalWidth = 0;
      let totalHeight = 0;
      
      pages.forEach(page => {
        const originalWidth = page.width;
        const originalHeight = page.height;
        const mTop = marginTop * scale;
        const mBottom = marginBottom * scale;
        const mLeft = marginLeft * scale;
        const mRight = marginRight * scale;
        const croppedWidth = Math.max(0, originalWidth - mLeft - mRight) / scale;
        const croppedHeight = Math.max(0, originalHeight - mTop - mBottom) / scale;
        
        totalWidth = Math.max(totalWidth, croppedWidth);
        totalHeight += croppedHeight;
      });
      onViewportChange({width: totalWidth, height: totalHeight});
    }
  }, [pages, marginTop, marginBottom, marginLeft, marginRight, onViewportChange]);

  if (loading) {
    return <div style={{ color: 'white', padding: '20px' }}>Loading concatenated PDF...</div>;
  }

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
  }

  return (
    <div className={className} style={{ ...style, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pages.map((page, index) => {
        const scale = 2;
        const originalWidth = page.width;
        const originalHeight = page.height;
        
        const mTop = marginTop * scale;
        const mBottom = marginBottom * scale;
        const mLeft = marginLeft * scale;
        const mRight = marginRight * scale;

        const croppedWidth = Math.max(0, originalWidth - mLeft - mRight);
        const croppedHeight = Math.max(0, originalHeight - mTop - mBottom);

        return (
          <CroppedCanvasPage
            key={index}
            pageCanvas={page.canvas}
            mTop={mTop}
            mLeft={mLeft}
            croppedWidth={croppedWidth}
            croppedHeight={croppedHeight}
          />
        );
      })}
    </div>
  );
}

function CroppedCanvasPage({
  pageCanvas,
  mTop,
  mLeft,
  croppedWidth,
  croppedHeight,
}: {
  pageCanvas: HTMLCanvasElement;
  mTop: number;
  mLeft: number;
  croppedWidth: number;
  croppedHeight: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = croppedWidth;
    canvas.height = croppedHeight;
    ctx.clearRect(0, 0, croppedWidth, croppedHeight);
    ctx.drawImage(
      pageCanvas,
      mLeft,
      mTop,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight
    );
  }, [pageCanvas, mLeft, mTop, croppedWidth, croppedHeight]);

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: `${croppedWidth} / ${croppedHeight}`,
        backgroundColor: 'white',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
    </div>
  );
}
