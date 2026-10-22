'use client';

import React from 'react';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleLogout}
      title="End admin session"
      style={{
        background: 'none',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#94A3B8',
        padding: '5px 12px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'color 0.15s, border-color 0.15s',
      }}
    >
      Sign Out
    </button>
  );
}
