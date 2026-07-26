'use client';

import {useEffect, useMemo, useState} from 'react';
import {PresenterPanel} from '@/components/presenter/PresenterPanel';
import {getClientSlideSource, type ClientSession} from '@/lib/client-types';

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

  async function slide(action: 'next' | 'prev') {
    await fetch(`/api/sessions/${sessionId}/slide`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({action}),
    });
  }

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
      onPrev={() => slide('prev')}
      onNext={() => slide('next')}
      onStartPause={() => timer(session.timerRunning ? 'pause' : 'start')}
      onResetTimer={() => timer('reset')}
    />
  );
}
