import React, { useState } from 'react';
import { Team, League, Trade, Round } from '../types';
import { calculateLeagueStandings, calculateMasterStandings, formatCurrency, formatPercent } from '../utils/calculations';
import confetti from 'canvas-confetti';
import { storage } from '../services/storageService';

interface StandingsScreenProps {
  teams: Team[];
  leagues: League[];
  trades: Trade[];
  rounds: Round[];
  onSelectTeam: (teamId: string) => void;
}

export const StandingsScreen: React.FC<StandingsScreenProps> = ({
  teams, leagues, trades, rounds, onSelectTeam,
}) => {
  const [view, setView] = useState<'master' | 'forex' | 'crypto'>('master');

  const masterStandings = calculateMasterStandings(teams, leagues, trades);

  const getLeagueStandings = (leagueId: string) =>
    calculateLeagueStandings(leagueId, trades, teams);

  const activeLeague = leagues.find(l =>
    view === 'forex' ? l.divisionId === 'forex' : l.divisionId === 'crypto'
  );

  const handleCompleteRound = async (league: League) => {
    const round = rounds.find(r => r.leagueId === league.id && r.roundNumber === league.activeRound);
    if (!round) return;

    if (!confirm(`Complete Round ${round.roundNumber} and generate Round ${round.roundNumber + 1}?`)) return;

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
    const q = round.playerQueue;
    const roundTrades = trades.filter(t => t.leagueId === league.id && t.roundNumber === round.roundNumber);
    const sorted = [...q].sort((a, b) => {
      const ta = roundTrades.find(t => t.playerId === a.playerId);
      const tb = roundTrades.find(t => t.playerId === b.playerId);
      return (tb?.pnlPercent ?? 0) - (ta?.pnlPercent ?? 0);
    });
    await storage.completeRoundAndStartNext(league.id, round.roundNumber, sorted.map(s => s.playerId));
  };

  return (
    <div className="screen">
      {/* Header */}
      <div className="safe-top" style={{ background: 'var(--bg-screen)', padding: '12px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 12 }}>
          Standings
        </div>
        <div className="segment" style={{ marginBottom: 16 }}>
          <button className={`segment-btn ${view === 'master' ? 'active' : ''}`} onClick={() => setView('master')}>
            🏆 ATL Master
          </button>
          <button className={`segment-btn ${view === 'forex' ? 'active' : ''}`} onClick={() => setView('forex')}>
            💱 Forex
          </button>
          <button className={`segment-btn ${view === 'crypto' ? 'active' : ''}`} onClick={() => setView('crypto')}>
            🪙 Crypto
          </button>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div style={{ padding: '0 20px' }}>

          {view === 'master' ? (
            <>
              {/* How scoring works */}
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                background: 'var(--bg-card)', borderRadius: 10,
                border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)',
              }}>
                🏆 Ranked by <strong style={{ color: 'var(--text-2)' }}>Average Position</strong> across all leagues. Lower score = better rank.
              </div>

              <div className="card">
                {masterStandings.map((s, i) => {
                  const team = teams.find(t => t.id === s.teamId);
                  const isPositive = s.totalNetPnlAmount >= 0;
                  return (
                    <div
                      key={s.teamId}
                      className="standing-row"
                      onClick={() => onSelectTeam(s.teamId)}
                    >
                      {/* Rank */}
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800,
                        background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--bg-input)',
                        color: i < 3 ? '#0a0a0f' : 'var(--text-2)',
                      }}>
                        {s.masterRank}
                      </div>

                      {/* Team name */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: team?.primaryColor || '#888',
                          }} />
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{team?.name || s.teamId}</span>
                        </div>
                        {/* League positions */}
                        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                          {leagues.map(l => (
                            <span key={l.id} style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 500 }}>
                              {l.divisionId === 'forex' ? '💱' : '🪙'} #{s.leaguePositions[l.id] ?? '—'}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Score */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                          {s.avgPosition.toFixed(1)}
                        </div>
                        <div style={{ fontSize: 10, color: isPositive ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
                          {isPositive ? '+' : ''}{s.totalNetPnlAmount.toFixed(2)}
                        </div>
                      </div>

                      <div style={{ fontSize: 14, color: 'var(--text-3)' }}>›</div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Individual League Standings */
            (() => {
              const lId = view === 'forex'
                ? leagues.find(l => l.divisionId === 'forex')?.id
                : leagues.find(l => l.divisionId === 'crypto')?.id;

              if (!lId) return <div style={{ color: 'var(--text-3)', textAlign: 'center', padding: 40 }}>League not found</div>;

              const ls = getLeagueStandings(lId);
              const league = leagues.find(l => l.id === lId)!;
              const round = rounds.find(r => r.leagueId === lId && r.roundNumber === league.activeRound);
              const allCompleted = round?.playerQueue.every(q => q.status === 'COMPLETED');

              return (
                <>
                  {allCompleted && (
                    <button
                      onClick={() => handleCompleteRound(league)}
                      style={{
                        width: '100%', padding: 13, background: 'var(--amber)', color: '#1a1200',
                        fontWeight: 700, fontSize: 14, borderRadius: 12, border: 'none',
                        cursor: 'pointer', marginBottom: 12,
                      }}>
                      🏁 Complete Round {round!.roundNumber} & Advance
                    </button>
                  )}

                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 8, fontWeight: 600 }}>
                    Ranked by Total ROI % · SL Limit {league.maxSlRiskPercent}% · Compounding {league.currency}
                  </div>

                  <div className="card">
                    {ls.map((s, i) => {
                      const team = teams.find(t => t.id === s.teamId);
                      return (
                        <div
                          key={s.teamId}
                          className="standing-row"
                          onClick={() => onSelectTeam(s.teamId)}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800,
                            background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : 'var(--bg-input)',
                            color: i < 3 ? '#0a0a0f' : 'var(--text-2)',
                          }}>
                            {s.rank}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: team?.primaryColor || '#888', flexShrink: 0 }} />
                              <span style={{ fontSize: 15, fontWeight: 700 }}>{team?.name || s.teamId}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                              {s.tradesCount} trades · {s.winRate.toFixed(0)}% win rate
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)',
                              color: s.totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)',
                            }}>
                              {s.totalPnlPercent >= 0 ? '+' : ''}{s.totalPnlPercent.toFixed(2)}%
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                              {formatCurrency(s.totalPnlAmount, league.currency)}
                            </div>
                          </div>

                          <div style={{ fontSize: 14, color: 'var(--text-3)' }}>›</div>
                        </div>
                      );
                    })}
                  </div>
                </>
              );
            })()
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
};
