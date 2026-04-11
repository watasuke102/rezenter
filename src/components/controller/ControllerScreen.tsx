'use client';

import {useState} from 'react';
import {PointerControl} from '@/components/controller/PointerControl';
import * as styles from '@/components/controller/ControllerScreen.css';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(false);
  const [fullScaleAdjustment, setFullScaleAdjustment] = useState(0);

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
