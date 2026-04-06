import {style} from '@vanilla-extract/css';

export const box = style({
  borderRadius: 2,
  padding: 18,
  display: 'grid',
});

export const textarea = style({
  width: '100%',
  border: '1px solid #3c4a5c',
  borderRadius: 2,
  padding: 10,
  marginBottom: 16,
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
