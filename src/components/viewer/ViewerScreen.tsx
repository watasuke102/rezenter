'use client';

import {useEffect, useRef, useState} from 'react';
import {PdfPageCanvas} from '@/components/pdf/PdfPageCanvas';
import type {ClientSession} from '@/lib/client-types';
import * as styles from '@/components/viewer/viewer.css';

type Props = {
  sessionId: string;
  initialSession: ClientSession;
};

export function ViewerScreen({sessionId, initialSession}: Props) {
  const [session, setSession] = useState<ClientSession | null>(initialSession);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastPointerUpdatedAtRef = useRef<number | null>(
    initialSession.pointerUpdatedAt,
  );
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1 : window.innerWidth,
    height: typeof window === 'undefined' ? 1 : window.innerHeight,
  }));
  const [pdfViewport, setPdfViewport] = useState<{
    width: number;
    height: number;
  } | null>(null);

  async function moveSlide(action: 'next' | 'prev') {
    try {
      await fetch(`/api/sessions/${sessionId}/slide`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({action}),
      });
    } catch {
      // ignore transient movement request failures
    }
  }

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${sessionId}/events`);

    source.addEventListener('session.update', event => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          session?: ClientSession;
        };
        if (payload.session) {
          if (
            payload.session.pointerUpdatedAt !== lastPointerUpdatedAtRef.current
          ) {
            setNowMs(Date.now());
          }
          lastPointerUpdatedAtRef.current = payload.session.pointerUpdatedAt;
          setSession(payload.session);
        }
      } catch {
        // ignore malformed event payloads
      }
    });

    source.addEventListener('session.not-found', () => {
      source.close();
      setSession(null);
    });

    return () => {
      source.close();
    };
  }, [sessionId]);

  useEffect(() => {
    function onResize() {
      setViewportSize({width: window.innerWidth, height: window.innerHeight});
    }

    onResize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    const pointerUpdatedAt = session?.pointerUpdatedAt;
    if (pointerUpdatedAt === null || pointerUpdatedAt === undefined) {
      return;
    }

    const now = Date.now();
    const initialElapsed = Math.max(0, now - pointerUpdatedAt);
    const initialRemaining = 2000 - initialElapsed;

    if (initialRemaining <= 0) {
      return;
    }

    const id = window.setTimeout(() => {
      setNowMs(pointerUpdatedAt + 2001);
    }, initialRemaining);

    return () => {
      window.clearTimeout(id);
    };
  }, [session?.pointerUpdatedAt]);

  if (!session || !session.pdfSrc) {
    return <main className={styles.page}>Loading session...</main>;
  }

  const VIEWER_OFFSET_LIMIT = 0.999;

  const displayRect = (() => {
    if (!pdfViewport) {
      return null;
    }

    const pdfAspect = pdfViewport.width / pdfViewport.height;
    const containerWidth = viewportSize.width;
    const containerHeight = viewportSize.height;
    const containerAspect = containerWidth / containerHeight;
    const baseWidth =
      containerAspect > pdfAspect
        ? containerHeight * pdfAspect
        : containerWidth;
    const baseHeight =
      containerAspect > pdfAspect
        ? containerHeight
        : containerWidth / pdfAspect;
    const scale = Math.max(1, session.viewerScale);
    const offsetX = Math.max(
      -VIEWER_OFFSET_LIMIT,
      Math.min(VIEWER_OFFSET_LIMIT, session.viewerOffsetX),
    );
    const offsetY = Math.max(
      -VIEWER_OFFSET_LIMIT,
      Math.min(VIEWER_OFFSET_LIMIT, session.viewerOffsetY),
    );
    const width = baseWidth * scale;
    const height = baseHeight * scale;
    const rangeX = Math.max(0, width - containerWidth) / 2;
    const rangeY = Math.max(0, height - containerHeight) / 2;
    const centerX = containerWidth / 2 + offsetX * rangeX;
    const centerY = containerHeight / 2 + offsetY * rangeY;

    return {
      left: centerX - width / 2,
      top: centerY - height / 2,
      width,
      height,
    };
  })();

  const pointerRect = (() => {
    if (!displayRect) {
      return null;
    }

    return {
      left: displayRect.left + ((session.pointerX + 1) / 2) * displayRect.width,
      top: displayRect.top + ((session.pointerY + 1) / 2) * displayRect.height,
    };
  })();

  const slideStyle = displayRect
    ? {
        right: 'auto',
        bottom: 'auto',
        left: `${displayRect.left}px`,
        top: `${displayRect.top}px`,
        width: `${displayRect.width}px`,
        height: `${displayRect.height}px`,
      }
    : undefined;

  const isPointerVisible =
    session.pointerUpdatedAt !== null &&
    Math.max(0, nowMs - session.pointerUpdatedAt) < 2000;

  return (
    <main className={styles.page}>
      <PdfPageCanvas
        src={session.pdfSrc}
        page={session.currentPage}
        fullscreen
        className={styles.slide}
        style={slideStyle}
        onViewportChange={setPdfViewport}
        onPrevPage={() => moveSlide('prev')}
        onNextPage={() => moveSlide('next')}
      />
      <div
        className={styles.pointer}
        style={{
          left: `${pointerRect?.left ?? viewportSize.width / 2}px`,
          top: `${pointerRect?.top ?? viewportSize.height / 2}px`,
          opacity: isPointerVisible ? 1 : 0,
        }}
      />
    </main>
  );
}
