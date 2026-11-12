import { Trade, Team, League, LeagueStanding, MasterStanding, PlayerStats, Player } from '../types';

export function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const mins = Math.floor(seconds / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remHours = hours % 24;
    return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
  }
  if (hours > 0) {
    const remMins = mins % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }
  if (mins > 0) {
    const remSecs = seconds % 60;
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = currency === 'USDT' ? '₮' : '$';
  const isNeg = amount < 0;
  const abs = Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${isNeg ? '-' : ''}${symbol}${abs}`;
}

export function formatPercent(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

// Compute Standings for a specific League
export function calculateLeagueStandings(
  leagueId: string,
  trades: Trade[],
  teams: Team[]
): LeagueStanding[] {
  const closedTrades = trades.filter(
    t => t.leagueId === leagueId && ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status)
  );

  const standings: LeagueStanding[] = teams.map(team => {
    const teamTrades = closedTrades.filter(t => t.teamId === team.id);
    const tradesCount = teamTrades.length;
    const wins = teamTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
    const losses = teamTrades.filter(t => (t.pnlAmount ?? 0) < 0).length;
    const winRate = tradesCount > 0 ? Number(((wins / tradesCount) * 100).toFixed(1)) : 0;
    const totalPnlAmount = Number(teamTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0).toFixed(2));
    const totalPnlPercent = Number(teamTrades.reduce((acc, t) => acc + (t.pnlPercent ?? 0), 0).toFixed(2));
    const riskyTradesCount = teamTrades.filter(t => t.isRiskyTrade).length;

    const totalSeconds = teamTrades.reduce((acc, t) => acc + (t.holdDurationSeconds ?? 0), 0);
    const avgHoldSeconds = tradesCount > 0 ? Math.round(totalSeconds / tradesCount) : 0;

    return {
      teamId: team.id,
      teamName: team.name,
      rank: 0,
      tradesCount,
      wins,
      losses,
      winRate,
      totalPnlAmount,
      totalPnlPercent,
      riskyTradesCount,
      avgHoldSeconds,
    };
  });

  // Sort by totalPnlPercent descending (highest % ROI is rank 1)
  // Tiebreakers: totalPnlAmount desc -> winRate desc
  standings.sort((a, b) => {
    if (b.totalPnlPercent !== a.totalPnlPercent) {
      return b.totalPnlPercent - a.totalPnlPercent;
    }
    if (b.totalPnlAmount !== a.totalPnlAmount) {
      return b.totalPnlAmount - a.totalPnlAmount;
    }
    return b.winRate - a.winRate;
  });

  // Assign ranks 1 to 10
  return standings.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

// Compute Master Standings based on Average Position across leagues
export function calculateMasterStandings(
  teams: Team[],
  leagues: League[],
  allTrades: Trade[]
): MasterStanding[] {
  // 1. Get league rankings map: leagueId -> { teamId: rank, pnlPercent }
  const leagueRankMaps: Record<string, Record<string, { rank: number; pnlPercent: number; pnlAmount: number }>> = {};

  leagues.forEach(league => {
    const standings = calculateLeagueStandings(league.id, allTrades, teams);
    leagueRankMaps[league.id] = {};
    standings.forEach(s => {
      leagueRankMaps[league.id][s.teamId] = {
        rank: s.rank,
        pnlPercent: s.totalPnlPercent,
        pnlAmount: s.totalPnlAmount,
      };
    });
  });

  const master: MasterStanding[] = teams.map(team => {
    const leaguePositions: Record<string, number> = {};
    const leaguePnls: Record<string, number> = {};
    let sumPositions = 0;
    let totalNetPnlAmount = 0;
    let totalNetPnlPercent = 0;
    let bestLeagueFinish = 999;

    leagues.forEach(league => {
      const data = leagueRankMaps[league.id]?.[team.id] || { rank: 10, pnlPercent: 0, pnlAmount: 0 };
      leaguePositions[league.id] = data.rank;
      leaguePnls[league.id] = data.pnlPercent;
      sumPositions += data.rank;
      totalNetPnlAmount += data.pnlAmount;
      totalNetPnlPercent += data.pnlPercent;
      if (data.rank < bestLeagueFinish) {
        bestLeagueFinish = data.rank;
      }
    });

    const activeLeagueCount = Math.max(1, leagues.length);
    const avgPosition = Number((sumPositions / activeLeagueCount).toFixed(2));

    return {
      teamId: team.id,
      teamName: team.name,
      masterRank: 0,
      avgPosition,
      leaguePositions,
      leaguePnls,
      totalNetPnlAmount: Number(totalNetPnlAmount.toFixed(2)),
      totalNetPnlPercent: Number(totalNetPnlPercent.toFixed(2)),
      bestLeagueFinish: bestLeagueFinish === 999 ? 10 : bestLeagueFinish,
    };
  });

  // Sort by Average Position ascending (1.0 is best)
  // Tiebreaker 1: Best single league finish (e.g. 1st beats two 5ths)
  // Tiebreaker 2: Total Net PnL amount desc
  master.sort((a, b) => {
    if (a.avgPosition !== b.avgPosition) {
      return a.avgPosition - b.avgPosition;
    }
    if (a.bestLeagueFinish !== b.bestLeagueFinish) {
      return a.bestLeagueFinish - b.bestLeagueFinish; // Lower rank finish is better
    }
    return b.totalNetPnlAmount - a.totalNetPnlAmount;
  });

  return master.map((item, index) => ({
    ...item,
    masterRank: index + 1,
  }));
}

// Compute Individual Player Stats
export function calculatePlayerStats(
  playerId: string,
  allTrades: Trade[],
  allPlayers: Player[],
  leagueId?: string
): PlayerStats {
  const player = allPlayers.find(p => p.id === playerId) || { id: playerId, name: 'Unknown', teamId: '' };
  
  let playerTrades = allTrades.filter(
    t => t.playerId === playerId && ['TP_HIT', 'SL_HIT', 'MANUAL_EXIT'].includes(t.status)
  );
  if (leagueId) {
    playerTrades = playerTrades.filter(t => t.leagueId === leagueId);
  }

  const totalTrades = playerTrades.length;
  const wins = playerTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const losses = playerTrades.filter(t => (t.pnlAmount ?? 0) < 0).length;
  const winRate = totalTrades > 0 ? Number(((wins / totalTrades) * 100).toFixed(1)) : 0;

  const longTrades = playerTrades.filter(t => t.direction === 'LONG');
  const longWins = longTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const longLosses = longTrades.filter(t => (t.pnlAmount ?? 0) < 0).length;
  const longWinRate = longTrades.length > 0 ? Number(((longWins / longTrades.length) * 100).toFixed(1)) : 0;

  const shortTrades = playerTrades.filter(t => t.direction === 'SHORT');
  const shortWins = shortTrades.filter(t => (t.pnlAmount ?? 0) > 0).length;
  const shortLosses = shortTrades.filter(t => (t.pnlAmount ?? 0) < 0).length;
  const shortWinRate = shortTrades.length > 0 ? Number(((shortWins / shortTrades.length) * 100).toFixed(1)) : 0;

  const totalPnlAmount = Number(playerTrades.reduce((acc, t) => acc + (t.pnlAmount ?? 0), 0).toFixed(2));
  const totalPnlPercent = Number(playerTrades.reduce((acc, t) => acc + (t.pnlPercent ?? 0), 0).toFixed(2));
  const avgPnlPercent = totalTrades > 0 ? Number((totalPnlPercent / totalTrades).toFixed(2)) : 0;

  let bestTradePercent = 0;
  let worstTradePercent = 0;
  if (totalTrades > 0) {
    const pnlList = playerTrades.map(t => t.pnlPercent ?? 0);
    bestTradePercent = Math.max(...pnlList);
    worstTradePercent = Math.min(...pnlList);
  }

  const riskyTradesCount = playerTrades.filter(t => t.isRiskyTrade).length;
  const totalSeconds = playerTrades.reduce((acc, t) => acc + (t.holdDurationSeconds ?? 0), 0);
  const avgHoldSeconds = totalTrades > 0 ? Math.round(totalSeconds / totalTrades) : 0;

  let tpChangesCount = 0;
  let slChangesCount = 0;
  playerTrades.forEach(t => {
    (t.adjustments || []).forEach(adj => {
      if (adj.type === 'TP_CHANGE') tpChangesCount++;
      if (adj.type === 'SL_CHANGE') slChangesCount++;
    });
  });

  return {
    playerId,
    playerName: player.name,
    teamId: player.teamId,
    leagueId,
    totalTrades,
    wins,
    losses,
    winRate,
    totalPnlPercent,
    totalPnlAmount,
    avgPnlPercent,
    longWins,
    longLosses,
    longWinRate,
    shortWins,
    shortLosses,
    shortWinRate,
    bestTradePercent,
    worstTradePercent,
    riskyTradesCount,
    avgHoldSeconds,
    tpChangesCount,
    slChangesCount,
  };
}

