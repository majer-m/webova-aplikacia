import React from 'react';

export default function HelpSection({ language }) {
  const isSk = language === 'sk';

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>🛈 {isSk ? 'Nápoveda' : 'Help'}</h3>

      <details open>
        <summary><strong>{isSk ? 'Aritmetické výrazy' : 'Arithmetic expressions'}</strong></summary>
        <ul>
          <li>
            {isSk
              ? 'Zápis výrazov ako '
              : 'Write expressions like '}
            <code>((x - y) * 3) + 2</code>
          </li>
          <li>
            {isSk
              ? 'Podporované operátory:'
              : 'Supported operators:'}{' '}
            <code>+</code>, <code>-</code>, <code>*</code>
          </li>
          <li>
            {isSk
              ? 'Premenné definuj pomocou '
              : 'Define variables like '}
            <code>x=5,y=2</code>
          </li>
        </ul>
      </details>

      <details>
        <summary><strong>{isSk ? 'Booleovské výrazy' : 'Boolean expressions'}</strong></summary>
        <ul>
          <li>
            {isSk ? 'Logické konštanty:' : 'Logical constants:'}{' '}
            <code>true</code>, <code>false</code>
          </li>
          <li>
            {isSk ? 'Operátory:' : 'Operators:'}{' '}
            <code>=</code>, <code>&le;</code>, <code>∧</code>, <code>¬</code>
          </li>
          <li>
            {isSk ? 'Príklad:' : 'Example:'}{' '}
            <code>!(x = y) ∧ true</code>
          </li>
        </ul>
      </details>
    </div>
  );
}
