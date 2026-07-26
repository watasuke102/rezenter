'use client';

import {useEffect, useMemo, useState, type CSSProperties} from 'react';
import {getSvgPage, type SvgPageData} from './svg-page';
import * as styles from './svg-page.css';

type Props = {
  baseUrl: string;
  totalPages: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  className?: string;
  style?: CSSProperties;
  onViewportChange?: (viewport: {width: number; height: number}) => void;
};

export function SvgConcatenatedPages({
  baseUrl,
  totalPages,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  className,
  style,
  onViewportChange,
}: Props) {
  const requestKey = `${baseUrl}:${totalPages}`;
  const [result, setResult] = useState<{
    key: string;
    pages: SvgPageData[];
    error: string | null;
  }>({key: '', pages: [], error: null});
  const pages = useMemo(
    () => (result.key === requestKey ? result.pages : []),
    [requestKey, result],
  );
  const error = result.key === requestKey ? result.error : null;

  useEffect(() => {
    let disposed = false;
    Promise.all(
      Array.from({length: totalPages}, (_, index) =>
        getSvgPage(baseUrl, index),
      ),
    )
      .then(pages => {
        if (!disposed) {
          setResult({key: requestKey, pages, error: null});
        }
      })
      .catch(() => {
        if (!disposed) {
          setResult({
            key: requestKey,
            pages: [],
            error: 'SVGスライドの読み込みに失敗しました',
          });
        }
      });
    return () => {
      disposed = true;
    };
  }, [baseUrl, requestKey, totalPages]);

  useEffect(() => {
    if (pages.length === 0) {
      return;
    }
    let width = 0;
    let height = 0;
    for (const page of pages) {
      width = Math.max(
        width,
        Math.max(1, page.width - marginLeft - marginRight),
      );
      height += Math.max(1, page.height - marginTop - marginBottom);
    }
    onViewportChange?.({width, height});
  }, [
    marginBottom,
    marginLeft,
    marginRight,
    marginTop,
    onViewportChange,
    pages,
  ]);

  if (error) {
    return (
      <div className={className} style={style}>
        {error}
      </div>
    );
  }
  if (pages.length === 0) {
    return (
      <div className={className} style={style}>
        Loading concatenated SVG...
      </div>
    );
  }

  const maxWidth = Math.max(
    ...pages.map(page => Math.max(1, page.width - marginLeft - marginRight)),
  );

  return (
    <div className={`${styles.concatenated} ${className ?? ''}`} style={style}>
      {pages.map((page, index) => {
        const croppedWidth = Math.max(1, page.width - marginLeft - marginRight);
        const croppedHeight = Math.max(
          1,
          page.height - marginTop - marginBottom,
        );
        const renderedWidthPercent = (page.width / croppedWidth) * 100;
        return (
          <div
            className={styles.croppedPage}
            key={index}
            style={{
              width: `${(croppedWidth / maxWidth) * 100}%`,
              aspectRatio: `${croppedWidth} / ${croppedHeight}`,
            }}
          >
            <div
              className={styles.croppedSvg}
              style={{
                left: `${(-marginLeft / croppedWidth) * 100}%`,
                top: `${(-marginTop / croppedHeight) * 100}%`,
                width: `${renderedWidthPercent}%`,
                height: `${(page.height / croppedHeight) * 100}%`,
              }}
              dangerouslySetInnerHTML={{__html: page.markup}}
            />
          </div>
        );
      })}
    </div>
  );
}
