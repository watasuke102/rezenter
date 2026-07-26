'use client';

import {useEffect, useRef} from 'react';
import * as styles from '@/components/controller/PointerControl.css';

type Point = {x: number; y: number};

type InteractionState =
  | 'Idle'
  | 'Down'
  | 'Drag'
  | 'Hold'
  | 'FirstTap'
  | 'PageMoved'
  | 'DoubleDown'
  | 'Pinch'
  | 'Pan'
  | 'Wait';

type SlideAction = 'next' | 'prev';

type Props = {
  sessionId: string;
  fullScaleAdjustment: number;
  pdfImageSize?: {width: number; height: number} | null;
  onSlide: (action: SlideAction) => Promise<void>;
};

const HOLD_DELAY_MS = 500;
const SECOND_TAP_TIMEOUT_MS = 300;
const DRAG_START_DISTANCE_PX = 8;
const DOUBLE_DOWN_MOVEMENT_THRESHOLD_PX = 6;
const PINCH_DIRECTION_COSINE_THRESHOLD = -0.45;
const PAN_DIRECTION_COSINE_THRESHOLD = 0.45;
const HOLD_VIBRATION_DURATION_MS = 50;

const POINTER_SEND_INTERVAL_MS = 20;
const GESTURE_SEND_INTERVAL_MS = 20;
const BASE_FULL_SCALE_SPEED_PX_PER_SEC = 7000;
const DEAD_ZONE_SPEED_PX_PER_SEC = 20;
const PAGE_PAN_SPEED_MULTIPLIER = 3.1;

export function PointerControl({
  sessionId,
  fullScaleAdjustment,
  pdfImageSize,
  onSlide,
}: Props) {
  const stateRef = useRef<InteractionState>('Idle');
  const activePointersRef = useRef(new Map<number, Point>());
  const primaryPointerIdRef = useRef<number | null>(null);
  const downStartPointRef = useRef<Point | null>(null);
  const downStartedAtRef = useRef(0);
  const firstTapActionRef = useRef<SlideAction | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secondTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pointerActiveRef = useRef(false);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);
  const lastMoveAtRef = useRef(0);
  const lastSentAtRef = useRef(0);

  const gesturePointerIdsRef = useRef<[number, number] | null>(null);
  const gestureStartPointersRef = useRef<Map<number, Point> | null>(null);
  const lastGestureCenterRef = useRef<Point | null>(null);
  const lastGestureDistanceRef = useRef<number | null>(null);
  const lastGestureSentAtRef = useRef(0);

  function clearHoldTimer() {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function clearSecondTapTimer() {
    if (secondTapTimerRef.current !== null) {
      clearTimeout(secondTapTimerRef.current);
      secondTapTimerRef.current = null;
    }
  }

  function endPointerMotion() {
    pointerActiveRef.current = false;
    lastMoveAtRef.current = 0;
  }

  function endGesture() {
    gesturePointerIdsRef.current = null;
    gestureStartPointersRef.current = null;
    lastGestureCenterRef.current = null;
    lastGestureDistanceRef.current = null;
    lastGestureSentAtRef.current = 0;
  }

  function transitionTo(nextState: InteractionState) {
    const previousState = stateRef.current;
    if (previousState === 'Down' && nextState !== 'Down') {
      clearHoldTimer();
    }
    if (previousState === 'FirstTap' && nextState !== 'FirstTap') {
      clearSecondTapTimer();
    }

    stateRef.current = nextState;

    if (nextState === 'Idle' || nextState === 'Wait') {
      clearHoldTimer();
      clearSecondTapTimer();
      primaryPointerIdRef.current = null;
      downStartPointRef.current = null;
      downStartedAtRef.current = 0;
      firstTapActionRef.current = null;
      endPointerMotion();
      endGesture();
    }
  }

  useEffect(() => {
    return () => {
      clearHoldTimer();
      clearSecondTapTimer();
    };
  }, []);

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

  function beginDown(pointerId: number, point: Point) {
    transitionTo('Down');
    primaryPointerIdRef.current = pointerId;
    downStartPointRef.current = point;
    downStartedAtRef.current = performance.now();

    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      if (stateRef.current !== 'Down') {
        return;
      }

      if ('vibrate' in navigator) {
        navigator.vibrate(HOLD_VIBRATION_DURATION_MS);
      }
      transitionTo('Hold');
    }, HOLD_DELAY_MS);
  }

  function beginDrag(point: Point) {
    const startPoint = downStartPointRef.current ?? point;
    pointerActiveRef.current = true;
    lastXRef.current = startPoint.x;
    lastYRef.current = startPoint.y;
    lastMoveAtRef.current = downStartedAtRef.current;
    transitionTo('Drag');
    processPointerMove(point.x, point.y);
  }

  function beginFirstTap(action: SlideAction) {
    firstTapActionRef.current = action;
    transitionTo('FirstTap');
    secondTapTimerRef.current = setTimeout(() => {
      secondTapTimerRef.current = null;
      if (stateRef.current === 'FirstTap') {
        transitionTo('Idle');
      }
    }, SECOND_TAP_TIMEOUT_MS);
  }

  function getGestureState() {
    const pointerIds = gesturePointerIdsRef.current;
    if (!pointerIds) {
      return null;
    }

    const first = activePointersRef.current.get(pointerIds[0]);
    const second = activePointersRef.current.get(pointerIds[1]);
    if (!first || !second) {
      return null;
    }

    return {
      centerX: (first.x + second.x) / 2,
      centerY: (first.y + second.y) / 2,
      distance: Math.hypot(first.x - second.x, first.y - second.y),
    };
  }

  function beginDoubleDown() {
    const entries = Array.from(activePointersRef.current.entries()).slice(0, 2);
    if (entries.length !== 2) {
      return;
    }

    transitionTo('DoubleDown');
    endPointerMotion();
    const [first, second] = entries;
    gesturePointerIdsRef.current = [first[0], second[0]];
    gestureStartPointersRef.current = new Map(entries);

    const centerX = (first[1].x + second[1].x) / 2;
    const centerY = (first[1].y + second[1].y) / 2;
    lastGestureCenterRef.current = {x: centerX, y: centerY};
    lastGestureDistanceRef.current = Math.hypot(
      first[1].x - second[1].x,
      first[1].y - second[1].y,
    );
    lastGestureSentAtRef.current = performance.now();
  }

  function classifyDoubleDown() {
    const pointerIds = gesturePointerIdsRef.current;
    const startPointers = gestureStartPointersRef.current;
    if (!pointerIds || !startPointers) {
      return null;
    }

    const startA = startPointers.get(pointerIds[0]);
    const startB = startPointers.get(pointerIds[1]);
    const currentA = activePointersRef.current.get(pointerIds[0]);
    const currentB = activePointersRef.current.get(pointerIds[1]);
    if (!startA || !startB || !currentA || !currentB) {
      return null;
    }

    const moveAx = currentA.x - startA.x;
    const moveAy = currentA.y - startA.y;
    const moveBx = currentB.x - startB.x;
    const moveBy = currentB.y - startB.y;
    const moveALength = Math.hypot(moveAx, moveAy);
    const moveBLength = Math.hypot(moveBx, moveBy);
    if (
      moveALength < DOUBLE_DOWN_MOVEMENT_THRESHOLD_PX ||
      moveBLength < DOUBLE_DOWN_MOVEMENT_THRESHOLD_PX
    ) {
      return null;
    }

    const cosine =
      (moveAx * moveBx + moveAy * moveBy) / (moveALength * moveBLength);
    if (cosine <= PINCH_DIRECTION_COSINE_THRESHOLD) {
      return 'Pinch' as const;
    }
    if (cosine >= PAN_DIRECTION_COSINE_THRESHOLD) {
      return 'Pan' as const;
    }
    return null;
  }

  function processPointerMove(clientX: number, clientY: number) {
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

    if (now - lastSentAtRef.current < POINTER_SEND_INTERVAL_MS) {
      return;
    }
    lastSentAtRef.current = now;

    void sendPointer(dx, dy);
  }

  function processGestureMove(
    element: HTMLElement,
    gestureState: 'Pinch' | 'Pan',
  ) {
    const state = getGestureState();
    if (!state) {
      transitionTo('Wait');
      return;
    }

    const now = performance.now();
    if (now - lastGestureSentAtRef.current < GESTURE_SEND_INTERVAL_MS) {
      return;
    }

    const previousCenter = lastGestureCenterRef.current;
    const previousDistance = lastGestureDistanceRef.current;
    if (!previousCenter || previousDistance === null || previousDistance <= 0) {
      lastGestureCenterRef.current = {x: state.centerX, y: state.centerY};
      lastGestureDistanceRef.current = state.distance;
      return;
    }

    const rect = element.getBoundingClientRect();
    const width = rect.width || 1;
    const height = rect.height || 1;
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
    lastGestureSentAtRef.current = now;

    if (gestureState === 'Pinch') {
      void sendViewerTransform(scaleMultiplier, 0, 0);
      return;
    }

    void sendViewerTransform(1, offsetDeltaX, offsetDeltaY);
  }

  function handlePointerDown(pointerId: number, point: Point) {
    activePointersRef.current.set(pointerId, point);

    if (
      stateRef.current === 'Idle' &&
      activePointersRef.current.size === 1
    ) {
      beginDown(pointerId, point);
      return;
    }

    if (stateRef.current === 'Idle') {
      transitionTo('Wait');
      return;
    }

    if (stateRef.current === 'Down' && activePointersRef.current.size === 2) {
      beginDoubleDown();
      return;
    }

    if (stateRef.current === 'FirstTap') {
      const action = firstTapActionRef.current;
      if (!action) {
        transitionTo('Wait');
        return;
      }

      transitionTo('PageMoved');
      firstTapActionRef.current = null;
      void onSlide(action);
    }
  }

  function handlePointerMove(
    pointerId: number,
    point: Point,
    element: HTMLElement,
  ) {
    if (!activePointersRef.current.has(pointerId)) {
      return;
    }
    activePointersRef.current.set(pointerId, point);

    if (
      stateRef.current === 'Down' &&
      pointerId === primaryPointerIdRef.current
    ) {
      const startPoint = downStartPointRef.current;
      if (
        startPoint &&
        Math.hypot(point.x - startPoint.x, point.y - startPoint.y) >=
          DRAG_START_DISTANCE_PX
      ) {
        beginDrag(point);
      }
      return;
    }

    if (
      stateRef.current === 'Drag' &&
      pointerId === primaryPointerIdRef.current
    ) {
      processPointerMove(point.x, point.y);
      return;
    }

    if (stateRef.current === 'DoubleDown') {
      const gestureState = classifyDoubleDown();
      if (gestureState) {
        transitionTo(gestureState);
        processGestureMove(element, gestureState);
      }
      return;
    }

    if (stateRef.current === 'Pinch' || stateRef.current === 'Pan') {
      processGestureMove(element, stateRef.current);
    }
  }

  function handlePointerEnd(pointerId: number) {
    const endingState = stateRef.current;
    activePointersRef.current.delete(pointerId);

    if (endingState === 'Down' && pointerId === primaryPointerIdRef.current) {
      endPointerMotion();
      primaryPointerIdRef.current = null;
      beginFirstTap('next');
      return;
    }

    if (endingState === 'Hold' && pointerId === primaryPointerIdRef.current) {
      endPointerMotion();
      primaryPointerIdRef.current = null;
      beginFirstTap('prev');
      return;
    }

    if (endingState === 'Drag') {
      transitionTo('Idle');
      return;
    }

    if (endingState === 'PageMoved') {
      transitionTo(
        activePointersRef.current.size === 0 ? 'Idle' : 'Wait',
      );
      return;
    }

    if (
      endingState === 'DoubleDown' ||
      endingState === 'Pinch' ||
      endingState === 'Pan'
    ) {
      transitionTo('Wait');
      if (activePointersRef.current.size === 0) {
        transitionTo('Idle');
      }
      return;
    }

    if (endingState === 'Wait' && activePointersRef.current.size === 0) {
      transitionTo('Idle');
    }
  }

  function handlePointerCancel(pointerId: number) {
    activePointersRef.current.delete(pointerId);
    transitionTo('Wait');
    if (activePointersRef.current.size === 0) {
      transitionTo('Idle');
    }
  }

  return (
    <div
      className={styles.trackpad}
      onPointerDown={event => {
        event.currentTarget.setPointerCapture(event.pointerId);
        handlePointerDown(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
      }}
      onPointerMove={event => {
        if (!activePointersRef.current.has(event.pointerId)) {
          return;
        }
        event.preventDefault();
        handlePointerMove(
          event.pointerId,
          {x: event.clientX, y: event.clientY},
          event.currentTarget,
        );
      }}
      onPointerUp={event => {
        handlePointerEnd(event.pointerId);
      }}
      onPointerCancel={event => {
        handlePointerCancel(event.pointerId);
      }}
      onPointerLeave={event => {
        if (
          event.buttons === 0 &&
          activePointersRef.current.has(event.pointerId)
        ) {
          handlePointerEnd(event.pointerId);
        }
      }}
    />
  );
}
