'use client';

import type {CSSProperties} from 'react';
import {useEffect, useRef, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import type {PDFDocumentProxy} from 'pdfjs-dist/types/src/display/api';
import * as styles from '@/components/pdf/pdf-page-canvas.css';

type Props = {
  src: string;
  page: number;
  className?: string;
  fullscreen?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onViewportChange?: (viewport: {width: number; height: number}) => void;
  style?: CSSProperties;
};

const documentCache = new Map<string, Promise<PDFDocumentProxy>>();
type CachedPage = {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
};

const pageCache = new Map<string, Promise<CachedPage>>();

export async function getDocument(src: string) {
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
    const task = pdfjs.getDocument({
      url: src,
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
      useSystemFonts: true,
    });
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

function getPageCacheKey(src: string, page: number) {
  return `${src}::${page}`;
}

async function renderPageToCanvas(src: string, page: number) {
  const pdf = await getDocument(src);
  const loadedPage = await pdf.getPage(page);
  const viewport = loadedPage.getViewport({scale: 2});
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to acquire canvas context');
  }

  await loadedPage.render({
    canvas,
    canvasContext: context,
    viewport,
  }).promise;

  return {canvas, width: viewport.width, height: viewport.height};
}

export async function getRenderedPage(src: string, page: number) {
  const cacheKey = getPageCacheKey(src, page);
  const cached = pageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const renderPromise = renderPageToCanvas(src, page).catch(error => {
    pageCache.delete(cacheKey);
    throw error;
  });

  pageCache.set(cacheKey, renderPromise);
  return renderPromise;
}

export async function preloadRenderedPages(src: string) {
  const pdf = await getDocument(src);
  await Promise.all(
    Array.from({length: pdf.numPages}, (_, index) =>
      getRenderedPage(src, index + 1),
    ),
  );
}

export function PdfPageCanvas({
  src,
  page,
  className,
  fullscreen = false,
  onPrevPage,
  onNextPage,
  onViewportChange,
  style,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canNavigate = Boolean(onPrevPage || onNextPage);

  useEffect(() => {
    void preloadRenderedPages(src);
  }, [src]);

  useEffect(() => {
    let disposed = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const targetPage = Math.max(1, page + 1);
        const renderedPage = await getRenderedPage(src, targetPage);

        const canvas = canvasRef.current;
        if (!canvas || disposed) {
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          return;
        }

        onViewportChange?.({
          width: renderedPage.width,
          height: renderedPage.height,
        });
        canvas.width = renderedPage.width;
        canvas.height = renderedPage.height;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(renderedPage.canvas, 0, 0);
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
  }, [onViewportChange, page, src]);

  useEffect(() => {
    if (!canNavigate) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? '';
      const isEditable =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable;
      if (isEditable) {
        return;
      }

      if (event.key === 'ArrowLeft' && onPrevPage) {
        event.preventDefault();
        onPrevPage();
      }
      if (event.key === 'ArrowRight' && onNextPage) {
        event.preventDefault();
        onNextPage();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canNavigate, onNextPage, onPrevPage]);

  return (
    <div
      className={`${styles.wrapper} ${fullscreen ? styles.wrapperFullscreen : ''} ${canNavigate ? styles.wrapperNavigable : ''} ${className ?? ''}`.trim()}
      style={style}
    >
      <canvas ref={canvasRef} className={styles.canvas} />
      {loading && <div className={styles.loading}>Loading PDF page...</div>}
      {error && <div className={styles.loading}>{error}</div>}
      {canNavigate && onPrevPage ? (
        <button
          type='button'
          aria-label='Previous page'
          className={`pdf-nav-button ${styles.navButton} ${styles.navLeft}`}
          onClick={onPrevPage}
        >
          <ChevronLeft size={28} aria-hidden='true' />
        </button>
      ) : null}
      {canNavigate && onNextPage ? (
        <button
          type='button'
          aria-label='Next page'
          className={`pdf-nav-button ${styles.navButton} ${styles.navRight}`}
          onClick={onNextPage}
        >
          <ChevronRight size={28} aria-hidden='true' />
        </button>
      ) : null}
    </div>
  );
}
