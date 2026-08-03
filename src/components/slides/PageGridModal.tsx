'use client';

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import {SlidePage, type SlideSource} from '@/components/slides/SlidePage';
import * as styles from '@/components/slides/PageGridModal.css';

type Props = {
  source: SlideSource;
  currentPage: number;
  totalPages: number;
  onSelectPage: (page: number) => void;
};

const MIN_COLUMNS = 2;
const MAX_COLUMNS = 10;

type PageGridItemProps = {
  source: SlideSource;
  page: number;
  totalPages: number;
  isCurrent: boolean;
  currentPageRef?: RefObject<HTMLButtonElement | null>;
  onSelectPage: (page: number) => void;
};

const PageGridItem = memo(
  function PageGridItem({
    source,
    page,
    totalPages,
    isCurrent,
    currentPageRef,
    onSelectPage,
  }: PageGridItemProps) {
    return (
      <button
        ref={currentPageRef}
        type='button'
        className={`${styles.pageButton} ${
          isCurrent ? styles.currentPageButton : ''
        }`.trim()}
        aria-label={`${page + 1}ページへ移動`}
        aria-current={isCurrent ? 'page' : undefined}
        onClick={() => onSelectPage(page)}
      >
        <SlidePage source={source} page={page} totalPages={totalPages} />
        <span className={styles.pageNumber}>{page + 1}</span>
      </button>
    );
  },
  (previous, next) => {
    if (previous.source.kind !== next.source.kind) {
      return false;
    }
    if (previous.source.kind === 'pdf') {
      if (
        next.source.kind !== 'pdf' ||
        previous.source.src !== next.source.src
      ) {
        return false;
      }
    } else if (
      next.source.kind !== 'svg' ||
      previous.source.baseUrl !== next.source.baseUrl
    ) {
      return false;
    }

    return (
      previous.page === next.page &&
      previous.totalPages === next.totalPages &&
      previous.isCurrent === next.isCurrent &&
      previous.currentPageRef === next.currentPageRef &&
      previous.onSelectPage === next.onSelectPage
    );
  },
);

export function PageGridModal({
  source,
  currentPage,
  totalPages,
  onSelectPage,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [columns, setColumns] = useState(4);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const currentPageRef = useRef<HTMLButtonElement | null>(null);
  const onSelectPageRef = useRef(onSelectPage);

  const selectPage = useCallback((page: number) => {
    setIsOpen(false);
    onSelectPageRef.current(page);
  }, []);

  useEffect(() => {
    onSelectPageRef.current = onSelectPage;
  }, [onSelectPage]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const isEditable =
        tagName === 'input' ||
        tagName === 'textarea' ||
        tagName === 'select' ||
        target?.isContentEditable;
      if (isEditable) {
        return;
      }

      if (event.code === 'Space' && !event.repeat) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsOpen(open => !open);
        return;
      }
      if (!isOpen) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setIsOpen(false);
        return;
      }
      if (event.ctrlKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setColumns(value => Math.max(MIN_COLUMNS, value - 1));
        return;
      }
      if (event.ctrlKey && event.key === '-') {
        event.preventDefault();
        event.stopImmediatePropagation();
        setColumns(value => Math.min(MAX_COLUMNS, value + 1));
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }

    window.addEventListener('keydown', onKeyDown, {capture: true});
    return () => {
      window.removeEventListener('keydown', onKeyDown, {capture: true});
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    dialogRef.current?.focus({preventScroll: true});
    const frame = window.requestAnimationFrame(() => {
      currentPageRef.current?.scrollIntoView({
        block: 'center',
        inline: 'center',
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [columns, currentPage, isOpen]);

  return (
    <div
      ref={dialogRef}
      className={`${styles.backdrop} ${isOpen ? '' : styles.hidden}`.trim()}
      role='dialog'
      aria-modal={isOpen ? 'true' : undefined}
      aria-hidden={!isOpen}
      aria-label='ページ一覧'
      tabIndex={-1}
    >
      <div
        className={styles.grid}
        style={{'--page-grid-columns': columns} as CSSProperties}
      >
        {Array.from({length: totalPages}, (_, page) => {
          const isCurrent = page === currentPage;
          return (
            <PageGridItem
              key={page}
              source={source}
              page={page}
              totalPages={totalPages}
              isCurrent={isCurrent}
              currentPageRef={isCurrent ? currentPageRef : undefined}
              onSelectPage={selectPage}
            />
          );
        })}
      </div>
    </div>
  );
}
