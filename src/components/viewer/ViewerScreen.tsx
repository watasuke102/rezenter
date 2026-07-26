'use client';

import {useEffect, useRef, useState} from 'react';
import {PdfConcatenatedCanvas} from '@/components/pdf/PdfConcatenatedCanvas';
import {SlidePage} from '@/components/slides/SlidePage';
import {SvgConcatenatedPages} from '@/components/svg/SvgConcatenatedPages';
import {getClientSlideSource, type ClientSession} from '@/lib/client-types';
import * as styles from '@/components/viewer/viewer.css';
import {useViewerSettings} from '@/lib/useViewerSettings';

type Props = {
  sessionId: string;
  initialSession: ClientSession;
};

export function ViewerScreen({sessionId, initialSession}: Props) {
  const {settings, isLoaded} = useViewerSettings(sessionId);
  const [session, setSession] = useState<ClientSession | null>(initialSession);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const lastPointerUpdatedAtRef = useRef<number | null>(
    initialSession.pointerUpdatedAt,
  );
  const [viewportSize, setViewportSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1 : window.innerWidth,
    height: typeof window === 'undefined' ? 1 : window.innerHeight,
  }));
  const [slideViewport, setSlideViewport] = useState<{
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

  const slideSource = session ? getClientSlideSource(session) : null;
  if (!session || !slideSource) {
    return <main className={styles.page}>Loading session...</main>;
  }

  const VIEWER_OFFSET_LIMIT = 0.999;

  const displayRect = (() => {
    if (!slideViewport) {
      return null;
    }

    const slideAspect = slideViewport.width / slideViewport.height;
    const containerWidth = viewportSize.width;
    const containerHeight = viewportSize.height;
    const containerAspect = containerWidth / containerHeight;
    let baseWidth: number;
    let baseHeight: number;
    if (settings.concatenatedMode) {
      baseWidth = containerWidth;
      baseHeight = containerWidth / slideAspect;
    } else {
      baseWidth =
        containerAspect > slideAspect
          ? containerHeight * slideAspect
          : containerWidth;
      baseHeight =
        containerAspect > slideAspect
          ? containerHeight
          : containerWidth / slideAspect;
    }

    const scale = Math.max(1, session.viewerScale);
    const width = baseWidth * scale;
    const height = baseHeight * scale;
    const rangeX = Math.max(0, width - containerWidth) / 2;
    const rangeY = Math.max(0, height - containerHeight) / 2;

    let actualOffsetX: number;
    let actualOffsetY: number;

    if (settings.concatenatedMode) {
      actualOffsetX = Math.max(
        -rangeX,
        Math.min(rangeX, session.viewerOffsetX * containerWidth),
      );
      actualOffsetY = Math.max(
        -rangeY,
        Math.min(rangeY, rangeY + session.viewerOffsetY * containerHeight),
      );
    } else {
      const offsetX = Math.max(
        -VIEWER_OFFSET_LIMIT,
        Math.min(VIEWER_OFFSET_LIMIT, session.viewerOffsetX),
      );
      const offsetY = Math.max(
        -VIEWER_OFFSET_LIMIT,
        Math.min(VIEWER_OFFSET_LIMIT, session.viewerOffsetY),
      );
      actualOffsetX = offsetX * rangeX;
      actualOffsetY = offsetY * rangeY;
    }

    const centerX = containerWidth / 2 + actualOffsetX;
    const centerY = containerHeight / 2 + actualOffsetY;

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

  if (!isLoaded) {
    return null;
  }

  if (settings.concatenatedMode) {
    return (
      <main className={styles.page}>
        {slideSource.kind === 'svg' ? (
          <SvgConcatenatedPages
            baseUrl={slideSource.baseUrl}
            totalPages={session.totalPages ?? 1}
            marginTop={settings.marginTop}
            marginBottom={settings.marginBottom}
            marginLeft={settings.marginLeft}
            marginRight={settings.marginRight}
            className={styles.slide}
            style={slideStyle}
            onViewportChange={setSlideViewport}
          />
        ) : (
          <PdfConcatenatedCanvas
            src={slideSource.src}
            marginTop={settings.marginTop}
            marginBottom={settings.marginBottom}
            marginLeft={settings.marginLeft}
            marginRight={settings.marginRight}
            className={styles.slide}
            style={slideStyle}
            onViewportChange={setSlideViewport}
          />
        )}
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

  return (
    <main className={styles.page}>
      <SlidePage
        source={slideSource}
        page={session.currentPage}
        totalPages={session.totalPages ?? undefined}
        fullscreen
        className={styles.slide}
        style={slideStyle}
        onViewportChange={setSlideViewport}
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
