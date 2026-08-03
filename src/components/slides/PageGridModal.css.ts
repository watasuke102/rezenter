import {style} from '@vanilla-extract/css';

export const backdrop = style({
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  display: 'grid',
  background: 'rgba(40, 44, 52, 0.96)',
});

export const hidden = style({
  display: 'none',
});

export const grid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(var(--page-grid-columns), minmax(0, 1fr))',
  gridAutoFlow: 'row',
  gridAutoRows: 'max-content',
  alignItems: 'start',
  gap: 12,
  padding: 24,
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
});

export const pageButton = style({
  position: 'relative',
  display: 'block',
  width: '100%',
  aspectRatio: '16 / 9',
  minWidth: 0,
  minHeight: 0,
  padding: 0,
  overflow: 'hidden',
  isolation: 'isolate',
  border: '2px solid #abb2bf',
  borderRadius: 2,
  background: '#282c34',
});

export const currentPageButton = style({
  borderColor: '#98c379',
});

export const pageNumber = style({
  position: 'absolute',
  right: 4,
  bottom: 4,
  zIndex: 1,
  minWidth: 24,
  background: '#282c34',
  color: '#abb2bf',
  fontVariantNumeric: 'tabular-nums',
});
