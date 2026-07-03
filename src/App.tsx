/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Upload, 
  RotateCcw, 
  Home, 
  Scale, 
  PiggyBank, 
  Percent, 
  Check, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Settings,
  Database,
  LayoutDashboard,
  Wallet,
  BarChart3,
  Smartphone,
  Coins,
  CreditCard,
  BookOpen,
  Cloud,
  CloudOff,
  Lock,
  ShieldCheck,
  Sun,
  Moon,
  ArrowRight,
  LogOut,
  X
} from 'lucide-react';

import { IncomeSource, DeductionSettings, Expense, Account } from './types';
import SalaryCalculator from './components/SalaryCalculator';
import ExpenseTracker from './components/ExpenseTracker';
import SpendingCharts from './components/SpendingCharts';
import SavingsReportCard from './components/SavingsReportCard';
import AccountBalances from './components/AccountBalances';
import PeriodAndCloudSync from './components/PeriodAndCloudSync';
import DashboardCharts from './components/DashboardCharts';
import ConfirmModal from './components/ConfirmModal';
import DatabaseExplorer from './components/DatabaseExplorer';
import MeowChatbot, { LayingCat } from './components/MeowChatbot';
import WelcomePopup from './components/WelcomePopup';
import LoginPage from './components/LoginPage';
import { calculateSourceYearly, calculateExpenseYearly } from './utils/financeCalculators';
import { saveVaultToCloud, loadVaultFromCloud, auth, onAuthStateChanged, signOut, User } from './utils/firebaseService';

// Prefilled empty data so the tracker starts clean and ready for real use
const DEFAULT_SALARY_SOURCES: IncomeSource[] = [];

const DEFAULT_ACCOUNTS: Account[] = [];

const DEFAULT_HOME_INFLOWS: { id: string; amount: number; description: string; date: string; accountId?: string }[] = [];

const DEFAULT_DEDUCTIONS: DeductionSettings = {
  taxRate: 0,
  pensionRate: 0,
  insuranceMonthly: 0,
  otherMonthly: 0
};

const DEFAULT_EXPENSES: Expense[] = [];

const getAccountIconHelper = (name: string, isDPS?: boolean) => {
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

const getAccountBgColorClassHelper = (color: string) => {
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

const getAccountDotColorHelper = (color: string) => {
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

export default function App() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // 1. Core State
  const [salarySources, setSalarySources] = useState<IncomeSource[]>(() => {
    const saved = localStorage.getItem('budget_salary_sources');
    if (saved && (saved.includes('Software Engineer Position') || saved.includes('Tuition Salary Account'))) {
      return DEFAULT_SALARY_SOURCES;
    }
    return saved ? JSON.parse(saved) : DEFAULT_SALARY_SOURCES;
  });

  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('budget_accounts');
    if (saved && (saved.includes('Bank Account') || saved.includes('bKash Mobile Wallet') || saved.includes('Handcash (Wallet)'))) {
      return DEFAULT_ACCOUNTS;
    }
    return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
  });

  const [homeInflows, setHomeInflows] = useState<{ id: string; amount: number; description: string; date: string; accountId?: string }[]>(() => {
    const saved = localStorage.getItem('budget_home_inflows');
    if (saved && (saved.includes('Family Relocation Support') || saved.includes('Monthly Personal Cash Allowance'))) {
      return DEFAULT_HOME_INFLOWS;
    }
    return saved ? JSON.parse(saved) : DEFAULT_HOME_INFLOWS;
  });

  const [deductions, setDeductions] = useState<DeductionSettings>(() => {
    const saved = localStorage.getItem('budget_deductions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.taxRate === 15 && parsed.pensionRate === 5 && parsed.insuranceMonthly === 120) {
          return DEFAULT_DEDUCTIONS;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_DEDUCTIONS;
      }
    }
    return DEFAULT_DEDUCTIONS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('budget_expenses');
    if (saved && (saved.includes('Apartment Rent / Utilities') || saved.includes('Upgraded Noise-Cancelling Headphones') || saved.includes('e1') || saved.includes('e8'))) {
      return DEFAULT_EXPENSES;
    }
    return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
  });

  // Date Filter States
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<string>('All');

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'income' | 'expenses' | 'accounts' | 'settings'>('overview');
  // Settings view nested sub-tabs
  const [settingsSubTab, setSettingsSubTab] = useState<'database' | 'analytics' | 'backup' | 'guide'>('guide');

  // Cloud sync credentials State
  const [vaultId, setVaultId] = useState<string>(() => {
    return localStorage.getItem('budget_vault_id') || 'rakib-financial-vault';
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'unsynced' | 'offline' | 'loading'>('offline');
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [hasOfflineChanges, setHasOfflineChanges] = useState<boolean>(() => {
    return localStorage.getItem('budget_has_offline_changes') === 'true';
  });
  const [syncTrigger, setSyncTrigger] = useState<number>(0);

  // Theme State
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('budget_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('budget_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const isInitialLoadRef = useRef(true);

  // UI Utilities State
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [isAccountsExpensesModalOpen, setIsAccountsExpensesModalOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isMeowOpen, setIsMeowOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [guideTab, setGuideTab] = useState<'overview' | 'income' | 'expenses' | 'accounts' | 'settings'>('overview');
  const [cardPeriodA, setCardPeriodA] = useState<'monthly' | 'yearly'>('monthly');
  const [cardPeriodB, setCardPeriodB] = useState<'monthly' | 'yearly'>('monthly');
  const [cardPeriodC, setCardPeriodC] = useState<'monthly' | 'yearly'>('monthly');
  const [cardPeriodD, setCardPeriodD] = useState<'monthly' | 'yearly'>('monthly');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Show status toasts
  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('budget_salary_sources', JSON.stringify(salarySources));
  }, [salarySources]);

  useEffect(() => {
    localStorage.setItem('budget_accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('budget_home_inflows', JSON.stringify(homeInflows));
  }, [homeInflows]);

  useEffect(() => {
    localStorage.setItem('budget_deductions', JSON.stringify(deductions));
  }, [deductions]);

  useEffect(() => {
    localStorage.setItem('budget_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('budget_vault_id', vaultId);
  }, [vaultId]);

  // Persist hasOfflineChanges status to local storage
  useEffect(() => {
    localStorage.setItem('budget_has_offline_changes', String(hasOfflineChanges));
  }, [hasOfflineChanges]);

  // Online / Offline status event listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      triggerNotification('আপনি আবার অনলাইনে আছেন! ক্লাউড ভল্টের সাথে ডেটা সিঙ্ক করা হচ্ছে...', 'success');
      setSyncTrigger(prev => prev + 1);
    };
    const handleOffline = () => {
      setIsOnline(false);
      triggerNotification('আপনি এখন অফলাইনে আছেন। আপনার সকল হিসাব ডিভাইসে সংরক্ষিত হচ্ছে এবং অনলাইনে আসলে সিঙ্ক হবে।', 'info');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen to Auth State Changes and sync user-specific data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userVaultId = currentUser.uid;
        setVaultId(userVaultId);
        
        // Fetch cloud data for this authenticated user
        if (!navigator.onLine) {
          setSyncStatus('offline');
          isInitialLoadRef.current = false;
          setIsAuthLoading(false);
          return;
        }

        setIsCloudLoading(true);
        setSyncStatus('loading');
        try {
          const fetched = await loadVaultFromCloud(userVaultId);
          if (fetched) {
            if (fetched.accounts) setAccounts(fetched.accounts);
            if (fetched.salarySources) setSalarySources(fetched.salarySources);
            if (fetched.deductions) setDeductions(fetched.deductions);
            if (fetched.expenses) setExpenses(fetched.expenses);
            if (fetched.homeInflows) setHomeInflows(fetched.homeInflows);
            setSyncStatus('synced');
            triggerNotification(`আসসালামু আলাইকুম, মালিক! আপনার সুরক্ষিত ডেটা ক্লাউড থেকে লোড হয়েছে।`, 'success');
          } else {
            // No existing cloud vault, initialize it with current local state
            setSyncStatus('unsynced');
            setSyncTrigger(prev => prev + 1);
          }
        } catch (err) {
          console.error('Error loading authenticated user vault:', err);
          setSyncStatus('unsynced');
        } finally {
          setIsCloudLoading(false);
          isInitialLoadRef.current = false;
          setIsAuthLoading(false);
        }
      } else {
        setUser(null);
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Automatic Cloud Firestore Sync whenever states change or when coming online (Debounced to 1.5s)
  useEffect(() => {
    if (isInitialLoadRef.current || isCloudLoading) {
      return;
    }
    if (!vaultId.trim()) return;

    if (!isOnline) {
      setHasOfflineChanges(true);
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('loading');
    const timer = setTimeout(async () => {
      try {
        const stateToSave = {
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
        setHasOfflineChanges(false);
      } catch (err: any) {
        console.error('Auto-save error:', err);
        setSyncStatus('unsynced');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [salarySources, accounts, homeInflows, deductions, expenses, vaultId, isCloudLoading, isOnline, syncTrigger]);

  // Lock body scroll when any modal is open to prevent underlying content from scrolling
  useEffect(() => {
    const isAnyModalOpen = isUserGuideOpen || isSyncModalOpen || isAccountsExpensesModalOpen || resetConfirmOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isUserGuideOpen, isSyncModalOpen, isAccountsExpensesModalOpen, resetConfirmOpen]);

  // Manual Force Pull function passed to DB explorer
  const handleForcePullFromCloud = async () => {
    if (!vaultId.trim()) {
      triggerNotification('Please enter a valid Vault Key to load', 'error');
      return;
    }
    setIsCloudLoading(true);
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
        triggerNotification(`No active vault found for key "${vaultId}".`, 'info');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('unsynced');
      triggerNotification('Failed to fetch from cloud database: ' + (err.message || ''), 'error');
    } finally {
      setIsCloudLoading(false);
    }
  };

  // 2. Aggregate Calculations & Date Filtering
  const filteredExpenses = expenses.filter(exp => {
    if (!exp.date) return true;
    const [y, m, d] = exp.date.split('-');
    if (selectedYear !== 'All' && y !== selectedYear) return false;
    if (selectedMonth !== 'All' && m !== selectedMonth) return false;
    if (selectedDay !== 'All' && d !== selectedDay) return false;
    return true;
  });

  const filteredHomeInflows = homeInflows.filter(inf => {
    if (!inf.date) return true;
    const [y, m, d] = inf.date.split('-');
    if (selectedYear !== 'All' && y !== selectedYear) return false;
    if (selectedMonth !== 'All' && m !== selectedMonth) return false;
    if (selectedDay !== 'All' && d !== selectedDay) return false;
    return true;
  });

  const grossSalaryYearly = salarySources.reduce((sum, src) => sum + calculateSourceYearly(src), 0);
  
  const taxDeduction = grossSalaryYearly * (deductions.taxRate / 100);
  const pensionDeduction = grossSalaryYearly * (deductions.pensionRate / 100);
  const insuranceDeduction = deductions.insuranceMonthly * 12;
  const otherDeduction = deductions.otherMonthly * 12;
  const totalDeductions = taxDeduction + pensionDeduction + insuranceDeduction + otherDeduction;

  const netSalaryYearly = Math.max(0, grossSalaryYearly - totalDeductions);
  const totalHomeCashYearly = filteredHomeInflows.reduce((sum, item) => sum + item.amount, 0);
  
  // Total yearly money the user has "taken"
  const totalInflowYearly = netSalaryYearly + totalHomeCashYearly;
  
  // Total yearly money spent
  const totalExpensesYearly = filteredExpenses.reduce((sum, exp) => sum + calculateExpenseYearly(exp), 0);

  // Net Savings
  const netSavingsYearly = totalInflowYearly - totalExpensesYearly;
  const savingsRate = totalInflowYearly > 0 ? (netSavingsYearly / totalInflowYearly) * 100 : 0;
  const totalAccountBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  // 3. Export data as JSON file
  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify({
        salarySources,
        accounts,
        homeInflows,
        deductions,
        expenses,
        version: '1.2',
        exportedAt: new Date().toISOString()
      }, null, 2);

      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yearly_budget_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      triggerNotification('Data backup exported successfully!', 'success');
    } catch (e) {
      triggerNotification('Failed to export data.', 'error');
    }
  };

  // 4. Import data from JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.salarySources && parsed.homeInflows && parsed.deductions && parsed.expenses) {
          setSalarySources(parsed.salarySources);
          setHomeInflows(parsed.homeInflows);
          setDeductions(parsed.deductions);
          setExpenses(parsed.expenses);
          if (parsed.accounts) {
            setAccounts(parsed.accounts);
          }
          triggerNotification('Data successfully imported and updated!', 'success');
        } else {
          triggerNotification('Invalid file structure. Required variables are missing.', 'error');
        }
      } catch (err) {
        triggerNotification('Failed to read or parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 5. Reset all variables back to defaults
  const handleResetData = () => {
    setResetConfirmOpen(true);
  };

  const executeResetData = () => {
    setSalarySources(DEFAULT_SALARY_SOURCES);
    setAccounts(DEFAULT_ACCOUNTS);
    setHomeInflows(DEFAULT_HOME_INFLOWS);
    setDeductions(DEFAULT_DEDUCTIONS);
    setExpenses(DEFAULT_EXPENSES);
    setVaultId('');
    
    localStorage.removeItem('budget_salary_sources');
    localStorage.removeItem('budget_accounts');
    localStorage.removeItem('budget_home_inflows');
    localStorage.removeItem('budget_deductions');
    localStorage.removeItem('budget_expenses');
    localStorage.removeItem('budget_vault_id');

    setResetConfirmOpen(false);
    triggerNotification('All local ledger data has been wiped and reset successfully.', 'info');
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-100 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="flex flex-col items-center gap-4 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
          />
          <h2 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-500">
            WealthVault
          </h2>
          <p className="text-xs text-zinc-500">আপনার ফাইন্যান্সিয়াল ভল্ট লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage 
          onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} 
          triggerNotification={triggerNotification} 
        />
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className={`fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-2xl backdrop-blur-md ${
                notification.type === 'success' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : notification.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-400'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <AlertCircle size={16} className="shrink-0" />
              <span className="text-xs font-semibold">{notification.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="min-h-screen text-[#fafafa] font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden" id="app_root">
      {/* iOS 26 Ambient Liquid Backlights */}
      <div className="ambient-liquid-bg">
        <div className="ambient-bubble-1" />
        <div className="ambient-bubble-2" />
      </div>

      {/* Invisible file input trigger */}
      <input 
        id="json_import_input"
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportData} 
        accept=".json" 
        className="hidden" 
      />

      {/* Premium Ambient Top Accent Bar */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 z-50 shadow-[0_1px_15px_rgba(99,102,241,0.5)] pointer-events-none" />

      {/* Header Bar */}
      <header className="border-b border-zinc-900 bg-[#09090b]/85 backdrop-blur-xl sticky top-0 z-40 h-20 flex items-center transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]" id="dashboard_header">
        <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between gap-4">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center gap-3.5">
            {user ? (
              <div className="relative">
                <button
                  id="app_logo_profile_trigger"
                  type="button"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="relative w-10 h-10 rounded-xl flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-all duration-300 ring-2 ring-indigo-500/30 hover:ring-indigo-500/60 cursor-pointer focus:outline-none overflow-visible"
                  title="আপনার প্রোফাইল দেখতে এখানে ক্লিক করুন"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Owner'} 
                      className="w-full h-full rounded-xl object-cover border border-zinc-700/50"
                      referrerPolicy="no-referrer"
                      id="header_user_avatar_left"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-base shadow-md" id="header_user_avatar_left_placeholder">
                      {user.displayName ? user.displayName.charAt(0) : 'ম'}
                    </div>
                  )}
                  {/* Micro Dot indicator for Secure Cloud Active Session */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#09090b] rounded-full flex items-center justify-center border border-zinc-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </span>
                </button>

                {/* Dropdown containing Profile details and Log Out Option */}
                {isProfileOpen && (
                  <>
                    {/* Backdrop cover for click-away */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    
                    <div className="absolute left-0 top-full mt-2.5 p-4 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl z-50 min-w-[260px] text-left backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                        {user.photoURL ? (
                          <img 
                            src={user.photoURL} 
                            className="w-10 h-10 rounded-xl object-cover border border-zinc-700/50 shadow" 
                            referrerPolicy="no-referrer" 
                            alt="" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-base shadow-md">
                            {user.displayName ? user.displayName.charAt(0) : 'ম'}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <span className="text-sm font-black text-zinc-100 block truncate">
                            {user.displayName || 'মালিক'}
                          </span>
                          <span className="text-[11px] text-zinc-400 font-medium truncate block max-w-[170px]">
                            {user.email}
                          </span>
                        </div>
                      </div>

                      <div className="py-2.5 space-y-1">
                        <div className="px-2 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-850 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">সার্ভার সেশন</span>
                          <span className="text-[10px] text-emerald-400 font-bold font-mono flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            সংযুক্ত
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-850 flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileOpen(false);
                            setActiveTab('settings');
                            setSettingsSubTab('guide');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="w-full flex items-center justify-between text-xs px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-900/60 rounded-xl transition-all font-semibold cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen size={14} className="text-indigo-400" />
                            ব্যবহার নির্দেশিকা
                          </span>
                          <ArrowRight size={12} className="text-zinc-500" />
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            setIsProfileOpen(false);
                            try {
                              await signOut(auth);
                              triggerNotification('সাফল্যের সাথে লগআউট করা হয়েছে।', 'info');
                            } catch (err) {
                              console.error('Logout error:', err);
                              triggerNotification('লগআউট করতে সমস্যা হয়েছে।', 'error');
                            }
                          }}
                          className="w-full flex items-center gap-2 text-xs text-left px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all font-bold cursor-pointer"
                          id="dropdown_logout_btn"
                        >
                          <LogOut size={14} />
                          লগআউট (Log Out)
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                id="app_logo_guide_trigger"
                type="button"
                className="w-10 h-10 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/35 hover:scale-105 active:scale-95 transition-all duration-300 ring-1 ring-white/10 shrink-0 text-lg cursor-pointer"
              >
                ৳
              </button>
            )}
            <div 
              onClick={() => {
                setIsMeowOpen(true);
              }} 
              className="cursor-pointer group select-none" 
              title="Meow AI সহকারী চ্যাটবট খুলতে ক্লিক করুন 🐱"
              id="app_logo_text_trigger"
            >
              <div className="flex items-center gap-2">
                <h1 className="relative text-xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent font-sans group-hover:text-orange-400 transition-all">
                  WealthVault
                  <LayingCat onClick={() => setIsMeowOpen(true)} />
                </h1>
                <span className="hidden sm:inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-extrabold font-mono group-hover:bg-orange-500/20 transition-all">
                  v1.2.0
                </span>
                {user && (
                  <span className="hidden md:inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold font-mono shadow-sm">
                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                    {user.email}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-500 font-medium tracking-wide uppercase font-sans mt-0.5 hidden xs:block group-hover:text-zinc-400 transition-all">
                Yearly Salary & Expense Tracker • <span className="text-orange-400 font-bold group-hover:underline">Meow AI সহকারী</span>
              </p>
            </div>
          </div>

          {/* Secure Session Status Pill (Premium Fintech Dashboard look) */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="theme_toggle_btn"
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2.5 bg-[#121214]/60 hover:bg-indigo-500/10 border border-[#27272a] hover:border-indigo-500/30 rounded-xl text-zinc-400 hover:text-indigo-400 transition-all shadow-inner shrink-0 cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-amber-400 animate-pulse" />
              ) : (
                <Moon size={16} className="text-indigo-500" />
              )}
            </button>

            <button
              id="header_sync_popup_trigger"
              type="button"
              onClick={() => setIsSyncModalOpen(true)}
              className="bg-[#121214]/60 hover:bg-[#1f1f23]/80 border border-[#27272a] hover:border-indigo-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 transition-all shadow-inner cursor-pointer hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
              title="Click to view Period & Database Sync Options"
            >
              
              {/* Cloud Sync State Indicators */}
              {syncStatus === 'synced' ? (
                <>
                  <div className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </div>
                  <div className="text-left hidden xs:block">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-none font-sans">Secured Session</span>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold block leading-tight mt-0.5">
                      Cloud Sync Active
                    </span>
                  </div>
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                </>
              ) : syncStatus === 'loading' ? (
                <>
                  <RefreshCw size={12} className="text-indigo-400 animate-spin shrink-0" />
                  <div className="text-left hidden xs:block">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-none font-sans">Synchronizing</span>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold block leading-tight mt-0.5">
                      Updating Ledger...
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </div>
                  <div className="text-left hidden xs:block">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block leading-none font-sans">Offline Mode</span>
                    <span className="text-[10px] font-mono text-amber-400 font-semibold block leading-tight mt-0.5">
                      Saved to Client Cache
                    </span>
                  </div>
                  <CloudOff size={13} className="text-amber-400 shrink-0" />
                </>
              )}
            </button>

            {/* User Profile dropdown is now integrated into the top-left logo profile trigger */}
          </div>

        </div>
      </header>



      {/* Main Content Frame */}
      <main className="max-w-7xl mx-auto px-6 py-8 pb-28 space-y-6" id="dashboard_main">
        
        {/* Dynamic Alert Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm shadow-md ${
                notification.type === 'success' 
                  ? 'bg-indigo-950/30 border-indigo-500/20 text-indigo-300' 
                  : notification.type === 'error'
                  ? 'bg-rose-950/40 border-rose-900/30 text-rose-300'
                  : 'bg-[#121214] border-[#27272a] text-zinc-300'
              }`}
              id="dashboard_alert_toast"
            >
              <div className="flex items-center gap-2.5">
                {notification.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                <p className="font-medium">{notification.message}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setNotification(null)} 
                className="text-xs font-semibold hover:underline cursor-pointer opacity-80 hover:opacity-100"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Interactive Tabs mapped to Floating Bottom Navbar */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Bento Box Aggregated Key Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4" id="dashboard_metrics_bento">
                
                {/* Card A: Net Earned Income (Salary) */}
                <div className="liquid-glass liquid-glass-hover p-3.5 sm:p-5 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-500 font-semibold block">Net Earned Salary</span>
                      <div className="flex bg-zinc-100 dark:bg-[#14151a] p-0.5 rounded-md text-[8px] sm:text-[9px] font-extrabold border border-zinc-200 dark:border-zinc-850 shadow-inner z-10 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodA('monthly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodA === 'monthly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Mo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodA('yearly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodA === 'yearly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Yr
                        </button>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#fafafa] font-sans tracking-tight">
                      ৳{((cardPeriodA === 'monthly' ? netSalaryYearly / 12 : netSalaryYearly)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-xs text-zinc-400 font-normal font-sans ml-1">
                        {cardPeriodA === 'monthly' ? '/mo' : '/yr'}
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] sm:text-[11px] text-zinc-400 pt-2 sm:pt-3 border-t border-[#27272a] gap-0.5 sm:gap-0">
                    <span>Gross: ৳{((cardPeriodA === 'monthly' ? grossSalaryYearly / 12 : grossSalaryYearly)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span className="text-indigo-400 font-semibold">After Taxes & Pension</span>
                  </div>
                </div>

                {/* Card B: Money Taken From Home (Allowances) */}
                <div className="liquid-glass liquid-glass-hover p-3.5 sm:p-5 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-500 font-semibold block">Money From Home</span>
                      <div className="flex bg-zinc-100 dark:bg-[#14151a] p-0.5 rounded-md text-[8px] sm:text-[9px] font-extrabold border border-zinc-200 dark:border-zinc-850 shadow-inner z-10 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodB('monthly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodB === 'monthly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Mo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodB('yearly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodB === 'yearly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Yr
                        </button>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-emerald-400 font-sans tracking-tight">
                      ৳{((cardPeriodB === 'monthly' ? totalHomeCashYearly / 12 : totalHomeCashYearly)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-xs text-zinc-400 font-normal font-sans ml-1">
                        {cardPeriodB === 'monthly' ? '/mo' : '/yr'}
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] sm:text-[11px] text-zinc-400 pt-2 sm:pt-3 border-t border-[#27272a] gap-0.5 sm:gap-0">
                    <span>{homeInflows.length} log events</span>
                    <span className="text-emerald-500 font-semibold">Tax-Free Inflow</span>
                  </div>
                </div>

                {/* Card C: Total Spending (Expenses) */}
                <div className="liquid-glass liquid-glass-hover p-3.5 sm:p-5 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-500 font-semibold block">Total Spent</span>
                      <div className="flex bg-zinc-100 dark:bg-[#14151a] p-0.5 rounded-md text-[8px] sm:text-[9px] font-extrabold border border-zinc-200 dark:border-zinc-850 shadow-inner z-10 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodC('monthly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodC === 'monthly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Mo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodC('yearly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodC === 'yearly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Yr
                        </button>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-rose-400 font-sans tracking-tight">
                      ৳{((cardPeriodC === 'monthly' ? totalExpensesYearly / 12 : totalExpensesYearly)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      <span className="text-xs text-zinc-400 font-normal font-sans ml-1">
                        {cardPeriodC === 'monthly' ? '/mo' : '/yr'}
                      </span>
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] sm:text-[11px] text-zinc-400 pt-2 sm:pt-3 border-t border-[#27272a] gap-0.5 sm:gap-0">
                    <span>
                      {cardPeriodC === 'monthly' 
                        ? `Yearly eqv: ৳${totalExpensesYearly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : `Monthly avg: ৳${(totalExpensesYearly / 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                      }
                    </span>
                    <span className="text-rose-500 font-semibold">{cardPeriodC === 'monthly' ? 'Monthly Outflow' : 'Annual Outflow'}</span>
                  </div>
                </div>

                {/* Card D: Annual Net Surplus / Savings */}
                <div className="liquid-glass liquid-glass-hover p-3.5 sm:p-5 shadow-sm relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[130px]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-500 font-semibold block">Net Savings</span>
                      <div className="flex bg-zinc-100 dark:bg-[#14151a] p-0.5 rounded-md text-[8px] sm:text-[9px] font-extrabold border border-zinc-200 dark:border-zinc-850 shadow-inner z-10 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodD('monthly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodD === 'monthly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Mo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCardPeriodD('yearly'); }}
                          className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                            cardPeriodD === 'yearly'
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                          }`}
                        >
                          Yr
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const savingsVal = cardPeriodD === 'monthly' ? netSavingsYearly / 12 : netSavingsYearly;
                      return (
                        <h2 className={`text-lg sm:text-2xl lg:text-3xl font-bold font-sans tracking-tight ${
                          savingsVal >= 0 ? 'text-white' : 'text-rose-400'
                        }`}>
                          {savingsVal < 0 && '-'}৳{Math.abs(savingsVal).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          <span className="text-xs text-zinc-400 font-normal font-sans ml-1">
                            {cardPeriodD === 'monthly' ? '/mo' : '/yr'}
                          </span>
                        </h2>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] sm:text-[11px] text-zinc-400 pt-2 sm:pt-3 border-t border-[#27272a] gap-0.5 sm:gap-0">
                    <span>Rate: {savingsRate.toFixed(1)}%</span>
                    <span className={netSavingsYearly >= 0 ? 'text-indigo-400 font-semibold' : 'text-rose-500 font-semibold'}>
                      {netSavingsYearly >= 0 ? (cardPeriodD === 'monthly' ? 'Mo Surplus' : 'Yr Surplus') : (cardPeriodD === 'monthly' ? 'Mo Deficit' : 'Yr Deficit')}
                    </span>
                  </div>
                </div>

                {/* Card E: Total Accounts Balance */}
                <div 
                  onClick={() => setIsAccountsExpensesModalOpen(true)}
                  className="liquid-glass liquid-glass-hover p-3.5 sm:p-5 shadow-sm active:scale-[0.98] transition-all relative overflow-hidden group flex flex-col justify-between min-h-[110px] sm:min-h-[130px] col-span-2 md:col-span-1 cursor-pointer hover:border-amber-500/30"
                  title="Click to view expenses breakdown by account"
                >
                  {/* Glowing background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                      <span className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-zinc-500 font-semibold block">Total Accounts Balance</span>
                      <Wallet size={12} className="text-zinc-500 group-hover:text-amber-500 transition-colors" />
                    </div>
                    <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-amber-500 font-sans tracking-tight">
                      ৳{totalAccountBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[9px] sm:text-[11px] text-zinc-400 pt-2 sm:pt-3 border-t border-[#27272a] gap-0.5 sm:gap-0 z-10">
                    <span>{accounts.length} liquid accounts</span>
                    <span className="text-amber-500 font-semibold group-hover:underline">
                      View Outflows →
                    </span>
                  </div>
                </div>

              </div>

              {/* Accounts & Cash Reserves Display */}
              <div className="liquid-glass p-6 space-y-4" id="dashboard_accounts_reserves">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Accounts & Cash Reserves</h3>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-950/20 border border-emerald-900/30 px-3 py-1 rounded-xl self-start sm:self-auto">
                    Liquid Net Worth: ৳{accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {accounts.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-[#27272a] rounded-xl text-zinc-500 text-xs flex flex-col items-center justify-center gap-2">
                    <Wallet size={24} className="text-zinc-600 animate-pulse" />
                    <p>No active accounts or cash reserves found.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('accounts');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-xs text-indigo-400 font-semibold hover:underline cursor-pointer"
                    >
                      Configure your first Account &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {accounts.map(acc => {
                      const colorName = acc.color || 'indigo';
                      return (
                        <div 
                          key={acc.id} 
                          className={`bg-[#09090b]/50 border rounded-xl p-4 flex items-center justify-between transition-all ${
                            acc.isDPS ? 'border-amber-500/20 hover:border-amber-500/40 bg-amber-950/2' : 'border-[#27272a] hover:border-[#3f3f46]'
                          }`}
                          id={`dashboard_account_card_${acc.id}`}
                        >
                          <div className="flex items-center gap-3 truncate">
                            <div className={`p-2 rounded-lg shrink-0 flex items-center justify-center ${getAccountBgColorClassHelper(colorName)}`}>
                              {getAccountIconHelper(acc.name, acc.isDPS)}
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-1.5 truncate">
                                <h4 className="text-xs font-semibold text-zinc-200 truncate">{acc.name}</h4>
                                {acc.isDPS && (
                                  <span className="px-1 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[7px] font-bold uppercase tracking-wide">DPS</span>
                                )}
                              </div>
                              <span className="text-[9px] font-mono text-zinc-500">
                                {acc.isDPS ? `Inst: ৳${acc.dpsMonthlyInst?.toLocaleString()}/mo` : 'Active Balance'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-2 shrink-0">
                            <span className="font-mono text-sm font-bold text-white block">
                              ৳{acc.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Analytics Graphs */}
              <DashboardCharts
                salarySources={salarySources}
                homeInflows={filteredHomeInflows}
                deductions={deductions}
                expenses={filteredExpenses}
                accounts={accounts}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedDay={selectedDay}
              />


            </motion.div>
          )}

          {activeTab === 'income' && (
            <motion.div
              key="tab-income"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              <SalaryCalculator 
                salarySources={salarySources} 
                setSalarySources={setSalarySources}
                homeInflows={homeInflows}
                setHomeInflows={setHomeInflows}
                deductions={deductions}
                setDeductions={setDeductions}
                accounts={accounts}
                setAccounts={setAccounts}
                triggerNotification={triggerNotification}
              />
            </motion.div>
          )}

          {activeTab === 'expenses' && (
            <motion.div
              key="tab-expenses"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-5xl mx-auto"
            >
              <ExpenseTracker 
                expenses={expenses} 
                setExpenses={setExpenses} 
                accounts={accounts}
                setAccounts={setAccounts}
                triggerNotification={triggerNotification}
              />
            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <motion.div
              key="tab-accounts"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="max-w-4xl mx-auto"
            >
              <AccountBalances
                accounts={accounts}
                setAccounts={setAccounts}
                triggerNotification={triggerNotification}
              />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="tab-settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Settings Sub-navigation Pills */}
              <div className="flex items-center justify-start p-1 bg-[#121214] border border-[#27272a] rounded-xl max-w-2xl mx-auto gap-1 shadow-inner overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('guide')}
                  className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    settingsSubTab === 'guide'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-semibold'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>নির্দেশিকা (Guide)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('database')}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    settingsSubTab === 'database'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-semibold'
                  }`}
                >
                  <Database size={14} />
                  <span>Database Explorer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('analytics')}
                  className={`flex-1 min-w-[90px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    settingsSubTab === 'analytics'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-semibold'
                  }`}
                >
                  <BarChart3 size={14} />
                  <span>Analytics</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsSubTab('backup')}
                  className={`flex-1 min-w-[110px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    settingsSubTab === 'backup'
                      ? 'bg-indigo-600 text-white shadow-sm font-black'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 font-semibold'
                  }`}
                >
                  <Settings size={14} />
                  <span>Backup & Reset</span>
                </button>
              </div>

              {/* Sub-tab content rendering */}
              <AnimatePresence mode="wait">
                {settingsSubTab === 'guide' && (
                  <motion.div
                    key="settings-guide"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="max-w-4xl mx-auto w-full bg-[#121214] border border-[#27272a] rounded-2xl p-5 sm:p-6 shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#27272a]/80 pb-4 mb-4 gap-3">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2">
                          <BookOpen size={20} className="text-indigo-400" />
                          WealthVault ব্যবহার নির্দেশিকা (User Guide)
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          অ্যাপের বিভিন্ন ফিচার, হিসাব-নিকাশ এবং ব্যবহারের সহজ নির্দেশিকা।
                        </p>
                      </div>
                    </div>

                    {/* Interactive Internal Navigation Selector */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2.5 border-b border-[#27272a]/60 mb-5 scrollbar-none" id="settings_guide_tab_selector">
                      {[
                        { id: 'overview', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' },
                        { id: 'income', label: 'আয় (Income)', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' },
                        { id: 'expenses', label: 'ব্যয় (Expenses)', icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20 text-rose-300' },
                        { id: 'accounts', label: 'অ্যাকাউন্ট', icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
                        { id: 'settings', label: 'সেটিংস', icon: Settings, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-300' },
                      ].map(t => {
                        const Icon = t.icon;
                        const isActive = guideTab === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setGuideTab(t.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all shrink-0 cursor-pointer ${
                              isActive 
                                ? t.bg
                                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#09090b]/40'
                            }`}
                          >
                            <Icon size={14} className={isActive ? '' : t.color} />
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Guide Content */}
                    <div className="space-y-4 text-sm" id="settings_guide_content">
                      {/* 1. DASHBOARD */}
                      {guideTab === 'overview' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="space-y-4"
                        >
                          {/* Hero Banner */}
                          <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-indigo-900/10 border border-indigo-500/20 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none">
                              <LayoutDashboard size={120} className="text-indigo-500" />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-1">
                              <Sparkles size={12} /> লাইভ ওভারভিউ সেন্টার
                            </div>
                            <h4 className="text-sm font-bold text-white relative z-10">আর্থিক হিসাবের মূল ড্যাশবোর্ড</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                              আপনার মূল বেতন, অন্যান্য আয় এবং নিয়মিত খরচগুলোকে বছর, মাস বা দিনের সহজ হিসেবে ট্র্যাক করুন।
                            </p>
                          </div>

                          {/* Features Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-zinc-950/20 border border-[#27272a] rounded-xl p-3.5 space-y-1.5">
                              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                সহজ মেট্রিকস (Bento Metrics)
                              </h5>
                              <p className="text-xs text-zinc-400">
                                এখানে ট্যাক্স ও পেনশন কাটার পর আপনার আসল বেতন, পরিবার থেকে পাওয়া টাকা, ১ বছরের মোট খরচ এবং সঞ্চয় এক নজরে দেখতে পাবেন।
                              </p>
                            </div>

                            <div className="bg-zinc-950/20 border border-[#27272a] rounded-xl p-3.5 space-y-1.5">
                              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                ইন্টারঅ্যাক্টিভ খরচ ট্র্যাকিং
                              </h5>
                              <p className="text-xs text-zinc-400">
                                <strong className="text-amber-500 font-semibold">পরামর্শ:</strong> "Total Accounts Balance" কার্ডের ওপর ক্লিক করলে আপনার অ্যাকাউন্টগুলোর সাথে যুক্ত সব খরচের বিস্তারিত তালিকা দেখতে পাবেন!
                              </p>
                            </div>

                            <div className="bg-zinc-950/20 border border-[#27272a] rounded-xl p-3.5 space-y-1.5">
                              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                সময় ফিল্টার (Chronos Filters)
                              </h5>
                              <p className="text-xs text-zinc-400">
                                নির্দিষ্ট কোনো বছর, মাস বা দিনের হিসাব দেখতে ড্যাশবোর্ডের একদম ওপরের ফিল্টার ড্রপডাউনগুলো ব্যবহার করুন।
                              </p>
                            </div>

                            <div className="bg-zinc-950/20 border border-[#27272a] rounded-xl p-3.5 space-y-1.5">
                              <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                মোট নগদ সম্পদ (Liquid Assets)
                              </h5>
                              <p className="text-xs text-zinc-400">
                                আপনার ব্যাংক অ্যাকাউন্ট, মোবাইল ওয়ালেট (বিকাশ/নগদ), নগদ ক্যাশ এবং ডিপিএস এর লাইভ ব্যালেন্স ও মোট সম্পদ ট্র্যাক করুন।
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 2. INCOME */}
                      {guideTab === 'income' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="space-y-4"
                        >
                          {/* Hero Banner */}
                          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none">
                              <TrendingUp size={120} className="text-emerald-500" />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                              <Sparkles size={12} /> বেতন ও আয়ের উৎস
                            </div>
                            <h4 className="text-sm font-bold text-white relative z-10">আয়ের উৎস সাজানো</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                              আপনার মূল বেতন, বোনাস, চিকিৎসা ভাতা, বাড়ি ভাড়া এবং পারিবারিক হাতখরচের টাকা সুন্দরভাবে সাজিয়ে রাখুন।
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <Coins size={14} className="text-emerald-500" />
                                বেতন এবং ট্যাক্স এর হিসাব
                              </h5>
                              <div className="space-y-2 text-xs text-zinc-400">
                                <p>
                                  <strong className="text-zinc-200 font-semibold">১. বেতনের বিবরণ:</strong> আমাদের দেশের চাকরিজীবীদের সাথে মিল রেখে এখানে বেতনের পাশাপাশি উৎসব বোনাস, চিকিৎসা ভাতা, বাড়ি ভাড়া ভাতা এবং যাতায়াত ভাতা আলাদাভাবে যোগ করতে পারবেন।
                                </p>
                                <p>
                                  <strong className="text-zinc-200 font-semibold">২. ট্যাক্স ও প্রভিডেন্ট ফান্ড:</strong> আপনার ব্যক্তিগত ট্যাক্স বা পেনশন কাটার হার সেট করুন। অ্যাপটি স্বয়ংক্রিয়ভাবে এগুলো বাদ দিয়ে আপনার ব্যবহারযোগ্য আসল নেট ইনকাম দেখাবে।
                                </p>
                                <p>
                                  <strong className="text-zinc-200 font-semibold">৩. জমা করার অ্যাকাউন্ট:</strong> আয়ের প্রতিটি খাতকে আপনার যেকোনো ব্যাংক বা মোবাইল ওয়ালেটের সাথে লিংক করে দিতে পারেন যাতে ব্যালেন্স সরাসরি সেখানে যোগ হয়।
                                </p>
                              </div>
                            </div>

                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <Home size={14} className="text-emerald-500" />
                                পারিবারিক বা অন্যান্য সাহায্য (Tax-Free)
                              </h5>
                              <div className="space-y-1.5 text-xs text-zinc-400">
                                <p>
                                  পারিবারিক হাতখরচ, টিউশনির টাকা, বা যেকোনো উপহার যা কর বা পেনশনের আওতাভুক্ত নয়, সেগুলো আলাদাভাবে এখানে যোগ করতে পারেন।
                                </p>
                                <p className="text-emerald-400/90 font-mono text-[11px] bg-emerald-950/10 border border-emerald-950 px-2 py-1 rounded inline-block">
                                  সূত্র: মোট ব্যবহারযোগ্য অর্থ = (ট্যাক্স বাদে আসল বেতন) + (অন্যান্য আয়)
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 3. EXPENSES */}
                      {guideTab === 'expenses' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="space-y-4"
                        >
                          {/* Hero Banner */}
                          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900/40 to-rose-900/10 border border-rose-500/20 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none">
                              <TrendingDown size={120} className="text-rose-500" />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-widest mb-1">
                              <Sparkles size={12} /> ব্যয়ের খাতা
                            </div>
                            <h4 className="text-sm font-bold text-white relative z-10">খরচ ট্র্যাকার</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                              আপনার নিয়মিত বা এককালীন খরচগুলো সহজে যোগ করুন এবং কোন অ্যাকাউন্ট থেকে খরচ হচ্ছে তা চমৎকারভাবে মনিটর করুন।
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <Scale size={14} className="text-rose-500" />
                                খরচের সময়কাল এবং বার্ষিক হিসাব
                              </h5>
                              <p className="text-xs text-zinc-400">
                                আপনার কোনো খরচ দৈনিক, সাপ্তাহিক, মাসিক কিংবা বার্ষিক—যেকোনো সময়ের হতে পারে। অ্যাপটি স্বয়ংক্রিয়ভাবে সেটিকে বার্ষিক খরচে রূপান্তর করে দেখাবে যাতে সব খরচকে একসাথে তুলনা করা যায়:
                              </p>
                              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2 text-center text-[11px] font-mono">
                                <div className="bg-zinc-900/60 p-1.5 rounded border border-[#27272a]">
                                  <span className="text-zinc-500 block">দৈনিক</span>
                                  <span className="text-zinc-300 font-bold">× ৩৬৫</span>
                                </div>
                                <div className="bg-zinc-900/60 p-1.5 rounded border border-[#27272a]">
                                  <span className="text-zinc-500 block">সাপ্তাহিক</span>
                                  <span className="text-zinc-300 font-bold">× ৫২</span>
                                </div>
                                <div className="bg-zinc-900/60 p-1.5 rounded border border-[#27272a]">
                                  <span className="text-zinc-500 block">মাসিক</span>
                                  <span className="text-zinc-300 font-bold">× ১২</span>
                                </div>
                                <div className="bg-zinc-900/60 p-1.5 rounded border border-[#27272a]">
                                  <span className="text-zinc-500 block">বার্ষিক</span>
                                  <span className="text-zinc-300 font-bold">× ১</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <CreditCard size={14} className="text-rose-500" />
                                অ্যাকাউন্ট ভিত্তিক খরচ
                              </h5>
                              <p className="text-xs text-zinc-400">
                                খরচটি কোন ব্যাংক বা ওয়ালেট থেকে পরিশোধ করা হয়েছে তা লিংক করুন। এর ফলে কোন খাতে কত খরচ হচ্ছে তার সুনির্দিষ্ট ডাটা তৈরি হবে এবং তা আপনার অ্যাকাউন্টের সাথে আপডেট হবে।
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 4. ACCOUNTS */}
                      {guideTab === 'accounts' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="space-y-4"
                        >
                          {/* Hero Banner */}
                          <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/40 to-amber-900/10 border border-amber-500/20 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none">
                              <Wallet size={120} className="text-amber-500" />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
                              <Sparkles size={12} /> ব্যাংক, ওয়ালেট ও ডিপিএস
                            </div>
                            <h4 className="text-sm font-bold text-white relative z-10">অ্যাকাউন্ট এবং ডিপিএস ট্র্যাকিং</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                              ব্যাংক অ্যাকাউন্ট, নগদ ক্যাশ, মোবাইল ওয়ালেট এবং ডিপিএস এর মতো বিভিন্ন নিয়মিত সঞ্চয় স্কিম এক জায়গায় ট্র্যাক করুন।
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <Smartphone size={14} className="text-amber-500" />
                                ব্যাংক এবং মোবাইল ওয়ালেট (bKash/Nagad/Rocket)
                              </h5>
                              <p className="text-xs text-zinc-400">
                                আপনার বিভিন্ন ব্যাংক অ্যাকাউন্ট বা বিকাশ, নগদ, রকেটের মতো মোবাইল ওয়ালেট যুক্ত করতে পারেন। প্রয়োজনে সরাসরি কার্ডের ওপর ক্লিক করে ব্যালেন্স বাড়িয়ে বা কমিয়ে অ্যাডজাস্ট করে নিতে পারেন।
                              </p>
                            </div>

                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <PiggyBank size={14} className="text-amber-500" />
                                ডিপোজিট পেনশন স্কিম (DPS Account)
                              </h5>
                              <div className="space-y-2 text-xs text-zinc-400">
                                <p>
                                  আপনার চলমান ডিপিএস বা মাসিক সঞ্চয়গুলো অ্যাপে যোগ করতে <span className="text-amber-500 font-semibold font-sans">"DPS Account"</span> বক্সে টিক দিন এবং নিচের তথ্যগুলো দিন:
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                  <li><strong className="text-zinc-200">মাসিক কিস্তি (৳)</strong>: প্রতি মাসে ডিপিএস-এ কত টাকা জমা করতে হয় তা রেকর্ড করুন।</li>
                                  <li><strong className="text-zinc-200">টার্গেট বা পূর্ণতা মূল্য (৳)</strong>: আপনার টার্গেট কত টাকা তা ইনপুট করুন। ডিপিএস ম্যাচিউর হতে আর কত বাকি তা অ্যাপটি প্রোগ্রেস বারে সুন্দরভাবে তুলে ধরবে।</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 5. SETTINGS & CLOUD */}
                      {guideTab === 'settings' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          className="space-y-4"
                        >
                          {/* Hero Banner */}
                          <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/40 to-purple-900/10 border border-purple-500/20 rounded-2xl p-4 relative overflow-hidden">
                            <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10 pointer-events-none">
                              <Settings size={120} className="text-purple-500" />
                            </div>
                            <div className="relative z-10 flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-widest mb-1">
                              <Sparkles size={12} /> ডাটা ক্লাউড সিঙ্ক এবং ব্যাকআপ
                            </div>
                            <h4 className="text-sm font-bold text-white relative z-10">ক্লাউড সিঙ্ক এবং রঙিন গ্রাফ চার্ট</h4>
                            <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                              নিরাপদ ক্লাউড ব্যাকআপ সিস্টেম ব্যবহার করুন, দারুণ গ্রাফ ও পাই চার্ট দেখুন এবং অফলাইন ব্যাকআপ ফাইল ডাউনলোড করুন।
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <Database size={14} className="text-purple-500" />
                                নিরাপদ ক্লাউড ব্যাকআপ (Google Firestore)
                              </h5>
                              <p className="text-xs text-zinc-400">
                                আপনার নিজের মতো একটি সিক্রেট <strong className="text-zinc-200">Vault Key</strong> (যেমন একটি কঠিন নাম বা পাসকোড) লিখুন। এরপর আপনার সকল ডাটা ক্লাউডে সুরক্ষিত থাকবে। পরবর্তীতে যেকোনো মোবাইল বা কম্পিউটার থেকে শুধুমাত্র এই Vault Key ব্যবহার করে আপনার সকল ডাটা সাথে সাথে পেয়ে যাবেন!
                              </p>
                            </div>

                            <div className="bg-zinc-950/10 border border-[#27272a] rounded-xl p-4 space-y-3">
                              <h5 className="text-xs font-bold text-zinc-200 uppercase tracking-widest flex items-center gap-1.5 border-b border-[#27272a] pb-2">
                                <BarChart3 size={14} className="text-purple-500" />
                                ইন্টারেক্টিভ গ্রাফ চার্ট ও অফলাইন ব্যাকআপ
                              </h5>
                              <div className="space-y-2 text-xs text-zinc-400">
                                <p>
                                  <strong className="text-zinc-200 font-semibold">রঙিন চার্ট ও গ্রাফ:</strong> সেটিংসের অধীনে 'Analytics' এ ক্লিক করুন। আপনার আয়ের বিপরীতে কোন খাতে কত শতাংশ খরচ হচ্ছে, তা চমৎকার পাই চার্ট ও এরিয়া গ্রাফের মাধ্যমে সহজে বুঝতে পারবেন।
                                </p>
                                <p>
                                  <strong className="text-zinc-200 font-semibold">অফলাইন ব্যাকআপ (JSON):</strong> আপনার সমস্ত ডাটা একটি অফলাইন ফাইল হিসেবে ডাউনলোড করে ড্রাইভে রাখতে পারেন এবং যেকোনো সময়ে তা পুনরায় আপলোড করতে পারেন।
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                {settingsSubTab === 'database' && (
                  <motion.div
                    key="settings-database"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <DatabaseExplorer 
                      vaultId={vaultId}
                      accounts={accounts}
                      salarySources={salarySources}
                      expenses={expenses}
                      homeInflows={homeInflows}
                      triggerNotification={triggerNotification}
                      onRefreshFromCloud={handleForcePullFromCloud}
                      isSyncing={isCloudLoading}
                    />
                  </motion.div>
                )}

                {settingsSubTab === 'analytics' && (
                  <motion.div
                    key="settings-analytics"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    <div className="lg:col-span-6">
                      <SpendingCharts 
                        salarySources={salarySources}
                        homeInflows={filteredHomeInflows}
                        deductions={deductions}
                        expenses={filteredExpenses}
                      />
                    </div>
                    <div className="lg:col-span-6">
                      <SavingsReportCard 
                        salarySources={salarySources}
                        homeInflows={filteredHomeInflows}
                        deductions={deductions}
                        expenses={filteredExpenses}
                      />
                    </div>
                  </motion.div>
                )}

                {settingsSubTab === 'backup' && (
                  <motion.div
                    key="settings-backup"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="max-w-2xl mx-auto w-full"
                  >
                    <div className="bg-[#121214] border border-[#27272a] rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-950/40 border border-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-400">
                          <Settings size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-white font-sans">Data & Backup Settings</h2>
                          <p className="text-xs text-zinc-400">Manage local cache data, generate portable backups, or restore custom ledgers.</p>
                        </div>
                      </div>

                      <div className="space-y-6 pt-4 border-t border-[#27272a]">
                        {/* Backup and Export */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <Download size={14} className="text-zinc-400" />
                            Export Data Backup
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Download your entire ledger configuration—including salary streams, local accounts, and expense records—as a secure, portable JSON backup file.
                          </p>
                          <button
                            id="settings_btn_export"
                            type="button"
                            onClick={handleExportData}
                            className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors shadow-sm shadow-indigo-600/10"
                          >
                            <Download size={14} /> Export Backup File (.json)
                          </button>
                        </div>

                        {/* Restore and Import */}
                        <div className="space-y-3 pt-6 border-t border-[#27272a]/50">
                          <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                            <Upload size={14} className="text-zinc-400" />
                            Restore Data Backup
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Restore your tracker's state using a previously exported JSON backup. This action will replace your current active ledger.
                          </p>
                          <button
                            id="settings_btn_import"
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-[#27272a] font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <Upload size={14} /> Upload & Restore Backup
                          </button>
                        </div>

                        {/* Clear and Reset */}
                        <div className="space-y-3 pt-6 border-t border-[#27272a]">
                          <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
                            <RotateCcw size={14} />
                            Wipe Data & Reset Tracker
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Clear all custom salary streams, linked accounts, logged cash inflows, and transaction ledgers. This action will completely reset the database back to clean, blank templates.
                          </p>
                          <button
                            id="settings_btn_reset"
                            type="button"
                            onClick={handleResetData}
                            className="flex items-center gap-2 text-xs bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 font-semibold px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                          >
                            <RotateCcw size={14} /> Clear All Data
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Meow AI Cat Chatbot Assistant Panel */}
      <MeowChatbot
        isOpen={isMeowOpen}
        onClose={() => setIsMeowOpen(false)}
        accounts={accounts}
        setAccounts={setAccounts}
        expenses={expenses}
        setExpenses={setExpenses}
        salarySources={salarySources}
        setSalarySources={setSalarySources}
        deductions={deductions}
        setDeductions={setDeductions}
        triggerNotification={triggerNotification}
      />

      {/* First-time welcome popup */}
      <WelcomePopup onStartChatting={() => setIsMeowOpen(true)} />

      {/* Reset Tracker Double Confirmation Modal */}
      <ConfirmModal
        isOpen={resetConfirmOpen}
        title="Wipe & Reset All Data"
        message="Are you sure you want to reset all data back to defaults? All custom logged income, accounts, and expenses will be lost."
        isDoubleConfirm={true}
        doubleConfirmMessage="CONFIRMATION 2/2: Are you absolutely certain you want to wipe all transaction entries and custom settings? This action cannot be undone."
        confirmText="Yes, Wipe Everything"
        cancelText="Cancel"
        onConfirm={executeResetData}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {/* Account-wise Expenses Modal */}
      <AnimatePresence>
        {isAccountsExpensesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccountsExpensesModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal content container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative bg-[#121214] border border-[#27272a] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl z-10 overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Subtle color highlight at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#27272a] pb-4 mb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white font-sans flex items-center gap-2">
                    <Wallet size={20} className="text-amber-500" />
                    Account Outflow Breakdown
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Detailed analysis of recurring and one-time expenses assigned to each liquid account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountsExpensesModalOpen(false)}
                  className="p-1.5 bg-[#121214]/60 hover:bg-zinc-800 border border-[#27272a] rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto pr-1 flex-1 space-y-4 max-h-[60vh] custom-scrollbar">
                {accounts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 italic bg-zinc-950/20 border border-dashed border-[#27272a] rounded-xl px-4">
                    No accounts defined yet. Go to the Accounts tab to create checking, savings, or mobile wallet accounts.
                  </div>
                ) : (
                  accounts.map(acc => {
                    const accExpenses = expenses.filter(e => e.accountId === acc.id);
                    const accTotalSpentYearly = accExpenses.reduce((sum, e) => sum + calculateExpenseYearly(e), 0);
                    
                    return (
                      <div key={acc.id} className="border border-[#27272a]/80 bg-zinc-950/20 rounded-xl overflow-hidden shadow-sm">
                        {/* Account Header */}
                        <div className="p-3 sm:p-4 bg-[#121214] border-b border-[#27272a] flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg border ${getAccountBgColorClassHelper(acc.color || 'indigo')}`}>
                              {getAccountIconHelper(acc.name, acc.isDPS)}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white font-sans">{acc.name}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Balance:</span>
                                <span className="text-xs font-bold text-amber-500 font-mono">৳{acc.balance.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block">Total Account Outflow</span>
                            <span className="text-xs sm:text-sm font-extrabold text-rose-400 font-mono">
                              ৳{accTotalSpentYearly.toLocaleString()}<span className="text-[10px] text-zinc-500 font-medium font-sans">/yr</span>
                            </span>
                          </div>
                        </div>

                        {/* Account Expenses List */}
                        <div className="p-3 bg-[#09090b]/40">
                          {accExpenses.length === 0 ? (
                            <p className="text-center text-xs text-zinc-500 italic py-3">
                              No expenses linked to this account yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {/* Desktop/Tablet Table, fully legible */}
                              <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-[#27272a]/60 text-[9px] font-bold text-zinc-500 uppercase tracking-widest bg-[#09090b]/60">
                                      <th className="py-2 px-3">Description</th>
                                      <th className="py-2 px-3">Category</th>
                                      <th className="py-2 px-3">Frequency</th>
                                      <th className="py-2 px-3 text-right">Cost</th>
                                      <th className="py-2 px-3 text-right">Yearly Equivalent</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#27272a]/40 text-xs">
                                    {accExpenses.map(exp => (
                                      <tr key={exp.id} className="hover:bg-zinc-900/20 transition-colors">
                                        <td className="py-2 px-3 font-medium text-zinc-200">{exp.description}</td>
                                        <td className="py-2 px-3">
                                          <span className="inline-block px-2 py-0.5 text-[10px] rounded bg-[#09090b] text-zinc-300 border border-[#27272a]">
                                            {exp.category}
                                          </span>
                                        </td>
                                        <td className="py-2 px-3 text-zinc-400 capitalize">{exp.frequency}</td>
                                        <td className="py-2 px-3 text-right font-mono text-zinc-300">৳{exp.amount.toLocaleString()}</td>
                                        <td className="py-2 px-3 text-right font-mono text-rose-400 font-bold">
                                          ৳{calculateExpenseYearly(exp).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              {/* Mobile List View */}
                              <div className="block sm:hidden space-y-2">
                                {accExpenses.map(exp => (
                                  <div key={exp.id} className="p-2.5 bg-zinc-950/30 rounded-lg border border-[#27272a]/60 flex flex-col gap-1.5 text-xs">
                                    <div className="flex justify-between items-start">
                                      <span className="font-semibold text-zinc-200">{exp.description}</span>
                                      <span className="font-bold text-rose-400 font-mono">৳{exp.amount.toLocaleString()} <span className="text-[10px] text-zinc-500 font-normal">({exp.frequency})</span></span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px]">
                                      <span className="px-1.5 py-0.5 rounded bg-[#09090b] text-zinc-400 border border-[#27272a]">{exp.category}</span>
                                      <span className="font-bold text-rose-400/90 font-mono">৳{calculateExpenseYearly(exp).toLocaleString()}/yr</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Close Button */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#27272a]/50">
                <button
                  id="accounts_expenses_modal_close_btn"
                  type="button"
                  onClick={() => setIsAccountsExpensesModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-[#27272a] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Period selection & Cloud Sync / Firestore backup controls Popup Modal */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSyncModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm"
              id="sync_popup_backdrop"
            />

            {/* Modal content container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative liquid-glass max-w-2xl w-full p-5 sm:p-6 shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col"
              id="sync_popup_modal_container"
            >
              {/* Premium Gradient Top Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse" />

              {/* Close Button Top Right */}
              <button
                type="button"
                onClick={() => setIsSyncModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 bg-[#121214]/60 hover:bg-zinc-800 border border-[#27272a] rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer z-20 focus:outline-none"
                id="sync_popup_close_top_btn"
              >
                <X size={16} />
              </button>

              {/* Scrollable Content wrapper */}
              <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar mt-2 pt-2" id="sync_popup_scrollable_content">
                <PeriodAndCloudSync
                  noCardWrapper
                  vaultId={vaultId}
                  setVaultId={setVaultId}
                  syncStatus={syncStatus}
                  setSyncStatus={setSyncStatus}
                  triggerNotification={triggerNotification}
                  accounts={accounts}
                  setAccounts={setAccounts}
                  salarySources={salarySources}
                  setSalarySources={setSalarySources}
                  deductions={deductions}
                  setDeductions={setDeductions}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  homeInflows={homeInflows}
                  setHomeInflows={setHomeInflows}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedDay={selectedDay}
                  setSelectedDay={setSelectedDay}
                />
              </div>

              {/* Footer Close Button */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#27272a]/50">
                <button
                  id="sync_popup_close_bottom_btn"
                  type="button"
                  onClick={() => setIsSyncModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-[#27272a] transition-colors cursor-pointer focus:outline-none"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Floating Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:pb-6 pt-6 bg-gradient-to-t from-zinc-950/80 via-zinc-950 to-transparent dark:from-[#0d0e12]/80 dark:via-[#0d0e12] dark:to-transparent pointer-events-none">
        <nav className="max-w-md mx-auto bg-white/90 dark:bg-[#14151a]/95 backdrop-blur-2xl border border-zinc-200 dark:border-zinc-800/80 rounded-3xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-2 flex items-center justify-around pointer-events-auto" id="bottom_floating_navbar">
          
          {/* Dashboard (Overview) */}
          <button
            id="bottom_nav_overview"
            type="button"
            onClick={() => {
              setActiveTab('overview');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
              activeTab === 'overview'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-[1.03]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'overview' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-[inset_0_1px_2px_rgba(99,102,241,0.05)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <LayoutDashboard size={18} className={activeTab === 'overview' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'} />
              <span className="text-[10px] font-semibold tracking-wide">Dashboard</span>
            </div>
            {activeTab === 'overview' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] z-10" />
            )}
          </button>
 
          {/* Income */}
          <button
            id="bottom_nav_income"
            type="button"
            onClick={() => {
              setActiveTab('income');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
              activeTab === 'income'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-[1.03]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'income' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-[inset_0_1px_2px_rgba(99,102,241,0.05)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <TrendingUp size={18} className={activeTab === 'income' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'} />
              <span className="text-[10px] font-semibold tracking-wide">Income</span>
            </div>
            {activeTab === 'income' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] z-10" />
            )}
          </button>
 
          {/* Expenses */}
          <button
            id="bottom_nav_expenses"
            type="button"
            onClick={() => {
              setActiveTab('expenses');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
              activeTab === 'expenses'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-[1.03]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'expenses' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-[inset_0_1px_2px_rgba(99,102,241,0.05)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <TrendingDown size={18} className={activeTab === 'expenses' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'} />
              <span className="text-[10px] font-semibold tracking-wide">Expenses</span>
            </div>
            {activeTab === 'expenses' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] z-10" />
            )}
          </button>
 
          {/* Accounts */}
          <button
            id="bottom_nav_accounts"
            type="button"
            onClick={() => {
              setActiveTab('accounts');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
              activeTab === 'accounts'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-[1.03]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'accounts' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-[inset_0_1px_2px_rgba(99,102,241,0.05)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <Wallet size={18} className={activeTab === 'accounts' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'} />
              <span className="text-[10px] font-semibold tracking-wide">Accounts</span>
            </div>
            {activeTab === 'accounts' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] z-10" />
            )}
          </button>
 
          {/* Settings */}
          <button
            id="bottom_nav_settings"
            type="button"
            onClick={() => {
              setActiveTab('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-2xl transition-all duration-300 cursor-pointer focus:outline-none ${
              activeTab === 'settings'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold scale-[1.03]'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'settings' && (
              <motion.div
                layoutId="activeTabGlow"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/20 shadow-[inset_0_1px_2px_rgba(99,102,241,0.05)] z-0"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
              <Settings size={18} className={activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'} />
              <span className="text-[10px] font-semibold tracking-wide">Settings</span>
            </div>
            {activeTab === 'settings' && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)] z-10" />
            )}
          </button>
 
        </nav>
      </div>
    </div>
  );
}
