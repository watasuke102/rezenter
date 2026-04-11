import {style} from '@vanilla-extract/css';

export const box = style({
  borderRadius: 2,
  display: 'grid',
  gap: 10,
});

export const fileInput = style({
  display: 'none',
});

export const button = style({
  justifySelf: 'start',
  border: 'none',
  borderRadius: 2,
  padding: '10px 14px',
  cursor: 'pointer',
  color: '#282c34',
  background: '#abb2bf',
  fontWeight: 700,
});
