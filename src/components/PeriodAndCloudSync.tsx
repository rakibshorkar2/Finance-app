import React, { useState } from 'react';
import { 
  Cloud, 
  CloudOff, 
  CloudLightning, 
  RefreshCw, 
  Calendar, 
  Search, 
  Settings, 
  Database,
  ArrowRight,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { loadVaultFromCloud, saveVaultToCloud, BudgetVaultState } from '../utils/firebaseService';
import { Account, IncomeSource, DeductionSettings, Expense } from '../types';

interface PeriodAndCloudSyncProps {
  noCardWrapper?: boolean;
  // Cloud Sync properties
  vaultId: string;
  setVaultId: (id: string) => void;
  syncStatus: 'synced' | 'unsynced' | 'offline' | 'loading';
  setSyncStatus: (status: 'synced' | 'unsynced' | 'offline' | 'loading') => void;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;

  // App States to synchronize
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  salarySources: IncomeSource[];
  setSalarySources: React.Dispatch<React.SetStateAction<IncomeSource[]>>;
  deductions: DeductionSettings;
  setDeductions: React.Dispatch<React.SetStateAction<DeductionSettings>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  homeInflows: { id: string; amount: number; description: string; date: string }[];
  setHomeInflows: React.Dispatch<React.SetStateAction<{ id: string; amount: number; description: string; date: string }[]>>;

  // Date Filters
  selectedYear: string; // "All" or e.g. "2026"
  setSelectedYear: (y: string) => void;
  selectedMonth: string; // "All" or "01" - "12"
  setSelectedMonth: (m: string) => void;
  selectedDay: string; // "All" or "01" - "31"
  setSelectedDay: (d: string) => void;
}

const MONTHS = [
  { value: 'All', label: 'All Months' },
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const YEARS = ['All', '2025', '2026', '2027', '2028'];

export default function PeriodAndCloudSync({
  noCardWrapper = false,
  vaultId,
  setVaultId,
  syncStatus,
  setSyncStatus,
  triggerNotification,
  accounts,
  setAccounts,
  salarySources,
  setSalarySources,
  deductions,
  setDeductions,
  expenses,
  setExpenses,
  homeInflows,
  setHomeInflows,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedDay,
  setSelectedDay
}: PeriodAndCloudSyncProps) {
  const [editingVaultId, setEditingVaultId] = useState(vaultId);
  const [showConfig, setShowConfig] = useState(false);

  // Manual Trigger: Save current state to database
  const handlePushToCloud = async () => {
    if (!vaultId.trim()) {
      triggerNotification('Please enter a valid Vault Key to sync', 'error');
      return;
    }
    if (!navigator.onLine) {
      triggerNotification('আপনি এখন অফলাইনে আছেন! ক্লাউডে ডেটা পাঠাতে অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন চেক করুন।', 'error');
      return;
    }
    setSyncStatus('loading');
    try {
      const stateToSave: BudgetVaultState = {
        vaultId: vaultId.trim(),
        accounts,
        salarySources,
        deductions,
        expenses,
        homeInflows,
        updatedAt: new Date().toISOString()
      };
      await saveVaultToCloud(stateToSave);
      setSyncStatus('synced');
      triggerNotification(`Vault state saved year, month, and day-wise in Firestore! Key: ${vaultId}`, 'success');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('unsynced');
      triggerNotification('Failed to save to cloud database: ' + (err.message || ''), 'error');
    }
  };

  // Manual Trigger: Load state from cloud database
  const handlePullFromCloud = async () => {
    if (!vaultId.trim()) {
      triggerNotification('Please enter a valid Vault Key to load', 'error');
      return;
    }
    if (!navigator.onLine) {
      triggerNotification('আপনি এখন অফলাইনে আছেন! ক্লাউড থেকে ডেটা আনতে অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন চেক করুন।', 'error');
      return;
    }
    setSyncStatus('loading');
    try {
      const fetched = await loadVaultFromCloud(vaultId.trim());
      if (fetched) {
        if (fetched.accounts) setAccounts(fetched.accounts);
        if (fetched.salarySources) setSalarySources(fetched.salarySources);
        if (fetched.deductions) setDeductions(fetched.deductions);
        if (fetched.expenses) setExpenses(fetched.expenses);
        if (fetched.homeInflows) setHomeInflows(fetched.homeInflows);
        setSyncStatus('synced');
        triggerNotification(`Vault state loaded successfully from Firestore!`, 'success');
      } else {
        setSyncStatus('unsynced');
        triggerNotification(`No active vault found for key "${vaultId}". Press "Sync to Cloud" to initialize it.`, 'info');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('unsynced');
      triggerNotification('Failed to fetch from cloud database: ' + (err.message || ''), 'error');
    }
  };

  const handleUpdateVaultId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = editingVaultId.trim();
    if (!cleanId) {
      triggerNotification('Vault Key cannot be empty', 'error');
      return;
    }
    setVaultId(cleanId);
    localStorage.setItem('budget_vault_id', cleanId);
    triggerNotification(`Vault Key updated to "${cleanId}"`, 'success');
    setShowConfig(false);
  };

  // Days list 1 - 31
  const days = ['All', ...Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))];

  return (
    <div 
      className={noCardWrapper ? "space-y-6" : "liquid-glass p-6 shadow-sm space-y-6"} 
      id="period_and_cloud_sync_container"
    >
      {/* Top row: Year/Month Selector and Cloud Status Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
            <Calendar size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-zinc-900 dark:text-white font-sans tracking-tight">Period & Database Sync</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Filter your financials and sync transaction histories day-wise</p>
          </div>
        </div>

        {/* Cloud Sync Badges & Compact Action */}
        <div className="flex items-center gap-2">
          {syncStatus === 'loading' ? (
            <span className="flex items-center gap-1 text-[10px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 px-2.5 py-1 rounded-full font-mono font-semibold animate-pulse">
              <RefreshCw size={10} className="animate-spin" /> Syncing...
            </span>
          ) : syncStatus === 'synced' ? (
            <span className="flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 px-2.5 py-1 rounded-full font-mono font-semibold">
              <Cloud size={10} /> Cloud Synced
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20 px-2.5 py-1 rounded-full font-mono font-semibold">
              <CloudOff size={10} /> Local Cache Only
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-[#27272a] border border-zinc-200 dark:border-[#27272a] rounded-lg transition-colors cursor-pointer text-zinc-600 dark:text-zinc-300"
            title="Database Connection Config"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* Cloud DB Setup and Key Info */}
      {showConfig && (
        <form onSubmit={handleUpdateVaultId} className="bg-zinc-50/80 dark:bg-[#09090b]/60 border border-zinc-200 dark:border-[#27272a] p-4 rounded-xl space-y-3" id="cloud_db_config_form">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Cloud Vault Key (ID)</label>
              <span className="text-[9px] text-indigo-600 dark:text-indigo-400">Allows accessing your budget on any browser</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. rakib-financial-vault"
                value={editingVaultId}
                onChange={e => setEditingVaultId(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="submit"
                className="text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3.5 py-2 cursor-pointer transition-colors"
              >
                Set Key
              </button>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Your ledger will be stored year, month, and day-wise in Firestore under project <code className="text-zinc-700 dark:text-zinc-400 font-semibold font-mono">stalwart-smoke-d4dh4</code>. Use the exact same key to load it on another computer or browser!
          </div>
        </form>
      )}

      {/* Main Database Action Rows */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="db_sync_button_group">
        <button
          type="button"
          onClick={handlePushToCloud}
          className="flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition-all hover:scale-[1.01]"
        >
          <Database size={14} /> Sync to Cloud Database
        </button>
        <button
          type="button"
          onClick={handlePullFromCloud}
          className="flex items-center justify-center gap-2 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-[#09090b] dark:hover:bg-zinc-800 border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
        >
          <RefreshCw size={14} /> Fetch from Cloud Database
        </button>
      </div>

      {/* Calendar Date Filter Widgets */}
      <div className="bg-zinc-50/50 dark:bg-[#09090b]/40 rounded-xl p-4.5 border border-zinc-200 dark:border-[#27272a] space-y-4" id="calendar_filters_panel">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
          <Sparkles size={12} className="text-amber-500 animate-pulse" />
          <span>Active Period Filter</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Year select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Year</label>
            <div className="relative">
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none font-medium"
              >
                {YEARS.map(y => (
                  <option key={y} value={y} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">{y === 'All' ? 'All Years' : y}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Month select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Month</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none font-medium"
              >
                {MONTHS.map(m => (
                  <option key={m.value} value={m.value} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">{m.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>

          {/* Day select */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Day of Month</label>
            <div className="relative">
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(e.target.value)}
                className="w-full text-xs bg-white dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 appearance-none font-medium"
              >
                {days.map(d => (
                  <option key={d} value={d} className="bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200">{d === 'All' ? 'All Days' : `Day ${d}`}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Status text explaining the active filters */}
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center justify-between border-t border-zinc-200 dark:border-[#27272a]/60 pt-3">
          <span>Active filter period: </span>
          <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">
            {selectedYear === 'All' ? 'ANY Year' : selectedYear}
            {' • '}
            {selectedMonth === 'All' ? 'ANY Month' : MONTHS.find(m => m.value === selectedMonth)?.label}
            {' • '}
            {selectedDay === 'All' ? 'ANY Day' : `Day ${selectedDay}`}
          </span>
        </div>
      </div>
    </div>
  );
}
