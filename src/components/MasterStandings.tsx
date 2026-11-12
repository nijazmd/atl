import React from 'react';
import { MasterStanding, Team, League, Trade } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Crown, Sparkles, TrendingUp, BarChart3 } from 'lucide-react';

interface MasterStandingsProps {
  masterStandings: MasterStanding[];
  teams: Team[];
  leagues: League[];
  allTrades: Trade[];
  onSelectTeam?: (teamId: string) => void;
}

export const MasterStandings: React.FC<MasterStandingsProps> = ({
  masterStandings,
  teams,
  leagues,
  allTrades,
  onSelectTeam,
}) => {
  // Compute global summary metrics across all trades
  const closedTrades = allTrades.filter(t => ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status));
  const totalTradesCount = closedTrades.length;
  const totalWins = closedTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const globalWinRate = totalTradesCount > 0 ? ((totalWins / totalTradesCount) * 100).toFixed(1) : '0';
  const totalNetPnl = closedTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0);
  const longCount = closedTrades.filter(t => t.direction === 'LONG').length;
  const longBiasPercent = totalTradesCount > 0 ? Math.round((longCount / totalTradesCount) * 100) : 50;

  return (
    <div className="space-y-4">
      {/* Global Analytics Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Total ATL Trades</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">{totalTradesCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all 10 teams</div>
        </div>

        <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">League Win Rate</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{globalWinRate}%</div>
          <div className="text-[10px] text-slate-500 mt-0.5">{totalWins} wins / {totalTradesCount - totalWins} losses</div>
        </div>

        <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Total Realized PnL</div>
          <div className={`text-xl font-bold font-mono mt-0.5 ${totalNetPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalNetPnl)}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Net profit generated</div>
        </div>

        <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase">Direction Bias</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {longBiasPercent}% <span className="text-xs text-emerald-400 font-sans font-normal">Long</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{100 - longBiasPercent}% Short positions</div>
        </div>
      </div>

      {/* Master Standings Table */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              <Crown size={15} className="text-amber-400" />
              ATL Master Championship Standings
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Ranked by Average Position across leagues (Lowest score is #1)
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-[#0c0f17] border border-[rgba(255,255,255,0.06)]">
              Forex Scalp
            </span>
            <span>+</span>
            <span className="px-2 py-0.5 rounded bg-[#0c0f17] border border-[rgba(255,255,255,0.06)]">
              Crypto Scalp
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[11px] font-semibold text-slate-400 font-mono bg-[#0c0f17]">
                <th className="py-2.5 px-3 w-12 text-center">RANK</th>
                <th className="py-2.5 px-3">TEAM</th>
                <th className="py-2.5 px-3 text-center bg-amber-500/[0.04] text-amber-300 font-bold">AVG POSITION</th>
                {leagues.map(l => (
                  <th key={l.id} className="py-2.5 px-3 text-center">
                    {l.name.toUpperCase()} (POS / PNL)
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right">TOTAL PNL ($)</th>
                <th className="py-2.5 px-3 text-center">BEST FINISH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)] font-mono">
              {masterStandings.map(row => {
                const team = teams.find(t => t.id === row.teamId);
                const isLeader = row.masterRank === 1;

                return (
                  <tr
                    key={row.teamId}
                    onClick={() => onSelectTeam && onSelectTeam(row.teamId)}
                    className={`hover:bg-white/[0.03] transition-colors cursor-pointer ${
                      isLeader ? 'bg-amber-500/[0.05]' : ''
                    }`}
                  >
                    {/* Master Rank */}
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                          row.masterRank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                            : row.masterRank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : row.masterRank === 3
                            ? 'bg-amber-700/60 text-amber-200'
                            : 'text-slate-500'
                        }`}
                      >
                        {row.masterRank}
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

                    {/* Average Position Score (Primary Championship Metric) */}
                    <td className="py-2.5 px-3 text-center bg-amber-500/[0.04]">
                      <span className="font-bold text-sm text-amber-300">
                        {row.avgPosition.toFixed(1)}
                      </span>
                    </td>

                    {/* Individual League Positions & PnLs */}
                    {leagues.map(l => {
                      const pos = row.leaguePositions[l.id] ?? 10;
                      const pnl = row.leaguePnls[l.id] ?? 0;
                      return (
                        <td key={l.id} className="py-2.5 px-3 text-center">
                          <span className="font-bold text-white">#{pos}</span>
                          <span className={`ml-1.5 text-[11px] ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ({formatPercent(pnl)})
                          </span>
                        </td>
                      );
                    })}

                    {/* Total Net PnL Amount */}
                    <td className="py-2.5 px-3 text-right font-semibold">
                      <span className={row.totalNetPnlAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {formatCurrency(row.totalNetPnlAmount)}
                      </span>
                    </td>

                    {/* Best League Finish */}
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                        #{row.bestLeagueFinish}
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

