'use client';

import {PdfPageCanvas} from '@/components/pdf/PdfPageCanvas';
import * as styles from '@/components/presenter/presenter.css';

type Props = {
  pdfSrc: string;
  currentPage: number;
  nextPage: number;
  timerText: string;
  timerRunning: boolean;
  noteText: string;
  onPrev: () => void;
  onNext: () => void;
  onStartPause: () => void;
  onResetTimer: () => void;
};

export function PresenterPanel({
  pdfSrc,
  currentPage,
  nextPage,
  timerText,
  timerRunning,
  noteText,
  onPrev,
  onNext,
  onStartPause,
  onResetTimer,
}: Props) {
  return (
    <main className={styles.page}>
      <section className={styles.slides}>
        <div className={styles.section}>
          <h2>Current</h2>
          <PdfPageCanvas src={pdfSrc} page={currentPage} />
        </div>
        <div className={styles.section}>
          <h2>Next</h2>
          <PdfPageCanvas src={pdfSrc} page={nextPage} />
        </div>
      </section>

      <section className={styles.panel}>
        <div className={styles.timer}>{timerText}</div>
        <div className={styles.controls}>
          <button type='button' className={styles.button} onClick={onPrev}>
            Prev
          </button>
          <button type='button' className={styles.button} onClick={onNext}>
            Next
          </button>
          <button
            type='button'
            className={`${styles.button} ${styles.secondary}`}
            onClick={onStartPause}
          >
            {timerRunning ? 'Pause' : 'Start'}
          </button>
          <button
            type='button'
            className={`${styles.button} ${styles.secondary}`}
            onClick={onResetTimer}
          >
            Reset Timer
          </button>
        </div>
        <div>
          <h3>Note</h3>
          <p className={styles.notes}>{noteText || 'No note for this page.'}</p>
        </div>
      </section>
    </main>
  );
}
