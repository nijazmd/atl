import React, { useState } from 'react';
import { Team, MasterStanding, Player, Trade, League } from '../types';
import { formatCurrency, formatPercent, formatDuration, calculatePlayerStats } from '../utils/calculations';

interface TeamDetailScreenProps {
  team: Team;
  masterStanding?: MasterStanding;
  players: Player[];
  trades: Trade[];
  leagues: League[];
  onBack: () => void;
  onSelectPlayer: (id: string) => void;
}

export const TeamDetailScreen: React.FC<TeamDetailScreenProps> = ({
  team, masterStanding, players, trades, leagues, onBack, onSelectPlayer,
}) => {
  const [leagueFilter, setLeagueFilter] = useState('all');

  const teamPlayers = players.filter(p => p.teamId === team.id);
  const teamTrades = trades.filter(t =>
    t.teamId === team.id &&
    ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status) &&
    (leagueFilter === 'all' || t.leagueId === leagueFilter)
  );

  const totalPnlPct = teamTrades.reduce((acc, t) => acc + (t.pnlPercent ?? 0), 0);
  const totalPnlAmt = teamTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0);
  const wins = teamTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const winRate = teamTrades.length > 0 ? (wins / teamTrades.length) * 100 : 0;

  return (
    <div className="screen">
      <div className="safe-top" style={{ background: 'var(--bg-screen)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 10px' }}>
          <button onClick={onBack} style={{
            background: 'var(--bg-card)', border: 'none', borderRadius: 10,
            padding: '8px 14px', fontSize: 14, color: 'var(--text-1)', cursor: 'pointer', fontWeight: 600,
          }}>
            ‹ Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: team.primaryColor, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 900, fontSize: 13, color: team.textColor || '#fff',
            }}>
              {team.shortName}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{team.name}</div>
          </div>
        </div>

        {/* League filter */}
        <div style={{ padding: '0 20px 12px' }}>
          <div className="segment">
            <button className={`segment-btn ${leagueFilter === 'all' ? 'active' : ''}`} onClick={() => setLeagueFilter('all')}>Consolidated</button>
            {leagues.map(l => (
              <button key={l.id} className={`segment-btn ${leagueFilter === l.id ? 'active' : ''}`} onClick={() => setLeagueFilter(l.id)}>
                {l.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div style={{ padding: '0 20px' }}>

          {/* Master rank banner */}
          {masterStanding && leagueFilter === 'all' && (
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
              padding: 16, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  ATL Master Rank
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--amber)' }}>
                  #{masterStanding.masterRank}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                  Avg Position
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                  {masterStanding.avgPosition.toFixed(1)}
                </div>
              </div>
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div className="stat-label" style={{ textAlign: 'center' }}>ROI</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', color: totalPnlPct >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 4 }}>
                {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%
              </div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div className="stat-label" style={{ textAlign: 'center' }}>Win%</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{winRate.toFixed(0)}%</div>
            </div>
            <div className="metric-card" style={{ textAlign: 'center' }}>
              <div className="stat-label" style={{ textAlign: 'center' }}>Trades</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: 4 }}>{teamTrades.length}</div>
            </div>
          </div>

          {/* Traders */}
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
            Nominated Traders
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            {teamPlayers.map((p, i) => {
              const stats = calculatePlayerStats(p.id, trades, players, leagueFilter === 'all' ? undefined : leagueFilter);
              const isLast = i === teamPlayers.length - 1;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
                    borderBottom: isLast ? 'none' : '1px solid var(--border)', cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 12, background: team.primaryColor, color: team.textColor || '#fff',
                  }}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {stats.totalTrades} trades · {stats.winRate.toFixed(0)}% win
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: stats.totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {formatPercent(stats.totalPnlPercent)}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-3)' }}>›</div>
                </div>
              );
            })}
          </div>

          {/* Trade ledger */}
          {teamTrades.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Trade Ledger ({teamTrades.length})
              </div>
              <div className="card">
                {teamTrades.map((t, i) => {
                  const gain = (t.pnlPercent ?? 0) >= 0;
                  return (
                    <div key={t.id} style={{
                      padding: '12px 16px',
                      borderBottom: i < teamTrades.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                            background: t.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
                            color: t.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {t.direction === 'LONG' ? '↗' : '↘'}
                          </span>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 14 }}>{t.instrument}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{t.playerName}</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: gain ? 'var(--green)' : 'var(--red)' }}>
                          {t.pnlPercent !== undefined ? formatPercent(t.pnlPercent) : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        R{t.roundNumber} · Entry {t.entryPrice} → {t.exitPrice ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
};

