import {style} from '@vanilla-extract/css';

export const page = style({
  position: 'fixed',
  inset: 0,
  background: '#0b0f14',
  margin: 0,
  padding: 0,
});

export const slide = style({
  position: 'absolute',
  inset: 0,
});

export const pointer = style({
  position: 'absolute',
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'rgba(255, 77, 41, 0.9)',
  border: '2px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 0 12px rgba(255, 77, 41, 0.7)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
});
