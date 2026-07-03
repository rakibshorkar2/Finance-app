import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  RefreshCw, 
  FileJson, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Check, 
  CalendarDays,
  Tag,
  Wallet,
  AlertCircle,
  X
} from 'lucide-react';
import { Account, IncomeSource, Expense } from '../types';
import { loadVaultFromCloud } from '../utils/firebaseService';

interface DatabaseExplorerProps {
  vaultId: string;
  accounts: Account[];
  salarySources: IncomeSource[];
  expenses: Expense[];
  homeInflows: { id: string; amount: number; description: string; date: string; accountId?: string }[];
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
  // Callback to refresh parents data from Firestore
  onRefreshFromCloud: () => Promise<void>;
  isSyncing: boolean;
}

export default function DatabaseExplorer({
  vaultId,
  accounts,
  salarySources,
  expenses,
  homeInflows,
  triggerNotification,
  onRefreshFromCloud,
  isSyncing
}: DatabaseExplorerProps) {
  // Advanced Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [recordType, setRecordType] = useState<'All' | 'Expense' | 'Salary' | 'HomeInflow' | 'Account'>('All');
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAccount, setSelectedAccount] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'name-asc'>('date-desc');
  
  // Modal for displaying raw Firestore record details (JSON inspect)
  const [inspectRecord, setInspectRecord] = useState<any>(null);

  // Categories list derived from expenses
  const categories = useMemo(() => {
    const cats = new Set<string>();
    expenses.forEach(exp => {
      if (exp.category) cats.add(exp.category);
    });
    return Array.from(cats);
  }, [expenses]);

  // Combined flat list of all database items
  const databaseItems = useMemo(() => {
    const items: {
      id: string;
      source: 'Expense' | 'Salary' | 'HomeInflow' | 'Account';
      name: string;
      category?: string;
      amount: number;
      date?: string;
      frequency?: string;
      accountId?: string;
      accountName?: string;
      raw: any;
    }[] = [];

    // 1. Add Accounts
    accounts.forEach(acc => {
      items.push({
        id: acc.id,
        source: 'Account',
        name: acc.name,
        category: 'Assets & Wallets',
        amount: acc.balance,
        raw: acc
      });
    });

    // 2. Add Salary Sources (converted to yearly representation or just stated)
    salarySources.forEach(src => {
      items.push({
        id: src.id,
        source: 'Salary',
        name: src.name,
        category: 'Job Income',
        amount: src.amount,
        frequency: src.frequency,
        accountId: src.accountId,
        accountName: accounts.find(a => a.id === src.accountId)?.name,
        raw: src
      });
    });

    // 3. Add Home Cash Log Inflows
    homeInflows.forEach(inf => {
      items.push({
        id: inf.id,
        source: 'HomeInflow',
        name: inf.description,
        category: 'Direct Deposit / Cash',
        amount: inf.amount,
        date: inf.date,
        accountId: inf.accountId,
        accountName: accounts.find(a => a.id === inf.accountId)?.name,
        raw: inf
      });
    });

    // 4. Add Expenses
    expenses.forEach(exp => {
      items.push({
        id: exp.id,
        source: 'Expense',
        name: exp.description,
        category: exp.category,
        amount: exp.amount,
        date: exp.date,
        frequency: exp.frequency,
        accountId: exp.accountId,
        accountName: accounts.find(a => a.id === exp.accountId)?.name,
        raw: exp
      });
    });

    return items;
  }, [accounts, salarySources, expenses, homeInflows]);

  // Apply Search & Advanced Filters
  const filteredItems = useMemo(() => {
    let result = [...databaseItems];

    // Search query filter (matches name, category, or account name)
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query)) ||
        (item.accountName && item.accountName.toLowerCase().includes(query)) ||
        item.source.toLowerCase().includes(query)
      );
    }

    // Record Type filter
    if (recordType !== 'All') {
      result = result.filter(item => item.source === recordType);
    }

    // Min Amount filter
    if (minAmount !== '') {
      result = result.filter(item => item.amount >= minAmount);
    }

    // Max Amount filter
    if (maxAmount !== '') {
      result = result.filter(item => item.amount <= maxAmount);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter(item => item.category === selectedCategory);
    }

    // Account filter
    if (selectedAccount !== 'All') {
      result = result.filter(item => item.accountId === selectedAccount);
    }

    // Apply Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        const dateA = a.date || '0000-00-00';
        const dateB = b.date || '0000-00-00';
        return dateB.localeCompare(dateA);
      }
      if (sortBy === 'date-asc') {
        const dateA = a.date || '9999-12-31';
        const dateB = b.date || '9999-12-31';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

    return result;
  }, [databaseItems, searchTerm, recordType, minAmount, maxAmount, selectedCategory, selectedAccount, sortBy]);

  // Aggregated Stats of Filtered Data
  const stats = useMemo(() => {
    let totalInflow = 0;
    let totalOutflow = 0;
    let accountsTotal = 0;

    filteredItems.forEach(item => {
      if (item.source === 'Salary' || item.source === 'HomeInflow') {
        totalInflow += item.amount;
      } else if (item.source === 'Expense') {
        totalOutflow += item.amount;
      } else if (item.source === 'Account') {
        accountsTotal += item.amount;
      }
    });

    return {
      inflow: totalInflow,
      outflow: totalOutflow,
      net: totalInflow - totalOutflow,
      accounts: accountsTotal,
      count: filteredItems.length
    };
  }, [filteredItems]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setRecordType('All');
    setMinAmount('');
    setMaxAmount('');
    setSelectedCategory('All');
    setSelectedAccount('All');
    setSortBy('date-desc');
    triggerNotification('Search filters cleared', 'info');
  };

  const handleForceRefresh = async () => {
    try {
      await onRefreshFromCloud();
      triggerNotification('Successfully re-pulled latest state from cloud Firestore!', 'success');
    } catch (e) {
      triggerNotification('Failed to pull newest database data', 'error');
    }
  };

  return (
    <div className="space-y-6" id="database_explorer_container">
      {/* 1. Header & Live Firestore Connectivity Info */}
      <div className="liquid-glass p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-sans tracking-tight">Cloud Firestore Explorer</h3>
              <p className="text-xs text-zinc-400">
                Direct read access to current synchronized tables under vault <code className="text-indigo-400 font-mono font-semibold bg-indigo-950/30 px-1.5 py-0.5 rounded">{vaultId || 'local-fallback'}</code>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleForceRefresh}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#09090b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] rounded-xl text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              Re-query Firestore
            </button>
            <div className="text-[11px] text-zinc-400 font-medium">
              Mode: <span className="text-emerald-400 font-bold">Auto-sync Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics of Matched Query Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="db_metrics_panel">
        <div className="liquid-glass p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Matched Documents</span>
            <span className="p-1 rounded-lg bg-zinc-900 text-zinc-400 text-xs font-mono font-bold px-2">SQL/NoSQL</span>
          </div>
          <div className="text-2xl font-bold text-white font-sans tracking-tight">
            {stats.count} <span className="text-xs text-zinc-500 font-normal">items</span>
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Matched under current active search criteria</div>
        </div>

        <div className="liquid-glass p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Total Inflows Stored</span>
            <TrendingUp size={14} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            ৳{stats.inflow.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Sum of filtered active salary + cash entries</div>
        </div>

        <div className="liquid-glass p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Total Outflows Stored</span>
            <TrendingDown size={14} className="text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight">
            ৳{stats.outflow.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Sum of filtered active expense tickets</div>
        </div>

        <div className="liquid-glass p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans">Net Filter Margin</span>
            <DollarSign size={14} className="text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 font-mono tracking-tight">
            ৳{stats.net.toLocaleString()}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Inflow minus outflow of current selection</div>
        </div>
      </div>

      {/* 3. Advanced Filtering Command Center */}
      <div className="liquid-glass p-6 space-y-4 shadow-sm" id="db_filter_panel">
        <div className="flex items-center justify-between border-b border-[#27272a]/80 pb-3">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Filter size={15} className="text-indigo-400" />
            <span>Advanced Search & Query Filters</span>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-zinc-400 hover:text-white hover:underline transition-all cursor-pointer"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* Main text search query */}
          <div className="space-y-1 md:col-span-2 lg:col-span-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Keyword Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name, category, wallet..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl pl-9 pr-4 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 placeholder-zinc-600"
              />
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            </div>
          </div>

          {/* Record Type filter dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Record Type</label>
            <select
              value={recordType}
              onChange={e => setRecordType(e.target.value as any)}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="All">All Documents</option>
              <option value="Expense">Expenses (Outflow)</option>
              <option value="Salary">Job Salaries (Inflow)</option>
              <option value="HomeInflow">Cash Logs (Inflow)</option>
              <option value="Account">Bank Accounts / Wallets</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="All">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="Assets & Wallets">Assets & Wallets</option>
              <option value="Job Income">Job Income</option>
              <option value="Direct Deposit / Cash">Direct Deposit / Cash</option>
            </select>
          </div>

          {/* Account Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Source Wallet/Account</label>
            <select
              value={selectedAccount}
              onChange={e => setSelectedAccount(e.target.value)}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="All">All Accounts</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </div>

          {/* Amount range filters */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Min Amount (৳)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={minAmount}
              onChange={e => setMinAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Max Amount (৳)</label>
            <input
              type="number"
              placeholder="e.g. 50000"
              value={maxAmount}
              onChange={e => setMaxAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Sort order */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Sort By Order</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full text-xs bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2.5 text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="date-desc">Date: Latest First</option>
              <option value="date-asc">Date: Oldest First</option>
              <option value="amount-desc">Amount: Highest First</option>
              <option value="amount-asc">Amount: Lowest First</option>
              <option value="name-asc">Name: Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Query Output Console/Table */}
      <div className="liquid-glass overflow-hidden shadow-sm">
        <div className="p-4 bg-zinc-900/40 border-b border-[#27272a]/40 flex items-center justify-between">
          <div className="text-xs font-semibold text-zinc-300 font-sans">
            Resulting Data Rows ({filteredItems.length} matched)
          </div>
          <span className="text-[9px] bg-indigo-950/40 text-indigo-400 px-2.5 py-1 rounded font-mono font-bold uppercase tracking-wider">
            Connected Project: stalwart-smoke-d4dh4
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-2">
            <AlertCircle size={24} className="mx-auto text-zinc-600" />
            <p className="text-sm font-semibold">No records match the active search filter parameters.</p>
            <p className="text-xs">Try clearing the search query or adjusting the minimum/maximum limits.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-950/20">
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Name/Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Wallet/Account</th>
                  <th className="py-3 px-4">Date / Interval</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]/60 text-xs">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-zinc-900/30 transition-all">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider ${
                        item.source === 'Expense' 
                          ? 'bg-rose-950/50 text-rose-400 border border-rose-900/20'
                          : item.source === 'Salary'
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/20'
                          : item.source === 'HomeInflow'
                          ? 'bg-teal-950/50 text-teal-400 border border-teal-900/20'
                          : 'bg-indigo-950/50 text-indigo-400 border border-indigo-900/20'
                      }`}>
                        {item.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white whitespace-nowrap max-w-xs truncate">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Tag size={10} className="text-zinc-500" />
                        <span>{item.category || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Wallet size={10} className="text-zinc-500" />
                        <span>{item.accountName || 'No linked account'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 whitespace-nowrap font-mono text-[11px]">
                      {item.date ? (
                        <div className="flex items-center gap-1.5">
                          <CalendarDays size={10} className="text-zinc-500" />
                          <span>{item.date}</span>
                        </div>
                      ) : item.frequency ? (
                        <span className="text-zinc-500 font-sans italic capitalize">Recurring: {item.frequency}</span>
                      ) : (
                        <span className="text-zinc-500 font-sans italic">Always On</span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-bold font-mono whitespace-nowrap text-sm ${
                      item.source === 'Expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {item.source === 'Expense' ? '-' : '+'}৳{item.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setInspectRecord(item.raw)}
                        className="text-[10px] text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 px-2 py-1 rounded border border-[#27272a] cursor-pointer font-sans"
                      >
                        JSON Raw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raw JSON Record inspector overlay modal */}
      {inspectRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setInspectRecord(null)} />
          <div className="relative bg-[#121214] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileJson className="text-indigo-400" size={18} />
                <h4 className="font-bold text-white font-sans text-sm">Firestore Document Representation</h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <pre className="bg-[#09090b] text-[11px] text-indigo-300 p-4 rounded-xl font-mono overflow-auto max-h-96 border border-[#27272a]">
              {JSON.stringify(inspectRecord, null, 2)}
            </pre>
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#27272a]/50">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(inspectRecord, null, 2));
                  triggerNotification('Raw JSON schema copied to clipboard!', 'success');
                }}
                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 cursor-pointer font-semibold"
              >
                Copy Schema
              </button>
              <button
                type="button"
                onClick={() => setInspectRecord(null)}
                className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-[#27272a] rounded-lg px-4 py-2 cursor-pointer font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
