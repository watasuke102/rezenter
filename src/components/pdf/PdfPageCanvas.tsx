'use client';

import {useEffect, useRef, useState} from 'react';
import type {PDFDocumentProxy} from 'pdfjs-dist/types/src/display/api';
import * as styles from '@/components/pdf/pdf-page-canvas.css';

type Props = {
  src: string;
  page: number;
  className?: string;
  fullscreen?: boolean;
};

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();

async function getDocument(src: string) {
  const cached = documentCache.get(src);
  if (cached) {
    return cached;
  }

  const loadPromise = (async () => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
    }
    const task = pdfjs.getDocument(src);
    return task.promise;
  })();

  documentCache.set(
    src,
    loadPromise.catch(error => {
      documentCache.delete(src);
      throw error;
    }),
  );
  return loadPromise;
}

export function PdfPageCanvas({
  src,
  page,
  className,
  fullscreen = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const pdf = await getDocument(src);
        const targetPage = Math.max(1, page + 1);
        const loadedPage = await pdf.getPage(targetPage);

        const canvas = canvasRef.current;
        if (!canvas || disposed) {
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          return;
        }

        const viewport = loadedPage.getViewport({scale: 1.5});
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await loadedPage.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;
      } catch {
        setError('PDFを表示できませんでした');
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      disposed = true;
    };
  }, [src, page]);

  return (
    <div
      className={`${styles.wrapper} ${fullscreen ? styles.wrapperFullscreen : ''} ${className ?? ''}`.trim()}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      {loading && <div className={styles.loading}>Loading PDF page...</div>}
      {error && <div className={styles.loading}>{error}</div>}
    </div>
  );
}
