'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {PresenterPanel} from '@/components/presenter/PresenterPanel';
import {PageNumberNavigationModal} from '@/components/session/PageNumberNavigationModal';
import {PageGridModal} from '@/components/slides/PageGridModal';
import {getClientSlideSource, type ClientSession} from '@/lib/client-types';
import {usePageNumberNavigation} from '@/lib/usePageNumberNavigation';

type Props = {
  sessionId: string;
};

function formatMs(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function PresenterScreen({sessionId}: Props) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [sessionReceivedAtMs, setSessionReceivedAtMs] = useState(() =>
    Date.now(),
  );
  const [nowMs, setNowMs] = useState(() => Date.now());

  const pageNumberInput = usePageNumberNavigation({
    sessionId,
    totalPages: session?.totalPages,
  });

  useEffect(() => {
    const source = new EventSource(`/api/sessions/${sessionId}/events`);

    source.addEventListener('session.update', event => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as {
          session?: ClientSession;
        };
        if (payload.session) {
          setSession(payload.session);
          setSessionReceivedAtMs(Date.now());
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
    if (!session?.timerRunning) {
      return;
    }

    const id = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    return () => {
      window.clearInterval(id);
    };
  }, [session?.timerRunning]);

  const elapsedMs = useMemo(() => {
    if (!session) {
      return 0;
    }

    if (!session.timerRunning) {
      return session.timerElapsedMs;
    }

    return session.timerElapsedMs + Math.max(0, nowMs - sessionReceivedAtMs);
  }, [nowMs, session, sessionReceivedAtMs]);

  const currentNote = useMemo(() => {
    if (!session) {
      return '';
    }
    const found = session.notes.find(item => item.page === session.currentPage);
    return found?.note ?? '';
  }, [session]);

  const slide = useCallback(
    async (action: 'next' | 'prev' | 'set', page?: number) => {
      await fetch(`/api/sessions/${sessionId}/slide`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({action, page}),
      });
    },
    [sessionId],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
        return;
      }

      event.preventDefault();
      void slide(event.key === 'ArrowLeft' ? 'prev' : 'next');
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [slide]);

  useEffect(() => {
    const pointerUpdatedAt = session?.pointerUpdatedAt;
    if (pointerUpdatedAt === null || pointerUpdatedAt === undefined) {
      return;
    }

    const remainingMs = 2000 - Math.max(0, Date.now() - pointerUpdatedAt);
    if (remainingMs <= 0) {
      return;
    }

    const id = window.setTimeout(() => {
      setNowMs(pointerUpdatedAt + 2001);
    }, remainingMs);

    return () => {
      window.clearTimeout(id);
    };
  }, [session?.pointerUpdatedAt]);

  async function timer(action: 'start' | 'pause' | 'reset') {
    await fetch(`/api/sessions/${sessionId}/timer`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({action}),
    });
  }

  const slideSource = session ? getClientSlideSource(session) : null;
  if (!session || !slideSource) {
    return <main>Loading presenter...</main>;
  }

  const totalPages = session.totalPages;
  const totalPagesText = `${session.currentPage + 1}/${totalPages ?? '?'}`;

  return (
    <>
      <PresenterPanel
        sessionId={sessionId}
        slideSource={slideSource}
        currentPage={session.currentPage}
        nextPage={session.currentPage + 1}
        totalPages={totalPages}
        totalPagesText={totalPagesText}
        timerText={formatMs(elapsedMs)}
        timerRunning={session.timerRunning}
        noteText={currentNote}
        pointerX={session.pointerX}
        pointerY={session.pointerY}
        pointerVisible={
          session.pointerUpdatedAt !== null &&
          Math.max(0, nowMs - session.pointerUpdatedAt) < 2000
        }
        onPrev={() => slide('prev')}
        onNext={() => slide('next')}
        onStartPause={() => timer(session.timerRunning ? 'pause' : 'start')}
        onResetTimer={() => timer('reset')}
      />
      <PageNumberNavigationModal pageNumberInput={pageNumberInput} />
      <PageGridModal
        source={slideSource}
        currentPage={session.currentPage}
        totalPages={totalPages ?? 1}
        onSelectPage={page => slide('set', page)}
      />
    </>
  );
}
