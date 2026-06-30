'use client';

import {useRef} from 'react';
import * as styles from '@/components/controller/PointerControl.css';

type Props = {
  sessionId: string;
  fullScaleAdjustment: number;
  pdfImageSize?: {width: number; height: number} | null;
};

export function PointerControl({
  sessionId,
  fullScaleAdjustment,
  pdfImageSize,
}: Props) {
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
  const lastGesturePointersRef = useRef<Map<
    number,
    {x: number; y: number}
  > | null>(null);
  const gestureStartCenterRef = useRef<{x: number; y: number} | null>(null);
  const gestureStartDistanceRef = useRef<number | null>(null);
  const lastGestureSentAtRef = useRef(0);

  const SEND_INTERVAL_MS = 20;
  const BASE_FULL_SCALE_SPEED_PX_PER_SEC = 7000;
  const DEAD_ZONE_SPEED_PX_PER_SEC = 20;
  const PAGE_PAN_SPEED_MULTIPLIER = 3.1;

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
    lastGesturePointersRef.current = null;
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
    lastGesturePointersRef.current = new Map(
      Array.from(activePointersRef.current.entries()).slice(0, 2),
    );
    lastGestureSentAtRef.current = performance.now();
  }

  function processMove(clientX: number, clientY: number) {
    if (!pointerActiveRef.current) {
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
    let dx = speedX / fullScaleSpeed;
    let dy = speedY / fullScaleSpeed;

    if (pdfImageSize) {
      const aspect = pdfImageSize.width / pdfImageSize.height;
      if (aspect < 1) {
        dy *= aspect;
      } else {
        dx /= aspect;
      }
    }

    dx = clamp(dx, -1, 1);
    dy = clamp(dy, -1, 1);

    if (now - lastSentAtRef.current < SEND_INTERVAL_MS) {
      return;
    }
    lastSentAtRef.current = now;

    void sendPointer(dx, dy);
  }

  function processGestureMove(element: HTMLElement) {
    if (!gestureActiveRef.current) {
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

    let gestureDirection: 'pan' | 'pinch' | null = null;
    const lastGesturePointers = lastGesturePointersRef.current;
    if (lastGesturePointers && lastGesturePointers.size >= 2) {
      const entries = Array.from(activePointersRef.current.entries()).slice(
        0,
        2,
      );
      if (entries.length === 2) {
        const [idA, currentA] = entries[0];
        const [idB, currentB] = entries[1];
        const previousA = lastGesturePointers.get(idA);
        const previousB = lastGesturePointers.get(idB);

        if (previousA && previousB) {
          const moveAx = currentA.x - previousA.x;
          const moveAy = currentA.y - previousA.y;
          const moveBx = currentB.x - previousB.x;
          const moveBy = currentB.y - previousB.y;
          const moveALen = Math.hypot(moveAx, moveAy);
          const moveBLen = Math.hypot(moveBx, moveBy);
          if (moveALen > 0.0001 && moveBLen > 0.0001) {
            const cosine =
              (moveAx * moveBx + moveAy * moveBy) / (moveALen * moveBLen);

            if (cosine <= -0.45) {
              gestureDirection = 'pinch';
            } else if (cosine >= 0.45) {
              gestureDirection = 'pan';
            }
          }
        }
      }
    }

    if (gestureModeRef.current === null) {
      if (gestureDirection === null) {
        return;
      }
      gestureModeRef.current = gestureDirection;
    }

    const scaleMultiplier = state.distance / previousDistance;
    const offsetDeltaX = clamp(
      ((state.centerX - previousCenter.x) / width) *
        (BASE_FULL_SCALE_SPEED_PX_PER_SEC / getFullScaleSpeedPxPerSec()) *
        PAGE_PAN_SPEED_MULTIPLIER,
      -1,
      1,
    );
    const offsetDeltaY = clamp(
      ((state.centerY - previousCenter.y) / height) *
        (BASE_FULL_SCALE_SPEED_PX_PER_SEC / getFullScaleSpeedPxPerSec()) *
        PAGE_PAN_SPEED_MULTIPLIER,
      -1,
      1,
    );

    lastGestureCenterRef.current = {x: state.centerX, y: state.centerY};
    lastGestureDistanceRef.current = state.distance;
    lastGesturePointersRef.current = new Map(
      Array.from(activePointersRef.current.entries()).slice(0, 2),
    );
    lastGestureSentAtRef.current = now;

    if (gestureModeRef.current === 'pinch') {
      void sendViewerTransform(scaleMultiplier, 0, 0);
      return;
    }

    void sendViewerTransform(1, offsetDeltaX, offsetDeltaY);
  }

  return (
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
  );
}
