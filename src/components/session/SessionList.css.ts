import {style} from '@vanilla-extract/css';

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

export const errorText = style({
  margin: 0,
  color: '#e06c75',
  fontSize: 14,
});
