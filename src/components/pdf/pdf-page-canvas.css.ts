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

export const wrapperNavigable = style({
  position: 'relative',
});

export const canvas = style({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  background: '#000',
});

export const loading = style({
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#c7d2df',
  fontSize: 14,
});

export const navButton = style({
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 72,
  display: 'grid',
  placeItems: 'center',
  border: 'none',
  background: 'rgba(0, 0, 0, 0.28)',
  color: '#e8edf5',
  cursor: 'pointer',
  opacity: 0,
  transition: 'opacity 120ms ease-out',
  fontSize: 28,
  lineHeight: 1,
  selectors: {
    '&:hover': {
      opacity: 1,
    },
    '&:focus-visible': {
      opacity: 1,
    },
  },
});

export const navLeft = style({
  left: 0,
});

export const navRight = style({
  right: 0,
});
