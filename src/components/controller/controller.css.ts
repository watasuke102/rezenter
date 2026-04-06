import {style} from '@vanilla-extract/css';

export const body = style({
  margin: 0,
  width: '100dvw',
  height: '100dvh',
  display: 'grid',
  gridTemplateRows: '60px 1fr',
  gap: 12,
  padding: 10,
  background: '#1a1a1a',
});

export const button = style({
  width: '100%',
  height: '100%',
  border: 'none',
  borderRadius: 2,
  cursor: 'pointer',
  fontSize: '1.4rem',
  fontWeight: 700,
});

export const primary = style({
  color: '#282c34',
  background: '#98c379',
});

export const secondary = style({
  color: '#abb2bf',
  background: '#282c34',
});

export const normal = style({
  display: 'grid',
  gridTemplateRows: '1fr 1fr',
  gap: 12,
});

export const pointer = style({
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
  gap: 8,
});

export const controls = style({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gap: 8,
  alignItems: 'center',
  color: '#abb2bf',
});

export const trackpad = style({
  width: '100%',
  height: '100%',
  background: '#98c379',
  border: '1px solid #344255',
  borderRadius: 2,
  touchAction: 'none',
});
