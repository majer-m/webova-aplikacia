import React from 'react';

export default function HelpModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginTop: 0 }}>🛈 Nápoveda</h3>
        <button onClick={onClose} style={closeBtnStyle}>✕</button>
        
        <div style={tabContainer}>
          <details open>
            <summary><strong>Aritmetické výrazy</strong></summary>
            <ul>
              <li>Zápis výrazov ako <code>((x - y) * 3) + 2</code></li>
              <li>Podporované operátory: <code>+</code>, <code>-</code>, <code>*</code>, <code>/</code>, <code>%</code></li>
              <li>Premenné definuj pomocou <code>x=5,y=2</code></li>
            </ul>
          </details>

          <details>
            <summary><strong>Booleovské výrazy</strong></summary>
            <ul>
              <li>Logické konštanty: <code>true</code>, <code>false</code></li>
              <li>Operátory: <code>=</code>, <code>==</code>, <code>&lt;</code>, <code>&gt;</code>, <code>&lt;=</code>, <code>&gt;=</code>, <code>∧</code>, <code>∨</code>, <code>¬</code></li>
              <li>Príklad: <code>!(x = y) ∧ true</code></li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}


const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalStyle = {
  background: 'white',
  padding: '2rem',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '500px',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
};

const closeBtnStyle = {
  position: 'absolute',
  top: '1rem',
  right: '1rem',
  background: 'transparent',
  border: 'none',
  fontSize: '18px',
  cursor: 'pointer',
};

const tabContainer = {
  marginTop: '1rem',
};