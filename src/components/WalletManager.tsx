import React, { useState } from 'react';
import { Wallet, WalletSnapshot } from '../types';
import { storage } from '../services/storageService';
import { EquityChart } from './EquityChart';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { Wallet as WalletIcon, ArrowRightLeft, ArrowUpRight, ArrowDownLeft, ShieldCheck, History } from 'lucide-react';

interface WalletManagerProps {
  wallets: Wallet[];
  snapshots: WalletSnapshot[];
}

export const WalletManager: React.FC<WalletManagerProps> = ({ wallets, snapshots }) => {
  const [selectedWalletId, setSelectedWalletId] = useState<string>('forex');
  const [fromWallet, setFromWallet] = useState<string>('master');
  const [toWallet, setToWallet] = useState<string>('forex');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);

  const activeWallet = wallets.find(w => w.id === selectedWalletId) || wallets[0];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please enter a valid transfer amount.');
      return;
    }
    if (fromWallet === toWallet) {
      setTransferError('Source and destination wallets must be different.');
      return;
    }

    const source = wallets.find(w => w.id === fromWallet);
    if (!source || source.balance < amt) {
      setTransferError(`Insufficient balance in ${source?.name || 'source wallet'}.`);
      return;
    }

    setIsTransferring(true);
    try {
      await storage.transferBetweenWallets(fromWallet, toWallet, amt, transferNote);
      setTransferSuccess(`Successfully transferred ${formatCurrency(amt, source.currency)}!`);
      setTransferAmount('');
      setTransferNote('');
      setTimeout(() => setTransferSuccess(''), 4000);
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed.');
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 3 Wallet Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {wallets.map(w => {
          const isSelected = w.id === selectedWalletId;
          const netChange = w.balance - w.startingBalance;
          const netChangePercent = w.startingBalance > 0 ? (netChange / w.startingBalance) * 100 : 0;
          const isPositive = netChange >= 0;

          return (
            <div
              key={w.id}
              onClick={() => setSelectedWalletId(w.id)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#111622] border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                  : 'bg-[#0c0f17] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                <span className="font-semibold uppercase flex items-center gap-1.5">
                  <WalletIcon size={13} className={isSelected ? 'text-emerald-400' : 'text-slate-500'} />
                  {w.name}
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {w.currency}
                </span>
              </div>

              <div className="text-2xl font-bold font-mono text-white mt-1">
                {formatCurrency(w.balance, w.currency)}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-2 border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-slate-500">Allocated: {formatCurrency(w.startingBalance, w.currency)}</span>
                <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}{formatCurrency(netChange, w.currency)} ({formatPercent(netChangePercent)})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Equity Chart for Selected Wallet */}
      {activeWallet && (
        <EquityChart
          wallet={activeWallet}
          snapshots={snapshots}
          title={`${activeWallet.name} Equity Curve`}
        />
      )}

      {/* Wallet Rebalancing / Transfer Dock */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
        <div className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5 pb-2 border-b border-[rgba(255,255,255,0.06)] mb-3">
          <ArrowRightLeft size={14} className="text-emerald-400" />
          Transfer & Rebalance Capital
        </div>

        {transferSuccess && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
            {transferSuccess}
          </div>
        )}
        {transferError && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {transferError}
          </div>
        )}

        <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              FROM ACCOUNT
            </label>
            <select
              value={fromWallet}
              onChange={e => setFromWallet(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance, w.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              TO ACCOUNT
            </label>
            <select
              value={toWallet}
              onChange={e => setToWallet(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {wallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance, w.currency)})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              AMOUNT
            </label>
            <input
              type="number"
              step="any"
              placeholder="50.00"
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              NOTE
            </label>
            <input
              type="text"
              placeholder="e.g. Round 2 allocation"
              value={transferNote}
              onChange={e => setTransferNote(e.target.value)}
              className="w-full bg-[#0c0f17] border border-[rgba(255,255,255,0.1)] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={isTransferring}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              Transfer
            </button>
          </div>
        </form>
      </div>

      {/* Snapshot / Transaction Log */}
      <div className="bg-[#111622] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
        <div className="p-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-1.5 text-xs font-bold text-white uppercase">
          <History size={13} className="text-slate-400" />
          Recent Wallet Ledger & Snapshots
        </div>

        <div className="overflow-x-auto max-h-60 overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)] text-[10px] text-slate-400 bg-[#0c0f17]">
                <th className="py-2 px-3">TIMESTAMP</th>
                <th className="py-2 px-3">ACCOUNT</th>
                <th className="py-2 px-3">EVENT</th>
                <th className="py-2 px-3 text-right">CHANGE</th>
                <th className="py-2 px-3 text-right">BALANCE</th>
                <th className="py-2 px-3">MEMO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {[...snapshots].reverse().slice(0, 15).map(snap => {
                const w = wallets.find(wl => wl.id === snap.walletId);
                const isGain = snap.changeAmount >= 0;

                return (
                  <tr key={snap.id} className="hover:bg-white/[0.02]">
                    <td className="py-1.5 px-3 text-slate-400 text-[11px]">
                      {new Date(snap.timestamp).toLocaleDateString()} {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-1.5 px-3 text-white font-medium">
                      {w?.name || snap.walletId}
                    </td>
                    <td className="py-1.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {snap.type}
                      </span>
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      {snap.changeAmount !== 0 ? (
                        <span className={isGain ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {isGain ? '+' : ''}{formatCurrency(snap.changeAmount, w?.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="py-1.5 px-3 text-right font-bold text-white">
                      {formatCurrency(snap.balance, w?.currency)}
                    </td>
                    <td className="py-1.5 px-3 text-slate-400 text-[11px] font-sans truncate max-w-xs">
                      {snap.note || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

