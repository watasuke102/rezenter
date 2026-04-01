import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
  padding: 16,
  background: '#0f1315',
  color: '#e8ecef',
  display: 'grid',
  gridTemplateRows: '1fr auto',
  gap: 16,
});

export const slides = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 12,
  minHeight: 0,
  '@media': {
    '(max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const section = style({
  display: 'grid',
  gap: 10,
});

export const panel = style({
  border: '1px solid #35424c',
  borderRadius: 2,
  background: '#141b23',
  padding: 12,
  display: 'grid',
  gap: 10,
});

export const timer = style({
  fontSize: '2rem',
  fontWeight: 700,
  letterSpacing: 1,
});

export const controls = style({
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
});

export const button = style({
  border: 'none',
  borderRadius: 2,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  background: '#2f5d8a',
  color: '#ecf4ff',
});

export const secondary = style({
  background: '#2a3543',
  color: '#dfe8f3',
});

export const notes = style({
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
  minHeight: 80,
});
