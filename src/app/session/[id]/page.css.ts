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
