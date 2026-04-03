import {style} from '@vanilla-extract/css';

export const page = style({
  height: '100dvh',
  padding: 16,
  background: '#0f1315',
  color: '#e8ecef',
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
});

export const nextPreview = style({
  minHeight: 0,
  overflow: 'hidden',
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
  color: '#d9e2ee',
  fontVariantNumeric: 'tabular-nums',
});

export const right = style({
  border: '1px solid #35424c',
  borderRadius: 2,
  background: '#141b23',
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
  fontSize: '2rem',
  fontWeight: 700,
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
  background: '#2f5d8a',
  color: '#ecf4ff',
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
  background: '#2a3543',
  color: '#dfe8f3',
});

export const notes = style({
  margin: 0,
  whiteSpace: 'pre-wrap',
  lineHeight: 1.5,
  minHeight: 0,
  overflow: 'auto',
});
