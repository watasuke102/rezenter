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
    const id = window.setInterval(pull, 450);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionId]);

  if (!session || !session.pdfSrc) {
    return <main className={styles.page}>Loading session...</main>;
  }

  return (
    <main className={styles.page}>
      <PdfPageCanvas
        src={session.pdfSrc}
        page={session.currentPage}
        fullscreen
        className={styles.slide}
      />
      <div
        className={styles.pointer}
        style={{
          left: `${(session.pointerX + 1) * 50}%`,
          top: `${(session.pointerY + 1) * 50}%`,
          opacity: session.pointerUpdatedAt ? 1 : 0,
        }}
      />
    </main>
  );
}
