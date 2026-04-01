import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
  maxWidth: 980,
  margin: '0 auto',
  padding: 24,
  display: 'grid',
  gap: 18,
});

export const box = style({
  border: '1px solid #2f3a47',
  borderRadius: 2,
  background: 'rgba(21, 27, 35, 0.88)',
  padding: 18,
  display: 'grid',
  gap: 10,
});

export const links = style({
  display: 'grid',
  gap: 8,
});

export const link = style({
  borderRadius: 2,
  padding: '10px 12px',
  border: '1px solid #3a4554',
  background: '#10161d',
});

export const textarea = style({
  width: '100%',
  minHeight: 140,
  border: '1px solid #3c4a5c',
  borderRadius: 2,
  padding: 10,
  background: '#0f141b',
  color: '#e7edf2',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
});

export const button = style({
  justifySelf: 'start',
  border: 'none',
  borderRadius: 2,
  padding: '10px 14px',
  cursor: 'pointer',
  color: '#ecf4ff',
  background: '#2f5d8a',
  fontWeight: 700,
});
