import React from 'react';

export default function TopBar({ language, onLanguageChange, darkMode, onToggleDarkMode }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: darkMode ? '#1e293b' : '#2563eb',
      color: 'white',
      padding: '0.75rem 1.5rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderBottom: darkMode ? '2px solid #0f172a' : 'none'
    }}>
      <div>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: 'none',
            fontWeight: 'bold',
          }}
        >
          <option value="sk">🇸🇰 Slovensky</option>
          <option value="en">🇬🇧 English</option>
        </select>
      </div>

      <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
        {language === 'sk'
          ? 'Výpočet podľa prirodzenej operačnej sémantiky'
          : 'Evaluation via Natural Operational Semantics'}
      </div>

      <div>
        <label style={{ marginRight: '0.5rem' }}>
          {darkMode ? '🌙 Dark' : '☀️ Light'}
        </label>
        <button onClick={onToggleDarkMode} style={{
          padding: '0.25rem 0.5rem',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: darkMode ? '#334155' : '#ffffff',
          color: darkMode ? '#f8fafc' : '#0f172a',
          cursor: 'pointer'
        }}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </div>
  );
}
