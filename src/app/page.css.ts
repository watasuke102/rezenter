import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
  padding: '16px 12px',
  display: 'grid',
  gap: 12,
  margin: '0 auto',
});

export const panel = style({
  borderRadius: 2,
  padding: 8,
});
