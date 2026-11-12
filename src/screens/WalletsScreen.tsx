import React, { useState, useMemo } from 'react';
import { Wallet, WalletSnapshot } from '../types';
import { storage } from '../services/storageService';
import { formatCurrency } from '../utils/calculations';

interface WalletsScreenProps {
  wallets: Wallet[];
  snapshots: WalletSnapshot[];
}

export const WalletsScreen: React.FC<WalletsScreenProps> = ({ wallets, snapshots }) => {
  const [selected, setSelected] = useState('forex');
  const [from, setFrom] = useState('master');
  const [to, setTo] = useState('forex');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedWallet = wallets.find(w => w.id === selected) || wallets[0];
  const walletSnaps = useMemo(() =>
    snapshots.filter(s => s.walletId === selected).reverse().slice(0, 20),
    [snapshots, selected]
  );

  // Mini equity chart data
  const chartSnaps = useMemo(() =>
    snapshots.filter(s => s.walletId === selected),
    [snapshots, selected]
  );

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setOk('');
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setErr('Enter a valid amount.'); return; }
    if (from === to) { setErr('Select different accounts.'); return; }
    const srcWallet = wallets.find(w => w.id === from);
    if (!srcWallet || srcWallet.balance < amt) { setErr('Insufficient balance.'); return; }
    setLoading(true);
    try {
      await storage.transferBetweenWallets(from, to, amt, note);
      setOk(`${formatCurrency(amt)} transferred ✓`);
      setAmount(''); setNote('');
      setTimeout(() => setOk(''), 4000);
    } catch (e: any) {
      setErr(e.message || 'Transfer failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <div className="safe-top" style={{ background: 'var(--bg-screen)', padding: '12px 20px 0' }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginBottom: 16 }}>Wallets</div>
      </div>

      <div className="scroll-body" style={{ paddingTop: 0 }}>
        <div style={{ padding: '0 20px' }}>

          {/* Wallet cards (horizontal scroll) */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, marginBottom: 20,
            scrollbarWidth: 'none', marginLeft: -20, marginRight: -20, paddingLeft: 20, paddingRight: 20,
          }}>
            {wallets.map(w => {
              const isSelected = w.id === selected;
              const gain = w.balance - w.startingBalance;
              const gainPct = w.startingBalance > 0 ? (gain / w.startingBalance) * 100 : 0;
              return (
                <div
                  key={w.id}
                  onClick={() => setSelected(w.id)}
                  style={{
                    minWidth: 180, background: isSelected ? 'var(--bg-card)' : 'var(--bg-input)',
                    borderRadius: 16, padding: 16, flexShrink: 0,
                    border: isSelected ? '1.5px solid rgba(34,197,94,0.4)' : '1px solid var(--border)',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                    {w.name}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-mono)', letterSpacing: -1 }}>
                    {formatCurrency(w.balance, w.currency)}
                  </div>
                  <div style={{
                    marginTop: 6, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    color: gain >= 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {gain >= 0 ? '+' : ''}{gain.toFixed(2)} ({gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mini equity chart */}
          {selectedWallet && chartSnaps.length > 1 && (
            <div className="card" style={{ marginBottom: 20, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12 }}>
                {selectedWallet.name} Equity
              </div>
              <MiniEquityChart snaps={chartSnaps} startingBal={selectedWallet.startingBalance} />
            </div>
          )}

          {/* Transfer */}
          <div className="card" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Transfer Capital
            </div>

            {ok && <div className="alert-bar success" style={{ marginBottom: 10 }}>{ok}</div>}
            {err && <div className="alert-bar warning" style={{ marginBottom: 10 }}>{err}</div>}

            <form onSubmit={handleTransfer}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="input-label">From</label>
                  <select className="input-field" value={from} onChange={e => setFrom(e.target.value)}>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">To</label>
                  <select className="input-field" value={to} onChange={e => setTo(e.target.value)}>
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <label className="input-label">Amount</label>
                <input type="number" step="any" className="input-field" placeholder="50.00"
                  value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="input-label">Note (optional)</label>
                <input className="input-field" placeholder="e.g. Round 2 allocation"
                  value={note} onChange={e => setNote(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Transferring...' : 'Transfer'}
              </button>
            </form>
          </div>

          {/* Recent ledger */}
          {walletSnaps.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                Recent Ledger
              </div>
              <div className="card">
                {walletSnaps.map((s, i) => {
                  const isGain = s.changeAmount >= 0;
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderBottom: i < walletSnaps.length - 1 ? '1px solid var(--border)' : 'none',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.note || s.type}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                          {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {s.changeAmount !== 0 && (
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: isGain ? 'var(--green)' : 'var(--red)' }}>
                            {isGain ? '+' : ''}{s.changeAmount.toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                          {formatCurrency(s.balance, selectedWallet?.currency)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ height: 20 }} />
        </div>
      </div>
    </div>
  );
};

// Minimal inline equity chart
const MiniEquityChart: React.FC<{ snaps: WalletSnapshot[]; startingBal: number }> = ({ snaps, startingBal }) => {
  const W = 320, H = 80, padX = 4, padY = 8;
  const balances = [startingBal, ...snaps.map(s => s.balance)];
  const minB = Math.min(...balances);
  const maxB = Math.max(...balances);
  const range = maxB - minB || 1;
  const isPositive = balances[balances.length - 1] >= startingBal;

  const pts = balances.map((b, i) => {
    const x = padX + (i / (balances.length - 1)) * (W - padX * 2);
    const y = padY + (1 - (b - minB) / range) * (H - padY * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${pts.join(' L ')}`;
  const areaD = `${pathD} L ${W - padX},${H} L ${padX},${H} Z`;
  const lineColor = isPositive ? 'var(--green)' : 'var(--red)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 80, display: 'block' }}>
      <defs>
        <linearGradient id={`cg-${isPositive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#cg-${isPositive})`} />
      <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
