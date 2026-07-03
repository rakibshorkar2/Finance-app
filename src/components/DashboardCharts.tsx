import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ZAxis,
  Cell
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Compass, 
  HelpCircle, 
  Info,
  Calendar,
  Wallet
} from 'lucide-react';
import { Expense, IncomeSource, DeductionSettings, Account } from '../types';
import { 
  calculateExpenseYearly, 
  calculateSourceYearly, 
  CATEGORY_COLORS 
} from '../utils/financeCalculators';

interface DashboardChartsProps {
  salarySources: IncomeSource[];
  homeInflows: { id: string; amount: number; description: string; date: string; accountId?: string }[];
  deductions: DeductionSettings;
  expenses: Expense[];
  accounts: Account[];
  selectedYear: string;
  selectedMonth: string;
  selectedDay: string;
}

export default function DashboardCharts({
  salarySources,
  homeInflows,
  deductions,
  expenses,
  accounts,
  selectedYear,
  selectedMonth,
  selectedDay
}: DashboardChartsProps) {
  const [activeChart, setActiveChart] = useState<'bar' | 'line' | 'scatter'>('bar');

  // Helper mapping for accounts
  const accountMap = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      acc[curr.id] = curr.name;
      return acc;
    }, {} as Record<string, string>);
  }, [accounts]);

  // Compute Base Salaries Net
  const grossSalaryYearly = useMemo(() => {
    return salarySources.reduce((sum, src) => sum + calculateSourceYearly(src), 0);
  }, [salarySources]);

  const netSalaryYearly = useMemo(() => {
    const taxDeduction = grossSalaryYearly * (deductions.taxRate / 100);
    const pensionDeduction = grossSalaryYearly * (deductions.pensionRate / 100);
    const insuranceDeduction = deductions.insuranceMonthly * 12;
    const otherDeduction = deductions.otherMonthly * 12;
    return Math.max(0, grossSalaryYearly - (taxDeduction + pensionDeduction + insuranceDeduction + otherDeduction));
  }, [grossSalaryYearly, deductions]);

  const baseMonthlyNetSalary = useMemo(() => netSalaryYearly / 12, [netSalaryYearly]);

  // 1. DATA PREPARATION: Bar Chart & Line Chart
  // We adapt depending on whether the user has filtered a specific month or 'All'
  const chartData = useMemo(() => {
    if (selectedMonth === 'All') {
      // 12-Month distribution
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      const monthlyHomeInflows = new Array(12).fill(0);
      homeInflows.forEach(inflow => {
        if (!inflow.date) return;
        const [y, m] = inflow.date.split('-');
        if (selectedYear !== 'All' && y !== selectedYear) return;
        const mIdx = parseInt(m, 10) - 1;
        if (mIdx >= 0 && mIdx < 12) {
          monthlyHomeInflows[mIdx] += inflow.amount;
        }
      });

      const monthlyExpenses = new Array(12).fill(0);
      expenses.forEach(exp => {
        const annualImpact = calculateExpenseYearly(exp);
        const monthlyImpact = annualImpact / 12;

        if (exp.frequency === 'once') {
          if (!exp.date) return;
          const [y, m] = exp.date.split('-');
          if (selectedYear !== 'All' && y !== selectedYear) return;
          const mIdx = parseInt(m, 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            monthlyExpenses[mIdx] += exp.amount;
          }
        } else {
          // recurring expense distributed
          for (let i = 0; i < 12; i++) {
            monthlyExpenses[i] += monthlyImpact;
          }
        }
      });

      let cumulative = 0;
      return months.map((month, idx) => {
        const income = baseMonthlyNetSalary + monthlyHomeInflows[idx];
        const outflow = monthlyExpenses[idx];
        const netSavings = income - outflow;
        cumulative += netSavings;

        return {
          label: month,
          Inflow: parseFloat(income.toFixed(0)),
          Outflow: parseFloat(outflow.toFixed(0)),
          'Net Savings': parseFloat(netSavings.toFixed(0)),
          'Cumulative Savings': parseFloat(cumulative.toFixed(0))
        };
      });
    } else {
      // Day-by-Day distribution of the specific filtered month
      const monthNum = parseInt(selectedMonth, 10);
      const yearNum = selectedYear === 'All' ? new Date().getFullYear() : parseInt(selectedYear, 10);
      
      // Determine days in that month
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
        const dayStr = String(i + 1).padStart(2, '0');
        return {
          label: dayStr,
          Inflow: 0,
          Outflow: 0,
          'Net Savings': 0,
          'Cumulative Savings': 0
        };
      });

      // Distribute home inflows on their exact day
      homeInflows.forEach(inflow => {
        if (!inflow.date) return;
        const [y, m, d] = inflow.date.split('-');
        if (selectedYear !== 'All' && y !== selectedYear) return;
        if (m !== selectedMonth) return;
        const dIdx = parseInt(d, 10) - 1;
        if (dIdx >= 0 && dIdx < daysInMonth) {
          dailyData[dIdx].Inflow += inflow.amount;
        }
      });

      // Daily portion of monthly base net salary (allocated on day 1 or spread out)
      // Let's allocate salary on Day 1 to model true bank deposits!
      if (dailyData[0]) {
        dailyData[0].Inflow += baseMonthlyNetSalary;
      }

      // Distribute expenses by day
      expenses.forEach(exp => {
        if (exp.frequency === 'once') {
          if (!exp.date) return;
          const [y, m, d] = exp.date.split('-');
          if (selectedYear !== 'All' && y !== selectedYear) return;
          if (m !== selectedMonth) return;
          const dIdx = parseInt(d, 10) - 1;
          if (dIdx >= 0 && dIdx < daysInMonth) {
            dailyData[dIdx].Outflow += exp.amount;
          }
        } else {
          // Spread weekly/monthly/yearly costs evenly by day
          const monthlyEquivalent = calculateExpenseYearly(exp) / 12;
          const dailyEquivalent = monthlyEquivalent / daysInMonth;
          for (let i = 0; i < daysInMonth; i++) {
            dailyData[i].Outflow += dailyEquivalent;
          }
        }
      });

      let cumulative = 0;
      return dailyData.map(day => {
        const netSavings = day.Inflow - day.Outflow;
        cumulative += netSavings;
        return {
          label: `Day ${day.label}`,
          Inflow: parseFloat(day.Inflow.toFixed(0)),
          Outflow: parseFloat(day.Outflow.toFixed(0)),
          'Net Savings': parseFloat(netSavings.toFixed(0)),
          'Cumulative Savings': parseFloat(cumulative.toFixed(0))
        };
      });
    }
  }, [selectedYear, selectedMonth, baseMonthlyNetSalary, homeInflows, expenses]);

  // 2. DATA PREPARATION: Scatter Plot Data
  // Plots individual transactions (expenses) with Day of Month on X axis, Amount on Y axis
  const scatterData = useMemo(() => {
    return expenses
      .filter(exp => {
        if (selectedYear !== 'All' && exp.date) {
          const [y] = exp.date.split('-');
          if (y !== selectedYear) return false;
        }
        if (selectedMonth !== 'All' && exp.date) {
          const [, m] = exp.date.split('-');
          if (m !== selectedMonth) return false;
        }
        if (selectedDay !== 'All' && exp.date) {
          const [, , d] = exp.date.split('-');
          if (d !== selectedDay) return false;
        }
        return true;
      })
      .map((exp, index) => {
        let day = 15; // default fallback middle of month
        if (exp.date) {
          const parts = exp.date.split('-');
          if (parts[2]) {
            day = parseInt(parts[2], 10);
          }
        }
        return {
          id: exp.id,
          index: index + 1,
          name: exp.description,
          amount: exp.amount,
          day: day,
          category: exp.category,
          account: exp.accountId ? (accountMap[exp.accountId] || 'Cash/Unlinked') : 'Cash/Unlinked',
          color: CATEGORY_COLORS[exp.category] || '#6B7280',
          frequency: exp.frequency,
          date: exp.date || 'Recurring'
        };
      })
      .sort((a, b) => a.day - b.day);
  }, [expenses, selectedYear, selectedMonth, selectedDay, accountMap]);

  // Premium custom tooltip for the scatter plot
  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#09090b]/95 border border-[#27272a] p-3 rounded-xl shadow-2xl font-mono text-xs text-zinc-300 space-y-1.5 max-w-[240px]">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span className="font-bold text-white truncate">{data.name}</span>
          </div>
          <p className="font-sans text-[10px] text-zinc-400">
            Category: <strong className="text-zinc-200">{data.category}</strong>
          </p>
          <p className="font-sans text-[10px] text-zinc-400">
            Account: <strong className="text-zinc-200 truncate block">{data.account}</strong>
          </p>
          <p className="font-sans text-[10px] text-zinc-400">
            Date: <strong className="text-zinc-200">{data.date}</strong>
          </p>
          <p className="font-sans text-[10px] text-zinc-400">
            Frequency: <strong className="text-zinc-200 capitalize">{data.frequency}</strong>
          </p>
          <p className="text-amber-400 font-bold mt-1 text-sm pt-0.5 border-t border-zinc-800/60 font-mono">
            ৳{data.amount.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="liquid-glass p-6 space-y-6" id="dashboard_interactive_charts">
      {/* Chart Title and Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">
              Dynamic Cashflow Analytics
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time visual reports of inflows, cumulative trajectories, and spend hotspots.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-[#09090b]/50 border border-[#27272a] p-1 rounded-xl self-start sm:self-auto">
          {[
            { id: 'bar', label: 'Bar Graph', icon: BarChart3 },
            { id: 'line', label: 'Line Graph', icon: TrendingUp },
            { id: 'scatter', label: 'Scatter Plot', icon: Compass }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeChart === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveChart(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Graph Area */}
      <div className="h-[280px] w-full bg-[#09090b]/20 border border-[#27272a]/50 rounded-xl p-3 sm:p-4">
        
        {/* BAR CHART: Inflow vs Outflow */}
        {activeChart === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
              <XAxis 
                dataKey="label" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                itemStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                formatter={(val) => [`৳${Number(val).toLocaleString()}`, '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10}
                wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
              />
              <Bar dataKey="Inflow" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="Outflow" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* LINE CHART: Cumulative Savings Path */}
        {activeChart === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
              <XAxis 
                dataKey="label" 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#71717a" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                labelStyle={{ fontWeight: 'bold', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                itemStyle={{ fontSize: '11px', color: '#a1a1aa' }}
                formatter={(val) => [`৳${Number(val).toLocaleString()}`, '']}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconSize={10}
                wrapperStyle={{ fontSize: '11px', color: '#a1a1aa' }}
              />
              <Line 
                type="monotone" 
                dataKey="Cumulative Savings" 
                stroke="#6366f1" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 1 }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Net Savings" 
                stroke="#10b981" 
                strokeWidth={1.5} 
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* SCATTER PLOT: Transaction Day Intensity Map */}
        {activeChart === 'scatter' && (
          <div className="w-full h-full">
            {scatterData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs gap-1.5 select-none">
                <Calendar size={20} className="text-zinc-600 animate-bounce" />
                <p>No transactions registered for scatter plot.</p>
                <p className="text-[10px] text-zinc-600">Switch off date filters or record some expenses.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                  <XAxis 
                    type="number" 
                    dataKey="day" 
                    name="Day of Month" 
                    domain={[1, 31]} 
                    tickCount={16}
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `D${val}`}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="amount" 
                    name="Amount" 
                    stroke="#71717a" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <ZAxis type="number" range={[50, 450]} />
                  <Tooltip content={<CustomScatterTooltip />} />
                  <Scatter name="Transactions" data={scatterData}>
                    {scatterData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

      </div>

      {/* Explanatory Footnote Footer */}
      <div className="flex gap-2.5 items-start bg-[#1a1a1e]/40 border border-[#27272a]/60 p-3 rounded-xl text-[11px] text-zinc-400">
        <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          {activeChart === 'bar' && (
            <p>
              The <strong className="text-white">Bar Graph</strong> groups monthly taxed salary & logged auxiliary cash inflows (Green) alongside recurring expenses & one-time outflows (Red) to contrast operational cashflows.
            </p>
          )}
          {activeChart === 'line' && (
            <p>
              The <strong className="text-white">Line Graph</strong> computes the monthly net surplus or deficit, projecting a cumulative trajectory of reserves over the 12-month calendar cycle.
            </p>
          )}
          {activeChart === 'scatter' && (
            <p>
              The <strong className="text-white">Scatter Plot</strong> maps individual expense events by their day of the month (1-31). Denser vertical alignment highlights heavy spending days, and larger dots represent larger single outflows.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
