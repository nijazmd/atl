import React, { useState } from 'react';
import { Team, Player, Trade, League, MasterStanding } from '../types';
import { formatCurrency, formatPercent, formatDuration } from '../utils/calculations';
import { Shield, Trophy, Users, ArrowLeft, TrendingUp, History, UserCheck } from 'lucide-react';

interface TeamProfileProps {
  team: Team;
  masterStanding?: MasterStanding;
  allPlayers: Player[];
  allTrades: Trade[];
  leagues: League[];
  onBack: () => void;
  onSelectPlayer: (playerId: string) => void;
}

export const TeamProfile: React.FC<TeamProfileProps> = ({
  team,
  masterStanding,
  allPlayers,
  allTrades,
  leagues,
  onBack,
  onSelectPlayer,
}) => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('all');

  const teamPlayers = allPlayers.filter(p => p.teamId === team.id);
  const teamTrades = allTrades.filter(
    t => t.teamId === team.id && (selectedLeagueId === 'all' || t.leagueId === selectedLeagueId)
  );

  const closedTrades = teamTrades.filter(t => ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status));
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : '0';
  const totalPnlAmount = closedTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0);
  const totalPnlPercent = closedTrades.reduce((acc, t) => acc + (t.pnlPercent ?? 0), 0);
  const riskyTrades = closedTrades.filter(t => t.isRiskyTrade).length;

  return (
    <div className="space-y-4">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
        >
          <ArrowLeft size={13} />
          Back to Standings
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
            Consolidated
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

      {/* Team Header Banner */}
      <div
        className="rounded-xl p-5 border relative overflow-hidden flex flex-wrap items-center justify-between gap-4"
        style={{
          backgroundColor: '#111622',
          borderColor: `${team.primaryColor}44`,
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl"
            style={{ backgroundColor: team.primaryColor }}
          >
            {team.shortName}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">{team.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                {team.shortName}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">
              Master Standing: <span className="text-amber-400 font-bold">#{masterStanding?.masterRank || '-'}</span> (Avg Position: {masterStanding?.avgPosition ?? '-'})
            </div>
          </div>
        </div>

        {/* PnL & Win Rate Highlights */}
        <div className="flex items-center gap-4 bg-[#0c0f17] px-4 py-2.5 rounded-xl border border-[rgba(255,255,255,0.06)]">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total ROI</div>
            <div className={`text-lg font-bold font-mono ${totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatPercent(totalPnlPercent)}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Net Profit</div>
            <div className={`text-lg font-bold font-mono ${totalPnlAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(totalPnlAmount)}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-mono">Win Rate</div>
            <div className="text-lg font-bold font-mono text-white">
              {winRate}% <span className="text-[10px] text-slate-500 font-normal">({wins}/{totalTrades})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nominated Roster Cards */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)] mb-3">
          <span className="flex items-center gap-1.5">
            <Users size={14} className="text-emerald-400" />
            Nominated Franchise Traders ({teamPlayers.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono font-normal">
            Max 2 traders per league • Roster editable before round starts
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teamPlayers.map(p => {
            const pTrades = allTrades.filter(t => t.playerId === p.id && ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status));
            const pWins = pTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
            const pTotalPnl = pTrades.reduce((acc, t) => acc + (t.pnlPercent ?? 0), 0);
            const pWinRate = pTrades.length > 0 ? ((pWins / pTrades.length) * 100).toFixed(0) : '0';

            return (
              <div
                key={p.id}
                onClick={() => onSelectPlayer(p.id)}
                className="p-3.5 rounded-xl bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-white"
                    style={{ backgroundColor: team.primaryColor }}
                  >
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">{p.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {pTrades.length} Trades • {pWins}W / {pTrades.length - pWins}L
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className={`font-bold text-xs ${pTotalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatPercent(pTotalPnl)}
                  </div>
                  <div className="text-[10px] text-slate-500">{pWinRate}% Win Rate</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Trade Ledger */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-3 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between text-xs font-bold text-white uppercase">
          <span className="flex items-center gap-1.5">
            <History size={13} className="text-slate-400" />
            Team Execution Ledger ({closedTrades.length})
          </span>
          <span className="text-slate-500 font-mono font-normal">
            Risky Trades: {riskyTrades}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 bg-[#0c0f17]">
                <th className="py-2 px-3">TRADER</th>
                <th className="py-2 px-3">LEAGUE / RND</th>
                <th className="py-2 px-3">INSTRUMENT</th>
                <th className="py-2 px-3">DIR</th>
                <th className="py-2 px-3 text-right">ENTRY</th>
                <th className="py-2 px-3 text-right">EXIT</th>
                <th className="py-2 px-3 text-right">PNL %</th>
                <th className="py-2 px-3 text-right">PNL ($)</th>
                <th className="py-2 px-3 text-center">OUTCOME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {closedTrades.map(t => {
                const isGain = (t.pnlAmount ?? 0) >= 0;
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-white font-sans font-medium">{t.playerName}</td>
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
                      <span className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatPercent(t.pnlPercent ?? 0)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      <span className={isGain ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(t.pnlAmount ?? 0)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        t.status === 'TP_HIT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'SL_HIT'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {t.status}
                      </span>
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

