import React, { useState, useEffect } from 'react';
import { Trade, Team } from '../types';
import { storage } from '../services/storageService';
import { formatCurrency, formatDuration } from '../utils/calculations';
import { AdjustTpSlModal } from './AdjustTpSlModal';
import { ManualExitModal } from './ManualExitModal';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Sliders,
  Target,
  Shield,
  LogOut,
  XCircle,
  AlertTriangle,
  History
} from 'lucide-react';

interface ActivePositionsProps {
  trades: Trade[];
  teams: Team[];
  leagueId: string;
}

export const ActivePositions: React.FC<ActivePositionsProps> = ({ trades, teams, leagueId }) => {
  const [adjustTrade, setAdjustTrade] = useState<Trade | null>(null);
  const [manualExitTrade, setManualExitTrade] = useState<Trade | null>(null);
  const [now, setNow] = useState(Date.now());

  // Tick every 10 seconds for live duration timer
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const openTrades = trades.filter(t => t.leagueId === leagueId && t.status === 'OPEN');

  const handleTpHit = async (trade: Trade) => {
    if (confirm(`Confirm TP Hit for ${trade.instrument} at ${trade.tpPrice}?`)) {
      await storage.closeTrade(trade, 'TP_HIT');
    }
  };

  const handleSlHit = async (trade: Trade) => {
    if (confirm(`Confirm SL Hit for ${trade.instrument} at ${trade.slPrice}?`)) {
      await storage.closeTrade(trade, 'SL_HIT');
    }
  };

  const handleCancel = async (trade: Trade) => {
    if (confirm(`Cancel trade for ${trade.playerName}? This will restore the player to the round queue.`)) {
      await storage.cancelTrade(trade);
    }
  };

  if (openTrades.length === 0) {
    return (
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 text-center">
        <div className="text-slate-500 text-xs">No active open positions in this league.</div>
      </div>
    );
  }

  return (
    <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-white tracking-wide uppercase">
            ACTIVE POSITIONS ({openTrades.length})
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Multiple concurrent orders supported
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {openTrades.map(trade => {
          const team = teams.find(t => t.id === trade.teamId);
          const durationSec = Math.round((now - new Date(trade.openedAt).getTime()) / 1000);
          const tpChanges = (trade.adjustments || []).filter(a => a.type === 'TP_CHANGE').length;
          const slChanges = (trade.adjustments || []).filter(a => a.type === 'SL_CHANGE').length;

          return (
            <div
              key={trade.id}
              className="bg-[#0c0f17] border border-[rgba(255,255,255,0.08)] rounded-xl p-3 flex flex-col justify-between space-y-3"
            >
              {/* Card Header: Direction, Instrument, Team, Duration */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1 ${
                      trade.direction === 'LONG'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {trade.direction === 'LONG' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                    {trade.direction}
                  </span>
                  <span className="text-sm font-bold font-mono text-white tracking-wide">
                    {trade.instrument}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    x{trade.qty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className="px-2 py-0.5 rounded text-[11px] font-bold"
                    style={{
                      backgroundColor: team ? `${team.primaryColor}22` : '#1e293b',
                      color: team?.primaryColor || '#94a3b8',
                      border: `1px solid ${team ? `${team.primaryColor}44` : '#334155'}`,
                    }}
                  >
                    {trade.playerName} ({team?.shortName || trade.teamId})
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock size={11} />
                    {formatDuration(durationSec)}
                  </div>
                </div>
              </div>

              {/* Price Details Grid */}
              <div className="grid grid-cols-3 gap-2 bg-[#111622] p-2 rounded-lg border border-[rgba(255,255,255,0.04)] text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Entry</span>
                  <span className="text-white font-semibold">{trade.entryPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400/80 block uppercase">TP</span>
                  <span className="text-emerald-400 font-semibold">{trade.tpPrice}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-400/80 block uppercase">SL</span>
                  <span className="text-rose-400 font-semibold">{trade.slPrice}</span>
                </div>
              </div>

              {/* Meta: Risk, Reward, Audit Info */}
              <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    Risk: <span className="text-rose-400 font-semibold">{formatCurrency(trade.riskAmount)} ({trade.riskPercent}%)</span>
                  </span>
                  <span>
                    Target: <span className="text-emerald-400 font-semibold">{formatCurrency(trade.rewardAmount)}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {trade.isRiskyTrade && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] border border-rose-500/30 font-sans">
                      ⚠️ Risky Trade
                    </span>
                  )}
                  {(tpChanges > 0 || slChanges > 0) && (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1" title="Adjustments count">
                      <History size={10} />
                      {tpChanges + slChanges} adj
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <button
                  onClick={() => handleTpHit(trade)}
                  className="py-1.5 px-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Close with TP"
                >
                  <Target size={12} />
                  TP Hit
                </button>

                <button
                  onClick={() => handleSlHit(trade)}
                  className="py-1.5 px-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Close with SL"
                >
                  <Shield size={12} />
                  SL Hit
                </button>

                <button
                  onClick={() => setManualExitTrade(trade)}
                  className="py-1.5 px-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Manual Exit Price"
                >
                  <LogOut size={12} />
                  Exit
                </button>

                <button
                  onClick={() => setAdjustTrade(trade)}
                  className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Adjust TP / SL"
                >
                  <Sliders size={12} />
                  Adjust
                </button>

                <button
                  onClick={() => handleCancel(trade)}
                  className="py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  title="Cancel Trade (Restores turn to queue)"
                >
                  <XCircle size={12} />
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {adjustTrade && (
        <AdjustTpSlModal trade={adjustTrade} onClose={() => setAdjustTrade(null)} />
      )}

      {manualExitTrade && (
        <ManualExitModal trade={manualExitTrade} onClose={() => setManualExitTrade(null)} />
      )}
    </div>
  );
};

