import {style} from '@vanilla-extract/css';

export const overlay = style({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
});

export const modal = style({
  backgroundColor: '#282c34',
  padding: '24px',
  borderRadius: '8px',
  border: '1px solid #abb2bf',
  minWidth: '320px',
  color: '#abb2bf',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

export const header = style({
  margin: 0,
  fontSize: '18px',
});

export const field = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
});

export const checkboxLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
});

export const inputGroup = style({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
});

export const numberInput = style({
  backgroundColor: '#1e2227',
  border: '1px solid #abb2bf',
  color: '#abb2bf',
  marginTop: 4,
  padding: 8,
  borderRadius: '4px',
  width: '100%',
  boxSizing: 'border-box',
});

export const buttonGroup = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
});

export const closeButton = style({
  backgroundColor: '#98c379',
  color: '#282c34',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
});
