import {globalStyle, style} from '@vanilla-extract/css';

export const wrapper = style({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: 2,
  background: '#000',
});

export const fullscreen = style({border: 'none', borderRadius: 0});
export const navigable = style({position: 'relative'});

export const svg = style({
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
  background: '#000',
});

globalStyle(`${svg} > svg`, {
  width: '100%',
  height: '100%',
  display: 'block',
});

export const status = style({
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
  color: '#e8edf5',
  background: 'rgba(0, 0, 0, 0.28)',
  opacity: 0,
  transition: 'opacity 120ms ease-out',
  selectors: {
    '&:hover': {opacity: 1},
    '&:focus-visible': {opacity: 1},
  },
});

export const navLeft = style({left: 0});
export const navRight = style({right: 0});

export const concatenated = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'hidden',
});

export const croppedPage = style({
  position: 'relative',
  flex: '0 0 auto',
  width: '100%',
  overflow: 'hidden',
  background: '#fff',
});

export const croppedSvg = style({position: 'absolute'});

globalStyle(`${croppedSvg} > svg`, {
  width: '100%',
  height: '100%',
  display: 'block',
});
