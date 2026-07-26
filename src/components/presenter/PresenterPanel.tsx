'use client';

import {ChevronLeft, ChevronRight, Pause, Play, RotateCcw} from 'lucide-react';
import {SlidePage, type SlideSource} from '@/components/slides/SlidePage';
import {NoteImportForm} from '@/components/session/NoteImportForm';
import * as styles from '@/components/presenter/presenter.css';

type Props = {
  sessionId: string;
  slideSource: SlideSource;
  currentPage: number;
  nextPage: number;
  totalPages: number | null;
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
  sessionId,
  slideSource,
  currentPage,
  nextPage,
  totalPages,
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
          <SlidePage
            source={slideSource}
            page={currentPage}
            totalPages={totalPages ?? undefined}
            className={styles.currentPreview}
          />
        </div>
        <div className={styles.pageNav}>
          <button
            type='button'
            className={styles.iconButton}
            onClick={onPrev}
            aria-label='Previous page'
          >
            <ChevronLeft size={20} aria-hidden='true' />
          </button>
          <span className={styles.pageInfo}>{totalPagesText}</span>
          <button
            type='button'
            className={styles.iconButton}
            onClick={onNext}
            aria-label='Next page'
          >
            <ChevronRight size={20} aria-hidden='true' />
          </button>
        </div>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Next</h2>
          <SlidePage
            source={slideSource}
            page={nextPage}
            totalPages={totalPages ?? undefined}
            className={styles.nextPreview}
          />
        </div>
      </section>

      <section className={styles.right}>
        <div className={styles.timer}>{timerText}</div>
        <div className={styles.controls}>
          <button
            type='button'
            className={`${styles.iconButton} ${styles.secondary}`}
            onClick={onStartPause}
            aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {timerRunning ? (
              <Pause size={18} aria-hidden='true' />
            ) : (
              <Play size={18} aria-hidden='true' />
            )}
          </button>
          <button
            type='button'
            className={`${styles.iconButton} ${styles.secondary}`}
            onClick={onResetTimer}
            aria-label='Reset timer'
          >
            <RotateCcw size={18} aria-hidden='true' />
          </button>
        </div>
        <div>
          <h3 className={styles.subTitle}>Note</h3>
          <p className={styles.notes}>{noteText || 'No note for this page.'}</p>
        </div>
        <NoteImportForm sessionId={sessionId} />
      </section>
    </main>
  );
}
