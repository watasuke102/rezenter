'use client';

import {useRef, useState} from 'react';
import * as styles from '@/components/controller/controller.css';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(false);
  const [fullScaleAdjustment, setFullScaleAdjustment] = useState(0);

  const activePointersRef = useRef(new Map<number, {x: number; y: number}>());
  const pointerActiveRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastSentAtRef = useRef(0);
  const gestureActiveRef = useRef(false);
  const gestureModeRef = useRef<'pan' | 'pinch' | null>(null);
  const lastGestureCenterRef = useRef<{x: number; y: number} | null>(null);
  const lastGestureDistanceRef = useRef<number | null>(null);
  const gestureStartCenterRef = useRef<{x: number; y: number} | null>(null);
  const gestureStartDistanceRef = useRef<number | null>(null);
  const lastGestureSentAtRef = useRef(0);

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

  async function sendViewerTransform(
    scaleMultiplier: number,
    offsetDeltaX: number,
    offsetDeltaY: number,
  ) {
    try {
      await fetch(`/api/sessions/${sessionId}/viewer-transform`, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          scaleMultiplier,
          offsetDeltaX,
          offsetDeltaY,
        }),
      });
    } catch {
      // ignore transient network errors on rapid gesture updates
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

  function endGesture() {
    gestureActiveRef.current = false;
    gestureModeRef.current = null;
    lastGestureCenterRef.current = null;
    lastGestureDistanceRef.current = null;
    gestureStartCenterRef.current = null;
    gestureStartDistanceRef.current = null;
    lastGestureSentAtRef.current = 0;
  }

  function getGestureState() {
    const pointers = Array.from(activePointersRef.current.values());
    if (pointers.length < 2) {
      return null;
    }

    const first = pointers[0];
    const second = pointers[1];
    return {
      centerX: (first.x + second.x) / 2,
      centerY: (first.y + second.y) / 2,
      distance: Math.hypot(first.x - second.x, first.y - second.y),
    };
  }

  function syncSinglePointerFromActivePointers() {
    if (activePointersRef.current.size !== 1) {
      endPointer();
      return;
    }

    const [pointerId, point] = Array.from(
      activePointersRef.current.entries(),
    )[0];
    activePointerIdRef.current = pointerId;
    pointerActiveRef.current = true;
    lastXRef.current = point.x;
    lastYRef.current = point.y;
    lastMoveAtRef.current = performance.now();
  }

  function beginGestureFromCurrentPointers() {
    const state = getGestureState();
    if (!state) {
      return;
    }

    gestureActiveRef.current = true;
    gestureModeRef.current = null;
    endPointer();
    gestureStartCenterRef.current = {x: state.centerX, y: state.centerY};
    gestureStartDistanceRef.current = state.distance;
    lastGestureCenterRef.current = {x: state.centerX, y: state.centerY};
    lastGestureDistanceRef.current = state.distance;
    lastGestureSentAtRef.current = performance.now();
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

  function processGestureMove(element: HTMLElement) {
    if (!pointerMode || !gestureActiveRef.current) {
      return;
    }

    const state = getGestureState();
    if (!state) {
      endGesture();
      return;
    }

    const startCenter = gestureStartCenterRef.current;
    const startDistance = gestureStartDistanceRef.current;
    if (!startCenter || startDistance === null || startDistance <= 0) {
      endGesture();
      return;
    }

    const now = performance.now();
    if (now - lastGestureSentAtRef.current < SEND_INTERVAL_MS) {
      return;
    }

    const rect = element.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
    const previousCenter = lastGestureCenterRef.current;
    const previousDistance = lastGestureDistanceRef.current;
    if (!previousCenter || previousDistance === null || previousDistance <= 0) {
      lastGestureCenterRef.current = {x: state.centerX, y: state.centerY};
      lastGestureDistanceRef.current = state.distance;
      return;
    }

    const centerMoveX = (state.centerX - startCenter.x) / width;
    const centerMoveY = (state.centerY - startCenter.y) / height;
    const panMagnitude = Math.hypot(centerMoveX, centerMoveY);
    const pinchMagnitude =
      Math.abs(state.distance - startDistance) / startDistance;

    if (gestureModeRef.current === null) {
      if (Math.max(panMagnitude, pinchMagnitude) < 0.005) {
        return;
      }

      gestureModeRef.current = pinchMagnitude > panMagnitude ? 'pinch' : 'pan';
    }

    const scaleMultiplier = state.distance / previousDistance;
    const offsetDeltaX = clamp(
      ((state.centerX - previousCenter.x) / width) *
        (BASE_FULL_SCALE_SPEED_PX_PER_SEC / getFullScaleSpeedPxPerSec()),
      -1,
      1,
    );
    const offsetDeltaY = clamp(
      ((state.centerY - previousCenter.y) / height) *
        (BASE_FULL_SCALE_SPEED_PX_PER_SEC / getFullScaleSpeedPxPerSec()),
      -1,
      1,
    );

    lastGestureCenterRef.current = {x: state.centerX, y: state.centerY};
    lastGestureDistanceRef.current = state.distance;
    lastGestureSentAtRef.current = now;

    if (gestureModeRef.current === 'pinch') {
      void sendViewerTransform(scaleMultiplier, 0, 0);
      return;
    }

    void sendViewerTransform(1, offsetDeltaX, offsetDeltaY);
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
              activePointersRef.current.clear();
              endGesture();
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
              event.currentTarget.setPointerCapture(event.pointerId);
              activePointersRef.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
              });

              if (activePointersRef.current.size === 1) {
                if (gestureActiveRef.current) {
                  endGesture();
                }
                activePointerIdRef.current = event.pointerId;
                beginPointer(event.clientX, event.clientY);
                return;
              }

              if (activePointersRef.current.size === 2) {
                beginGestureFromCurrentPointers();
              }
            }}
            onPointerMove={event => {
              if (!activePointersRef.current.has(event.pointerId)) {
                return;
              }

              activePointersRef.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
              });

              if (activePointersRef.current.size >= 2) {
                if (!gestureActiveRef.current) {
                  beginGestureFromCurrentPointers();
                }
                event.preventDefault();
                processGestureMove(event.currentTarget);
                return;
              }

              if (gestureActiveRef.current) {
                gestureActiveRef.current = false;
                syncSinglePointerFromActivePointers();
              }

              if (event.pointerId !== activePointerIdRef.current) {
                return;
              }

              event.preventDefault();
              processMove(event.clientX, event.clientY);
            }}
            onPointerUp={event => {
              activePointersRef.current.delete(event.pointerId);

              if (activePointersRef.current.size >= 2) {
                const state = getGestureState();
                if (state) {
                  lastGestureCenterRef.current = {
                    x: state.centerX,
                    y: state.centerY,
                  };
                  lastGestureDistanceRef.current = state.distance;
                }
                return;
              }

              if (activePointersRef.current.size === 1) {
                endGesture();
                syncSinglePointerFromActivePointers();
                return;
              }

              if (event.pointerId === activePointerIdRef.current) {
                endPointer();
              }
              endGesture();
            }}
            onPointerCancel={event => {
              activePointersRef.current.delete(event.pointerId);

              if (activePointersRef.current.size === 1) {
                endGesture();
                syncSinglePointerFromActivePointers();
              } else if (activePointersRef.current.size === 0) {
                endPointer();
              }
              endGesture();
            }}
            onPointerLeave={event => {
              if (event.buttons !== 0) {
                return;
              }

              activePointersRef.current.delete(event.pointerId);
              if (activePointersRef.current.size === 1) {
                endGesture();
                syncSinglePointerFromActivePointers();
              } else if (activePointersRef.current.size === 0) {
                endPointer();
              }
              endGesture();
            }}
          />
        </div>
      )}
    </main>
  );
}
