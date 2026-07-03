import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  DollarSign, 
  Percent, 
  Plus, 
  Trash2, 
  Home, 
  Info, 
  Shield, 
  ChevronDown, 
  ChevronUp, 
  HelpCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { IncomeSource, DeductionSettings, Account } from '../types';
import { calculateSourceYearly } from '../utils/financeCalculators';
import ConfirmModal from './ConfirmModal';

interface SalaryCalculatorProps {
  salarySources: IncomeSource[];
  setSalarySources: React.Dispatch<React.SetStateAction<IncomeSource[]>>;
  homeInflows: { id: string; amount: number; description: string; date: string; accountId?: string }[];
  setHomeInflows: React.Dispatch<React.SetStateAction<{ id: string; amount: number; description: string; date: string; accountId?: string }[]>>;
  deductions: DeductionSettings;
  setDeductions: React.Dispatch<React.SetStateAction<DeductionSettings>>;
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  triggerNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function SalaryCalculator({
  salarySources,
  setSalarySources,
  homeInflows,
  setHomeInflows,
  deductions,
  setDeductions,
  accounts,
  setAccounts,
  triggerNotification
}: SalaryCalculatorProps) {
  // Local inputs state for adding salary source
  const [salaryName, setSalaryName] = useState('Primary Job');
  const [salaryAmount, setSalaryAmount] = useState<number>(50000);
  const [salaryFreq, setSalaryFreq] = useState<'yearly' | 'monthly' | 'weekly' | 'hourly'>('yearly');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);

  // Local inputs state for home inflow
  const [homeAmount, setHomeAmount] = useState<string>('');
  const [homeDesc, setHomeDesc] = useState<string>('');
  const [homeDate, setHomeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [homeReceiveAccountId, setHomeReceiveAccountId] = useState<string>('');

  // Collapsible sections
  const [showDeductionsHelp, setShowDeductionsHelp] = useState(false);
  const [showHomeHelp, setShowHomeHelp] = useState(false);

  // Confirmation states
  const [deleteSalaryId, setDeleteSalaryId] = useState<string | null>(null);
  const [deleteInflowId, setDeleteInflowId] = useState<string | null>(null);

  // Add salary source
  const handleAddSalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaryName.trim() || salaryAmount <= 0) return;

    const newSource: IncomeSource = {
      id: crypto.randomUUID(),
      name: salaryName.trim(),
      amount: salaryAmount,
      frequency: salaryFreq,
      hoursPerWeek: salaryFreq === 'hourly' ? hoursPerWeek : undefined
    };

    setSalarySources(prev => [...prev, newSource]);
    setSalaryName('');
    setSalaryAmount(0);
  };

  // Remove salary source
  const handleRemoveSalary = (id: string) => {
    setDeleteSalaryId(id);
  };

  const executeRemoveSalary = () => {
    if (!deleteSalaryId) return;
    const target = salarySources.find(src => src.id === deleteSalaryId);
    if (target) {
      setSalarySources(prev => prev.filter(src => src.id !== deleteSalaryId));
      triggerNotification(`Income source "${target.name}" removed`, 'info');
    }
    setDeleteSalaryId(null);
  };

  // Add home inflow
  const handleAddHomeInflow = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(homeAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newInflow = {
      id: crypto.randomUUID(),
      amount: parsedAmount,
      description: homeDesc.trim() || 'Allowance from Home',
      date: homeDate || new Date().toISOString().split('T')[0],
      accountId: homeReceiveAccountId || undefined
    };

    if (homeReceiveAccountId) {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === homeReceiveAccountId) {
          return { ...acc, balance: acc.balance + parsedAmount };
        }
        return acc;
      }));
      const accName = accounts.find(a => a.id === homeReceiveAccountId)?.name || '';
      triggerNotification(`Deposited ৳${parsedAmount} to "${accName}"`, 'success');
    } else {
      triggerNotification(`Logged cash inflow of ৳${parsedAmount}`, 'success');
    }

    setHomeInflows(prev => [newInflow, ...prev]);
    setHomeAmount('');
    setHomeDesc('');
  };

  // Remove home inflow
  const handleRemoveHomeInflow = (id: string) => {
    setDeleteInflowId(id);
  };

  const executeRemoveHomeInflow = () => {
    if (!deleteInflowId) return;
    const target = homeInflows.find(item => item.id === deleteInflowId);
    if (target) {
      if (target.accountId) {
        setAccounts(prev => prev.map(acc => {
          if (acc.id === target.accountId) {
            return { ...acc, balance: Math.max(0, acc.balance - target.amount) };
          }
          return acc;
        }));
        triggerNotification(`Removed cash log; deducted ৳${target.amount} from account`, 'info');
      } else {
        triggerNotification(`Removed cash log`, 'info');
      }
      setHomeInflows(prev => prev.filter(item => item.id !== deleteInflowId));
    }
    setDeleteInflowId(null);
  };

  // Quick preset deductions
  const applyPresetDeductions = (tier: 'low' | 'med' | 'high') => {
    if (tier === 'low') {
      setDeductions({ taxRate: 5, pensionRate: 2, insuranceMonthly: 1000, otherMonthly: 500 });
    } else if (tier === 'med') {
      setDeductions({ taxRate: 15, pensionRate: 5, insuranceMonthly: 2500, otherMonthly: 1000 });
    } else {
      setDeductions({ taxRate: 25, pensionRate: 10, insuranceMonthly: 5000, otherMonthly: 2000 });
    }
  };

  // Calculate totals
  const totalGrossSalaries = salarySources.reduce((sum, src) => sum + calculateSourceYearly(src), 0);
  const totalHomeCash = homeInflows.reduce((sum, item) => sum + item.amount, 0);

  const targetSalary = deleteSalaryId ? salarySources.find(src => src.id === deleteSalaryId) : null;
  const targetInflow = deleteInflowId ? homeInflows.find(item => item.id === deleteInflowId) : null;

  return (
    <div className="space-y-6" id="salary_calculator_container">
      {/* Confirm modal for removing Salary Source */}
      <ConfirmModal
        isOpen={deleteSalaryId !== null}
        title="Remove Income Source"
        message={targetSalary ? `Are you sure you want to remove the income source "${targetSalary.name}"?` : ''}
        isDoubleConfirm={true}
        doubleConfirmMessage={targetSalary ? `CONFIRMATION 2/2: Are you absolutely certain you want to permanently remove "${targetSalary.name}"? This action cannot be undone.` : ''}
        confirmText="Remove Income Source"
        cancelText="Cancel"
        onConfirm={executeRemoveSalary}
        onCancel={() => setDeleteSalaryId(null)}
      />

      {/* Confirm modal for removing Cash Log Inflow */}
      <ConfirmModal
        isOpen={deleteInflowId !== null}
        title="Delete Inflow Cash Log"
        message={targetInflow ? `Are you sure you want to delete the home cash log entry "${targetInflow.description}"?` : ''}
        isDoubleConfirm={true}
        doubleConfirmMessage={targetInflow ? `CONFIRMATION 2/2: Are you absolutely certain you want to permanently delete this cash log entry?` : ''}
        confirmText="Delete Cash Log"
        cancelText="Cancel"
        onConfirm={executeRemoveHomeInflow}
        onCancel={() => setDeleteInflowId(null)}
      />
      {/* 1. Job Income Sources Section */}
      <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="income_sources_card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-sans tracking-tight">Salary & Earned Income</h3>
              <p className="text-xs text-zinc-400">Add salary sources and wages before taxes</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900/30">
            Gross Total: ৳{totalGrossSalaries.toLocaleString()}/yr
          </span>
        </div>

        {/* Form to Add Job Income */}
        <form onSubmit={handleAddSalary} className="space-y-4 liquid-glass-inner p-4 mb-4 shadow-inner" id="add_salary_form">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Income Name</label>
              <input
                id="salary_name_input"
                type="text"
                required
                placeholder="e.g. Primary Job, Freelance"
                value={salaryName}
                onChange={e => setSalaryName(e.target.value)}
                className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Frequency</label>
              <select
                id="salary_freq_select"
                value={salaryFreq}
                onChange={e => setSalaryFreq(e.target.value as any)}
                className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
              >
                <option value="yearly">Yearly Rate</option>
                <option value="monthly">Monthly Salary</option>
                <option value="weekly">Weekly Wage</option>
                <option value="hourly">Hourly Pay</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
                Amount ({salaryFreq === 'hourly' ? 'per hour' : salaryFreq === 'weekly' ? 'per week' : salaryFreq === 'monthly' ? 'per month' : 'per year'})
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">৳</span>
                <input
                  id="salary_amount_input"
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="0"
                  value={salaryAmount || ''}
                  onChange={e => setSalaryAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full text-sm liquid-input pl-7 pr-3 py-2 transition-all duration-300"
                />
              </div>
            </div>

            {salaryFreq === 'hourly' ? (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Hours / Week</label>
                <input
                  id="salary_hours_input"
                  type="number"
                  min="1"
                  max="168"
                  placeholder="40"
                  value={hoursPerWeek}
                  onChange={e => setHoursPerWeek(Math.max(1, parseInt(e.target.value) || 40))}
                  className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
                />
              </div>
            ) : (
              <div className="flex items-end">
                <button
                  id="add_salary_button"
                  type="submit"
                  className="w-full text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 cursor-pointer transition-all shadow-sm shadow-indigo-600/10"
                >
                  <Plus size={16} /> Add Income
                </button>
              </div>
            )}
          </div>

          {salaryFreq === 'hourly' && (
            <div className="flex justify-end mt-2">
              <button
                id="add_salary_hourly_button"
                type="submit"
                className="w-full md:w-auto text-sm font-semibold flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2 cursor-pointer transition-all"
              >
                <Plus size={16} /> Add Hourly Wage
              </button>
            </div>
          )}
        </form>

        {/* List of Earned Incomes */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1" id="salary_sources_list">
          <AnimatePresence initial={false}>
            {salarySources.length === 0 ? (
              <p className="text-zinc-500 text-xs italic text-center py-4 bg-[#09090b]/20 rounded-xl border border-[#27272a]">
                No job incomes added. Add your salary above to calculate taxes and deductions!
              </p>
            ) : (
              salarySources.map(src => (
                <motion.div
                  key={src.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center justify-between p-3 bg-[#09090b]/50 rounded-xl border border-[#27272a] hover:border-[#3f3f46] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">{src.name}</p>
                      <p className="text-[11px] text-zinc-400 capitalize">
                        ৳{src.amount.toLocaleString()} / {src.frequency}
                        {src.frequency === 'hourly' && ` (${src.hoursPerWeek} hrs/wk)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-mono font-semibold text-indigo-400">
                      +৳{calculateSourceYearly(src).toLocaleString()}/yr
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSalary(src.id)}
                      className="p-1.5 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                      title="Remove Income Source"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Deductions Section (Taxes, Pension, Insurance) */}
      <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="deductions_card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-950/40 text-rose-400 rounded-xl border border-rose-900/30">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-sans tracking-tight">Deductions & Allocations</h3>
              <p className="text-xs text-zinc-400">Configure payroll taxes, pension plans, and insurance premiums</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeductionsHelp(!showDeductionsHelp)}
            className="text-zinc-400 hover:text-zinc-200 p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle size={16} />
          </button>
        </div>

        {showDeductionsHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3.5 bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 text-xs rounded-xl flex gap-2"
          >
            <Info size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-indigo-200">How are deductions calculated?</p>
              <p className="mt-0.5 leading-relaxed text-zinc-300">
                Taxes and retirement/pension contributions are calculated as percentages against your **Salary & Earned Income** only. 
                Health insurance and other custom monthly deductions are flat amounts converted to yearly values (monthly value × 12).
              </p>
            </div>
          </motion.div>
        )}

        {/* Preset selections */}
        <div className="flex flex-wrap items-center gap-2 mb-4 liquid-glass-inner p-2.5 shadow-inner">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Presets:</span>
          <button
            type="button"
            onClick={() => applyPresetDeductions('low')}
            className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
          >
            Low (5% Tax, 2% Pension)
          </button>
          <button
            type="button"
            onClick={() => applyPresetDeductions('med')}
            className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
          >
            Mid (15% Tax, 5% Pension)
          </button>
          <button
            type="button"
            onClick={() => applyPresetDeductions('high')}
            className="text-[11px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
          >
            High (25% Tax, 10% Pension)
          </button>
        </div>

        {/* Input sliders & text inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="deductions_grid">
          {/* Tax Rate Percentage */}
          <div className="space-y-1 liquid-glass-inner p-3.5 shadow-inner">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">Income Tax Rate</span>
              <span className="font-mono text-indigo-400 font-bold">{deductions.taxRate}%</span>
            </div>
            <input
              id="tax_rate_range"
              type="range"
              min="0"
              max="60"
              step="0.5"
              value={deductions.taxRate}
              onChange={e => setDeductions(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
              className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>0%</span>
              <span>60% max</span>
            </div>
          </div>

          {/* Pension rate Percentage */}
          <div className="space-y-1 liquid-glass-inner p-3.5 shadow-inner">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">Retirement / Pension Plan (401k/EPF)</span>
              <span className="font-mono text-purple-400 font-bold">{deductions.pensionRate}%</span>
            </div>
            <input
              id="pension_rate_range"
              type="range"
              min="0"
              max="25"
              step="0.5"
              value={deductions.pensionRate}
              onChange={e => setDeductions(prev => ({ ...prev, pensionRate: parseFloat(e.target.value) || 0 }))}
              className="w-full accent-purple-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>0%</span>
              <span>25% max</span>
            </div>
          </div>

          {/* Health/Insurance Monthly Flat */}
          <div className="space-y-1 liquid-glass-inner p-3.5 shadow-inner">
            <label className="text-xs font-semibold text-zinc-300 block">Monthly Insurance Premiums</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">৳</span>
              <input
                id="insurance_monthly_input"
                type="number"
                min="0"
                placeholder="0"
                value={deductions.insuranceMonthly || ''}
                onChange={e => setDeductions(prev => ({ ...prev, insuranceMonthly: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full text-sm liquid-input pl-7 pr-3 py-2 transition-all duration-300"
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Annualized: ৳{(deductions.insuranceMonthly * 12).toLocaleString()}/yr</p>
          </div>

          {/* Other Monthly Deductions */}
          <div className="space-y-1 liquid-glass-inner p-3.5 shadow-inner">
            <label className="text-xs font-semibold text-zinc-300 block">Other Monthly Fixed Deductions</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">৳</span>
              <input
                id="other_monthly_input"
                type="number"
                min="0"
                placeholder="0"
                value={deductions.otherMonthly || ''}
                onChange={e => setDeductions(prev => ({ ...prev, otherMonthly: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full text-sm liquid-input pl-7 pr-3 py-2 transition-all duration-300"
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-mono">Annualized: ৳{(deductions.otherMonthly * 12).toLocaleString()}/yr</p>
          </div>
        </div>
      </div>

      {/* 3. Personal Cash Taken From Home Section */}
      <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="home_inflows_card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/40 text-emerald-400 rounded-xl border border-emerald-900/30">
              <Home size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-sans tracking-tight">Manual Deposits, Allowances & Tuition Salaries</h3>
              <p className="text-xs text-zinc-400">Track and deposit custom allowances, tuition salaries, and handcash inflows</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-900/30">
              Total Inflows: ৳{totalHomeCash.toLocaleString()}
            </span>
            <button
              type="button"
              onClick={() => setShowHomeHelp(!showHomeHelp)}
              className="text-zinc-400 hover:text-zinc-200 p-1 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>

        {showHomeHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3.5 bg-indigo-950/20 border border-indigo-900/30 text-indigo-300 text-xs rounded-xl flex gap-2 leading-relaxed"
          >
            <Info size={16} className="shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <p className="font-semibold text-indigo-200">Depositing custom wages & tuition cash</p>
              <p className="mt-0.5 text-zinc-300">
                Log any direct cash sources (like **Tuition salary**, parents' aid, or odd cash jobs) and choose a wallet/account (e.g. **bKash**, **Handcash**, or **Bank**) to deposit it instantly. This will increase your real-time wallet balances!
              </p>
            </div>
          </motion.div>
        )}

        {/* Inflow Logger Form */}
        <form onSubmit={handleAddHomeInflow} className="grid grid-cols-1 md:grid-cols-12 gap-3 liquid-glass-inner p-4 mb-4 shadow-inner" id="add_home_inflow_form">
          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Amount (৳)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">৳</span>
              <input
                id="home_amount_input"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="0"
                value={homeAmount}
                onChange={e => setHomeAmount(e.target.value)}
                className="w-full text-sm liquid-input pl-7 pr-3 py-2 transition-all duration-300"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description / Source</label>
            <input
              id="home_desc_input"
              type="text"
              required
              placeholder="e.g. Tuition Salary, Pocket Cash"
              value={homeDesc}
              onChange={e => setHomeDesc(e.target.value)}
              className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Date</label>
            <input
              id="home_date_input"
              type="date"
              required
              value={homeDate}
              onChange={e => setHomeDate(e.target.value)}
              className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300"
            />
          </div>

          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Deposit Into Account</label>
            <select
              id="home_receive_account_select"
              value={homeReceiveAccountId}
              onChange={e => setHomeReceiveAccountId(e.target.value)}
              className="w-full text-sm liquid-input px-3 py-2 transition-all duration-300 font-semibold text-emerald-400"
            >
              <option value="">-- Cash/Unlinked --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}{acc.isDPS ? ' [DPS Scheme]' : ''} (৳{acc.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              id="add_home_inflow_button"
              type="submit"
              className="w-full text-sm font-semibold flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 cursor-pointer transition-all shadow-sm shadow-indigo-600/10"
            >
              <Plus size={16} /> Deposit
            </button>
          </div>
        </form>

        {/* Table/List of Inflows */}
        <div className="max-h-[180px] overflow-y-auto pr-1 text-sm" id="home_inflows_list_container">
          {/* Desktop View (Table) */}
          <div className="hidden md:block">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#27272a] text-zinc-400 font-medium">
                  <th className="py-2 pl-2">Date</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                  <th className="py-2 text-center w-12">Action</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {homeInflows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500 italic bg-[#09090b]/20 rounded-lg">
                        No inflows registered. Use this section to log tuition salary or parental support!
                      </td>
                    </tr>
                  ) : (
                    homeInflows.map(item => {
                      const linkedAcc = item.accountId ? accounts.find(a => a.id === item.accountId) : null;
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: -2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="border-b border-[#27272a] hover:bg-[#09090b]/50 transition-colors"
                        >
                          <td className="py-2.5 pl-2 font-mono text-zinc-400">{item.date}</td>
                          <td className="py-2.5">
                            <span className="font-semibold text-zinc-300 block">{item.description}</span>
                            {linkedAcc && (
                              <span className="inline-block text-[9px] bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 px-1 py-0.5 rounded font-semibold uppercase mt-0.5 font-sans">
                                {linkedAcc.name}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right font-bold font-mono text-emerald-400">
                            ৳{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveHomeInflow(item.id)}
                              className="p-1 hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              title="Delete cash log"
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
          <div className="block md:hidden space-y-2">
            <AnimatePresence initial={false}>
              {homeInflows.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 italic bg-[#09090b]/20 rounded-xl border border-dashed border-[#27272a] px-3">
                  No inflows registered. Log your tuition salary or parental support!
                </div>
              ) : (
                homeInflows.map(item => {
                  const linkedAcc = item.accountId ? accounts.find(a => a.id === item.accountId) : null;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 bg-[#09090b]/30 rounded-xl border border-[#27272a] flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] text-zinc-500 font-mono font-medium">{item.date}</span>
                          <h4 className="font-semibold text-xs text-zinc-200 mt-0.5">{item.description}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveHomeInflow(item.id)}
                          className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/20 border border-[#27272a] rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-[#27272a]/40 text-xs">
                        <div>
                          {linkedAcc && (
                            <span className="inline-block text-[9px] bg-emerald-950/40 text-emerald-300 border border-emerald-900/30 px-1.5 py-0.5 rounded font-semibold uppercase font-sans">
                              {linkedAcc.name}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-emerald-400 font-mono">
                          ৳{item.amount.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
