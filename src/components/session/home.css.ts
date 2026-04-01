import {style} from '@vanilla-extract/css';

export const page = style({
  minHeight: '100dvh',
  padding: '32px 20px',
  display: 'grid',
  gap: 24,
  maxWidth: 980,
  margin: '0 auto',
});

export const hero = style({
  display: 'grid',
  gap: 8,
});

export const title = style({
  margin: 0,
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  color: '#f0f6ff',
});

export const subtitle = style({
  margin: 0,
  color: '#aeb8c5',
});

export const panel = style({
  border: '1px solid #2f3a47',
  borderRadius: 2,
  background: 'rgba(21, 27, 35, 0.88)',
  padding: 18,
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
  border: '1px solid #3c4a5c',
  borderRadius: 2,
  background: '#10161d',
  color: '#c6cfda',
  padding: '6px 10px',
  fontSize: 13,
  lineHeight: 1,
  cursor: 'pointer',
});

export const switchButtonActive = style({
  background: '#2f5d8a',
  color: '#ecf4ff',
  borderColor: '#2f5d8a',
});

export const label = style({
  fontSize: 14,
  color: '#c6cfda',
});

export const input = style({
  width: '100%',
  border: '1px solid #3c4a5c',
  borderRadius: 2,
  padding: '10px 12px',
  background: '#0f141b',
  color: '#e7edf2',
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
        borderRight: '1px solid #3c4a5c',
        marginRight: 10,
        padding: '8px 10px',
        height: '100%',
        background: '#18222f',
        color: '#dbe7f4',
        cursor: 'pointer',
      },
    },
  },
]);

export const button = style({
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 38,
  border: 'none',
  borderRadius: 2,
  padding: '8px 14px',
  lineHeight: 1,
  fontWeight: 700,
  background: '#2f5d8a',
  color: '#ecf4ff',
  cursor: 'pointer',
});

export const errorText = style({
  margin: 0,
  color: '#ffb4b4',
  fontSize: 14,
});

export const sessions = style({
  display: 'grid',
  gap: 10,
});

export const sessionItem = style({
  border: '1px solid #3a4554',
  borderRadius: 2,
  padding: '12px 14px',
  background: 'rgba(17, 22, 29, 0.8)',
  display: 'grid',
  gap: 5,
});
