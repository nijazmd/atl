import React, { useState } from 'react';
import { Player, Team, Trade } from '../types';
import { calculatePlayerStats, formatCurrency, formatPercent } from '../utils/calculations';
import { Search, Trophy, ShieldAlert, TrendingUp } from 'lucide-react';

interface PlayersDirectoryProps {
  players: Player[];
  teams: Team[];
  trades: Trade[];
  onSelectPlayer: (playerId: string) => void;
}

export const PlayersDirectory: React.FC<PlayersDirectoryProps> = ({
  players,
  teams,
  trades,
  onSelectPlayer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');

  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeamFilter === 'ALL' || p.teamId === selectedTeamFilter;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-4">
      {/* Search & Team Filter Bar */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search trader..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.08)] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedTeamFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedTeamFilter === 'ALL'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-[#0c0f17] text-slate-400 hover:text-white border border-[rgba(255,255,255,0.06)]'
            }`}
          >
            All
          </button>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamFilter(t.id)}
              className={`px-2 py-1 rounded-md text-xs font-semibold font-mono transition-all ${
                selectedTeamFilter === t.id
                  ? 'bg-white text-slate-950 font-bold'
                  : 'bg-[#0c0f17] text-slate-400 hover:text-white border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              {t.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredPlayers.map(player => {
          const team = teams.find(t => t.id === player.teamId);
          const stats = calculatePlayerStats(player.id, trades, players);

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player.id)}
              className="p-3.5 rounded-xl bg-[#111622] border border-[rgba(255,255,255,0.08)] hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: team?.primaryColor || '#8B5CF6' }}
                  >
                    {player.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{player.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {team?.name || player.teamId}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className={`text-xs font-bold ${stats.totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(stats.totalPnlPercent)}
                  </span>
                  <div className="text-[10px] text-slate-500">{formatCurrency(stats.totalPnlAmount)}</div>
                </div>
              </div>

              {/* Mini Stats Bar */}
              <div className="grid grid-cols-3 gap-1 bg-[#0c0f17] p-2 rounded-lg text-center font-mono text-[10px] border border-[rgba(255,255,255,0.04)]">
                <div>
                  <span className="text-slate-500 block">Trades</span>
                  <span className="text-white font-semibold">{stats.totalTrades}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Win%</span>
                  <span className="text-white font-semibold">{stats.winRate}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Risky</span>
                  <span className={stats.riskyTradesCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                    {stats.riskyTradesCount}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

