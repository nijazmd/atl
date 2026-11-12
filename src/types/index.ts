export type Direction = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'TP_HIT' | 'SL_HIT' | 'MANUAL_EXIT' | 'CANCELLED';
export type PlayerQueueStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'PASSED';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  avatarUrl?: string;
  role?: string;
}

export interface Division {
  id: 'forex' | 'crypto';
  name: string;
  icon: string;
  description: string;
}

export interface League {
  id: string; // 'forex-scalp' | 'crypto-scalp'
  divisionId: 'forex' | 'crypto';
  name: string;
  currency: 'USD' | 'USDT';
  walletId: string;
  activeRound: number;
  maxSlRiskPercent: number; // e.g. 1.0 for Forex, 2.0 for Crypto
  description: string;
}

export interface TradeAdjustment {
  id: string;
  timestamp: string;
  type: 'SL_CHANGE' | 'TP_CHANGE';
  oldValue: number;
  newValue: number;
  note?: string;
}

export interface Trade {
  id: string;
  leagueId: string;
  roundNumber: number;
  playerId: string;
  playerName: string;
  teamId: string;
  instrument: string;
  direction: Direction;
  qty: number;
  entryPrice: number;
  tpPrice: number;
  slPrice: number;
  exitPrice?: number;
  status: TradeStatus;
  walletBalanceAtEntry: number;
  riskAmount: number;
  riskPercent: number;
  rewardAmount: number;
  rewardPercent: number;
  isRiskyTrade: boolean;
  pnlAmount?: number;
  pnlPercent?: number; // ROI % based on walletBalanceAtEntry
  openedAt: string;
  closedAt?: string;
  holdDurationSeconds?: number;
  adjustments: TradeAdjustment[];
}

export interface RoundQueueItem {
  playerId: string;
  playerName: string;
  teamId: string;
  position: number; // 20 down to 1
  status: PlayerQueueStatus;
  tradeId?: string;
}

export interface Round {
  id: string;
  leagueId: string;
  roundNumber: number;
  status: 'ACTIVE' | 'COMPLETED';
  playerQueue: RoundQueueItem[];
  startedAt: string;
  completedAt?: string;
}

export interface Wallet {
  id: string; // 'master' | 'forex' | 'crypto'
  name: string;
  currency: string;
  balance: number;
  startingBalance: number;
  lockedMargin: number;
  updatedAt: string;
}

export interface WalletSnapshot {
  id: string;
  walletId: string;
  timestamp: string;
  dateStr: string; // YYYY-MM-DD
  balance: number;
  changeAmount: number;
  changePercent: number;
  type: 'TRADE_EXIT' | 'DAILY' | 'TRANSFER' | 'DEPOSIT';
  referenceTradeId?: string;
  note?: string;
}

export interface LeagueStanding {
  teamId: string;
  teamName: string;
  rank: number;
  tradesCount: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnlAmount: number;
  totalPnlPercent: number;
  riskyTradesCount: number;
  avgHoldSeconds: number;
}

export interface MasterStanding {
  teamId: string;
  teamName: string;
  masterRank: number;
  avgPosition: number; // Average of ranks across all leagues
  leaguePositions: Record<string, number>; // leagueId -> rank
  leaguePnls: Record<string, number>; // leagueId -> pnlPercent
  totalNetPnlAmount: number;
  totalNetPnlPercent: number;
  bestLeagueFinish: number;
}

export interface PlayerStats {
  playerId: string;
  playerName: string;
  teamId: string;
  leagueId?: string; // undefined means all leagues combined
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnlPercent: number;
  totalPnlAmount: number;
  avgPnlPercent: number;
  longWins: number;
  longLosses: number;
  longWinRate: number;
  shortWins: number;
  shortLosses: number;
  shortWinRate: number;
  bestTradePercent: number;
  worstTradePercent: number;
  riskyTradesCount: number;
  avgHoldSeconds: number;
  tpChangesCount: number;
  slChangesCount: number;
}

