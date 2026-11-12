import React from 'react';
import { Round, Trade, Team, Player } from '../types';
import { storage } from '../services/storageService';
import { formatPercent } from '../utils/calculations';
import { CheckCircle2, Clock, PlayCircle, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RoundQueueProps {
  round?: Round;
  trades: Trade[];
  teams: Team[];
  players: Player[];
  leagueId: string;
  onRoundCompleted?: () => void;
}

export const RoundQueue: React.FC<RoundQueueProps> = ({
  round,
  trades,
  teams,
  players,
  leagueId,
  onRoundCompleted,
}) => {
  if (!round) return null;

  const queue = round.playerQueue || [];
  // Sort by position descending (20 down to 1)
  const sortedQueue = [...queue].sort((a, b) => b.position - a.position);

  const completedCount = queue.filter(q => q.status === 'COMPLETED').length;
  const activeCount = queue.filter(q => q.status === 'ACTIVE').length;
  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const totalCount = queue.length || 20;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const isRoundFinished = completedCount === totalCount && totalCount > 0;

  const handleCompleteRound = async () => {
    if (!confirm(`Complete Round ${round.roundNumber} and generate Round ${round.roundNumber + 1}?`)) {
      return;
    }

    try {
      // Trigger confetti celebration!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Pass player ranking (ordered 1st to 20th by performance in this round or cumulative)
      // Rank players by completed trade pnlPercent in this round
      const roundTrades = trades.filter(t => t.leagueId === leagueId && t.roundNumber === round.roundNumber);
      const playerScores: { playerId: string; pnlPercent: number }[] = queue.map(q => {
        const tr = roundTrades.find(t => t.playerId === q.playerId);
        return {
          playerId: q.playerId,
          pnlPercent: tr?.pnlPercent ?? 0,
        };
      });

      // Sort 1st to 20th (highest pnlPercent first)
      playerScores.sort((a, b) => b.pnlPercent - a.pnlPercent);
      const rankedPlayerIds = playerScores.map(ps => ps.playerId);

      await storage.completeRoundAndStartNext(leagueId, round.roundNumber, rankedPlayerIds);
      if (onRoundCompleted) onRoundCompleted();
    } catch (err) {
      console.error('Failed to complete round:', err);
    }
  };

  return (
    <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      {/* Header & Progress */}
      <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.06)] mb-3">
        <div>
          <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
            <Trophy size={14} className="text-amber-400" />
            ROUND {round.roundNumber} ORDER OF PLAY
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            Starts at #20 • {completedCount}/{totalCount} Completed ({progressPercent}%)
          </div>
        </div>

        {/* Complete Round Action Button */}
        {isRoundFinished ? (
          <button
            onClick={handleCompleteRound}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer animate-bounce"
          >
            <Sparkles size={14} />
            Complete Round {round.roundNumber} & Advance
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-emerald-400">{completedCount} Done</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400">{activeCount} Open</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{waitingCount} Wait</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#0c0f17] h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* Queue Grid (high density chips) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
        {sortedQueue.map(item => {
          const team = teams.find(t => t.id === item.teamId);
          const trade = item.tradeId ? trades.find(t => t.id === item.tradeId) : undefined;
          const isDone = item.status === 'COMPLETED';
          const isActive = item.status === 'ACTIVE';

          return (
            <div
              key={item.playerId}
              className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                  : isDone
                  ? 'bg-slate-900/60 border-slate-800 text-slate-400'
                  : 'bg-[#0c0f17] border-[rgba(255,255,255,0.06)] text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono font-bold text-[10px] text-slate-500">
                  #{item.position}
                </span>
                <div className="truncate font-medium text-[11px]">
                  {item.playerName}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-1 shrink-0 font-mono text-[10px]">
                <span
                  className="px-1 rounded font-bold"
                  style={{
                    backgroundColor: team ? `${team.primaryColor}22` : '#1e293b',
                    color: team?.primaryColor || '#94a3b8',
                  }}
                >
                  {team?.shortName || item.teamId}
                </span>

                {isDone ? (
                  <span className={`font-semibold ${
                    (trade?.pnlPercent ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {trade ? formatPercent(trade.pnlPercent ?? 0) : 'Done'}
                  </span>
                ) : isActive ? (
                  <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                    <PlayCircle size={10} /> Open
                  </span>
                ) : (
                  <span className="text-slate-600">Wait</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

