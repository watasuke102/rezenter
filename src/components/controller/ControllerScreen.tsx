'use client';

import {useState} from 'react';
import * as styles from '@/components/controller/controller.css';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(false);
  const [active, setActive] = useState(false);
  const [last, setLast] = useState({x: 0, y: 0, at: 0});

  async function slide(action: 'next' | 'prev') {
    await fetch(`/api/sessions/${sessionId}/slide`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({action}),
    });
  }

  async function sendPointer(x: number, y: number) {
    await fetch(`/api/sessions/${sessionId}/pointer`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({x, y}),
    });
  }

  function onDown(clientX: number, clientY: number) {
    setActive(true);
    setLast({x: clientX, y: clientY, at: performance.now()});
  }

  function onMove(clientX: number, clientY: number) {
    if (!active) {
      return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - last.at);
    const dx = (clientX - last.x) / dt;
    const dy = (clientY - last.y) / dt;
    const nx = Math.max(-1, Math.min(1, dx * 0.06));
    const ny = Math.max(-1, Math.min(1, dy * 0.06));
    setLast({x: clientX, y: clientY, at: now});
    void sendPointer(nx, ny);
  }

  return (
    <main className={styles.body}>
      <button
        className={`${styles.button} ${styles.secondary}`}
        type='button'
        onClick={() => setPointerMode(prev => !prev)}
      >
        {pointerMode ? 'Button Mode' : 'Pointer Mode'}
      </button>

      {!pointerMode ? (
        <div className={styles.normal}>
          <button
            className={`${styles.button} ${styles.secondary}`}
            type='button'
            onClick={() => slide('prev')}
          >
            PREV
          </button>
          <button
            className={`${styles.button} ${styles.primary}`}
            type='button'
            onClick={() => slide('next')}
          >
            NEXT
          </button>
        </div>
      ) : (
        <div className={styles.pointer}>
          <div className={styles.controls}>
            <span>Move pointer</span>
            <span />
            <span>live</span>
          </div>
          <div
            className={styles.trackpad}
            onPointerDown={event => onDown(event.clientX, event.clientY)}
            onPointerMove={event => onMove(event.clientX, event.clientY)}
            onPointerUp={() => setActive(false)}
            onPointerCancel={() => setActive(false)}
          />
        </div>
      )}
    </main>
  );
}
