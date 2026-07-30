'use client';

import {useEffect, useRef, useState} from 'react';
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
  pointerX: number;
  pointerY: number;
  pointerVisible: boolean;
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
  pointerX,
  pointerY,
  pointerVisible,
  onPrev,
  onNext,
  onStartPause,
  onResetTimer,
}: Props) {
  const currentPreviewRef = useRef<HTMLDivElement | null>(null);
  const [currentPreviewSize, setCurrentPreviewSize] = useState({
    width: 0,
    height: 0,
  });
  const [currentSlideViewport, setCurrentSlideViewport] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const preview = currentPreviewRef.current;
    if (!preview) {
      return;
    }

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setCurrentPreviewSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });
    observer.observe(preview);

    return () => {
      observer.disconnect();
    };
  }, []);

  const currentSlideRect = (() => {
    if (
      !currentSlideViewport ||
      currentPreviewSize.width === 0 ||
      currentPreviewSize.height === 0
    ) {
      return null;
    }

    const slideAspect =
      currentSlideViewport.width / currentSlideViewport.height;
    const previewAspect = currentPreviewSize.width / currentPreviewSize.height;
    const width =
      previewAspect > slideAspect
        ? currentPreviewSize.height * slideAspect
        : currentPreviewSize.width;
    const height =
      previewAspect > slideAspect
        ? currentPreviewSize.height
        : currentPreviewSize.width / slideAspect;

    return {
      left: (currentPreviewSize.width - width) / 2,
      top: (currentPreviewSize.height - height) / 2,
      width,
      height,
    };
  })();

  return (
    <main className={styles.page}>
      <section className={styles.left}>
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitle}>Current</h2>
          <div ref={currentPreviewRef} className={styles.currentPreviewFrame}>
            <SlidePage
              source={slideSource}
              page={currentPage}
              totalPages={totalPages ?? undefined}
              className={styles.currentPreview}
              onViewportChange={setCurrentSlideViewport}
            />
            <div
              className={styles.pointer}
              style={{
                left: `${
                  (currentSlideRect?.left ?? currentPreviewSize.width / 2) +
                  ((pointerX + 1) / 2) * (currentSlideRect?.width ?? 0)
                }px`,
                top: `${
                  (currentSlideRect?.top ?? currentPreviewSize.height / 2) +
                  ((pointerY + 1) / 2) * (currentSlideRect?.height ?? 0)
                }px`,
                opacity: pointerVisible && currentSlideRect ? 1 : 0,
              }}
            />
          </div>
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
