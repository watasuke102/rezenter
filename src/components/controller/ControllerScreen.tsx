'use client';

import {useEffect, useState} from 'react';
import {PointerControl} from '@/components/controller/PointerControl';
import * as styles from '@/components/controller/ControllerScreen.css';
import {useViewerSettings} from '@/lib/useViewerSettings';

type Props = {
  sessionId: string;
};

export function ControllerScreen({sessionId}: Props) {
  const [pointerMode, setPointerMode] = useState(true);
  const [fullScaleAdjustment, setFullScaleAdjustment] = useState(0);
  const [disableScaleReset, setDisableScaleReset] = useState(false);
  const [slideImageSize, setSlideImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const {settings} = useViewerSettings(sessionId);

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
          session?: {
            disableScaleResetOnPageChange?: boolean;
            pdfSrc?: string;
            slideKind?: 'pdf' | 'svg';
            svgPageBaseUrl?: string;
            totalPages?: number;
          };
        };

        if (cancelled || !payload.session) {
          return;
        }

        if (
          typeof payload.session.disableScaleResetOnPageChange === 'boolean'
        ) {
          setDisableScaleReset(payload.session.disableScaleResetOnPageChange);
        }

        if (
          payload.session.slideKind === 'svg' &&
          payload.session.svgPageBaseUrl
        ) {
          const {getSvgPage} = await import('@/components/svg/svg-page');
          const page = await getSvgPage(payload.session.svgPageBaseUrl, 0);
          const totalPages = payload.session.totalPages || 1;
          setSlideImageSize({
            width: page.width,
            height: page.height * (settings.concatenatedMode ? totalPages : 1),
          });
        } else if (payload.session.pdfSrc) {
          const {getRenderedPage} =
            await import('@/components/pdf/PdfPageCanvas');
          const page = await getRenderedPage(payload.session.pdfSrc, 1);
          const totalPages = payload.session.totalPages || 1;
          setSlideImageSize({
            width: page.width,
            height: page.height * (settings.concatenatedMode ? totalPages : 1),
          });
        }
      } catch {
        // ignore transient load failures
      }
    }

    void loadSessionSetting();
    return () => {
      cancelled = true;
    };
  }, [sessionId, settings.concatenatedMode]);

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
            pdfImageSize={slideImageSize}
            onSlide={slide}
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
