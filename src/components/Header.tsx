import React from 'react';
import { League, Wallet } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  TrendingUp,
  Trophy,
  Wallet as WalletIcon,
  Users,
  Layers,
  ChevronRight
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'trade' | 'master' | 'wallets' | 'players';
  onSelectTab: (tab: 'trade' | 'master' | 'wallets' | 'players') => void;
  leagues: League[];
  activeLeagueId: string;
  onSelectLeague: (leagueId: string) => void;
  wallets: Wallet[];
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  leagues,
  activeLeagueId,
  onSelectLeague,
  wallets,
}) => {
  const activeLeague = leagues.find(l => l.id === activeLeagueId) || leagues[0];
  const activeWallet = wallets.find(w => w.id === activeLeague?.walletId);

  return (
    <header className="sticky top-0 z-40 bg-[#080a0f]/95 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & League / Division Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-black text-emerald-400 text-sm shadow-sm">
              📈
            </div>
            <div>
              <span className="font-black text-sm text-white tracking-wider">ATL</span>
              <span className="text-[10px] text-slate-500 font-mono ml-1.5 uppercase">Season 1</span>
            </div>
          </div>

          <div className="h-5 w-px bg-white/10 hidden sm:block"></div>

          {/* Division / League Selector Pills */}
          <div className="flex items-center gap-1 bg-[#111622] p-0.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
            {leagues.map(l => {
              const isSelected = l.id === activeLeagueId;
              const w = wallets.find(wl => wl.id === l.walletId);
              return (
                <button
                  key={l.id}
                  onClick={() => {
                    onSelectLeague(l.id);
                    if (currentTab !== 'trade') onSelectTab('trade');
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{l.divisionId === 'forex' ? '💱' : '🪙'}</span>
                  <span>{l.name}</span>
                  {w && (
                    <span className={`text-[10px] font-mono px-1 rounded ${
                      isSelected ? 'bg-slate-950/20 text-slate-950 font-bold' : 'text-slate-500'
                    }`}>
                      {formatCurrency(w.balance, w.currency)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Nav Items */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onSelectTab('trade')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'trade'
                ? 'bg-[#111622] text-white border border-[rgba(255,255,255,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp size={13} className={currentTab === 'trade' ? 'text-emerald-400' : ''} />
            <span>Trading Deck</span>
          </button>

          <button
            onClick={() => onSelectTab('master')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'master'
                ? 'bg-[#111622] text-white border border-[rgba(255,255,255,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy size={13} className={currentTab === 'master' ? 'text-amber-400' : ''} />
            <span>Master Standings</span>
          </button>

          <button
            onClick={() => onSelectTab('wallets')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'wallets'
                ? 'bg-[#111622] text-white border border-[rgba(255,255,255,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <WalletIcon size={13} className={currentTab === 'wallets' ? 'text-cyan-400' : ''} />
            <span>Wallets</span>
          </button>

          <button
            onClick={() => onSelectTab('players')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'players'
                ? 'bg-[#111622] text-white border border-[rgba(255,255,255,0.12)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users size={13} className={currentTab === 'players' ? 'text-purple-400' : ''} />
            <span>Players</span>
          </button>
        </div>
      </div>
    </header>
  );
};

