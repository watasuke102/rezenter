import {style} from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  pointerEvents: 'none',
  zIndex: 1000,
});

export const modal = style({
  minWidth: '4ch',
  padding: '20px 28px',
  border: '1px solid #abb2bf',
  borderRadius: 2,
  backgroundColor: '#282c34',
  color: '#abb2bf',
  fontSize: 'clamp(3rem, 10vw, 6rem)',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1,
  textAlign: 'center',
});
