import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
});

export const box = style({
  borderRadius: 2,
  padding: 18,
});

export const info = style({
  display: 'grid',
  gridTemplateColumns: 'max-content 1fr',
  gap: '8px 16px',
  marginBottom: 12,
});

export const links = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
});

export const link = style({
  borderRadius: 2,
  paddingBlock: 4,
  textAlign: 'center',
  color: '#282c34',
  backgroundColor: '#98c379',
});
