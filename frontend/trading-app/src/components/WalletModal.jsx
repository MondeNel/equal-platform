import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';

export default function WalletModal({ balance, openTrades, onDeposit, onWithdraw, onClose, onCloseAll }) {
  const [tab, setTab] = useState('overview');
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [txHistory, setTxHistory] = useState([]);

  useEffect(() => {
    walletAPI.transactions()
      .then(res => setTxHistory(res.data))
      .catch(() => {});
  }, []);

  const totalPnl = openTrades.reduce((s, t) => s + (t.pnl || 0), 0);
  const currentBalance = (balance || 0) + totalPnl;

  const fmt = (v) => {
    const n = Number(v);
    if (isNaN(n)) return 'ZAR 0,00';
    const abs = Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (n < 0 ? '−' : '') + `ZAR ${abs}`;
  };

  const doDeposit = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFeedback({ ok: false, msg: 'Enter a valid amount' }); return; }
    if (n < 100) { setFeedback({ ok: false, msg: 'Minimum deposit is ZAR 100' }); return; }
    try {
      await onDeposit(n);
      setFeedback({ ok: true, msg: `ZAR ${n.toLocaleString()} deposited!` });
      setAmount('');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ ok: false, msg: 'Deposit failed. Try again.' });
    }
  };

  const doWithdraw = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) { setFeedback({ ok: false, msg: 'Enter a valid amount' }); return; }
    if (n > balance) { setFeedback({ ok: false, msg: 'Insufficient available balance' }); return; }
    if (n < 100) { setFeedback({ ok: false, msg: 'Minimum withdrawal is ZAR 100' }); return; }
    if (openTrades.length) { setFeedback({ ok: false, msg: 'Close open trades before withdrawing' }); return; }
    try {
      await onWithdraw(n);
      setFeedback({ ok: true, msg: `ZAR ${n.toLocaleString()} withdrawn!` });
      setAmount('');
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ ok: false, msg: 'Withdrawal failed. Try again.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-[390px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#08091a] to-[#0c0a22] border border-[#1c1c44] rounded-xl shadow-xl font-mono">
        <div className="flex justify-between items-center p-5 border-b border-white/10">
          <div>
            <div className="text-cyan-400 text-sm font-bold tracking-wider">⬡ WALLET</div>
            <div className="text-white/40 text-[8px] tracking-wider mt-0.5">SIMULATION ACCOUNT</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 p-5">
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/40 text-[8px] tracking-wider mb-1">DEPOSITED</div>
            <div className="text-white text-sm font-bold">{fmt(balance)}</div>
            <div className="text-white/20 text-[7px] mt-2">Available funds</div>
          </div>
          <div className="bg-black/20 border border-white/10 rounded-lg p-3">
            <div className="text-white/40 text-[8px] tracking-wider mb-1">UNREALISED P&L</div>
            <div className="text-sm font-bold text-white">{fmt(totalPnl)}</div>
            <div className="text-white/20 text-[7px] mt-2">{openTrades.length} position{openTrades.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        <div className="mx-5 mb-3 p-2.5 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 border border-cyan-500/30 rounded-lg flex justify-between items-center">
          <span className="text-white/50 text-[9px] tracking-wider">TOTAL EQUITY</span>
          <span className="text-gold text-base font-bold">{fmt(currentBalance)}</span>
        </div>

        <div className="flex border-b border-white/10">
          {[
            { id: 'overview', icon: '◈', label: 'OVERVIEW' },
            { id: 'deposit', icon: '↓', label: 'DEPOSIT' },
            { id: 'withdraw', icon: '↑', label: 'WITHDRAW' },
            { id: 'history', icon: '≡', label: 'HISTORY' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setTab(btn.id); setFeedback(null); setAmount(''); }}
              className={`flex-1 py-3 text-center border-b-2 transition-colors ${
                tab === btn.id ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {btn.icon}<br/>{btn.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {feedback && (
            <div className={`mb-4 p-2.5 rounded-lg text-xs ${feedback.ok ? 'bg-green-500/10 border border-green-500 text-green-400' : 'bg-red-500/10 border border-red-500 text-red-400'}`}>
              {feedback.ok ? '✓' : '✗'} {feedback.msg}
            </div>
          )}

          {tab === 'overview' && (
            <>
              <div className="text-white/40 text-[8px] tracking-wider mb-3">OPEN POSITIONS</div>
              {openTrades.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs">No open positions</div>
              ) : (
                openTrades.map(t => (
                  <div key={t.id} className="bg-black/20 border border-white/10 rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2 items-center">
                        <span className={`text-xs font-bold ${t.direction === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                          {t.direction === 'BUY' ? '▲' : '▼'} {t.direction}
                        </span>
                        <span className="text-purple-400 text-[10px]">{t.symbol}</span>
                      </div>
                      <div className={`text-xs font-bold ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.pnl >= 0 ? '+' : ''}{t.pnl.toFixed(2)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[8px] mb-2">
                      <div><span className="text-white/40">ENTRY </span><span className="text-cyan-400">{t.entry_price}</span></div>
                      <div><span className="text-white/40">TP </span><span className="text-green-400">{t.take_profit || '–'}</span></div>
                      <div><span className="text-white/40">SL </span><span className="text-red-400">{t.stop_loss || '–'}</span></div>
                    </div>
                    <button onClick={() => onCloseAll(t.id)} className="w-full text-[8px] bg-white/5 border border-purple-500/30 text-purple-300 py-1 rounded hover:bg-purple-500/10">
                      CLOSE
                    </button>
                  </div>
                ))
              )}
              {openTrades.length > 0 && (
                <button onClick={() => onCloseAll('all')} className="w-full mt-2 py-2 bg-white/5 border border-purple-500/30 text-purple-300 text-xs rounded">
                  CLOSE ALL POSITIONS
                </button>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => setTab('deposit')} className="flex-1 py-2 bg-cyan-500/10 border border-cyan-500 text-cyan-400 text-xs rounded">
                  ↓ DEPOSIT
                </button>
                <button onClick={() => setTab('withdraw')} className="flex-1 py-2 bg-purple-500/10 border border-purple-500 text-purple-400 text-xs rounded">
                  ↑ WITHDRAW
                </button>
              </div>
            </>
          )}

          {tab === 'deposit' && (
            <>
              <div className="bg-black/20 border border-white/10 rounded-lg p-3 mb-4">
                <div className="text-cyan-400 text-[9px] font-bold tracking-wider mb-1">ℹ SIMULATION DEPOSIT</div>
                <div className="text-white/60 text-[9px]">Deposit virtual ZAR to start trading.</div>
              </div>
              <div className="mb-4">
                <div className="text-white/40 text-[8px] tracking-wider mb-2">AMOUNT (ZAR)</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm font-bold">R</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 bg-black/20 border border-white/20 rounded-lg text-white text-base font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[500, 1000, 2500, 5000, 10000].map(q => (
                    <button key={q} onClick={() => setAmount(String(q))} className="px-2 py-1 text-[10px] rounded border border-white/20 text-white/60 hover:border-white/40">
                      R{q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={doDeposit} className="w-full py-3 bg-green-500/20 border border-green-500 text-green-400 font-bold text-xs rounded">
                ↓ DEPOSIT FUNDS
              </button>
            </>
          )}

          {tab === 'withdraw' && (
            <>
              <div className="bg-black/20 border border-white/10 rounded-lg p-3 mb-4">
                <div className="text-purple-400 text-[9px] font-bold tracking-wider mb-1">AVAILABLE TO WITHDRAW</div>
                <div className="text-white text-base font-bold">{fmt(balance)}</div>
              </div>
              <div className="mb-4">
                <div className="text-white/40 text-[8px] tracking-wider mb-2">AMOUNT (ZAR)</div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 text-sm font-bold">R</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-3 py-3 bg-black/20 border border-white/20 rounded-lg text-white text-base font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[500, 1000, 2500, 5000, 10000].map(q => (
                    <button key={q} onClick={() => setAmount(String(q))} className="px-2 py-1 text-[10px] rounded border border-white/20 text-white/60 hover:border-white/40">
                      R{q.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={doWithdraw} disabled={openTrades.length > 0} className="w-full py-3 bg-purple-500/20 border border-purple-500 text-purple-400 font-bold text-xs rounded disabled:opacity-50">
                ↑ WITHDRAW FUNDS
              </button>
            </>
          )}

          {tab === 'history' && (
            <>
              <div className="text-white/40 text-[8px] tracking-wider mb-3">TRANSACTION HISTORY</div>
              {txHistory.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-xs">No transactions yet</div>
              ) : (
                <div className="space-y-2">
                  {txHistory.map(tx => (
                    <div key={tx.id} className="flex justify-between items-center py-2 border-b border-white/10">
                      <div>
                        <div className={`text-[10px] font-bold ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-purple-400'}`}>{tx.type}</div>
                        <div className="text-white/30 text-[7px]">{new Date(tx.created_at).toLocaleDateString()}</div>
                      </div>
                      <div className={`text-xs font-bold ${tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-purple-400'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{fmt(Math.abs(tx.amount))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
