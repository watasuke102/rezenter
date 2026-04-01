'use client';

import {PdfPageCanvas} from '@/components/pdf/PdfPageCanvas';
import * as styles from '@/components/presenter/presenter.css';

type Props = {
  pdfSrc: string;
  currentPage: number;
  nextPage: number;
  totalPagesText: string;
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
  totalPagesText,
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
      <section className={styles.left}>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Current</h2>
          <PdfPageCanvas
            src={pdfSrc}
            page={currentPage}
            className={styles.currentPreview}
          />
        </div>
        <div className={styles.pageNav}>
          <button type='button' className={styles.button} onClick={onPrev}>
            Prev
          </button>
          <span className={styles.pageInfo}>{totalPagesText}</span>
          <button type='button' className={styles.button} onClick={onNext}>
            Next
          </button>
        </div>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Next</h2>
          <PdfPageCanvas
            src={pdfSrc}
            page={nextPage}
            className={styles.nextPreview}
          />
        </div>
      </section>

      <section className={styles.right}>
        <div className={styles.timer}>{timerText}</div>
        <div className={styles.controls}>
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
          <h3 className={styles.subTitle}>Note</h3>
          <p className={styles.notes}>{noteText || 'No note for this page.'}</p>
        </div>
      </section>
    </main>
  );
}
