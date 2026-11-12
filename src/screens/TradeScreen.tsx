import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { League, Round, Player, Team, Wallet, Direction, Trade } from '../types';
import { storage } from '../services/storageService';
import { formatCurrency, formatDuration } from '../utils/calculations';
import { AdjustTpSlModal } from '../components/AdjustTpSlModal';
import { ManualExitModal } from '../components/ManualExitModal';

interface TradeScreenProps {
  league: League;
  round?: Round;
  wallet?: Wallet;
  players: Player[];
  teams: Team[];
  openTrades: Trade[];
  onLeagueChange: (id: string) => void;
  leagues: League[];
  wallets: Wallet[];
}

const riskColor = (pct: number, limit: number) =>
  pct > limit ? 'var(--red)' : pct > limit * 0.75 ? 'var(--amber)' : 'var(--green)';

export const TradeScreen: React.FC<TradeScreenProps> = ({
  league, round, wallet, players, teams, openTrades,
  onLeagueChange, leagues, wallets,
}) => {
  const [direction, setDirection] = useState<Direction>('LONG');
  const [instrument, setInstrument] = useState('EURUSD');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [qty, setQty]       = useState('');
  const [entry, setEntry]   = useState('');
  const [tp, setTp]         = useState('');
  const [sl, setSl]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash]   = useState('');

  // Reset instrument when league changes
  useEffect(() => {
    setInstrument(league.divisionId === 'forex' ? 'EURUSD' : 'BTCUSDT');
    setQty(''); setEntry(''); setTp(''); setSl('');
  }, [league.id, league.divisionId]);

  // Waiting players
  const waiting = useMemo(() => {
    if (!round) return [];
    return [...round.playerQueue.filter(q => q.status === 'WAITING')]
      .sort((a, b) => b.position - a.position);
  }, [round]);

  // Auto-select top of queue
  useEffect(() => {
    if (waiting.length && !waiting.find(w => w.playerId === selectedPlayerId)) {
      setSelectedPlayerId(waiting[0].playerId);
    }
  }, [waiting]);

  const selectedQueueItem = waiting.find(w => w.playerId === selectedPlayerId);
  const selectedTeam = selectedQueueItem
    ? teams.find(t => t.id === selectedQueueItem.teamId)
    : null;

  const n = (s: string) => parseFloat(s) || 0;
  const walletBal = wallet?.balance || 100;

  const { riskAmt, rewardAmt, riskPct, rewardPct, rr, slBad, tpBad, isRisky } = useMemo(() => {
    const q = n(qty), e = n(entry), tpV = n(tp), slV = n(sl);
    let risk = 0, reward = 0, slBad = false, tpBad = false;
    if (q > 0 && e > 0 && slV > 0) {
      slBad = direction === 'LONG' ? slV >= e : slV <= e;
      risk = Math.abs(e - slV) * q;
    }
    if (q > 0 && e > 0 && tpV > 0) {
      tpBad = direction === 'LONG' ? tpV <= e : tpV >= e;
      reward = Math.abs(tpV - e) * q;
    }
    const riskPct = walletBal > 0 ? (risk / walletBal) * 100 : 0;
    const rewardPct = walletBal > 0 ? (reward / walletBal) * 100 : 0;
    const rr = risk > 0 ? (reward / risk).toFixed(1) : '—';
    return { riskAmt: risk, rewardAmt: reward, riskPct, rewardPct, rr, slBad, tpBad, isRisky: riskPct > league.maxSlRiskPercent };
  }, [direction, qty, entry, tp, sl, walletBal, league.maxSlRiskPercent]);

  const canSubmit = !submitting && selectedPlayerId && n(qty) > 0 && n(entry) > 0 && n(tp) > 0 && n(sl) > 0 && !slBad && !tpBad;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !round) return;
    setSubmitting(true);
    try {
      const item = waiting.find(w => w.playerId === selectedPlayerId)!;
      await storage.openTrade({
        leagueId: league.id, roundNumber: round.roundNumber,
        playerId: item.playerId, playerName: item.playerName, teamId: item.teamId,
        instrument, direction,
        qty: n(qty), entryPrice: n(entry), tpPrice: n(tp), slPrice: n(sl),
        walletBalance: walletBal, maxSlRiskPercent: league.maxSlRiskPercent,
      });
      setFlash('Position opened ✓');
      setQty(''); setEntry(''); setTp(''); setSl('');
      setTimeout(() => setFlash(''), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const leagueWallet = wallets.find(w => w.id === league.walletId);

  return (
    <div className="screen">
      {/* Top bar */}
      <div className="safe-top" style={{ background: 'var(--bg-screen)' }}>
        {/* League selector */}
        <div style={{ padding: '12px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
                ATL <span style={{ color: 'var(--text-3)', fontSize: 14, fontWeight: 500 }}>Season 1</span>
              </div>
            </div>
            {leagueWallet && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {league.name} Wallet
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                  {formatCurrency(leagueWallet.balance, leagueWallet.currency)}
                </div>
              </div>
            )}
          </div>

          {/* League tabs */}
          <div className="segment" style={{ marginBottom: 16 }}>
            {leagues.map(l => (
              <button
                key={l.id}
                className={`segment-btn ${league.id === l.id ? 'active' : ''}`}
                onClick={() => onLeagueChange(l.id)}
              >
                {l.divisionId === 'forex' ? '💱' : '🪙'} {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="scroll-body" style={{ paddingTop: 0 }}>

        {/* Open positions strip */}
        {openTrades.length > 0 && (
          <div style={{ padding: '0 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              Open Positions
            </div>
            <div className="card">
              {openTrades.map((trade, i) => (
                <OpenPositionRow key={trade.id} trade={trade} teams={teams} isLast={i === openTrades.length - 1} />
              ))}
            </div>
          </div>
        )}

        {/* Trade Entry Card */}
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            New Position · Round {round?.roundNumber || 1}
          </div>

          {flash && (
            <div className="alert-bar success" style={{ marginBottom: 12 }}>
              ✓ {flash}
            </div>
          )}

          {waiting.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏁</div>
              <div style={{ color: 'var(--text-2)', fontSize: 14, fontWeight: 600 }}>All traders have played this round</div>
              <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>Go to Standings to complete the round</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="card" style={{ padding: 16, marginBottom: 12 }}>
                {/* Trader row */}
                <div style={{ marginBottom: 14 }}>
                  <label className="input-label">Trader on the Clock</label>
                  <select
                    className="input-field"
                    value={selectedPlayerId}
                    onChange={e => setSelectedPlayerId(e.target.value)}
                  >
                    {waiting.map(item => {
                      const t = teams.find(tm => tm.id === item.teamId);
                      return (
                        <option key={item.playerId} value={item.playerId}>
                          #{item.position} {item.playerName} · {t?.shortName || item.teamId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Team pill */}
                {selectedTeam && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      background: `${selectedTeam.primaryColor}22`,
                      color: selectedTeam.primaryColor,
                      border: `1px solid ${selectedTeam.primaryColor}44`,
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: selectedTeam.primaryColor, flexShrink: 0 }} />
                      {selectedTeam.name}
                    </div>
                  </div>
                )}

                {/* Direction */}
                <div style={{ marginBottom: 14 }}>
                  <label className="input-label">Direction</label>
                  <div className="dir-toggle">
                    <button type="button" className={`dir-btn long ${direction === 'LONG' ? 'active' : ''}`} onClick={() => setDirection('LONG')}>
                      ↗ Long
                    </button>
                    <button type="button" className={`dir-btn short ${direction === 'SHORT' ? 'active' : ''}`} onClick={() => setDirection('SHORT')}>
                      ↘ Short
                    </button>
                  </div>
                </div>

                {/* Instrument */}
                <div style={{ marginBottom: 14 }}>
                  <label className="input-label">Instrument</label>
                  <input
                    className="input-field"
                    value={instrument}
                    onChange={e => setInstrument(e.target.value.toUpperCase())}
                    placeholder={league.divisionId === 'forex' ? 'EURUSD' : 'BTCUSDT'}
                  />
                </div>

                {/* Qty + Entry */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="input-label">Qty / Lots</label>
                    <input
                      type="number" step="any" className="input-field"
                      value={qty} onChange={e => setQty(e.target.value)} placeholder="0.10"
                    />
                  </div>
                  <div>
                    <label className="input-label">Entry</label>
                    <input
                      type="number" step="any" className="input-field"
                      value={entry} onChange={e => setEntry(e.target.value)}
                      placeholder={league.divisionId === 'forex' ? '1.0850' : '92000'}
                    />
                  </div>
                </div>

                {/* TP + SL */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="input-label" style={{ color: 'var(--green)' }}>Take Profit</label>
                    <input
                      type="number" step="any"
                      className="input-field"
                      style={tpBad ? { borderColor: 'var(--red)' } : {}}
                      value={tp} onChange={e => setTp(e.target.value)}
                      placeholder={league.divisionId === 'forex' ? '1.0900' : '94000'}
                    />
                    {tpBad && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 3 }}>TP must be {direction === 'LONG' ? 'above' : 'below'} Entry</div>}
                  </div>
                  <div>
                    <label className="input-label" style={{ color: 'var(--red)' }}>Stop Loss</label>
                    <input
                      type="number" step="any"
                      className="input-field"
                      style={slBad ? { borderColor: 'var(--red)' } : {}}
                      value={sl} onChange={e => setSl(e.target.value)}
                      placeholder={league.divisionId === 'forex' ? '1.0820' : '91000'}
                    />
                    {slBad && <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 3 }}>SL must be {direction === 'LONG' ? 'below' : 'above'} Entry</div>}
                  </div>
                </div>

                {/* Live risk metrics */}
                {(riskAmt > 0 || rewardAmt > 0) && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 8, marginBottom: 14,
                    background: 'var(--bg-input)', borderRadius: 10, padding: 12,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Risk</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: riskColor(riskPct, league.maxSlRiskPercent) }}>
                        {riskPct.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{formatCurrency(riskAmt)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>R:R</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                        1 : {rr}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Target</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
                        {rewardPct.toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{formatCurrency(rewardAmt)}</div>
                    </div>
                  </div>
                )}

                {/* Risky trade warning */}
                {isRisky && (
                  <div className="alert-bar warning" style={{ marginBottom: 12 }}>
                    ⚠️ Exceeds {league.maxSlRiskPercent}% risk limit — will be flagged as Risky Trade
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={!canSubmit}>
                  {submitting ? 'Opening...' : 'Open Position'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Round Queue */}
        {round && (
          <RoundQueueSection round={round} teams={teams} openTrades={openTrades} />
        )}
      </div>
    </div>
  );
};


// --- Open Position Row ---
const OpenPositionRow: React.FC<{ trade: Trade; teams: Team[]; isLast: boolean }> = ({ trade, teams, isLast }) => {
  const [showAdjust, setShowAdjust] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const team = teams.find(t => t.id === trade.teamId);
  const dur = Math.round((now - new Date(trade.openedAt).getTime()) / 1000);

  const handleClose = async (type: 'TP_HIT' | 'SL_HIT') => {
    const price = type === 'TP_HIT' ? trade.tpPrice : trade.slPrice;
    if (!confirm(`Close ${trade.instrument} at ${price}?`)) return;
    await storage.closeTrade(trade, type);
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel ${trade.instrument}? Player returns to queue.`)) return;
    await storage.cancelTrade(trade);
  };

  return (
    <>
      <div style={{
        padding: '14px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}>
        {/* Top row: instrument + team + direction */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
              background: trade.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
              color: trade.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
              border: `1px solid ${trade.direction === 'LONG' ? 'var(--green-border)' : 'var(--red-border)'}`,
            }}>
              {trade.direction === 'LONG' ? '↗' : '↘'} {trade.direction}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{trade.instrument}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>⏱ {formatDuration(dur)}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
              background: team ? `${team.primaryColor}22` : '#1e1e2e',
              color: team?.primaryColor || 'var(--text-2)',
            }}>
              {trade.playerName}
            </span>
          </div>
        </div>

        {/* Price row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          background: 'var(--bg-input)', borderRadius: 8, padding: '8px 12px',
          marginBottom: 10, textAlign: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600 }}>Entry</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{trade.entryPrice}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--green)', textTransform: 'uppercase', fontWeight: 600 }}>TP</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: 2 }}>{trade.tpPrice}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', fontWeight: 600 }}>SL</div>
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--red)', marginTop: 2 }}>{trade.slPrice}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          <button className="btn-sm"
            style={{ background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid var(--green-border)' }}
            onClick={() => handleClose('TP_HIT')}>TP Hit</button>
          <button className="btn-sm"
            style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red-border)' }}
            onClick={() => handleClose('SL_HIT')}>SL Hit</button>
          <button className="btn-sm"
            style={{ background: 'var(--amber-bg)', color: 'var(--amber)' }}
            onClick={() => setShowExit(true)}>Exit</button>
          <button className="btn-sm"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-2)' }}
            onClick={() => setShowAdjust(true)}>Adjust</button>
        </div>

        {trade.isRiskyTrade && (
          <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 6, fontWeight: 600 }}>
            ⚠️ Risky Trade (exceeded {trade.riskPercent.toFixed(1)}% risk limit)
          </div>
        )}

        {/* Cancel link */}
        <div style={{ textAlign: 'right', marginTop: 6 }}>
          <button onClick={handleCancel}
            style={{ fontSize: 11, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel Trade
          </button>
        </div>
      </div>

      {showAdjust && <AdjustTpSlModal trade={trade} onClose={() => setShowAdjust(false)} />}
      {showExit && <ManualExitModal trade={trade} onClose={() => setShowExit(false)} />}
    </>
  );
};


// --- Round Queue Section ---
const RoundQueueSection: React.FC<{ round: Round; teams: Team[]; openTrades: Trade[] }> = ({ round, teams, openTrades }) => {
  const q = [...round.playerQueue].sort((a, b) => b.position - a.position);
  const completed = q.filter(i => i.status === 'COMPLETED').length;
  const isAllDone = completed === q.length && q.length > 0;

  const handleComplete = async () => {
    if (!confirm(`Complete Round ${round.roundNumber} and generate Round ${round.roundNumber + 1}?`)) return;
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    const sorted = [...q].sort((a, b) => {
      const ta = openTrades.find(t => t.playerId === a.playerId);
      const tb = openTrades.find(t => t.playerId === b.playerId);
      return (tb?.pnlPercent ?? 0) - (ta?.pnlPercent ?? 0);
    });
    await storage.completeRoundAndStartNext(round.leagueId, round.roundNumber, sorted.map(s => s.playerId));
  };

  return (
    <div style={{ padding: '0 20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Round {round.roundNumber} Order
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>
          {completed}/{q.length} done
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--bg-card)', borderRadius: 4, height: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4, background: 'var(--green)',
          width: `${q.length > 0 ? (completed / q.length) * 100 : 0}%`,
          transition: 'width 0.5s',
        }} />
      </div>

      {isAllDone && (
        <button
          onClick={handleComplete}
          style={{
            width: '100%', padding: '13px', background: 'var(--amber)', color: '#1a1200',
            fontWeight: 700, fontSize: 14, borderRadius: 12, border: 'none', cursor: 'pointer',
            marginBottom: 10,
          }}>
          🏁 Complete Round {round.roundNumber} & Advance
        </button>
      )}

      <div className="card">
        {q.map((item, i) => {
          const team = teams.find(t => t.id === item.teamId);
          const statusColor = item.status === 'COMPLETED'
            ? 'var(--green)' : item.status === 'ACTIVE'
            ? 'var(--amber)' : 'var(--text-3)';
          const statusLabel = item.status === 'COMPLETED' ? 'Done'
            : item.status === 'ACTIVE' ? '⏳ Open' : 'Wait';

          return (
            <div key={item.playerId} style={{
              display: 'flex', alignItems: 'center',
              padding: '11px 16px', gap: 10,
              borderBottom: i < q.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: item.status === 'COMPLETED' ? 0.5 : 1,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', width: 24, flexShrink: 0 }}>
                #{item.position}
              </span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{item.playerName}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                background: team ? `${team.primaryColor}22` : '#1e1e2e',
                color: team?.primaryColor || 'var(--text-2)',
              }}>
                {team?.shortName || item.teamId}
              </span>
              <span style={{ fontSize: 11, color: statusColor, fontWeight: 600, minWidth: 42, textAlign: 'right' }}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
