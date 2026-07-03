import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Sparkles, 
  Calendar, 
  Tag, 
  TrendingDown, 
  Clock,
  X,
  Wallet,
  Smartphone,
  Coins,
  CreditCard,
  BookOpen,
  PiggyBank
} from 'lucide-react';
import { Expense, ExpenseCategory, Account } from '../types';
import { calculateExpenseYearly, CATEGORY_COLORS, CATEGORY_DESCRIPTIONS } from '../utils/financeCalculators';
import ConfirmModal from './ConfirmModal';

interface ExpenseTrackerProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'Housing',
  'Food & Dining',
  'Transport',
  'Utilities',
  'Healthcare',
  'Education',
  'Shopping & Goods',
  'Entertainment & Leisure',
  'Family Support',
  'Savings & Investments',
  'Other'
];

export default function ExpenseTracker({ 
  expenses, 
  setExpenses,
  accounts,
  setAccounts,
  triggerNotification
}: ExpenseTrackerProps) {
  // Input form state
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [frequency, setFrequency] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('once');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  // Deletion state
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);

  // Pending quick-add preset for account selection
  const [pendingPreset, setPendingPreset] = useState<{
    name: string;
    amt: number;
    cat: ExpenseCategory;
    freq: 'once' | 'weekly' | 'monthly' | 'yearly';
  } | null>(null);

  // Quick Preset states
  const [presets, setPresets] = useState<Array<{
    id: string;
    name: string;
    amt: number;
    cat: ExpenseCategory;
    freq: 'once' | 'weekly' | 'monthly' | 'yearly';
    emoji: string;
  }>>(() => {
    const saved = localStorage.getItem('wealthvault_expense_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      { id: '1', name: 'Apartment Rent', amt: 15000, cat: 'Housing' as ExpenseCategory, freq: 'monthly' as const, emoji: '🏠' },
      { id: '2', name: 'Weekly Groceries', amt: 2500, cat: 'Food & Dining' as ExpenseCategory, freq: 'weekly' as const, emoji: '🍎' },
      { id: '3', name: 'Evening Tea & Snacks', amt: 30, cat: 'Food & Dining' as ExpenseCategory, freq: 'once' as const, emoji: '☕' },
      { id: '4', name: 'Rickshaw / Ride-share', amt: 80, cat: 'Transport' as ExpenseCategory, freq: 'once' as const, emoji: '🚲' },
      { id: '5', name: 'Wifi Broadband internet', amt: 1000, cat: 'Utilities' as ExpenseCategory, freq: 'monthly' as const, emoji: '🌐' }
    ];
  });

  const [isPresetManageMode, setIsPresetManageMode] = useState(false);
  const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetAmt, setNewPresetAmt] = useState('');
  const [newPresetCat, setNewPresetCat] = useState<ExpenseCategory>('Food & Dining');
  const [newPresetFreq, setNewPresetFreq] = useState<'once' | 'weekly' | 'monthly' | 'yearly'>('once');
  const [newPresetEmoji, setNewPresetEmoji] = useState('💸');

  const savePresets = (newPresets: typeof presets) => {
    setPresets(newPresets);
    localStorage.setItem('wealthvault_expense_presets', JSON.stringify(newPresets));
  };

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(newPresetAmt);
    if (!newPresetName.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      triggerNotification('Please enter a valid template name and positive amount', 'error');
      return;
    }

    const newPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      amt: parsedAmt,
      cat: newPresetCat,
      freq: newPresetFreq,
      emoji: newPresetEmoji || '💸'
    };

    const updated = [...presets, newPreset];
    savePresets(updated);
    triggerNotification(`Created template "${newPresetName}"`, 'success');
    
    // Reset form
    setNewPresetName('');
    setNewPresetAmt('');
    setNewPresetCat('Food & Dining');
    setNewPresetFreq('once');
    setNewPresetEmoji('💸');
    setIsAddPresetOpen(false);
  };

  const handleDeletePreset = (id: string, name: string) => {
    const updated = presets.filter(p => p.id !== id);
    savePresets(updated);
    triggerNotification(`Removed template "${name}"`, 'info');
  };

  // Account rendering helper functions
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

  const getAccountBgColorClass = (color: string) => {
    switch (color) {
      case 'indigo': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'pink': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'amber': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rose': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'sky': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'violet': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  // Add custom expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!desc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: desc.trim(),
      amount: parsedAmount,
      category,
      frequency,
      date: date || new Date().toISOString().split('T')[0],
      accountId: selectedAccountId || undefined
    };

    if (selectedAccountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === selectedAccountId) {
          return { ...acc, balance: Math.max(0, acc.balance - parsedAmount) };
        }
        return acc;
      }));
      const accName = accounts.find(a => a.id === selectedAccountId)?.name || '';
      triggerNotification(`Expense of ৳${parsedAmount} logged & paid from "${accName}"`, 'success');
    } else {
      triggerNotification(`Expense of ৳${parsedAmount} logged`, 'success');
    }

    setExpenses(prev => [newExpense, ...prev]);
    setDesc('');
    setAmount('');
  };

  // Add quick preset template expense with explicit account selection
  const addQuickPreset = (
    name: string, 
    amt: number, 
    cat: ExpenseCategory, 
    freq: 'once' | 'weekly' | 'monthly' | 'yearly', 
    accountId?: string
  ) => {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description: name,
      amount: amt,
      category: cat,
      frequency: freq,
      date: new Date().toISOString().split('T')[0],
      accountId: accountId || undefined
    };

    if (accountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === accountId) {
          return { ...acc, balance: Math.max(0, acc.balance - amt) };
        }
        return acc;
      }));
      const accName = accounts.find(a => a.id === accountId)?.name || '';
      triggerNotification(`Logged "${name}" (৳${amt}) paid from "${accName}"`, 'success');
    } else {
      triggerNotification(`Logged "${name}" (৳${amt})`, 'success');
    }

    setExpenses(prev => [newExpense, ...prev]);
  };

  // Delete expense
  const handleDeleteExpense = (id: string) => {
    setDeleteExpenseId(id);
  };

  const executeDeleteExpense = () => {
    if (!deleteExpenseId) return;
    const target = expenses.find(exp => exp.id === deleteExpenseId);
    if (target) {
      if (target.accountId) {
        // Reimburse account balance on deletion
        setAccounts(prev => prev.map(acc => {
          if (acc.id === target.accountId) {
            return { ...acc, balance: acc.balance + target.amount };
          }
          return acc;
        }));
        triggerNotification(`Deleted expense; reimbursed ৳${target.amount} to account`, 'info');
      } else {
        triggerNotification(`Deleted expense`, 'info');
      }
      setExpenses(prev => prev.filter(exp => exp.id !== deleteExpenseId));
    }
    setDeleteExpenseId(null);
  };

  // Filter and search logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchesSearch = exp.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            exp.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchQuery, filterCategory]);

  const totalAnnualExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + calculateExpenseYearly(exp), 0);
  }, [expenses]);

  const targetExpense = deleteExpenseId ? expenses.find(exp => exp.id === deleteExpenseId) : null;

  return (
    <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="expense_tracker_container">
      {/* Delete Expense Double Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteExpenseId !== null}
        title="Delete Expense Entry"
        message={targetExpense ? `Are you sure you want to delete the expense "${targetExpense.description}"?` : ''}
        isDoubleConfirm={true}
        doubleConfirmMessage={targetExpense ? `CONFIRMATION 2/2: Are you absolutely certain you want to permanently delete "${targetExpense.description}"? This will remove the entry from your ledger.` : ''}
        confirmText="Delete Expense"
        cancelText="Cancel"
        onConfirm={executeDeleteExpense}
        onCancel={() => setDeleteExpenseId(null)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-950/40 text-rose-400 rounded-xl border border-rose-900/30">
            <Receipt size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white font-sans tracking-tight">Expense Tracking & Ledger</h3>
            <p className="text-xs text-zinc-400">Track and project your expenditures into a 1-year scale</p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-rose-950/40 text-rose-400 border border-rose-900/30">
          Annualized Spend: ৳{totalAnnualExpenses.toLocaleString()}/yr
        </span>
      </div>

      {/* Quick Add Presets Row */}
      <div className="mb-4 p-4 liquid-glass-inner space-y-3 shadow-inner">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles size={13} className="text-amber-500 animate-pulse" />
            <span className="font-bold uppercase tracking-widest text-[10px] text-zinc-500">Quick-Add Common Templates:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPresetManageMode(!isPresetManageMode)}
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-all cursor-pointer border ${
                isPresetManageMode 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                  : 'bg-zinc-800/60 border-[#27272a] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {isPresetManageMode ? 'Done Managing' : 'Manage Templates'}
            </button>
            <button
              type="button"
              onClick={() => setIsAddPresetOpen(!isAddPresetOpen)}
              className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={10} />
              <span>Create</span>
            </button>
          </div>
        </div>

        {/* Add Template Form (Expandable) */}
        <AnimatePresence>
          {isAddPresetOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleAddPreset}
              className="overflow-hidden border border-dashed border-[#27272a]/60 rounded-xl p-3.5 bg-zinc-950/40 space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-[#27272a]/50 pb-1.5">
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">New Quick-Add Template</span>
                <button 
                  type="button" 
                  onClick={() => setIsAddPresetOpen(false)}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Netflix, Tea, Gym"
                    value={newPresetName}
                    onChange={e => setNewPresetName(e.target.value)}
                    className="w-full text-xs liquid-input px-2.5 py-1.5 font-sans"
                  />
                </div>

                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Cost (৳)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Amount"
                    value={newPresetAmt}
                    onChange={e => setNewPresetAmt(e.target.value)}
                    className="w-full text-xs liquid-input px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
                  <select
                    value={newPresetCat}
                    onChange={e => setNewPresetCat(e.target.value as ExpenseCategory)}
                    className="w-full text-xs liquid-input px-2 py-1.5"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Freq</label>
                  <select
                    value={newPresetFreq}
                    onChange={e => setNewPresetFreq(e.target.value as any)}
                    className="w-full text-xs liquid-input px-2 py-1.5"
                  >
                    <option value="once">Once</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Emoji</label>
                  <select
                    value={newPresetEmoji}
                    onChange={e => setNewPresetEmoji(e.target.value)}
                    className="w-full text-xs liquid-input px-1 py-1.5 text-center"
                  >
                    <option value="💸">💸</option>
                    <option value="🏠">🏠</option>
                    <option value="🍎">🍎</option>
                    <option value="☕">☕</option>
                    <option value="🚲">🚲</option>
                    <option value="🌐">🌐</option>
                    <option value="🍿">🍿</option>
                    <option value="💊">💊</option>
                    <option value="🍔">🍔</option>
                    <option value="🚗">🚗</option>
                    <option value="🛍️">🛍️</option>
                    <option value="🎮">🎮</option>
                    <option value="🔌">🔌</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPresetOpen(false)}
                  className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer border border-[#27272a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                >
                  Add Template
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Presets List */}
        <div className="flex flex-wrap gap-2">
          {presets.length === 0 ? (
            <p className="text-zinc-500 text-[11px] italic">No templates available. Create one above to get started!</p>
          ) : (
            presets.map(p => {
              const freqAbbr = p.freq === 'once' ? '' : p.freq === 'weekly' ? '/wk' : p.freq === 'monthly' ? '/mo' : '/yr';
              return (
                <div key={p.id} className="relative group">
                  <button
                    type="button"
                    disabled={isPresetManageMode}
                    onClick={() => setPendingPreset({ name: p.name, amt: p.amt, cat: p.cat, freq: p.freq })}
                    className={`text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-[#27272a] px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                      isPresetManageMode ? 'opacity-85 border-rose-500/30 cursor-default' : 'cursor-pointer hover:border-indigo-500/40'
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.name} (৳{p.amt.toLocaleString()}{freqAbbr})</span>
                  </button>

                  {/* Deletion overlay / close button */}
                  {isPresetManageMode && (
                    <button
                      type="button"
                      onClick={() => handleDeletePreset(p.id, p.name)}
                      className="absolute -top-1.5 -right-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 border border-rose-800 shadow-md transition-all cursor-pointer flex items-center justify-center w-4 h-4"
                      title="Delete this template"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Form to log custom expenses */}
      <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-12 gap-3 liquid-glass-inner p-4 mb-4 shadow-inner" id="add_expense_form">
        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Expense Name</label>
          <input
            id="expense_desc_input"
            type="text"
            required
            placeholder="e.g. Tea, Uber, Rent"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
          />
        </div>

        <div className="md:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Category</label>
          <select
            id="expense_category_select"
            value={category}
            onChange={e => setCategory(e.target.value as ExpenseCategory)}
            className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Frequency</label>
          <select
            id="expense_frequency_select"
            value={frequency}
            onChange={e => setFrequency(e.target.value as any)}
            className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
          >
            <option value="once">One-Time</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="md:col-span-3 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount (৳)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">৳</span>
            <input
              id="expense_amount_input"
              type="number"
              min="0.01"
              step="any"
              required
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full text-sm liquid-input pl-7 pr-3 py-2 transition-all duration-300"
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Date Paid</label>
          <div className="relative">
            <input
              id="expense_date_input"
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
            />
          </div>
        </div>

        <div className="md:col-span-4 space-y-1">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Paid From Account</label>
          <select
            id="expense_account_select"
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300 font-semibold text-indigo-400"
          >
            <option value="">-- Cash/Unlinked --</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name}{acc.isDPS ? ' [DPS Scheme]' : ''} (৳{acc.balance.toLocaleString()})
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-4 flex items-end">
          <button
            id="add_expense_submit_button"
            type="submit"
            className="w-full text-sm font-semibold flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 cursor-pointer transition-all shadow-sm shadow-indigo-600/10"
          >
            <Plus size={16} /> Record Expense
          </button>
        </div>
      </form>

      {/* Ledger Filter & Search controls */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4 liquid-glass-inner p-2.5 shadow-inner" id="filter_controls">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="expense_search_input"
            type="text"
            placeholder="Search expense description or category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs liquid-input pl-8 pr-3 py-2 transition-all duration-300"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={13} className="text-zinc-500 shrink-0" />
          <select
            id="expense_category_filter"
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs liquid-input px-2.5 py-1.5 transition-all duration-300"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense ledger list table */}
      {/* Responsive Ledger layout */}
      <div className="max-h-[350px] overflow-y-auto pr-1 text-sm" id="ledger_table_container">
        {/* Desktop View (Table) */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#27272a] text-zinc-400 font-medium">
                <th className="py-2 pl-2">Expense / Category</th>
                <th className="py-2">Frequency</th>
                <th className="py-2 text-right">Nominal Cost</th>
                <th className="py-2 text-right">1-Year Impact</th>
                <th className="py-2 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-zinc-500 italic bg-[#09090b]/20 rounded-lg">
                      {expenses.length === 0 
                        ? 'No expenses recorded yet. Use the presets or form to start logging.' 
                        : 'No expenses match your search query or category filter.'}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map(exp => {
                    const annVal = calculateExpenseYearly(exp);
                    const color = CATEGORY_COLORS[exp.category] || '#999';
                    const linkedAccount = exp.accountId ? accounts.find(a => a.id === exp.accountId) : null;
                    return (
                      <motion.tr
                        key={exp.id}
                        initial={{ opacity: 0, y: -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-b border-[#27272a] hover:bg-[#09090b]/50 transition-colors"
                      >
                        <td className="py-3 pl-2">
                          <div>
                            <p className="font-semibold text-zinc-200">{exp.description}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span 
                                className="inline-block w-2 h-2 rounded-full" 
                                style={{ backgroundColor: color }}
                              ></span>
                              <span className="text-[10px] text-zinc-400 font-semibold">{exp.category}</span>
                              <span className="text-[10px] text-zinc-500 font-mono font-medium">• {exp.date}</span>
                              {linkedAccount && (
                                <span className="text-[9px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider font-sans">
                                  {linkedAccount.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-zinc-300 capitalize font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-[#27272a] text-[10px] font-medium text-zinc-400">
                            {exp.frequency === 'once' ? 'one-time' : exp.frequency}
                          </span>
                        </td>
                        <td className="py-3 text-right text-zinc-200 font-mono font-medium">
                          ৳{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right text-rose-400 font-bold font-mono">
                          ৳{annVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/yr
                        </td>
                        <td className="py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1.5 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="Delete Expense Entry"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile View (Cards) */}
        <div className="block md:hidden space-y-2.5">
          <AnimatePresence initial={false}>
            {filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-zinc-500 italic bg-[#09090b]/20 rounded-xl border border-dashed border-[#27272a] px-3">
                {expenses.length === 0 
                  ? 'No expenses recorded yet. Use presets or the form to start logging.' 
                  : 'No matching expenses found.'}
              </div>
            ) : (
              filteredExpenses.map(exp => {
                const annVal = calculateExpenseYearly(exp);
                const color = CATEGORY_COLORS[exp.category] || '#999';
                const linkedAccount = exp.accountId ? accounts.find(a => a.id === exp.accountId) : null;
                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3.5 bg-[#09090b]/30 rounded-xl border border-[#27272a] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-xs text-zinc-100">{exp.description}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
                          <span className="text-zinc-400 font-semibold">{exp.category}</span>
                          <span className="text-zinc-500 font-mono font-medium">• {exp.date}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 border border-[#27272a] hover:border-rose-900/30 rounded"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#27272a]/40 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-[#27272a] text-[9px] font-semibold text-zinc-400 capitalize">
                          {exp.frequency === 'once' ? 'one-time' : exp.frequency}
                        </span>
                        {linkedAccount && (
                          <span className="text-[9px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/30 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider font-sans">
                            {linkedAccount.name}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-300 font-mono text-[11px] block">Cost: ৳{exp.amount.toLocaleString()}</span>
                        <span className="text-rose-400 font-mono text-xs font-bold block">1-Yr: ৳{annVal.toLocaleString()}/yr</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Quick Preset Account Selector Modal */}
      <AnimatePresence>
        {pendingPreset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPendingPreset(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-[#121214] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 overflow-hidden space-y-4"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setPendingPreset(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                  <Wallet size={18} className="text-indigo-400" />
                  <span>Select Payment Account</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Select an account to deduct this quick-add template expense from.
                </p>
              </div>

              {/* Preset details card */}
              <div className="p-3 bg-[#09090b]/60 border border-[#27272a] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Template Expense</span>
                  <span className="text-xs font-semibold text-zinc-200">{pendingPreset.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">Cost ({pendingPreset.freq})</span>
                  <span className="text-sm font-bold text-rose-400 font-mono">৳{pendingPreset.amt.toLocaleString()}</span>
                </div>
              </div>

              {/* Accounts list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Available Accounts:</span>
                
                {accounts.map(acc => {
                  const isInsufficient = acc.balance < pendingPreset.amt;
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        addQuickPreset(pendingPreset.name, pendingPreset.amt, pendingPreset.cat, pendingPreset.freq, acc.id);
                        setPendingPreset(null);
                      }}
                      className="w-full flex items-center justify-between p-3 bg-[#09090b]/40 hover:bg-zinc-900/50 border border-[#27272a] hover:border-indigo-500/50 rounded-xl transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${getAccountBgColorClass(acc.color || 'indigo')}`}>
                          {getAccountIcon(acc.name, acc.isDPS)}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-zinc-200 group-hover:text-white block truncate">{acc.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Balance: ৳{acc.balance.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      {isInsufficient && (
                        <span className="text-[9px] font-semibold text-rose-400 bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded ml-2 shrink-0">
                          Low Balance
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Cash/Unlinked option */}
                <button
                  type="button"
                  onClick={() => {
                    addQuickPreset(pendingPreset.name, pendingPreset.amt, pendingPreset.cat, pendingPreset.freq);
                    setPendingPreset(null);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[#09090b]/40 hover:bg-zinc-900/50 border border-dashed border-[#27272a] hover:border-zinc-500 rounded-xl transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-800/50 text-zinc-400 rounded-lg shrink-0 flex items-center justify-center">
                      <Coins size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-200 block">Cash / Unlinked</span>
                      <span className="text-[10px] text-zinc-500">Record without deducting any accounts</span>
                    </div>
                  </div>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPendingPreset(null)}
                className="w-full text-center py-2 bg-zinc-900 hover:bg-zinc-800 border border-[#27272a] rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
