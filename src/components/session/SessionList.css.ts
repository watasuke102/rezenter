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
  gap: 8,
  border: '1px solid #abb2bf',
  borderRadius: 2,
});

export const sessionMeta = style({
  display: 'grid',
  gap: 5,
});

export const sessionLink = style({
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
});

export const sessionActions = style({
  marginTop: 8,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
});

export const pageLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  color: '#282c34',
  backgroundColor: '#98c379',
  border: 'none',
  borderRadius: 2,
  padding: '6px 10px',
  lineHeight: 1,
  textDecoration: 'none',
  cursor: 'pointer',
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
