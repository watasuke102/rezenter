'use client';

import {useEffect, useMemo, useState} from 'react';
import {PresenterPanel} from '@/components/presenter/PresenterPanel';
import type {ClientSession} from '@/lib/client-types';

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
  const [now, setNow] = useState(0);
  const [resolvedTotalPages, setResolvedTotalPages] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function pull() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }
        const payload = await response.json();
        if (!cancelled) {
          setSession(payload.session);
        }
      } catch {
        // ignore polling errors
      }
    }

    pull();
    const id = window.setInterval(pull, 500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let disposed = false;

    async function resolveTotalPages() {
      if (!session?.pdfSrc) {
        return;
      }

      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString();
        }
        const task = pdfjs.getDocument(session.pdfSrc);
        const doc = await task.promise;
        if (!disposed) {
          setResolvedTotalPages(doc.numPages);
        }
      } catch {
        if (!disposed) {
          setResolvedTotalPages(null);
        }
      }
    }

    resolveTotalPages();
    return () => {
      disposed = true;
    };
  }, [session?.pdfSrc]);

  const elapsedMs = useMemo(() => {
    if (!session) {
      return 0;
    }
    if (!session.timerRunning || !session.timerStartedAt) {
      return session.timerElapsedMs;
    }
    return session.timerElapsedMs + (now - session.timerStartedAt);
  }, [now, session]);

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

  if (!session || !session.pdfSrc) {
    return <main>Loading presenter...</main>;
  }

  const totalPages = resolvedTotalPages ?? session.totalPages;
  const totalPagesText = `${session.currentPage + 1}/${totalPages ?? '?'}`;

  return (
    <PresenterPanel
      pdfSrc={session.pdfSrc}
      currentPage={session.currentPage}
      nextPage={session.currentPage + 1}
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
