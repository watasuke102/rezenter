'use client';

import {useRef, useState} from 'react';
import * as styles from '@/components/controller/controller.css';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(false);
  const [fullScaleAdjustment, setFullScaleAdjustment] = useState(0);

  const pointerActiveRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastSentAtRef = useRef(0);

  const SEND_INTERVAL_MS = 20;
  const BASE_FULL_SCALE_SPEED_PX_PER_SEC = 11000;
  const DEAD_ZONE_SPEED_PX_PER_SEC = 20;

  async function slide(action: 'next' | 'prev') {
    await fetch(`/api/sessions/${sessionId}/slide`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({action}),
    });
  }

  async function sendPointer(x: number, y: number) {
    try {
      await fetch(`/api/sessions/${sessionId}/pointer`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({x: clamp(x, -1, 1), y: clamp(y, -1, 1)}),
      });
    } catch {
      // ignore transient network errors on rapid pointer updates
    }
  }

  function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v));
  }

  function getFullScaleSpeedPxPerSec() {
    return Math.max(
      200,
      BASE_FULL_SCALE_SPEED_PX_PER_SEC - fullScaleAdjustment,
    );
  }

  function beginPointer(clientX: number, clientY: number) {
    if (!pointerMode) {
      return;
    }
    pointerActiveRef.current = true;
    lastXRef.current = clientX;
    lastYRef.current = clientY;
    lastMoveAtRef.current = performance.now();
  }

  function endPointer() {
    pointerActiveRef.current = false;
    activePointerIdRef.current = null;
    lastMoveAtRef.current = 0;
  }

  function processMove(clientX: number, clientY: number) {
    if (!pointerMode || !pointerActiveRef.current) {
      return;
    }

    const now = performance.now();
    const dtMs = now - lastMoveAtRef.current;
    if (dtMs <= 0) {
      return;
    }

    const deltaX = clientX - lastXRef.current;
    const deltaY = clientY - lastYRef.current;
    const dtSec = dtMs / 1000;
    const speedX = deltaX / dtSec;
    const speedY = deltaY / dtSec;

    lastXRef.current = clientX;
    lastYRef.current = clientY;
    lastMoveAtRef.current = now;

    const speedMagnitude = Math.hypot(speedX, speedY);
    if (speedMagnitude < DEAD_ZONE_SPEED_PX_PER_SEC) {
      return;
    }

    const fullScaleSpeed = getFullScaleSpeedPxPerSec();
    const dx = clamp(speedX / fullScaleSpeed, -1, 1);
    const dy = clamp(speedY / fullScaleSpeed, -1, 1);

    if (now - lastSentAtRef.current < SEND_INTERVAL_MS) {
      return;
    }
    lastSentAtRef.current = now;

    void sendPointer(dx, dy);
  }

  return (
    <main className={styles.body}>
      <button
        className={`${styles.button} ${styles.secondary}`}
        type='button'
        onClick={() => {
          setPointerMode(prev => {
            const next = !prev;
            if (!next) {
              endPointer();
            }
            return next;
          });
        }}
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
            <span>SLOW</span>
            <input
              className={styles.speedSlider}
              type='range'
              min='-4000'
              max='4000'
              step='100'
              value={fullScaleAdjustment}
              aria-label='speed adjustment'
              onChange={event =>
                setFullScaleAdjustment(Number(event.currentTarget.value))
              }
            />
            <span>FAST</span>
            <span className={styles.speedValue}>{fullScaleAdjustment}</span>
          </div>
          <div
            className={styles.trackpad}
            onPointerDown={event => {
              if (
                activePointerIdRef.current !== null &&
                activePointerIdRef.current !== event.pointerId
              ) {
                return;
              }
              activePointerIdRef.current = event.pointerId;
              beginPointer(event.clientX, event.clientY);
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerMove={event => {
              if (event.pointerId !== activePointerIdRef.current) {
                return;
              }
              event.preventDefault();
              processMove(event.clientX, event.clientY);
            }}
            onPointerUp={event => {
              if (event.pointerId === activePointerIdRef.current) {
                endPointer();
              }
            }}
            onPointerCancel={event => {
              if (event.pointerId === activePointerIdRef.current) {
                endPointer();
              }
            }}
            onPointerLeave={event => {
              if (
                event.pointerId === activePointerIdRef.current &&
                event.buttons === 0
              ) {
                endPointer();
              }
            }}
          />
        </div>
      )}
    </main>
  );
}
