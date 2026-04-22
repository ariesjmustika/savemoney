'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ width: '40px', height: '40px' }} />;

  return (
    <button
      onClick={toggleTheme}
      className="glass-card"
      style={{
        padding: '8px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '1px solid var(--border)',
        fontSize: '1.2rem',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
