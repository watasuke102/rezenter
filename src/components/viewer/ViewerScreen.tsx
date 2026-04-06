'use client';

import {useEffect, useState} from 'react';
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
          setSession(payload.session);
          setNowMs(Date.now());
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

  const pointerRect = (() => {
    if (!pdfViewport) {
      return null;
    }

    const pdfAspect = pdfViewport.width / pdfViewport.height;
    const containerAspect = viewportSize.width / viewportSize.height;

    if (containerAspect > pdfAspect) {
      const contentWidth = pdfAspect / containerAspect;
      const insetX = (1 - contentWidth) / 2;
      return {
        left: insetX + ((session.pointerX + 1) / 2) * contentWidth,
        top: (session.pointerY + 1) / 2,
      };
    }

    const contentHeight = containerAspect / pdfAspect;
    const insetY = (1 - contentHeight) / 2;
    return {
      left: (session.pointerX + 1) / 2,
      top: insetY + ((session.pointerY + 1) / 2) * contentHeight,
    };
  })();

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
        onViewportChange={setPdfViewport}
        onPrevPage={() => moveSlide('prev')}
        onNextPage={() => moveSlide('next')}
      />
      <div
        className={styles.pointer}
        style={{
          left: `${(pointerRect?.left ?? 0.5) * 100}%`,
          top: `${(pointerRect?.top ?? 0.5) * 100}%`,
          opacity: isPointerVisible ? 1 : 0,
        }}
      />
    </main>
  );
}
