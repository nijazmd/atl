import React, { useState } from 'react';
import { Player, Team, Trade, League } from '../types';
import { calculatePlayerStats, formatCurrency, formatPercent, formatDuration } from '../utils/calculations';

interface PlayersScreenProps {
  players: Player[];
  teams: Team[];
  trades: Trade[];
  leagues: League[];
  onSelectPlayer: (id: string) => void;
}

export const PlayersScreen: React.FC<PlayersScreenProps> = ({ players, teams, trades, leagues, onSelectPlayer }) => {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');

  const filtered = players.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchTeam = teamFilter === 'ALL' || p.teamId === teamFilter;
    return matchSearch && matchTeam;
  });

  return (
    <div className="screen">
      <div className="safe-top" style={{ background: 'var(--bg-screen)', padding: '12px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 12 }}>Players</div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
          <input
            className="input-field"
            style={{ paddingLeft: 38 }}
            placeholder="Search trader..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Team filter chips */}
        <div style={{
          display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12,
          scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
        }}>
          <button
            onClick={() => setTeamFilter('ALL')}
            style={{
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700, flexShrink: 0,
              background: teamFilter === 'ALL' ? 'var(--green)' : 'var(--bg-card)',
              color: teamFilter === 'ALL' ? '#0a1a0d' : 'var(--text-2)',
            }}>
            All
          </button>
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setTeamFilter(t.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: teamFilter === t.id ? t.primaryColor : 'var(--bg-card)',
                color: teamFilter === t.id ? (t.textColor || '#fff') : 'var(--text-2)',
              }}>
              {t.shortName}
            </button>
          ))}
        </div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div style={{ padding: '0 20px' }}>
          <div className="card">
            {filtered.map((p, i) => {
              const team = teams.find(t => t.id === p.teamId);
              const stats = calculatePlayerStats(p.id, trades, players);
              const isLast = i === filtered.length - 1;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center',
                    padding: '14px 16px', gap: 12,
                    borderBottom: isLast ? 'none' : '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 14, color: '#fff',
                    background: team?.primaryColor || '#8B5CF6',
                  }}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                      {team?.name || p.teamId} · {stats.totalTrades} trades · {stats.winRate.toFixed(0)}% win rate
                    </div>
                  </div>

                  {/* PnL */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)',
                      color: stats.totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)',
                    }}>
                      {stats.totalPnlPercent >= 0 ? '+' : ''}{stats.totalPnlPercent.toFixed(1)}%
                    </div>
                    {stats.riskyTradesCount > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--red)', marginTop: 2 }}>⚠️ {stats.riskyTradesCount} risky</div>
                    )}
                  </div>

                  <div style={{ fontSize: 14, color: 'var(--text-3)' }}>›</div>
                </div>
              );
            })}
          </div>
          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
};


// Player detail screen
interface PlayerDetailScreenProps {
  player: Player;
  teams: Team[];
  trades: Trade[];
  players: Player[];
  leagues: League[];
  onBack: () => void;
}

export const PlayerDetailScreen: React.FC<PlayerDetailScreenProps> = ({
  player, teams, trades, players, leagues, onBack,
}) => {
  const [leagueFilter, setLeagueFilter] = useState('all');
  const team = teams.find(t => t.id === player.teamId);
  const stats = calculatePlayerStats(player.id, trades, players, leagueFilter === 'all' ? undefined : leagueFilter);

  const playerTrades = trades.filter(t =>
    t.playerId === player.id &&
    ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status) &&
    (leagueFilter === 'all' || t.leagueId === leagueFilter)
  );

  return (
    <div className="screen">
      {/* Back header */}
      <div className="safe-top" style={{ background: 'var(--bg-screen)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px 12px' }}>
          <button onClick={onBack} style={{
            background: 'var(--bg-card)', border: 'none', borderRadius: 10,
            padding: '8px 14px', fontSize: 14, color: 'var(--text-1)', cursor: 'pointer', fontWeight: 600,
          }}>
            ‹ Back
          </button>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{player.name}</div>
        </div>

        {/* League filter */}
        <div style={{ padding: '0 20px 12px' }}>
          <div className="segment">
            <button className={`segment-btn ${leagueFilter === 'all' ? 'active' : ''}`} onClick={() => setLeagueFilter('all')}>All</button>
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
          {/* Hero stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="metric-card">
              <div className="stat-label">Total ROI</div>
              <div className="stat-value" style={{ color: stats.totalPnlPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {formatPercent(stats.totalPnlPercent)}
              </div>
            </div>
            <div className="metric-card">
              <div className="stat-label">Net Profit</div>
              <div className="stat-value" style={{ color: stats.totalPnlAmount >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 18 }}>
                {formatCurrency(stats.totalPnlAmount)}
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              {[
                ['Trades', stats.totalTrades],
                ['Win Rate', `${stats.winRate.toFixed(0)}%`],
                ['Long Win%', `${stats.longWinRate.toFixed(0)}%`],
                ['Short Win%', `${stats.shortWinRate.toFixed(0)}%`],
                ['Best Trade', formatPercent(stats.bestTradePercent)],
                ['Worst Trade', formatPercent(stats.worstTradePercent)],
                ['Avg Hold', formatDuration(stats.avgHoldSeconds)],
                ['Risky Trades', stats.riskyTradesCount],
              ].map(([label, value], i) => (
                <div key={i} style={{
                  padding: '12px 16px',
                  borderBottom: i < 6 ? '1px solid var(--border)' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade history */}
          {playerTrades.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Trade History ({playerTrades.length})
              </div>
              <div className="card">
                {playerTrades.map((t, i) => {
                  const gain = (t.pnlPercent ?? 0) >= 0;
                  return (
                    <div key={t.id} style={{
                      padding: '12px 16px',
                      borderBottom: i < playerTrades.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 5,
                            background: t.direction === 'LONG' ? 'var(--green-bg)' : 'var(--red-bg)',
                            color: t.direction === 'LONG' ? 'var(--green)' : 'var(--red)',
                          }}>
                            {t.direction === 'LONG' ? '↗' : '↘'} {t.direction}
                          </span>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{t.instrument}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>R{t.roundNumber}</span>
                        </div>
                        <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: gain ? 'var(--green)' : 'var(--red)' }}>
                          {t.pnlPercent !== undefined ? formatPercent(t.pnlPercent) : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)' }}>
                        <span>Entry {t.entryPrice} → {t.exitPrice ?? '—'}</span>
                        <span style={{
                          padding: '2px 6px', borderRadius: 5, fontWeight: 600,
                          background: t.status === 'TP_HIT' ? 'var(--green-bg)' : t.status === 'SL_HIT' ? 'var(--red-bg)' : 'var(--amber-bg)',
                          color: t.status === 'TP_HIT' ? 'var(--green)' : t.status === 'SL_HIT' ? 'var(--red)' : 'var(--amber)',
                        }}>
                          {t.status}
                        </span>
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
