import {style} from '@vanilla-extract/css';

export const wrapper = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  borderRadius: 2,
  overflow: 'hidden',
  background: '#0d1117',
  border: '1px solid rgba(255, 255, 255, 0.14)',
});

export const wrapperFullscreen = style({
  borderRadius: 0,
  border: 'none',
});

export const canvas = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  background: '#111822',
});

export const loading = style({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#c7d2df',
  fontSize: 14,
});
