import React, { useState } from 'react';
import { Player, Team, Trade, League } from '../types';
import { calculatePlayerStats, formatCurrency, formatPercent, formatDuration } from '../utils/calculations';
import { User, Trophy, TrendingUp, TrendingDown, ShieldAlert, Sliders, History, ArrowLeft } from 'lucide-react';

interface PlayerProfileProps {
  player: Player;
  team?: Team;
  allTrades: Trade[];
  allPlayers: Player[];
  leagues: League[];
  onBack: () => void;
}

export const PlayerProfile: React.FC<PlayerProfileProps> = ({
  player,
  team,
  allTrades,
  allPlayers,
  leagues,
  onBack,
}) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('all');

  const stats = calculatePlayerStats(
    player.id,
    allTrades,
    allPlayers,
    selectedLeagueId === 'all' ? undefined : selectedLeagueId
  );

  const playerTrades = allTrades.filter(
    t => t.playerId === player.id && (selectedLeagueId === 'all' || t.leagueId === selectedLeagueId)
  );

  return (
    <div className="space-y-4">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft size={13} />
          Back to League
        </button>

        {/* League Filter */}
        <div className="flex items-center gap-1 bg-[#111622] p-1 rounded-lg border border-[rgba(255,255,255,0.06)] text-xs">
          <button
            onClick={() => setSelectedLeagueId('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              selectedLeagueId === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Leagues
          </button>
          {leagues.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLeagueId(l.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedLeagueId === l.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
            }`}
          >
            {l.name}
          </button>
        ))}
        </div>
      </div>

      {/* Player Header Banner */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white shadow-lg"
            style={{ backgroundColor: team?.primaryColor || '#8B5CF6' }}
          >
            {player.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">{player.name}</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold font-mono"
                style={{
                  backgroundColor: team ? `${team.primaryColor}22` : '#1e293b',
                  color: team?.primaryColor || '#94a3b8',
                }}
              >
                {team?.name || player.teamId}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Role: Nominated League Trader • {stats.totalTrades} Total Trades
            </div>
          </div>
        </div>

        {/* Highlight Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-mono uppercase">Cumulative ROI</div>
            <div className={`text-xl font-bold font-mono ${stats.totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(stats.totalPnlPercent)}
            </div>
          </div>
          <div className="text-right pl-3 border-l border-[rgba(255,255,255,0.06)]">
            <div className="text-[11px] text-slate-400 font-mono uppercase">Net Profit</div>
            <div className={`text-xl font-bold font-mono ${stats.totalPnlAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(stats.totalPnlAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Win Rate</div>
          <div className="text-lg font-bold font-mono text-white mt-1">{stats.winRate}%</div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {stats.wins}W - {stats.losses}L
          </div>
        </div>

        <div className="bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Long / Short Win %</div>
          <div className="text-sm font-bold font-mono text-white mt-1">
            <span className="text-emerald-400">{stats.longWinRate}% L</span> / <span className="text-rose-400">{stats.shortWinRate}% S</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {stats.longWins + stats.longLosses} Longs, {stats.shortWins + stats.shortLosses} Shorts
          </div>
        </div>

        <div className="bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Best / Worst Trade</div>
          <div className="text-sm font-bold font-mono mt-1">
            <span className="text-emerald-400">{formatPercent(stats.bestTradePercent)}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-rose-400">{formatPercent(stats.worstTradePercent)}</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Avg: {formatPercent(stats.avgPnlPercent)}
          </div>
        </div>

        <div className="bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] rounded-xl p-3">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Risk & Discipline</div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-1 flex items-center gap-1">
            <ShieldAlert size={14} />
            {stats.riskyTradesCount} Risky Trades
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {stats.tpChangesCount + stats.slChangesCount} TP/SL Adjustments
          </div>
        </div>
      </div>

      {/* Trade History Ledger for Player */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-bold text-white uppercase">
          <span className="flex items-center gap-1.5">
            <History size={13} className="text-slate-400" />
            Trade Ledger ({playerTrades.length})
          </span>
          <span className="text-slate-500 font-mono font-normal">
            Avg Hold Time: {formatDuration(stats.avgHoldSeconds)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 bg-[#0c0f17]">
                <th className="py-2 px-3">LEAGUE / RND</th>
                <th className="py-2 px-3">INSTRUMENT</th>
                <th className="py-2 px-3">DIR</th>
                <th className="py-2 px-3 text-right">ENTRY</th>
                <th className="py-2 px-3 text-right">EXIT</th>
                <th className="py-2 px-3 text-right">PNL %</th>
                <th className="py-2 px-3 text-right">PNL ($)</th>
                <th className="py-2 px-3 text-center">STATUS</th>
                <th className="py-2 px-3 text-right">DURATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {playerTrades.map(t => {
                const isGain = (t.pnlAmount ?? 0) >= 0;
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-slate-300 font-sans">
                      {t.leagueId.startsWith('forex') ? 'Forex' : 'Crypto'} • R{t.roundNumber}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">{t.instrument}</td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.direction === 'LONG' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{t.entryPrice}</td>
                    <td className="py-2 px-3 text-right text-slate-300">{t.exitPrice ?? '-'}</td>
                    <td className="py-2 px-3 text-right font-bold">
                      {t.pnlPercent !== undefined ? (
                        <span className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatPercent(t.pnlPercent)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      {t.pnlAmount !== undefined ? (
                        <span className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatCurrency(t.pnlAmount)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        t.status === 'TP_HIT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'SL_HIT'
                          ? 'bg-rose-500/20 text-rose-300'
                          : t.status === 'OPEN'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 text-[11px]">
                      {formatDuration(t.holdDurationSeconds)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

