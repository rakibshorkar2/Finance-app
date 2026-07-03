import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Smartphone, 
  Coins, 
  CreditCard, 
  BookOpen,
  DollarSign,
  PiggyBank,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Account } from '../types';
import ConfirmModal from './ConfirmModal';

interface AccountBalancesProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AccountBalances({ 
  accounts, 
  setAccounts, 
  triggerNotification 
}: AccountBalancesProps) {
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('indigo');
  const [showAddForm, setShowAddForm] = useState(false);

  // DPS state fields
  const [isNewAccDPS, setIsNewAccDPS] = useState(false);
  const [newAccDpsMonthlyInst, setNewAccDpsMonthlyInst] = useState('');
  const [newAccDpsTargetAmt, setNewAccDpsTargetAmt] = useState('');

  // Quick balance adjustment state
  const [adjustingAccId, setAdjustingAccId] = useState<string | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract'>('add');

  // Deletion state
  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) {
      triggerNotification('Please enter a valid account name', 'error');
      return;
    }
    const bal = parseFloat(newAccBalance) || 0;
    
    const monthlyInst = isNewAccDPS ? (parseFloat(newAccDpsMonthlyInst) || undefined) : undefined;
    const targetAmt = isNewAccDPS ? (parseFloat(newAccDpsTargetAmt) || undefined) : undefined;

    const newAcc: Account = {
      id: 'acc_' + Date.now(),
      name: newAccName.trim(),
      balance: bal,
      color: newAccColor,
      isDPS: isNewAccDPS,
      dpsMonthlyInst: monthlyInst,
      dpsTargetAmt: targetAmt
    };

    setAccounts(prev => [...prev, newAcc]);
    setNewAccName('');
    setNewAccBalance('');
    setIsNewAccDPS(false);
    setNewAccDpsMonthlyInst('');
    setNewAccDpsTargetAmt('');
    setShowAddForm(false);
    
    const dpsMsg = isNewAccDPS ? ' (DPS Scheme Account)' : '';
    triggerNotification(`Account "${newAcc.name}" created with balance ৳${bal.toLocaleString()}${dpsMsg}`, 'success');
  };

  const handleDeleteAccount = (id: string, name: string) => {
    setDeleteAccountId(id);
  };

  const executeDeleteAccount = () => {
    if (!deleteAccountId) return;
    const target = accounts.find(acc => acc.id === deleteAccountId);
    if (target) {
      setAccounts(prev => prev.filter(acc => acc.id !== deleteAccountId));
      triggerNotification(`Account "${target.name}" deleted`, 'info');
    }
    setDeleteAccountId(null);
  };

  const handleAdjustBalance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingAccId) return;
    const amount = parseFloat(adjustmentAmount);
    if (isNaN(amount) || amount <= 0) {
      triggerNotification('Please enter a valid positive amount', 'error');
      return;
    }

    setAccounts(prev => prev.map(acc => {
      if (acc.id === adjustingAccId) {
        const diff = adjustmentType === 'add' ? amount : -amount;
        const newBal = Math.max(0, acc.balance + diff);
        return { ...acc, balance: newBal };
      }
      return acc;
    }));

    const accName = accounts.find(a => a.id === adjustingAccId)?.name || '';
    triggerNotification(
      `Adjusted ${accName} balance by ${adjustmentType === 'add' ? '+' : '-'}৳${amount.toLocaleString()}`,
      'success'
    );

    setAdjustingAccId(null);
    setAdjustmentAmount('');
  };

  const getAccountIcon = (name: string, isDPS?: boolean) => {
    if (isDPS) {
      return <PiggyBank size={16} className="text-amber-400" />;
    }
    const lower = name.toLowerCase();
    if (lower.includes('dps') || lower.includes('deposit') || lower.includes('pension') || lower.includes('scheme')) {
      return <PiggyBank size={16} className="text-amber-400" />;
    }
    if (lower.includes('bkash') || lower.includes('nagad') || lower.includes('rocket') || lower.includes('mobile')) {
      return <Smartphone size={16} className="text-pink-400" />;
    }
    if (lower.includes('cash') || lower.includes('hand') || lower.includes('pocket')) {
      return <Coins size={16} className="text-amber-400" />;
    }
    if (lower.includes('tuition') || lower.includes('salary') || lower.includes('job')) {
      return <BookOpen size={16} className="text-emerald-400" />;
    }
    return <CreditCard size={16} className="text-[#38bdf8]" />;
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-500';
      case 'pink': return 'bg-pink-500';
      case 'amber': return 'bg-amber-500';
      case 'emerald': return 'bg-emerald-500';
      case 'rose': return 'bg-rose-500';
      case 'sky': return 'bg-sky-500';
      case 'violet': return 'bg-violet-500';
      default: return 'bg-zinc-500';
    }
  };

  const getBorderColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'border-indigo-500/20';
      case 'pink': return 'border-pink-500/20';
      case 'amber': return 'border-amber-500/20';
      case 'emerald': return 'border-emerald-500/20';
      case 'rose': return 'border-rose-500/20';
      case 'sky': return 'border-sky-500/20';
      case 'violet': return 'border-violet-500/20';
      default: return 'border-zinc-500/20';
    }
  };

  const getBgColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-500/10 text-indigo-400';
      case 'pink': return 'bg-pink-500/10 text-pink-400';
      case 'amber': return 'bg-amber-500/10 text-amber-400';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400';
      case 'rose': return 'bg-rose-500/10 text-rose-400';
      case 'sky': return 'bg-sky-500/10 text-sky-400';
      case 'violet': return 'bg-violet-500/10 text-violet-400';
      default: return 'bg-zinc-500/10 text-zinc-400';
    }
  };

  const targetAccount = deleteAccountId ? accounts.find(acc => acc.id === deleteAccountId) : null;

  return (
    <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="account_balances_container">
      {/* Delete Account Double Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteAccountId !== null}
        title="Delete Account"
        message={targetAccount ? `Are you sure you want to delete the account "${targetAccount.name}"? This will not alter your historical ledger entries, but the account balance track will be removed.` : ''}
        isDoubleConfirm={true}
        doubleConfirmMessage={targetAccount ? `CONFIRMATION 2/2: Are you absolutely certain you want to permanently delete "${targetAccount.name}"? All balance records for this account will be lost.` : ''}
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={executeDeleteAccount}
        onCancel={() => setDeleteAccountId(null)}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
            <Wallet size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-sans tracking-tight">Accounts & Cash Reserves</h3>
            <p className="text-xs text-zinc-400">Manage real-time balances of your wallets & income streams</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 hover:bg-[#27272a] border border-[#27272a] rounded-lg transition-colors cursor-pointer text-zinc-300 hover:text-white"
          title="Add New Account"
          id="btn_add_account_toggle"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Net Wealth Metric */}
      <div className="liquid-glass-inner p-4 mb-5 flex items-center justify-between shadow-inner" id="net_wealth_display">
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Total Liquid Wealth</span>
          <span className="text-2xl font-extrabold font-mono text-emerald-400">৳{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
        <div className="text-right text-[11px] text-zinc-400">
          <span>Active accounts: </span>
          <span className="font-bold text-zinc-200">{accounts.length}</span>
        </div>
      </div>

      {/* Add New Account Form */}
      {showAddForm && (
        <form onSubmit={handleCreateAccount} className="liquid-glass-inner p-4 mb-4 space-y-3 shadow-inner" id="add_account_form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Account Name</label>
              <input
                type="text"
                required
                placeholder="e.g., bKash, Bank Asia, Pocket Cash"
                value={newAccName}
                onChange={e => setNewAccName(e.target.value)}
                className="w-full text-xs liquid-input px-3 py-2 transition-all duration-300"
                id="input_new_acc_name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Initial Balance (৳)</label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="e.g., 500"
                value={newAccBalance}
                onChange={e => setNewAccBalance(e.target.value)}
                className="w-full text-xs liquid-input px-3 py-2 transition-all duration-300"
                id="input_new_acc_balance"
              />
            </div>
          </div>

          {/* DPS Toggle & Options */}
          <div className="p-3.5 liquid-glass-inner space-y-3 shadow-inner">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkbox_is_dps"
                checked={isNewAccDPS}
                onChange={e => {
                  setIsNewAccDPS(e.target.checked);
                  if (e.target.checked && !newAccName) {
                    setNewAccName('Monthly DPS');
                  }
                  if (e.target.checked) {
                    setNewAccColor('amber');
                  }
                }}
                className="rounded border-[#27272a] text-amber-500 focus:ring-amber-500 bg-black/40 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="checkbox_is_dps" className="text-xs font-bold text-zinc-300 select-none cursor-pointer flex items-center gap-1.5">
                <PiggyBank size={14} className="text-amber-500 animate-bounce" />
                This is a Deposit Pension Scheme (DPS) / Monthly Savings Account
              </label>
            </div>

            {isNewAccDPS && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block flex items-center gap-1">
                    Monthly Installment (৳) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required={isNewAccDPS}
                    placeholder="e.g., 2000"
                    value={newAccDpsMonthlyInst}
                    onChange={e => setNewAccDpsMonthlyInst(e.target.value)}
                    className="w-full text-xs liquid-input px-3 py-2 transition-all duration-300 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                    Target Maturity Amount (৳, Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g., 100000"
                    value={newAccDpsTargetAmt}
                    onChange={e => setNewAccDpsTargetAmt(e.target.value)}
                    className="w-full text-xs liquid-input px-3 py-2 transition-all duration-300 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Color Palette</label>
              <div className="flex gap-1.5">
                {['indigo', 'pink', 'amber', 'emerald', 'sky', 'violet'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewAccColor(color)}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-all ${getColorClass(color)} ${
                      newAccColor === color ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 cursor-pointer transition-colors w-full sm:w-auto"
              id="submit_new_account"
            >
              Add Account
            </button>
          </div>
        </form>
      )}

      {/* Adjust Account Balance Modal/Inline form */}
      {adjustingAccId && (
        <form onSubmit={handleAdjustBalance} className="liquid-glass-inner p-4 mb-4 space-y-3 shadow-inner" id="adjust_balance_form">
          <div className="flex items-center justify-between border-b border-[#27272a]/60 pb-2 mb-2">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Adjust Balance ({accounts.find(a => a.id === adjustingAccId)?.name})
            </h4>
            <button
              type="button"
              onClick={() => setAdjustingAccId(null)}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Adjustment Type</label>
              <div className="flex p-0.5 bg-black/30 border border-[#27272a]/40 rounded-lg">
                <button
                  type="button"
                  onClick={() => setAdjustmentType('add')}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                    adjustmentType === 'add' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-zinc-400'
                  }`}
                >
                  <ArrowUpRight size={12} /> Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType('subtract')}
                  className={`flex-1 text-[10px] font-bold py-1.5 rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1 ${
                    adjustmentType === 'subtract' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-zinc-400'
                  }`}
                >
                  <ArrowDownRight size={12} /> Withdraw
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount (৳)</label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                placeholder="0.00"
                value={adjustmentAmount}
                onChange={e => setAdjustmentAmount(e.target.value)}
                className="w-full text-xs liquid-input px-3 py-2 transition-all duration-300"
                id="input_adjustment_amount"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2.5 cursor-pointer transition-colors"
              id="submit_adjustment"
            >
              Apply Adjustment
            </button>
          </div>
        </form>
      )}

      {/* Account Items List */}
      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1" id="accounts_list_items">
        {accounts.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-[#27272a] rounded-xl text-zinc-500 text-xs italic">
            No accounts created yet. Use the '+' button to log your bank, bKash, or wallet.
          </div>
        ) : (
          accounts.map(acc => {
            const colorName = acc.color || 'indigo';
            return (
              <div 
                key={acc.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 ${getBorderColorClass(colorName)}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getBgColorClass(colorName)}`}>
                    {getAccountIcon(acc.name, acc.isDPS)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-semibold text-xs text-zinc-100">{acc.name}</h4>
                      {acc.isDPS && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[8px] uppercase tracking-wider font-bold flex items-center gap-0.5">
                          <PiggyBank size={8} /> DPS Scheme
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <span className="text-[9px] font-mono text-zinc-500">ID: {acc.id.replace('acc_', '')}</span>
                      
                      {acc.isDPS && (
                        <div className="space-y-0.5 mt-1">
                          {acc.dpsMonthlyInst && (
                            <span className="text-[10px] text-zinc-400 block font-sans">
                              Installment: <strong className="text-zinc-200 font-mono">৳{acc.dpsMonthlyInst.toLocaleString()}</strong>/mo
                            </span>
                          )}
                          {acc.dpsTargetAmt && (
                            <div className="space-y-1">
                              <span className="text-[10px] text-zinc-400 block font-sans">
                                Maturity: <strong className="text-zinc-200 font-mono">৳{acc.dpsTargetAmt.toLocaleString()}</strong>
                                <span className="text-amber-500 ml-1 font-bold">
                                  ({Math.min(100, Math.round((acc.balance / acc.dpsTargetAmt) * 100))}% saved)
                                </span>
                              </span>
                              {/* Simple mini progress bar */}
                              <div className="w-28 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, (acc.balance / acc.dpsTargetAmt) * 100)}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white block">
                      ৳{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAdjustingAccId(acc.id);
                        setAdjustmentType('add');
                      }}
                      className="p-1 hover:bg-[#27272a] text-zinc-400 hover:text-indigo-400 border border-[#27272a] rounded-md transition-colors cursor-pointer text-[10px] font-semibold"
                      title="Adjust account balance"
                    >
                      Adjust
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteAccount(acc.id, acc.name)}
                      className="p-1 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 border border-[#27272a] rounded-md transition-colors cursor-pointer"
                      title="Delete account entry"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
