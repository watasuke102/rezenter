'use client';

import type {CSSProperties} from 'react';
import {useEffect, useState} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {
  getCachedSvgPage,
  getSvgPage,
  preloadSvgPages,
  type SvgPageData,
} from './svg-page';
import {SvgContent} from './SvgContent';
import * as styles from './svg-page.css';

type Props = {
  baseUrl: string;
  page: number;
  totalPages?: number;
  className?: string;
  fullscreen?: boolean;
  onPrevPage?: () => void;
  onNextPage?: () => void;
  onViewportChange?: (viewport: {width: number; height: number}) => void;
  style?: CSSProperties;
};

export function SvgPage({
  baseUrl,
  page,
  totalPages,
  className,
  fullscreen = false,
  onPrevPage,
  onNextPage,
  onViewportChange,
  style,
}: Props) {
  const requestKey = `${baseUrl}:${page}`;
  const [result, setResult] = useState<{
    key: string;
    page: SvgPageData | null;
    error: string | null;
  }>({key: '', page: null, error: null});
  const canNavigate = Boolean(onPrevPage || onNextPage);
  const cachedPage = getCachedSvgPage(baseUrl, page);
  const pageData =
    cachedPage ?? (result.key === requestKey ? result.page : null);
  const error = result.key === requestKey ? result.error : null;

  useEffect(() => {
    if (totalPages) {
      void preloadSvgPages(baseUrl, totalPages);
    }
  }, [baseUrl, totalPages]);

  useEffect(() => {
    let disposed = false;
    getSvgPage(baseUrl, page)
      .then(result => {
        if (disposed) {
          return;
        }
        setResult({key: requestKey, page: result, error: null});
        onViewportChange?.({width: result.width, height: result.height});
      })
      .catch(() => {
        if (!disposed) {
          setResult({
            key: requestKey,
            page: null,
            error: 'SVGスライドを表示できませんでした',
          });
        }
      });
    return () => {
      disposed = true;
    };
  }, [baseUrl, onViewportChange, page, requestKey]);

  useEffect(() => {
    if (!canNavigate) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase() ?? '';
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
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
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canNavigate, onNextPage, onPrevPage]);

  return (
    <div
      className={`${styles.wrapper} ${fullscreen ? styles.fullscreen : ''} ${
        canNavigate ? styles.navigable : ''
      } ${className ?? ''}`.trim()}
      style={style}
    >
      {pageData ? <SvgContent page={pageData} className={styles.svg} /> : null}
      {!pageData && !error ? (
        <div className={styles.status}>Loading SVG page...</div>
      ) : null}
      {error ? <div className={styles.status}>{error}</div> : null}
      {onPrevPage ? (
        <button
          type='button'
          className={`${styles.navButton} ${styles.navLeft}`}
          onClick={onPrevPage}
          aria-label='Previous page'
        >
          <ChevronLeft size={28} />
        </button>
      ) : null}
      {onNextPage ? (
        <button
          type='button'
          className={`${styles.navButton} ${styles.navRight}`}
          onClick={onNextPage}
          aria-label='Next page'
        >
          <ChevronRight size={28} />
        </button>
      ) : null}
    </div>
  );
}
