import React from 'react';
import { LeagueStanding, Team, League } from '../types';
import { formatCurrency, formatPercent, formatDuration } from '../utils/calculations';
import { Trophy, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LeagueStandingsProps {
  standings: LeagueStanding[];
  teams: Team[];
  league: League;
  onSelectTeam?: (teamId: string) => void;
}

export const LeagueStandings: React.FC<LeagueStandingsProps> = ({
  standings,
  teams,
  league,
  onSelectTeam,
}) => {
  return (
    <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Trophy size={14} className="text-emerald-400" />
            {league.name} Standings
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Ranked by Total ROI % • Compounding Wallet: {league.currency}
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Max SL Limit: <span className="text-amber-400 font-bold">{league.maxSlRiskPercent}%</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)] text-[11px] font-semibold text-slate-400 font-mono bg-[#0c0f17]">
              <th className="py-2.5 px-3 w-12 text-center">POS</th>
              <th className="py-2.5 px-3">TEAM</th>
              <th className="py-2.5 px-3 text-right">PNL %</th>
              <th className="py-2.5 px-3 text-right">PNL ({league.currency})</th>
              <th className="py-2.5 px-3 text-center">TRADES</th>
              <th className="py-2.5 px-3 text-center">W / L</th>
              <th className="py-2.5 px-3 text-right">WIN RATE</th>
              <th className="py-2.5 px-3 text-center">RISKY TRADES</th>
              <th className="py-2.5 px-3 text-right">AVG HOLD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-mono">
            {standings.map(row => {
              const team = teams.find(t => t.id === row.teamId);
              const isFirst = row.rank === 1;
              const isPodium = row.rank <= 3;

              return (
                <tr
                  key={row.teamId}
                  onClick={() => onSelectTeam && onSelectTeam(row.teamId)}
                  className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                    isFirst ? 'bg-emerald-500/[0.04]' : ''
                  }`}
                >
                  {/* Position */}
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                        row.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : row.rank === 2
                          ? 'bg-slate-300 text-slate-950'
                          : row.rank === 3
                          ? 'bg-amber-700/60 text-amber-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {row.rank}
                    </span>
                  </td>

                  {/* Team */}
                  <td className="py-2.5 px-3 font-sans">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: team?.primaryColor || '#94a3b8' }}
                      ></span>
                      <span className="font-bold text-white text-xs">{team?.name || row.teamId}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({team?.shortName || row.teamId})</span>
                    </div>
                  </td>

                  {/* PnL % */}
                  <td className="py-2.5 px-3 text-right font-bold">
                    <span className={row.totalPnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatPercent(row.totalPnlPercent)}
                    </span>
                  </td>

                  {/* PnL Amount */}
                  <td className="py-2.5 px-3 text-right">
                    <span className={row.totalPnlAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatCurrency(row.totalPnlAmount, league.currency)}
                    </span>
                  </td>

                  {/* Trades Count */}
                  <td className="py-2.5 px-3 text-center text-slate-300">
                    {row.tradesCount}
                  </td>

                  {/* W / L */}
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-emerald-400">{row.wins}W</span>
                    <span className="text-slate-600 mx-1">-</span>
                    <span className="text-rose-400">{row.losses}L</span>
                  </td>

                  {/* Win Rate */}
                  <td className="py-2.5 px-3 text-right">
                    <span className={`font-semibold ${row.winRate >= 50 ? 'text-white' : 'text-slate-400'}`}>
                      {row.winRate.toFixed(1)}%
                    </span>
                  </td>

                  {/* Risky Trades */}
                  <td className="py-2.5 px-3 text-center">
                    {row.riskyTradesCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[11px] font-sans font-medium">
                        <AlertTriangle size={11} />
                        {row.riskyTradesCount}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[11px] flex items-center justify-center gap-1 font-sans">
                        <ShieldCheck size={11} className="text-emerald-500/60" /> 0
                      </span>
                    )}
                  </td>

                  {/* Avg Hold */}
                  <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                    {formatDuration(row.avgHoldSeconds)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

