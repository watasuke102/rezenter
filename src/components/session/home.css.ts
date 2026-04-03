import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
  padding: '16px 12px',
  display: 'grid',
  gap: 12,
  margin: '0 auto',
});

export const panel = style({
  borderRadius: 2,
  padding: 8,
});

export const form = style({
  display: 'grid',
  gap: 12,
});

export const row = style({
  display: 'grid',
  gap: 4,
  marginBottom: 0,
});

export const switchRow = style({
  display: 'flex',
  gap: 6,
});

export const switchButton = style({
  padding: '6px 10px',
  fontSize: 13,
  lineHeight: 1,
  cursor: 'pointer',
});

export const switchButtonActive = style({
  color: '#282c34',
  backgroundColor: '#98c379',
  fontWeight: 'bold',
});

export const label = style({
  fontSize: 14,
});

export const input = style({
  width: '100%',
  border: '1px solid #abb2bf',
  borderRadius: 2,
  padding: '10px 12px',
  lineHeight: 1.2,
});

export const fileInput = style([
  input,
  {
    padding: 0,
    minHeight: 38,
    overflow: 'hidden',
    selectors: {
      '&::file-selector-button': {
        border: 'none',
        marginRight: 10,
        padding: '8px 10px',
        height: '100%',
        color: '#282c34',
        backgroundColor: '#abb2bf',
        cursor: 'pointer',
      },
    },
  },
]);

export const button = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  color: '#282c34',
  backgroundColor: '#98c379',
});

export const errorText = style({
  margin: 0,
  color: '#e06c75',
  fontSize: 14,
});

export const sessions = style({
  display: 'grid',
  gap: 10,
  marginTop: 12,
});

export const sessionItem = style({
  padding: '12px 14px',
  backgroundColor: '#282c34',
  display: 'grid',
  gap: 4,
  border: '1px solid #abb2bf',
  borderRadius: 2,
});

export const sessionLink = style({
  display: 'grid',
  gap: 5,
});

export const sessionActions = style({
  marginTop: 8,
  display: 'flex',
  justifyContent: 'flex-end',
});

export const deleteButton = style({
  border: '1px solid #e06c75',
  borderRadius: 2,
  backgroundColor: 'transparent',
  color: '#e06c75',
  padding: '6px 10px',
  lineHeight: 1,
  cursor: 'pointer',
});
