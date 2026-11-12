import React, { useState, useEffect, useMemo } from 'react';
import { Team, Player, League, Wallet, WalletSnapshot, Round, Trade } from './types';
import { storage } from './services/storageService';
import { calculateLeagueStandings, calculateMasterStandings } from './utils/calculations';
import { Header } from './components/Header';
import { TradeEntryPanel } from './components/TradeEntryPanel';
import { ActivePositions } from './components/ActivePositions';
import { RoundQueue } from './components/RoundQueue';
import { LeagueStandings } from './components/LeagueStandings';
import { MasterStandings } from './components/MasterStandings';
import { WalletManager } from './components/WalletManager';
import { PlayersDirectory } from './components/PlayersDirectory';
import { PlayerProfile } from './components/PlayerProfile';
import { TeamProfile } from './components/TeamProfile';
import { INITIAL_TEAMS, INITIAL_PLAYERS, INITIAL_LEAGUES, INITIAL_WALLETS } from './data/seedData';
import { Download, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';

export function App() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [leagues, setLeagues] = useState<League[]>(INITIAL_LEAGUES);
  const [wallets, setWallets] = useState<Wallet[]>(INITIAL_WALLETS);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [snapshots, setSnapshots] = useState<WalletSnapshot[]>([]);

  const [activeLeagueId, setActiveLeagueId] = useState<string>('forex-scalp');
  const [currentTab, setCurrentTab] = useState<'trade' | 'master' | 'wallets' | 'players'>('trade');
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

    return () => {
      unsubs.forEach(u => u());
    };
  }, []);

  const activeLeague = useMemo(() => {
    return leagues.find(l => l.id === activeLeagueId) || leagues[0];
  }, [leagues, activeLeagueId]);

  const activeRound = useMemo(() => {
    if (!activeLeague) return undefined;
    return rounds.find(r => r.leagueId === activeLeague.id && r.roundNumber === activeLeague.activeRound);
  }, [rounds, activeLeague]);

  const activeWallet = useMemo(() => {
    if (!activeLeague) return undefined;
    return wallets.find(w => w.id === activeLeague.walletId);
  }, [wallets, activeLeague]);

  const leagueStandings = useMemo(() => {
    return calculateLeagueStandings(activeLeagueId, trades, teams);
  }, [activeLeagueId, trades, teams]);

  const masterStandings = useMemo(() => {
    return calculateMasterStandings(teams, leagues, trades);
  }, [teams, leagues, trades]);

  // Selected Player or Team objects
  const selectedPlayer = useMemo(() => {
    return players.find(p => p.id === selectedPlayerId);
  }, [players, selectedPlayerId]);

  const selectedTeam = useMemo(() => {
    return teams.find(t => t.id === selectedTeamId);
  }, [teams, selectedTeamId]);

  // JSON Data Backup Export
  const handleExportBackup = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      teams,
      players,
      leagues,
      wallets,
      rounds,
      trades,
      snapshots,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ATL_Data_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center text-slate-400 font-mono text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Connecting to ATL Trading Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-slate-100 flex flex-col font-sans">
      {/* Top Fixed Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          setSelectedPlayerId(null);
          setSelectedTeamId(null);
        }}
        leagues={leagues}
        activeLeagueId={activeLeagueId}
        onSelectLeague={leagueId => {
          setActiveLeagueId(leagueId);
          setSelectedPlayerId(null);
          setSelectedTeamId(null);
        }}
        wallets={wallets}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 space-y-4">
        {/* Drill-Down Single Player Profile View */}
        {selectedPlayer ? (
          <PlayerProfile
            player={selectedPlayer}
            team={teams.find(t => t.id === selectedPlayer.teamId)}
            allTrades={trades}
            allPlayers={players}
            leagues={leagues}
            onBack={() => setSelectedPlayerId(null)}
          />
        ) : selectedTeam ? (
          /* Drill-Down Single Team Profile View */
          <TeamProfile
            team={selectedTeam}
            masterStanding={masterStandings.find(m => m.teamId === selectedTeam.id)}
            allPlayers={players}
            allTrades={trades}
            leagues={leagues}
            onBack={() => setSelectedTeamId(null)}
            onSelectPlayer={pid => {
              setSelectedTeamId(null);
              setSelectedPlayerId(pid);
            }}
          />
        ) : currentTab === 'trade' ? (
          /* TRADING DECK (Docked Inline UI) */
          <div className="space-y-4">
            {/* Inline Trade Entry (No Popups!) */}
            <TradeEntryPanel
              league={activeLeague}
              round={activeRound}
              wallet={activeWallet}
              players={players}
              teams={teams}
            />

            {/* Active Running Positions */}
            <ActivePositions
              trades={trades}
              teams={teams}
              leagueId={activeLeagueId}
            />

            {/* Turn Queue & Order of Play (#20 down to #1) */}
            <RoundQueue
              round={activeRound}
              trades={trades}
              teams={teams}
              players={players}
              leagueId={activeLeagueId}
            />

            {/* League Standings Ladder */}
            <LeagueStandings
              standings={leagueStandings}
              teams={teams}
              league={activeLeague}
              onSelectTeam={tid => setSelectedTeamId(tid)}
            />
          </div>
        ) : currentTab === 'master' ? (
          /* MASTER STANDINGS (Average Position Across Leagues) */
          <MasterStandings
            masterStandings={masterStandings}
            teams={teams}
            leagues={leagues}
            allTrades={trades}
            onSelectTeam={tid => setSelectedTeamId(tid)}
          />
        ) : currentTab === 'wallets' ? (
          /* WALLET & EQUITY CURVES OVER TIME */
          <WalletManager
            wallets={wallets}
            snapshots={snapshots}
          />
        ) : (
          /* PLAYERS DIRECTORY */
          <PlayersDirectory
            players={players}
            teams={teams}
            trades={trades}
            onSelectPlayer={pid => setSelectedPlayerId(pid)}
          />
        )}
      </main>

      {/* Footer Info & Quick Backup Tool */}
      <footer className="border-t border-[rgba(255,255,255,0.06)] py-3 px-4 bg-[#080a0f] text-[11px] text-slate-500 font-mono mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>Austin Trading League (ATL) • AL2 Ecosystem</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Firebase Firestore Cloud Sync</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
              title="Download JSON snapshot of all trades, wallets, and standings"
            >
              <Download size={12} />
              <span>Export Backup JSON</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

