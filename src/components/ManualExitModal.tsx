import React, { useState } from 'react';
import { Trade } from '../types';
import { storage } from '../services/storageService';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { X, LogOut } from 'lucide-react';

interface ManualExitModalProps {
  trade: Trade;
  onClose: () => void;
}

export const ManualExitModal: React.FC<ManualExitModalProps> = ({ trade, onClose }) => {
  const [exitPrice, setExitPrice] = useState(trade.entryPrice.toString());
  const [saving, setSaving] = useState(false);

  const numExit = parseFloat(exitPrice) || 0;
  const priceDiff = trade.direction === 'LONG' ? numExit - trade.entryPrice : trade.entryPrice - numExit;
  const pnlAmount = Number((priceDiff * trade.qty).toFixed(2));
  const pnlPercent = trade.walletBalanceAtEntry > 0 ? (pnlAmount / trade.walletBalanceAtEntry) * 100 : 0;

  const handleClosePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numExit) || numExit <= 0) return;

    setSaving(true);
    try {
      await storage.closeTrade(trade, 'MANUAL_EXIT', numExit);
      onClose();
    } catch (err) {
      console.error('Failed to close trade:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.12)] rounded-xl w-full max-w-sm p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)] mb-3">
          <div className="text-xs font-bold text-white tracking-wide uppercase">
            Manual Exit • {trade.instrument}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleClosePosition} className="space-y-3">
          <div className="text-[11px] text-slate-400">
            {trade.direction} | Trader: <span className="text-white font-medium">{trade.playerName}</span> | Entry: <span className="font-mono text-white">{trade.entryPrice}</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              EXIT PRICE
            </label>
            <input
              type="number"
              step="any"
              value={exitPrice}
              onChange={e => setExitPrice(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-[#0c0f17] border border-[rgba(255,255,255,0.06)] text-xs font-mono space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Estimated Realized PnL:</span>
              <span className={`font-bold ${pnlAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(pnlAmount)} ({formatPercent(pnlPercent)})
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || numExit <= 0}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 flex items-center gap-1"
            >
              <LogOut size={13} />
              Confirm Exit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

