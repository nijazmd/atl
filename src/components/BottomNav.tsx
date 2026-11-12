import React from 'react';

interface BottomNavProps {
  active: 'trade' | 'standings' | 'wallets' | 'players';
  onChange: (tab: 'trade' | 'standings' | 'wallets' | 'players') => void;
}

const tabs = [
  { id: 'trade',     icon: '📊', label: 'Trade'     },
  { id: 'standings', icon: '🏆', label: 'Standings'  },
  { id: 'wallets',   icon: '💰', label: 'Wallets'    },
  { id: 'players',   icon: '👤', label: 'Players'    },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => (
  <nav className="bottom-nav">
    {tabs.map(t => (
      <button
        key={t.id}
        className={`nav-item ${active === t.id ? 'active' : ''}`}
        onClick={() => onChange(t.id)}
      >
        <span className="nav-icon">{t.icon}</span>
        <span className="nav-label">{t.label}</span>
      </button>
    ))}
  </nav>
);
