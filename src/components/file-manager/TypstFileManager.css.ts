import {style} from '@vanilla-extract/css';

export const manager = style({
  overflow: 'hidden',
  border: '1px solid #4b5361',
  borderRadius: 4,
  background: '#21252b',
});

export const toolbar = style({
  display: 'flex',
  gap: 6,
  padding: 8,
  borderBottom: '1px solid #3e4451',
  background: '#2c313a',
});

export const iconButton = style({
  flex: '0 0 auto',
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: '1px solid #545d6b',
  background: '#353b45',
  selectors: {
    '&:hover:not(:disabled)': {background: '#454d59'},
    '&:disabled': {opacity: 0.35, cursor: 'default'},
  },
});

export const pathForm = style({flex: 1, minWidth: 0});

export const pathInput = style({
  width: '100%',
  height: 34,
  padding: '0 10px',
  border: '1px solid #545d6b',
  borderRadius: 2,
  color: '#d7dae0',
  background: '#1b1e23',
  fontFamily: 'monospace',
});

export const content = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(130px, 0.32fr) minmax(0, 1fr)',
  height: 320,
  minHeight: 0,
  overflow: 'hidden',
  '@media': {
    '(max-width: 700px)': {
      gridTemplateColumns: '1fr',
      gridTemplateRows: 'minmax(90px, 0.35fr) minmax(0, 1fr)',
      height: 420,
    },
  },
});

export const favorites = style({
  minHeight: 0,
  padding: 8,
  overflowY: 'auto',
  borderRight: '1px solid #3e4451',
  background: '#282c34',
  '@media': {
    '(max-width: 700px)': {
      maxHeight: 130,
      borderRight: 0,
      borderBottom: '1px solid #3e4451',
    },
  },
});

export const asideTitle = style({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '2px 6px 7px',
  color: '#c6cad1',
  fontSize: 12,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
});

export const empty = style({margin: '6px', color: '#7f8794', fontSize: 12});

export const favoriteRow = style({
  display: 'flex',
  alignItems: 'center',
  borderRadius: 2,
  selectors: {'&:hover': {background: '#343a44'}},
});

export const favoritePath = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px',
  textAlign: 'left',
  background: 'transparent',
});

export const favoriteName = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const removeFavorite = style({
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  color: '#89919e',
  background: 'transparent',
});

export const fileList = style({
  minHeight: 0,
  padding: 7,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
});

export const entry = style({
  display: 'flex',
  alignItems: 'center',
  minHeight: 36,
  borderRadius: 2,
  selectors: {'&:hover': {background: '#323842'}},
});

export const entrySelected = style({
  color: '#d9edc7',
  background: 'rgba(152, 195, 121, 0.18)',
  outline: '1px solid rgba(152, 195, 121, 0.55)',
});

export const entryMain = style({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  padding: '7px 9px',
  textAlign: 'left',
  background: 'transparent',
});

export const entryFavorite = style({
  width: 34,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  color: '#69717e',
  background: 'transparent',
});

export const favoriteActive = style({color: '#e5c07b'});

export const status = style({margin: 12, color: '#8f98a6', fontSize: 13});
export const error = style({margin: 12, color: '#e06c75', fontSize: 13});

export const selection = style({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 48,
  padding: '7px 9px',
  borderBottom: '1px solid #3e4451',
  background: '#2c313a',
});

export const selectionLabel = style({
  flex: '0 0 auto',
  color: '#8f98a6',
  fontSize: 12,
});

export const selectionPath = style({
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  color: '#d7dae0',
  fontFamily: 'monospace',
  fontSize: 12,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
