import React, { useState, useEffect, useMemo } from 'react';
import { League, Round, Player, Team, Direction, Wallet } from '../types';
import { storage } from '../services/storageService';
import { formatCurrency } from '../utils/calculations';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TradeEntryPanelProps {
  league: League;
  round?: Round;
  wallet?: Wallet;
  players: Player[];
  teams: Team[];
  onTradeOpened?: () => void;
}

export const TradeEntryPanel: React.FC<TradeEntryPanelProps> = ({
  league,
  round,
  wallet,
  players,
  teams,
  onTradeOpened,
}) => {
  const [direction, setDirection] = useState<Direction>('LONG');
  const [instrument, setInstrument] = useState(league.divisionId === 'forex' ? 'EURUSD' : 'BTCUSDT');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [qty, setQty] = useState<string>('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [tpPrice, setTpPrice] = useState<string>('');
  const [slPrice, setSlPrice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Switch default instrument when league changes
  useEffect(() => {
    setInstrument(league.divisionId === 'forex' ? 'EURUSD' : 'BTCUSDT');
  }, [league.id, league.divisionId]);

  // Compute waiting players who have NOT taken a trade in this active round
  const waitingQueue = useMemo(() => {
    if (!round) return [];
    // Only players who are 'WAITING' (not 'ACTIVE' open order, not 'COMPLETED')
    return round.playerQueue.filter(item => item.status === 'WAITING');
  }, [round]);

  // Default to next player in the queue (starts at position 20 downwards)
  useEffect(() => {
    if (waitingQueue.length > 0) {
      // Find highest position waiting (e.g. 20, 19, 18...)
      const nextInLine = [...waitingQueue].sort((a, b) => b.position - a.position)[0];
      if (nextInLine && !waitingQueue.some(p => p.playerId === selectedPlayerId)) {
        setSelectedPlayerId(nextInLine.playerId);
      }
    } else {
      setSelectedPlayerId('');
    }
  }, [waitingQueue, selectedPlayerId]);

  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const selectedTeam = useMemo(() => {
    if (!selectedPlayer) return null;
    return teams.find(t => t.id === selectedPlayer.teamId);
  }, [teams, selectedPlayer]);

  // Calculations
  const numQty = parseFloat(qty) || 0;
  const numEntry = parseFloat(entryPrice) || 0;
  const numTp = parseFloat(tpPrice) || 0;
  const numSl = parseFloat(slPrice) || 0;
  const walletBal = wallet?.balance || 100;

  const { riskAmount, rewardAmount, riskPercent, rewardPercent, rrRatio, isSlInvalid, isTpInvalid, isRisky } = useMemo(() => {
    let risk = 0;
    let reward = 0;
    let slInvalid = false;
    let tpInvalid = false;

    if (numEntry > 0 && numSl > 0 && numQty > 0) {
      if (direction === 'LONG') {
        if (numSl >= numEntry) slInvalid = true;
        risk = Math.max(0, (numEntry - numSl) * numQty);
      } else {
        if (numSl <= numEntry) slInvalid = true;
        risk = Math.max(0, (numSl - numEntry) * numQty);
      }
    }

    if (numEntry > 0 && numTp > 0 && numQty > 0) {
      if (direction === 'LONG') {
        if (numTp <= numEntry) tpInvalid = true;
        reward = Math.max(0, (numTp - numEntry) * numQty);
      } else {
        if (numTp >= numEntry) tpInvalid = true;
        reward = Math.max(0, (numEntry - numTp) * numQty);
      }
    }

    const rPercent = walletBal > 0 ? (risk / walletBal) * 100 : 0;
    const rewPercent = walletBal > 0 ? (reward / walletBal) * 100 : 0;
    const ratio = risk > 0 ? (reward / risk).toFixed(2) : '-';
    const risky = rPercent > league.maxSlRiskPercent;

    return {
      riskAmount: risk,
      rewardAmount: reward,
      riskPercent: rPercent,
      rewardPercent: rewPercent,
      rrRatio: ratio,
      isSlInvalid: slInvalid,
      isTpInvalid: tpInvalid,
      isRisky: risky,
    };
  }, [direction, numEntry, numSl, numTp, numQty, walletBal, league.maxSlRiskPercent]);

  const canSubmit =
    !isSubmitting &&
    selectedPlayer &&
    numQty > 0 &&
    numEntry > 0 &&
    numTp > 0 &&
    numSl > 0 &&
    !isSlInvalid &&
    !isTpInvalid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !selectedPlayer || !round) return;

    setIsSubmitting(true);
    setSuccessMsg('');
    try {
      await storage.openTrade({
        leagueId: league.id,
        roundNumber: round.roundNumber,
        playerId: selectedPlayer.id,
        playerName: selectedPlayer.name,
        teamId: selectedPlayer.teamId,
        instrument,
        direction,
        qty: numQty,
        entryPrice: numEntry,
        tpPrice: numTp,
        slPrice: numSl,
        walletBalance: walletBal,
        maxSlRiskPercent: league.maxSlRiskPercent,
      });

      setSuccessMsg(`Position opened for ${selectedPlayer.name} (${selectedTeam?.shortName || ''})`);
      setQty('');
      setEntryPrice('');
      setTpPrice('');
      setSlPrice('');

      setTimeout(() => setSuccessMsg(''), 4000);
      if (onTradeOpened) onTradeOpened();
    } catch (err) {
      console.error('Failed to open trade:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.06)] mb-3">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-white tracking-wide">
            RECORD NEW POSITION
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-medium">
            Round {round?.roundNumber || 1}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {league.name}
          </span>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          SL Limit: <span className="text-amber-400 font-semibold">{league.maxSlRiskPercent}%</span>
        </div>
      </div>

      {successMsg && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          {successMsg}
        </div>
      )}

      {waitingQueue.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          All 20 players in Round {round?.roundNumber} have executed their trades!
          <div className="text-slate-500 mt-1">Close all open positions to complete this round.</div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Top Row: Trader Selector, Direction, Instrument */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Player Selector (takes 6 cols) */}
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                TRADER (ON THE CLOCK)
              </label>
              <div className="relative">
                <select
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {waitingQueue.map(item => {
                    const t = teams.find(tm => tm.id === item.teamId);
                    return (
                      <option key={item.playerId} value={item.playerId}>
                        #{item.position} • {item.playerName} ({t?.shortName || item.teamId})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Team Pill (takes 2 cols) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                TEAM
              </label>
              <div
                className="h-[31px] px-2.5 rounded-lg flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: selectedTeam ? `${selectedTeam.primaryColor}22` : '#1e293b',
                  color: selectedTeam?.primaryColor || '#94a3b8',
                  border: `1px solid ${selectedTeam ? `${selectedTeam.primaryColor}44` : '#334155'}`,
                }}
              >
                {selectedTeam?.shortName || '-'}
              </div>
            </div>

            {/* Direction Toggle (takes 2 cols) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                DIRECTION
              </label>
              <div className="grid grid-cols-2 gap-1 bg-[#0c0f17] p-0.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setDirection('LONG')}
                  className={`py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${
                    direction === 'LONG'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp size={11} />
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('SHORT')}
                  className={`py-1 text-xs font-bold rounded flex items-center justify-center gap-1 transition-all ${
                    direction === 'SHORT'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingDown size={11} />
                  SHORT
                </button>
              </div>
            </div>

            {/* Instrument (takes 3 cols) */}
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                INSTRUMENT
              </label>
              <input
                type="text"
                value={instrument}
                onChange={e => setInstrument(e.target.value.toUpperCase())}
                placeholder="EURUSD"
                className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Second Row: Qty, Entry, TP, SL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                QTY (LOTS / UNITS)
              </label>
              <input
                type="number"
                step="any"
                value={qty}
                onChange={e => setQty(e.target.value)}
                placeholder="0.10"
                className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                ENTRY PRICE
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={e => setEntryPrice(e.target.value)}
                placeholder={league.divisionId === 'forex' ? '1.08500' : '92000'}
                className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
                TAKE PROFIT (TP)
              </label>
              <input
                type="number"
                step="any"
                value={tpPrice}
                onChange={e => setTpPrice(e.target.value)}
                placeholder={league.divisionId === 'forex' ? '1.09000' : '94000'}
                className={`w-full bg-[#0c0f17] border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${
                  isTpInvalid ? 'border-rose-500/70' : 'border-[rgba(255,255,255,0.1)] focus:border-emerald-500'
                }`}
              />
              {isTpInvalid && (
                <span className="text-[10px] text-rose-400 mt-0.5 block">
                  TP must be {direction === 'LONG' ? 'above' : 'below'} Entry
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-rose-400 mb-1">
                STOP LOSS (SL)
              </label>
              <input
                type="number"
                step="any"
                value={slPrice}
                onChange={e => setSlPrice(e.target.value)}
                placeholder={league.divisionId === 'forex' ? '1.08200' : '91000'}
                className={`w-full bg-[#0c0f17] border rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none ${
                  isSlInvalid ? 'border-rose-500/70' : 'border-[rgba(255,255,255,0.1)] focus:border-emerald-500'
                }`}
              />
              {isSlInvalid && (
                <span className="text-[10px] text-rose-400 mt-0.5 block">
                  SL must be {direction === 'LONG' ? 'below' : 'above'} Entry
                </span>
              )}
            </div>
          </div>

          {/* Bottom Live Metrics & Action Bar */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(255,255,255,0.06)]">
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Risk: </span>
                <span className={`font-semibold ${isRisky ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                  {formatCurrency(riskAmount, league.currency)} ({riskPercent.toFixed(2)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500">Reward: </span>
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(rewardAmount, league.currency)} ({rewardPercent.toFixed(2)}%)
                </span>
              </div>
              <div>
                <span className="text-slate-500">R:R: </span>
                <span className="text-slate-200 font-semibold">1 : {rrRatio}</span>
              </div>

              {/* SL Limit warning label (non-blocking, as requested) */}
              {isRisky && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-sans">
                  <ShieldAlert size={12} />
                  <span>Risk exceeds {league.maxSlRiskPercent}% limit (Flagged as Risky Trade)</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${
                canSubmit
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>OPEN POSITION</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

