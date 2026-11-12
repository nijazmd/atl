import { Team, Player, Division, League, Wallet, Round, RoundQueueItem } from '../types';

export const INITIAL_TEAMS: Team[] = [
  { id: 'AMC', name: 'AMC', shortName: 'AMC', primaryColor: '#8B5CF6', secondaryColor: '#6D28D9', textColor: '#FFFFFF' },
  { id: 'BIS', name: 'BIS', shortName: 'BIS', primaryColor: '#2563EB', secondaryColor: '#1D4ED8', textColor: '#FFFFFF' },
  { id: 'BOS', name: 'BOS', shortName: 'BOS', primaryColor: '#0EA5E9', secondaryColor: '#0284C7', textColor: '#FFFFFF' },
  { id: 'CAR', name: 'CAR', shortName: 'CAR', primaryColor: '#DC2626', secondaryColor: '#B91C1C', textColor: '#FFFFFF' },
  { id: 'FRE', name: 'FRE', shortName: 'FRE', primaryColor: '#92400E', secondaryColor: '#78350F', textColor: '#FFFFFF' },
  { id: 'GRE', name: 'GRE', shortName: 'GRE', primaryColor: '#15803D', secondaryColor: '#166534', textColor: '#FFFFFF' },
  { id: 'HST', name: 'HST', shortName: 'HST', primaryColor: '#FF0033', secondaryColor: '#CC0029', textColor: '#FFFFFF' },
  { id: 'OTT', name: 'OTT', shortName: 'OTT', primaryColor: '#EAB308', secondaryColor: '#CA8A04', textColor: '#0A0D14' },
  { id: 'PNX', name: 'PNX', shortName: 'PNX', primaryColor: '#F8FAFC', secondaryColor: '#475569', textColor: '#0A0D14' },
  { id: 'ZDG', name: 'ZDG', shortName: 'ZDG', primaryColor: '#16A34A', secondaryColor: '#15803D', textColor: '#FFFFFF' },
];

export const INITIAL_PLAYERS: Player[] = [
  // AMC
  { id: 'amc-1', name: 'Bosq', teamId: 'AMC' },
  { id: 'amc-2', name: 'Haadi', teamId: 'AMC' },
  // BIS
  { id: 'bis-1', name: 'Zain', teamId: 'BIS' },
  { id: 'bis-2', name: 'Blessi', teamId: 'BIS' },
  // BOS
  { id: 'bos-1', name: 'Boomer', teamId: 'BOS' },
  { id: 'bos-2', name: 'Blitz', teamId: 'BOS' },
  // CAR
  { id: 'car-1', name: 'Jonathan', teamId: 'CAR' },
  { id: 'car-2', name: 'Caspian', teamId: 'CAR' },
  // FRE
  { id: 'fre-1', name: 'Frost', teamId: 'FRE' },
  { id: 'fre-2', name: 'Falcon', teamId: 'FRE' },
  // GRE
  { id: 'gre-1', name: 'Grizz', teamId: 'GRE' },
  { id: 'gre-2', name: 'Gage', teamId: 'GRE' },
  // HST
  { id: 'hst-1', name: 'Fidel', teamId: 'HST' },
  { id: 'hst-2', name: 'Manish', teamId: 'HST' },
  // OTT
  { id: 'ott-1', name: 'Shaan', teamId: 'OTT' },
  { id: 'ott-2', name: 'Orion', teamId: 'OTT' },
  // PNX
  { id: 'pnx-1', name: 'Phoenix', teamId: 'PNX' },
  { id: 'pnx-2', name: 'Pulse', teamId: 'PNX' },
  // ZDG
  { id: 'zdg-1', name: 'Fincer', teamId: 'ZDG' },
  { id: 'zdg-2', name: 'Lancel', teamId: 'ZDG' },
];

export const INITIAL_DIVISIONS: Division[] = [
  { id: 'forex', name: 'Forex Division', icon: '💱', description: 'Currencies & Global FX Markets' },
  { id: 'crypto', name: 'Crypto Division', icon: '🪙', description: 'Digital Assets & Tokens' },
];

export const INITIAL_LEAGUES: League[] = [
  {
    id: 'forex-scalp',
    divisionId: 'forex',
    name: 'Forex Scalp',
    currency: 'USD',
    walletId: 'forex',
    activeRound: 1,
    maxSlRiskPercent: 1.0,
    description: 'High precision FX scalping (1% max SL limit)',
  },
  {
    id: 'crypto-scalp',
    divisionId: 'crypto',
    name: 'Crypto Scalp',
    currency: 'USDT',
    walletId: 'crypto',
    activeRound: 1,
    maxSlRiskPercent: 2.0,
    description: 'High volatility Crypto scalping (2% max SL limit)',
  },
];

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'master',
    name: 'ATL Master Treasury',
    currency: 'USD',
    balance: 200,
    startingBalance: 200,
    lockedMargin: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'forex',
    name: 'Forex Scalp Wallet',
    currency: 'USD',
    balance: 100,
    startingBalance: 100,
    lockedMargin: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crypto',
    name: 'Crypto Scalp Wallet',
    currency: 'USDT',
    balance: 100,
    startingBalance: 100,
    lockedMargin: 0,
    updatedAt: new Date().toISOString(),
  },
];

export function generateInitialRoundQueue(players: Player[] = INITIAL_PLAYERS): RoundQueueItem[] {
  // 20 players, position 20 down to 1
  return players.map((player, index) => ({
    playerId: player.id,
    playerName: player.name,
    teamId: player.teamId,
    position: 20 - index, // #20 trades first
    status: 'WAITING' as const,
  }));
}

export function generateInitialRound(leagueId: string, roundNumber: number = 1): Round {
  return {
    id: `${leagueId}-r${roundNumber}`,
    leagueId,
    roundNumber,
    status: 'ACTIVE',
    playerQueue: generateInitialRoundQueue(),
    startedAt: new Date().toISOString(),
  };
}

