import React, { useState, useEffect, useMemo } from 'react';
import { Team, Player, League, Wallet, WalletSnapshot, Round, Trade, MasterStanding } from './types';
import { storage } from './services/storageService';
import { calculateMasterStandings } from './utils/calculations';
import { BottomNav } from './components/BottomNav';
import { TradeScreen } from './screens/TradeScreen';
import { StandingsScreen } from './screens/StandingsScreen';
import { WalletsScreen } from './screens/WalletsScreen';
import { PlayersScreen, PlayerDetailScreen } from './screens/PlayersScreen';
import { TeamDetailScreen } from './screens/TeamDetailScreen';
import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_LEAGUES, INITIAL_WALLETS } from './data/seedData';

type Tab = 'trade' | 'standings' | 'wallets' | 'players';

export function App() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [leagues, setLeagues] = useState<League[]>(INITIAL_LEAGUES);
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [snapshots, setSnapshots] = useState<WalletSnapshot[]>([]);

  const [activeLeagueId, setActiveLeagueId] = useState<string>('forex-scalp');
  const [currentTab, setCurrentTab] = useState<Tab>('trade');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize Storage & Subscriptions
  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const start = async () => {
      await storage.initialize();

      unsubs.push(storage.subscribeTeams(setTeams));
      unsubs.push(storage.subscribePlayers(setPlayers));
      unsubs.push(storage.subscribeLeagues(setLeagues));
      unsubs.push(storage.subscribeWallets(setWallets));
      unsubs.push(storage.subscribeRounds(setRounds));
      unsubs.push(storage.subscribeTrades(setTrades));
      unsubs.push(storage.subscribeSnapshots(setSnapshots));

      setIsLoading(false);
    };

    start();
    return () => { unsubs.forEach(u => u()); };
  }, []);

  const activeLeague = useMemo(() =>
    leagues.find(l => l.id === activeLeagueId) || leagues[0],
    [leagues, activeLeagueId]
  );

  const activeRound = useMemo(() => {
    if (!activeLeague) return undefined;
    return rounds.find(r => r.leagueId === activeLeague.id && r.roundNumber === activeLeague.activeRound);
  }, [rounds, activeLeague]);

  const activeWallet = useMemo(() =>
    wallets.find(w => w.id === activeLeague?.walletId),
    [wallets, activeLeague]
  );

  const openTrades = useMemo(() =>
    trades.filter(t => t.leagueId === activeLeagueId && t.status === 'OPEN'),
    [trades, activeLeagueId]
  );

  const masterStandings = useMemo(() =>
    calculateMasterStandings(teams, leagues, trades),
    [teams, leagues, trades]
  );

  const selectedPlayer = useMemo(() =>
    players.find(p => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  const selectedTeam = useMemo(() =>
    teams.find(t => t.id === selectedTeamId),
    [teams, selectedTeamId]
  );

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
    setSelectedPlayerId(null);
    setSelectedTeamId(null);
  };

  const handleSelectTeam = (tid: string) => {
    setSelectedTeamId(tid);
    setSelectedPlayerId(null);
  };

  const handleSelectPlayer = (pid: string) => {
    setSelectedPlayerId(pid);
    setSelectedTeamId(null);
  };

  const handleBack = () => {
    setSelectedPlayerId(null);
    setSelectedTeamId(null);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100dvh', background: '#0a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(34,197,94,0.2)',
          borderTopColor: '#22c55e',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: '#5a5a70', fontWeight: 500 }}>Connecting to ATL…</div>
      </div>
    );
  }

  // Drill-down: player detail screen
  if (selectedPlayer) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-screen)' }}>
        <PlayerDetailScreen
          player={selectedPlayer}
          teams={teams}
          trades={trades}
          players={players}
          leagues={leagues}
          onBack={handleBack}
        />
      </div>
    );
  }

  // Drill-down: team detail screen
  if (selectedTeam) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-screen)' }}>
        <TeamDetailScreen
          team={selectedTeam}
          masterStanding={masterStandings.find(m => m.teamId === selectedTeam.id)}
          players={players}
          trades={trades}
          leagues={leagues}
          onBack={handleBack}
          onSelectPlayer={handleSelectPlayer}
        />
      </div>
    );
  }

  // Main tabbed UI
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-screen)' }}>
      {/* Screens */}
      {currentTab === 'trade' && (
        <TradeScreen
          league={activeLeague}
          round={activeRound}
          wallet={activeWallet}
          players={players}
          teams={teams}
          openTrades={openTrades}
          leagues={leagues}
          wallets={wallets}
          onLeagueChange={id => setActiveLeagueId(id)}
        />
      )}

      {currentTab === 'standings' && (
        <StandingsScreen
          teams={teams}
          leagues={leagues}
          trades={trades}
          rounds={rounds}
          onSelectTeam={handleSelectTeam}
        />
      )}

      {currentTab === 'wallets' && (
        <WalletsScreen
          wallets={wallets}
          snapshots={snapshots}
        />
      )}

      {currentTab === 'players' && (
        <PlayersScreen
          players={players}
          teams={teams}
          trades={trades}
          leagues={leagues}
          onSelectPlayer={handleSelectPlayer}
        />
      )}

      {/* iOS Bottom Nav */}
      <BottomNav active={currentTab} onChange={handleTabChange} />
    </div>
  );
}

export default App;
