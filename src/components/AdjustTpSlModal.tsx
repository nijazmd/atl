import React, { useState } from 'react';
import { Trade } from '../types';
import { storage } from '../services/storageService';
import { X, Check } from 'lucide-react';

interface AdjustTpSlModalProps {
  trade: Trade;
  onClose: () => void;
}

export const AdjustTpSlModal: React.FC<AdjustTpSlModalProps> = ({ trade, onClose }) => {
  const [tp, setTp] = useState(trade.tpPrice.toString());
  const [sl, setSl] = useState(trade.slPrice.toString());
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const numTp = parseFloat(tp);
  const numSl = parseFloat(sl);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(numTp) || isNaN(numSl)) return;

    setSaving(true);
    try {
      await storage.adjustTpSl(trade.id, {
        newTp: numTp !== trade.tpPrice ? numTp : undefined,
        newSl: numSl !== trade.slPrice ? numSl : undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to adjust TP/SL:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.12)] rounded-xl w-full max-w-sm p-4 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)] mb-3">
          <div className="text-xs font-bold text-white tracking-wide uppercase">
            Adjust TP / SL • {trade.instrument}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="text-[11px] text-slate-400">
            Trader: <span className="text-white font-medium">{trade.playerName}</span> ({trade.teamId}) | Entry: <span className="font-mono text-white">{trade.entryPrice}</span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-emerald-400 mb-1">
              TAKE PROFIT (TP)
            </label>
            <input
              type="number"
              step="any"
              value={tp}
              onChange={e => setTp(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-rose-400 mb-1">
              STOP LOSS (SL)
            </label>
            <input
              type="number"
              step="any"
              value={sl}
              onChange={e => setSl(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              AUDIT NOTE (OPTIONAL)
            </label>
            <input
              type="text"
              placeholder="e.g. Moved SL to breakeven"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-500"
            />
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
              disabled={saving}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center gap-1"
            >
              <Check size={13} />
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

