import {style} from '@vanilla-extract/css';

export const page = style({
  height: '100dvh',
  padding: 16,
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
  gap: 16,
  overflow: 'hidden',
  '@media': {
    '(max-width: 980px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
  },
});

export const left = style({
  display: 'grid',
  gridTemplateRows: 'minmax(0, 1fr) auto minmax(0, 1fr)',
  gap: 12,
  minHeight: 0,
  overflow: 'hidden',
});

export const previewSection = style({
  display: 'grid',
  gridTemplateRows: 'auto minmax(0, 1fr)',
  gap: 10,
  minHeight: 0,
  overflow: 'hidden',
});

export const sectionTitle = style({
  margin: 0,
  lineHeight: 1.2,
});

export const currentPreview = style({
  minHeight: 0,
  overflow: 'hidden',
  border: '2px solid #98c379',
  borderRadius: 2,
});

export const currentPreviewFrame = style({
  position: 'relative',
  minHeight: 0,
  overflow: 'hidden',
});

export const pointer = style({
  position: 'absolute',
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: 'rgba(255, 40, 20, 0.75)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 0 12px rgba(255, 40, 20, 0.55)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
  zIndex: 2,
});

export const nextPreview = style({
  minHeight: 0,
  overflow: 'hidden',
  border: '2px solid #abb2bf',
  borderRadius: 2,
});

export const pageNav = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  paddingBlock: 4,
});

export const pageInfo = style({
  minWidth: 110,
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
});

export const right = style({
  borderRadius: 2,
  padding: 12,
  display: 'grid',
  gridTemplateRows: 'auto auto minmax(0, 1fr)',
  gap: 10,
  minHeight: 0,
  overflow: 'hidden',
});

export const subTitle = style({
  margin: 0,
  lineHeight: 1.2,
});

export const timer = style({
  fontSize: '3rem',
  fontWeight: 'bold',
  letterSpacing: 1,
});

export const controls = style({
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
});

const button = style({
  border: 'none',
  borderRadius: 2,
  padding: '8px 14px',
  cursor: 'pointer',
  fontWeight: 700,
  background: '#98c379',
  color: '#282c34',
});

export const iconButton = style([
  button,
  {
    width: 36,
    height: 36,
    padding: 0,
    display: 'grid',
    placeItems: 'center',
  },
]);

export const secondary = style({
  color: '#282c34',
  backgroundColor: '#abb2bf',
});

export const notes = style({
  margin: 0,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
  minHeight: 0,
  overflow: 'auto',
});
