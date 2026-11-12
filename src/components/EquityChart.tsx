import React, { useState, useMemo } from 'react';
import { WalletSnapshot, Wallet } from '../types';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { TrendingUp, Calendar, Zap, DollarSign } from 'lucide-react';

interface EquityChartProps {
  wallet: Wallet;
  snapshots: WalletSnapshot[];
  title?: string;
}

export const EquityChart: React.FC<EquityChartProps> = ({ wallet, snapshots, title }) => {
  const [viewMode, setViewMode] = useState<'trade' | 'daily'>('trade');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter snapshots for this wallet
  const walletSnaps = useMemo(() => {
    return snapshots.filter(s => s.walletId === wallet.id);
  }, [snapshots, wallet.id]);

  // Aggregate by trade or daily
  const points = useMemo(() => {
    if (walletSnaps.length === 0) {
      return [{ label: 'Start', date: 'Initial', balance: wallet.startingBalance, change: 0, note: 'Initial Balance' }];
    }

    if (viewMode === 'daily') {
      // Group by dateStr, pick latest balance of the day
      const byDate: Record<string, WalletSnapshot> = {};
      walletSnaps.forEach(s => {
        byDate[s.dateStr] = s;
      });
      const dates = Object.keys(byDate).sort();
      return dates.map(d => ({
        label: d,
        date: d,
        balance: byDate[d].balance,
        change: byDate[d].changeAmount,
        note: byDate[d].note || 'Daily Close',
      }));
    } else {
      // Trade-by-trade
      return walletSnaps.map((s, idx) => ({
        label: `T#${idx + 1}`,
        date: new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        balance: s.balance,
        change: s.changeAmount,
        note: s.note || (s.type === 'TRADE_EXIT' ? 'Trade Exit' : s.type),
      }));
    }
  }, [walletSnaps, viewMode, wallet.startingBalance]);

  // Chart dimensions & calculations
  const minBal = Math.min(wallet.startingBalance, ...points.map(p => p.balance));
  const maxBal = Math.max(wallet.startingBalance, ...points.map(p => p.balance));
  const paddingY = Math.max(10, (maxBal - minBal) * 0.15);
  const chartMin = Math.floor(minBal - paddingY);
  const chartMax = Math.ceil(maxBal + paddingY);
  const range = chartMax - chartMin || 1;

  const width = 680;
  const height = 220;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const coordinates = useMemo(() => {
    if (points.length === 1) {
      const y = padTop + plotH - ((points[0].balance - chartMin) / range) * plotH;
      return [{ x: padLeft + plotW / 2, y, ...points[0] }];
    }
    return points.map((p, i) => {
      const x = padLeft + (i / (points.length - 1)) * plotW;
      const y = padTop + plotH - ((p.balance - chartMin) / range) * plotH;
      return { x, y, ...p };
    });
  }, [points, chartMin, range, plotW, plotH, padLeft, padTop]);

  // Baseline Y position
  const baselineY = padTop + plotH - ((wallet.startingBalance - chartMin) / range) * plotH;

  // Path generator
  const pathD = useMemo(() => {
    if (coordinates.length <= 1) return '';
    return coordinates.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, '');
  }, [coordinates]);

  const areaD = useMemo(() => {
    if (coordinates.length <= 1) return '';
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    return `${pathD} L ${last.x} ${height - padBottom} L ${first.x} ${height - padBottom} Z`;
  }, [coordinates, pathD, height, padBottom]);

  const currentBal = wallet.balance;
  const netGrowthPercent = wallet.startingBalance > 0 ? ((currentBal - wallet.startingBalance) / wallet.startingBalance) * 100 : 0;
  const isProfitable = currentBal >= wallet.startingBalance;
  const lineColor = isProfitable ? '#10b981' : '#f43f5e';
  const fillColor = isProfitable ? 'url(#greenGrad)' : 'url(#redGrad)';

  const activePoint = hoverIndex !== null && coordinates[hoverIndex] ? coordinates[hoverIndex] : coordinates[coordinates.length - 1];

  return (
    <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
      {/* Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={14} className={isProfitable ? 'text-emerald-400' : 'text-rose-400'} />
            {title || `${wallet.name} Equity Curve`}
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold font-mono text-white">
              {formatCurrency(currentBal, wallet.currency)}
            </span>
            <span className={`text-xs font-semibold font-mono px-1.5 py-0.5 rounded ${
              isProfitable ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
            }`}>
              {formatPercent(netGrowthPercent)}
            </span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[#0c0f17] p-1 rounded-lg border border-[rgba(255,255,255,0.06)]">
          <button
            onClick={() => { setViewMode('trade'); setHoverIndex(null); }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'trade'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap size={12} />
            Per Trade
          </button>
          <button
            onClick={() => { setViewMode('daily'); setHoverIndex(null); }}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
              viewMode === 'daily'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={12} />
            Daily Close
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padLeft}
            y1={baselineY}
            x2={width - padRight}
            y2={baselineY}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />
          <text
            x={padLeft - 6}
            y={baselineY + 4}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {wallet.startingBalance}
          </text>

          {/* Max & Min Y labels */}
          <text
            x={padLeft - 6}
            y={padTop + 6}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {chartMax}
          </text>
          <text
            x={padLeft - 6}
            y={height - padBottom}
            fill="#64748b"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="end"
          >
            {chartMin}
          </text>

          {/* Gradient Fill & Line */}
          {areaD && <path d={areaD} fill={fillColor} />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Active Hover crosshair & circle */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={height - padBottom}
                stroke="rgba(255,255,255,0.2)"
                strokeDasharray="2 2"
                strokeWidth="1"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                fill={lineColor}
                stroke="#0c0f17"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Interactive touch/hover invisible overlay bars */}
          {coordinates.map((pt, i) => {
            const barW = plotW / Math.max(1, coordinates.length);
            return (
              <rect
                key={i}
                x={pt.x - barW / 2}
                y={padTop}
                width={barW}
                height={plotH}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
              />
            );
          })}
        </svg>

        {/* Hover Info Tooltip */}
        {activePoint && (
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 px-2 border-t border-[rgba(255,255,255,0.06)] pt-2 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{activePoint.note}</span>
              <span className="text-slate-500">({activePoint.date})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold">
                {formatCurrency(activePoint.balance, wallet.currency)}
              </span>
              {activePoint.change !== 0 && (
                <span className={activePoint.change > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {activePoint.change > 0 ? '+' : ''}{activePoint.change.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

