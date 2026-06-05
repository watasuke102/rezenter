'use client';

import {useEffect, useState} from 'react';
import {PointerControl} from '@/components/controller/PointerControl';
import * as styles from '@/components/controller/ControllerScreen.css';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(false);
  const [fullScaleAdjustment, setFullScaleAdjustment] = useState(0);
  const [disableScaleReset, setDisableScaleReset] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSessionSetting() {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`, {
          cache: 'no-store',
        });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          session?: {disableScaleResetOnPageChange?: boolean};
        };
        if (
          !cancelled &&
          typeof payload.session?.disableScaleResetOnPageChange === 'boolean'
        ) {
          setDisableScaleReset(payload.session.disableScaleResetOnPageChange);
        }
      } catch {
        // ignore transient load failures
      }
    }

    void loadSessionSetting();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function setScaleResetDisabled(disable: boolean) {
    const previous = disableScaleReset;
    setDisableScaleReset(disable);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({disableScaleResetOnPageChange: disable}),
      });
      if (!response.ok) {
        setDisableScaleReset(previous);
      }
    } catch {
      setDisableScaleReset(previous);
    }
  }

  async function slide(action: 'next' | 'prev') {
    await fetch(`/api/sessions/${sessionId}/slide`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify({action}),
    });
  }

  return (
    <main className={styles.body}>
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
          <div className={styles.controlsPanel}>
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
            <label className={styles.scaleResetToggle}>
              <input
                type='checkbox'
                checked={disableScaleReset}
                onChange={event => {
                  void setScaleResetDisabled(event.currentTarget.checked);
                }}
              />
              Disable scale reset on page change
            </label>
          </div>
          <PointerControl
            sessionId={sessionId}
            fullScaleAdjustment={fullScaleAdjustment}
          />
        </div>
      )}
      <button
        className={`${styles.button} ${styles.secondary}`}
        type='button'
        onClick={() => {
          setPointerMode(prev => {
            return !prev;
          });
        }}
      >
        {pointerMode ? 'Button Mode' : 'Pointer Mode'}
      </button>
    </main>
  );
}
