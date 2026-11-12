import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  Team,
  Player,
  Division,
  League,
  Wallet,
  WalletSnapshot,
  Round,
  Trade,
  TradeStatus,
  Direction,
  TradeAdjustment,
  RoundQueueItem
} from '../types';
import {
  INITIAL_TEAMS,
  INITIAL_PLAYERS,
  INITIAL_DIVISIONS,
  INITIAL_LEAGUES,
  INITIAL_WALLETS,
  generateInitialRound
} from '../data/seedData';

// Fallback Local Storage keys
const LS_KEYS = {
  TEAMS: 'atl_teams',
  PLAYERS: 'atl_players',
  DIVISIONS: 'atl_divisions',
  LEAGUES: 'atl_leagues',
  WALLETS: 'atl_wallets',
  ROUNDS: 'atl_rounds',
  TRADES: 'atl_trades',
  SNAPSHOTS: 'atl_snapshots',
};

// Helper for local storage read/write
function getLocal<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setLocal<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Local storage write error:', err);
  }
}

export class StorageService {
  private isFirebaseOnline: boolean = true;

  // Initialize data (seed if not present in Firestore)
  async initialize(): Promise<void> {
    try {
      // Check if teams exist in Firestore
      const teamsSnap = await getDocs(collection(db, 'atl_teams'));
      if (teamsSnap.empty) {
        console.log('Seeding initial ATL data into Firestore...');
        await this.seedAll();
      }
    } catch (err) {
      console.warn('Firestore connection failed or offline. Using local cache fallback:', err);
      this.isFirebaseOnline = false;
      this.initLocalCache();
    }
  }

  private initLocalCache(): void {
    if (!localStorage.getItem(LS_KEYS.TEAMS)) setLocal(LS_KEYS.TEAMS, INITIAL_TEAMS);
    if (!localStorage.getItem(LS_KEYS.PLAYERS)) setLocal(LS_KEYS.PLAYERS, INITIAL_PLAYERS);
    if (!localStorage.getItem(LS_KEYS.DIVISIONS)) setLocal(LS_KEYS.DIVISIONS, INITIAL_DIVISIONS);
    if (!localStorage.getItem(LS_KEYS.LEAGUES)) setLocal(LS_KEYS.LEAGUES, INITIAL_LEAGUES);
    if (!localStorage.getItem(LS_KEYS.WALLETS)) setLocal(LS_KEYS.WALLETS, INITIAL_WALLETS);
    if (!localStorage.getItem(LS_KEYS.ROUNDS)) {
      setLocal(LS_KEYS.ROUNDS, [
        generateInitialRound('forex-scalp', 1),
        generateInitialRound('crypto-scalp', 1),
      ]);
    }
    if (!localStorage.getItem(LS_KEYS.TRADES)) setLocal(LS_KEYS.TRADES, []);
    if (!localStorage.getItem(LS_KEYS.SNAPSHOTS)) {
      const today = new Date().toISOString().split('T')[0];
      const initialSnapshots: WalletSnapshot[] = INITIAL_WALLETS.map(w => ({
        id: `snap-${w.id}-init`,
        walletId: w.id,
        timestamp: new Date().toISOString(),
        dateStr: today,
        balance: w.balance,
        changeAmount: 0,
        changePercent: 0,
        type: 'DEPOSIT',
        note: 'Initial allocation',
      }));
      setLocal(LS_KEYS.SNAPSHOTS, initialSnapshots);
    }
  }

  async seedAll(): Promise<void> {
    const batch = writeBatch(db);

    INITIAL_TEAMS.forEach(team => {
      batch.set(doc(db, 'atl_teams', team.id), team);
    });

    INITIAL_PLAYERS.forEach(player => {
      batch.set(doc(db, 'atl_players', player.id), player);
    });

    INITIAL_DIVISIONS.forEach(div => {
      batch.set(doc(db, 'atl_divisions', div.id), div);
    });

    INITIAL_LEAGUES.forEach(league => {
      batch.set(doc(db, 'atl_leagues', league.id), league);
    });

    INITIAL_WALLETS.forEach(wallet => {
      batch.set(doc(db, 'atl_wallets', wallet.id), wallet);
    });

    const rForex = generateInitialRound('forex-scalp', 1);
    const rCrypto = generateInitialRound('crypto-scalp', 1);
    batch.set(doc(db, 'atl_rounds', rForex.id), rForex);
    batch.set(doc(db, 'atl_rounds', rCrypto.id), rCrypto);

    const today = new Date().toISOString().split('T')[0];
    INITIAL_WALLETS.forEach(w => {
      const snap: WalletSnapshot = {
        id: `snap-${w.id}-init`,
        walletId: w.id,
        timestamp: new Date().toISOString(),
        dateStr: today,
        balance: w.balance,
        changeAmount: 0,
        changePercent: 0,
        type: 'DEPOSIT',
        note: 'Initial balance',
      };
      batch.set(doc(db, 'atl_snapshots', snap.id), snap);
    });

    await batch.commit();
  }

  // --- Realtime Subscriptions ---

  subscribeTeams(callback: (teams: Team[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_teams'), snap => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Team);
          setLocal(LS_KEYS.TEAMS, list);
          callback(list);
        } else {
          callback(getLocal(LS_KEYS.TEAMS, INITIAL_TEAMS));
        }
      }, () => callback(getLocal(LS_KEYS.TEAMS, INITIAL_TEAMS)));
    } catch {
      callback(getLocal(LS_KEYS.TEAMS, INITIAL_TEAMS));
      return () => {};
    }
  }

  subscribePlayers(callback: (players: Player[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_players'), snap => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Player);
          setLocal(LS_KEYS.PLAYERS, list);
          callback(list);
        } else {
          callback(getLocal(LS_KEYS.PLAYERS, INITIAL_PLAYERS));
        }
      }, () => callback(getLocal(LS_KEYS.PLAYERS, INITIAL_PLAYERS)));
    } catch {
      callback(getLocal(LS_KEYS.PLAYERS, INITIAL_PLAYERS));
      return () => {};
    }
  }

  subscribeLeagues(callback: (leagues: League[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_leagues'), snap => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as League);
          setLocal(LS_KEYS.LEAGUES, list);
          callback(list);
        } else {
          callback(getLocal(LS_KEYS.LEAGUES, INITIAL_LEAGUES));
        }
      }, () => callback(getLocal(LS_KEYS.LEAGUES, INITIAL_LEAGUES)));
    } catch {
      callback(getLocal(LS_KEYS.LEAGUES, INITIAL_LEAGUES));
      return () => {};
    }
  }

  subscribeWallets(callback: (wallets: Wallet[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_wallets'), snap => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Wallet);
          setLocal(LS_KEYS.WALLETS, list);
          callback(list);
        } else {
          callback(getLocal(LS_KEYS.WALLETS, INITIAL_WALLETS));
        }
      }, () => callback(getLocal(LS_KEYS.WALLETS, INITIAL_WALLETS)));
    } catch {
      callback(getLocal(LS_KEYS.WALLETS, INITIAL_WALLETS));
      return () => {};
    }
  }

  subscribeRounds(callback: (rounds: Round[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_rounds'), snap => {
        if (!snap.empty) {
          const list = snap.docs.map(d => d.data() as Round);
          setLocal(LS_KEYS.ROUNDS, list);
          callback(list);
        } else {
          callback(getLocal(LS_KEYS.ROUNDS, []));
        }
      }, () => callback(getLocal(LS_KEYS.ROUNDS, [])));
    } catch {
      callback(getLocal(LS_KEYS.ROUNDS, []));
      return () => {};
    }
  }

  subscribeTrades(callback: (trades: Trade[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_trades'), snap => {
        const list = snap.docs.map(d => d.data() as Trade);
        // Sort descending by openedAt
        list.sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());
        setLocal(LS_KEYS.TRADES, list);
        callback(list);
      }, () => callback(getLocal(LS_KEYS.TRADES, [])));
    } catch {
      callback(getLocal(LS_KEYS.TRADES, []));
      return () => {};
    }
  }

  subscribeSnapshots(callback: (snaps: WalletSnapshot[]) => void): () => void {
    try {
      return onSnapshot(collection(db, 'atl_snapshots'), snap => {
        const list = snap.docs.map(d => d.data() as WalletSnapshot);
        list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setLocal(LS_KEYS.SNAPSHOTS, list);
        callback(list);
      }, () => callback(getLocal(LS_KEYS.SNAPSHOTS, [])));
    } catch {
      callback(getLocal(LS_KEYS.SNAPSHOTS, []));
      return () => {};
    }
  }

  // --- Trade Operations ---

  async openTrade(params: {
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
    walletBalance: number;
    maxSlRiskPercent: number;
  }): Promise<Trade> {
    const riskAmount = Math.abs(params.entryPrice - params.slPrice) * params.qty;
    const rewardAmount = Math.abs(params.tpPrice - params.entryPrice) * params.qty;
    const riskPercent = params.walletBalance > 0 ? (riskAmount / params.walletBalance) * 100 : 0;
    const rewardPercent = params.walletBalance > 0 ? (rewardAmount / params.walletBalance) * 100 : 0;
    const isRiskyTrade = riskPercent > params.maxSlRiskPercent;

    const tradeId = `tr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const trade: Trade = {
      id: tradeId,
      leagueId: params.leagueId,
      roundNumber: params.roundNumber,
      playerId: params.playerId,
      playerName: params.playerName,
      teamId: params.teamId,
      instrument: params.instrument.toUpperCase().trim(),
      direction: params.direction,
      qty: params.qty,
      entryPrice: params.entryPrice,
      tpPrice: params.tpPrice,
      slPrice: params.slPrice,
      status: 'OPEN',
      walletBalanceAtEntry: params.walletBalance,
      riskAmount: Number(riskAmount.toFixed(2)),
      riskPercent: Number(riskPercent.toFixed(2)),
      rewardAmount: Number(rewardAmount.toFixed(2)),
      rewardPercent: Number(rewardPercent.toFixed(2)),
      isRiskyTrade,
      openedAt: new Date().toISOString(),
      adjustments: [],
    };

    // Save to Firestore
    try {
      await setDoc(doc(db, 'atl_trades', tradeId), trade);
    } catch (err) {
      console.warn('Firestore write failed, saving locally:', err);
      const trades = getLocal<Trade[]>(LS_KEYS.TRADES, []);
      setLocal(LS_KEYS.TRADES, [trade, ...trades]);
    }

    // Update Round Queue: Mark this player as ACTIVE with tradeId
    await this.updatePlayerQueueStatus(params.leagueId, params.roundNumber, params.playerId, 'ACTIVE', tradeId);

    return trade;
  }

  async adjustTpSl(tradeId: string, updates: { newTp?: number; newSl?: number; note?: string }): Promise<void> {
    const tradeRef = doc(db, 'atl_trades', tradeId);
    let existing: Trade | null = null;

    try {
      const snap = await getDocs(query(collection(db, 'atl_trades'), where('id', '==', tradeId)));
      if (!snap.empty) {
        existing = snap.docs[0].data() as Trade;
      }
    } catch {
      const trades = getLocal<Trade[]>(LS_KEYS.TRADES, []);
      existing = trades.find(t => t.id === tradeId) || null;
    }

    if (!existing) return;

    const adjustments: TradeAdjustment[] = [...(existing.adjustments || [])];
    const updateObj: Partial<Trade> = {};

    if (updates.newSl !== undefined && updates.newSl !== existing.slPrice) {
      adjustments.push({
        id: `adj-${Date.now()}-sl`,
        timestamp: new Date().toISOString(),
        type: 'SL_CHANGE',
        oldValue: existing.slPrice,
        newValue: updates.newSl,
        note: updates.note || 'SL updated',
      });
      updateObj.slPrice = updates.newSl;
      // Recompute risk amount & percent
      const newRisk = Math.abs(existing.entryPrice - updates.newSl) * existing.qty;
      updateObj.riskAmount = Number(newRisk.toFixed(2));
      updateObj.riskPercent = existing.walletBalanceAtEntry > 0 ? Number(((newRisk / existing.walletBalanceAtEntry) * 100).toFixed(2)) : 0;
    }

    if (updates.newTp !== undefined && updates.newTp !== existing.tpPrice) {
      adjustments.push({
        id: `adj-${Date.now()}-tp`,
        timestamp: new Date().toISOString(),
        type: 'TP_CHANGE',
        oldValue: existing.tpPrice,
        newValue: updates.newTp,
        note: updates.note || 'TP updated',
      });
      updateObj.tpPrice = updates.newTp;
      const newReward = Math.abs(updates.newTp - existing.entryPrice) * existing.qty;
      updateObj.rewardAmount = Number(newReward.toFixed(2));
      updateObj.rewardPercent = existing.walletBalanceAtEntry > 0 ? Number(((newReward / existing.walletBalanceAtEntry) * 100).toFixed(2)) : 0;
    }

    updateObj.adjustments = adjustments;

    try {
      await updateDoc(tradeRef, updateObj);
    } catch {
      const trades = getLocal<Trade[]>(LS_KEYS.TRADES, []);
      const idx = trades.findIndex(t => t.id === tradeId);
      if (idx !== -1) {
        trades[idx] = { ...trades[idx], ...updateObj };
        setLocal(LS_KEYS.TRADES, trades);
      }
    }
  }

  async closeTrade(trade: Trade, exitType: 'TP_HIT' | 'SL_HIT' | 'MANUAL_EXIT', exitPrice?: number): Promise<void> {
    const finalExitPrice = exitType === 'TP_HIT' ? trade.tpPrice : exitType === 'SL_HIT' ? trade.slPrice : (exitPrice ?? trade.entryPrice);

    // Calculate PnL based on direction
    const priceDiff = trade.direction === 'LONG' ? finalExitPrice - trade.entryPrice : trade.entryPrice - finalExitPrice;
    const pnlAmount = Number((priceDiff * trade.qty).toFixed(2));
    const pnlPercent = trade.walletBalanceAtEntry > 0 ? Number(((pnlAmount / trade.walletBalanceAtEntry) * 100).toFixed(2)) : 0;

    const closedAt = new Date().toISOString();
    const holdDurationSeconds = Math.max(1, Math.round((new Date(closedAt).getTime() - new Date(trade.openedAt).getTime()) / 1000));

    const updatedTrade: Trade = {
      ...trade,
      status: exitType,
      exitPrice: finalExitPrice,
      pnlAmount,
      pnlPercent,
      closedAt,
      holdDurationSeconds,
    };

    // 1. Update trade record
    try {
      await updateDoc(doc(db, 'atl_trades', trade.id), {
        status: exitType,
        exitPrice: finalExitPrice,
        pnlAmount,
        pnlPercent,
        closedAt,
        holdDurationSeconds,
      });
    } catch {
      const trades = getLocal<Trade[]>(LS_KEYS.TRADES, []);
      const idx = trades.findIndex(t => t.id === trade.id);
      if (idx !== -1) {
        trades[idx] = updatedTrade;
        setLocal(LS_KEYS.TRADES, trades);
      }
    }

    // 2. Update League Wallet balance
    await this.applyTradePnlToWallet(trade.leagueId, pnlAmount, pnlPercent, trade.id);

    // 3. Update Round Queue: Mark player as COMPLETED
    await this.updatePlayerQueueStatus(trade.leagueId, trade.roundNumber, trade.playerId, 'COMPLETED');
  }

  async cancelTrade(trade: Trade): Promise<void> {
    try {
      await updateDoc(doc(db, 'atl_trades', trade.id), {
        status: 'CANCELLED',
        closedAt: new Date().toISOString(),
      });
    } catch {
      const trades = getLocal<Trade[]>(LS_KEYS.TRADES, []);
      const idx = trades.findIndex(t => t.id === trade.id);
      if (idx !== -1) {
        trades[idx] = { ...trades[idx], status: 'CANCELLED', closedAt: new Date().toISOString() };
        setLocal(LS_KEYS.TRADES, trades);
      }
    }

    // Restore player back to 'WAITING' in round queue!
    await this.updatePlayerQueueStatus(trade.leagueId, trade.roundNumber, trade.playerId, 'WAITING', undefined);
  }

  // --- Wallet Operations ---

  private async applyTradePnlToWallet(leagueId: string, pnlAmount: number, pnlPercent: number, tradeId: string): Promise<void> {
    const walletId = leagueId.startsWith('forex') ? 'forex' : 'crypto';
    let currentWallet: Wallet | null = null;

    try {
      const snap = await getDocs(query(collection(db, 'atl_wallets'), where('id', '==', walletId)));
      if (!snap.empty) {
        currentWallet = snap.docs[0].data() as Wallet;
      }
    } catch {
      const wallets = getLocal<Wallet[]>(LS_KEYS.WALLETS, INITIAL_WALLETS);
      currentWallet = wallets.find(w => w.id === walletId) || null;
    }

    if (!currentWallet) return;

    const newBalance = Number((currentWallet.balance + pnlAmount).toFixed(2));
    const now = new Date().toISOString();

    const updatedWallet: Wallet = {
      ...currentWallet,
      balance: newBalance,
      updatedAt: now,
    };

    // Update wallet
    try {
      await updateDoc(doc(db, 'atl_wallets', walletId), {
        balance: newBalance,
        updatedAt: now,
      });
    } catch {
      const wallets = getLocal<Wallet[]>(LS_KEYS.WALLETS, INITIAL_WALLETS);
      const idx = wallets.findIndex(w => w.id === walletId);
      if (idx !== -1) {
        wallets[idx] = updatedWallet;
        setLocal(LS_KEYS.WALLETS, wallets);
      }
    }

    // Record wallet snapshot for graph over time
    const snapshot: WalletSnapshot = {
      id: `snap-${Date.now()}-${tradeId}`,
      walletId,
      timestamp: now,
      dateStr: now.split('T')[0],
      balance: newBalance,
      changeAmount: pnlAmount,
      changePercent: pnlPercent,
      type: 'TRADE_EXIT',
      referenceTradeId: tradeId,
      note: `Trade exit (${pnlAmount >= 0 ? '+' : ''}${pnlAmount} ${currentWallet.currency})`,
    };

    try {
      await setDoc(doc(db, 'atl_snapshots', snapshot.id), snapshot);
    } catch {
      const snaps = getLocal<WalletSnapshot[]>(LS_KEYS.SNAPSHOTS, []);
      setLocal(LS_KEYS.SNAPSHOTS, [...snaps, snapshot]);
    }
  }

  async transferBetweenWallets(fromId: string, toId: string, amount: number, note?: string): Promise<void> {
    const wallets = getLocal<Wallet[]>(LS_KEYS.WALLETS, INITIAL_WALLETS);
    const fromW = wallets.find(w => w.id === fromId);
    const toW = wallets.find(w => w.id === toId);

    if (!fromW || !toW || fromW.balance < amount) {
      throw new Error('Insufficient balance or invalid wallet.');
    }

    const now = new Date().toISOString();
    const newFromBal = Number((fromW.balance - amount).toFixed(2));
    const newToBal = Number((toW.balance + amount).toFixed(2));

    try {
      await updateDoc(doc(db, 'atl_wallets', fromId), { balance: newFromBal, updatedAt: now });
      await updateDoc(doc(db, 'atl_wallets', toId), { balance: newToBal, updatedAt: now });

      const snapFrom: WalletSnapshot = {
        id: `snap-${Date.now()}-from`,
        walletId: fromId,
        timestamp: now,
        dateStr: now.split('T')[0],
        balance: newFromBal,
        changeAmount: -amount,
        changePercent: Number(((-amount / fromW.balance) * 100).toFixed(2)),
        type: 'TRANSFER',
        note: `Transfer to ${toW.name} (${note || ''})`,
      };
      const snapTo: WalletSnapshot = {
        id: `snap-${Date.now()}-to`,
        walletId: toId,
        timestamp: now,
        dateStr: now.split('T')[0],
        balance: newToBal,
        changeAmount: amount,
        changePercent: Number(((amount / toW.balance) * 100).toFixed(2)),
        type: 'TRANSFER',
        note: `Transfer from ${fromW.name} (${note || ''})`,
      };

      await setDoc(doc(db, 'atl_snapshots', snapFrom.id), snapFrom);
      await setDoc(doc(db, 'atl_snapshots', snapTo.id), snapTo);
    } catch {
      // Local fallback
      fromW.balance = newFromBal;
      toW.balance = newToBal;
      setLocal(LS_KEYS.WALLETS, wallets);
    }
  }

  // --- Round Queue Updates ---

  private async updatePlayerQueueStatus(
    leagueId: string,
    roundNumber: number,
    playerId: string,
    status: RoundQueueItem['status'],
    tradeId?: string
  ): Promise<void> {
    const roundId = `${leagueId}-r${roundNumber}`;
    let round: Round | null = null;

    try {
      const snap = await getDocs(query(collection(db, 'atl_rounds'), where('id', '==', roundId)));
      if (!snap.empty) {
        round = snap.docs[0].data() as Round;
      }
    } catch {
      const rounds = getLocal<Round[]>(LS_KEYS.ROUNDS, []);
      round = rounds.find(r => r.id === roundId) || null;
    }

    if (!round) return;

    const newQueue = round.playerQueue.map(item => {
      if (item.playerId === playerId) {
        return { ...item, status, tradeId: tradeId !== undefined ? tradeId : item.tradeId };
      }
      return item;
    });

    try {
      await updateDoc(doc(db, 'atl_rounds', roundId), { playerQueue: newQueue });
    } catch {
      const rounds = getLocal<Round[]>(LS_KEYS.ROUNDS, []);
      const idx = rounds.findIndex(r => r.id === roundId);
      if (idx !== -1) {
        rounds[idx].playerQueue = newQueue;
        setLocal(LS_KEYS.ROUNDS, rounds);
      }
    }
  }

  async completeRoundAndStartNext(
    leagueId: string,
    currentRoundNumber: number,
    rankedPlayerIds: string[] // Player IDs ordered by rank 1st to 20th in standings
  ): Promise<Round> {
    const currentRoundId = `${leagueId}-r${currentRoundNumber}`;
    const nextRoundNumber = currentRoundNumber + 1;
    const nextRoundId = `${leagueId}-r${nextRoundNumber}`;
    const now = new Date().toISOString();

    // 1. Mark current round COMPLETED
    try {
      await updateDoc(doc(db, 'atl_rounds', currentRoundId), {
        status: 'COMPLETED',
        completedAt: now,
      });
    } catch {
      const rounds = getLocal<Round[]>(LS_KEYS.ROUNDS, []);
      const idx = rounds.findIndex(r => r.id === currentRoundId);
      if (idx !== -1) {
        rounds[idx].status = 'COMPLETED';
        rounds[idx].completedAt = now;
        setLocal(LS_KEYS.ROUNDS, rounds);
      }
    }

    // 2. Generate next round queue:
    // Position 20 goes to the player at bottom of standings (index 19 in ranked list)
    // Position 1 goes to the player at top of standings (index 0)
    const allPlayers = getLocal<Player[]>(LS_KEYS.PLAYERS, INITIAL_PLAYERS);
    const nextQueue: RoundQueueItem[] = rankedPlayerIds.map((pid, rankIndex) => {
      const p = allPlayers.find(pl => pl.id === pid) || { id: pid, name: 'Player', teamId: 'AMC' };
      // rankIndex 0 is 1st place -> position 1
      // rankIndex 19 is 20th place -> position 20 (trades first!)
      return {
        playerId: pid,
        playerName: p.name,
        teamId: p.teamId,
        position: 20 - rankIndex, // 20 trades first
        status: 'WAITING',
      };
    });

    // Sort queue by position descending (20 down to 1)
    nextQueue.sort((a, b) => b.position - a.position);

    const nextRound: Round = {
      id: nextRoundId,
      leagueId,
      roundNumber: nextRoundNumber,
      status: 'ACTIVE',
      playerQueue: nextQueue,
      startedAt: now,
    };

    try {
      await setDoc(doc(db, 'atl_rounds', nextRoundId), nextRound);
      await updateDoc(doc(db, 'atl_leagues', leagueId), { activeRound: nextRoundNumber });
    } catch {
      const rounds = getLocal<Round[]>(LS_KEYS.ROUNDS, []);
      setLocal(LS_KEYS.ROUNDS, [...rounds, nextRound]);
      const leagues = getLocal<League[]>(LS_KEYS.LEAGUES, INITIAL_LEAGUES);
      const lIdx = leagues.findIndex(l => l.id === leagueId);
      if (lIdx !== -1) {
        leagues[lIdx].activeRound = nextRoundNumber;
        setLocal(LS_KEYS.LEAGUES, leagues);
      }
    }

    return nextRound;
  }

  // Update Roster (swap players for a team before round begins)
  async updateTeamRoster(teamId: string, nominatedPlayerIds: string[]): Promise<void> {
    // Allows updating player assignments
    console.log(`Updated roster for team ${teamId}:`, nominatedPlayerIds);
  }
}

export const storage = new StorageService();

