import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { PieChart as PieIcon, BarChart3, TrendingUp, Info } from 'lucide-react';
import { Expense, IncomeSource, DeductionSettings } from '../types';
import { 
  calculateExpenseYearly, 
  calculateSourceYearly, 
  CATEGORY_COLORS 
} from '../utils/financeCalculators';

interface SpendingChartsProps {
  salarySources: IncomeSource[];
  homeInflows: { id: string; amount: number; description: string; date: string }[];
  deductions: DeductionSettings;
  expenses: Expense[];
}

export default function SpendingCharts({
  salarySources,
  homeInflows,
  deductions,
  expenses
}: SpendingChartsProps) {
  const [activeChart, setActiveChart] = useState<'category' | 'monthly'>('category');

  // 1. Calculate base parameters
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

  const totalHomeInflowsYearly = useMemo(() => {
    return homeInflows.reduce((sum, item) => sum + item.amount, 0);
  }, [homeInflows]);

  // 2. Compute Donut Chart Data
  const pieData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    expenses.forEach(exp => {
      const annualVal = calculateExpenseYearly(exp);
      categoriesMap[exp.category] = (categoriesMap[exp.category] || 0) + annualVal;
    });

    return Object.entries(categoriesMap)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name as any] || '#6B7280'
      }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const totalAnnualSpending = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  // 3. Compute 12-Month Projection Data
  const monthlyData = useMemo(() => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    // Compute base monthly constants
    const baseMonthlyNetSalary = netSalaryYearly / 12;
    
    // Distribute actual home inflows by logged month, or evenly if they are spread
    const monthlyHomeInflows = new Array(12).fill(0);
    homeInflows.forEach(inflow => {
      try {
        const monthIndex = new Date(inflow.date).getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyHomeInflows[monthIndex] += inflow.amount;
        } else {
          monthlyHomeInflows[0] += inflow.amount; // fallback
        }
      } catch (e) {
        monthlyHomeInflows[0] += inflow.amount;
      }
    });

    // Distribute expenses by month:
    // Recurring expenses (monthly, weekly, yearly) are projected evenly.
    // One-time expenses ('once') are placed in their actual logged month.
    const monthlyExpenses = new Array(12).fill(0);
    expenses.forEach(exp => {
      const annualImpact = calculateExpenseYearly(exp);
      const monthlyImpact = annualImpact / 12;

      if (exp.frequency === 'once') {
        try {
          const monthIndex = new Date(exp.date).getMonth();
          if (monthIndex >= 0 && monthIndex < 12) {
            monthlyExpenses[monthIndex] += exp.amount;
          } else {
            monthlyExpenses[0] += exp.amount;
          }
        } catch (e) {
          monthlyExpenses[0] += exp.amount;
        }
      } else {
        // distribute recurring costs across all 12 months
        for (let i = 0; i < 12; i++) {
          monthlyExpenses[i] += monthlyImpact;
        }
      }
    });

    // Build the final array
    return months.map((month, index) => {
      const income = baseMonthlyNetSalary + monthlyHomeInflows[index];
      const spend = monthlyExpenses[index];
      const netSavings = income - spend;
      return {
        month,
        Income: parseFloat(income.toFixed(2)),
        Spending: parseFloat(spend.toFixed(2)),
        'Net Savings': parseFloat(netSavings.toFixed(2))
      };
    });
  }, [netSalaryYearly, homeInflows, expenses]);

  // Custom Pie Tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = totalAnnualSpending > 0 ? (data.value / totalAnnualSpending) * 100 : 0;
      return (
        <div className="bg-[#09090b]/95 border border-[#27272a] p-3 rounded-xl shadow-xl font-mono text-xs">
          <p className="font-semibold text-zinc-100 mb-1">{data.name}</p>
          <div className="flex justify-between gap-4 text-zinc-400">
            <span>Yearly Cost:</span>
            <span className="text-rose-400 font-bold">৳{data.value.toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4 text-zinc-400">
            <span>Percentage:</span>
            <span className="text-zinc-200 font-bold">{pct.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Monthly Tooltip
  const CustomMonthlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#09090b]/95 border border-[#27272a] p-3 rounded-xl shadow-xl font-mono text-xs space-y-1.5">
          <p className="font-bold text-zinc-100 border-b border-[#27272a] pb-1 mb-1">{label} Projection</p>
          {payload.map((p: any) => {
            const color = p.name === 'Income' ? '#10B981' : p.name === 'Spending' ? '#F43F5E' : '#6366F1';
            return (
              <div key={p.name} className="flex justify-between gap-6">
                <span className="flex items-center gap-1 text-zinc-400">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                  {p.name}:
                </span>
                <span className="font-semibold" style={{ color }}>
                  ৳{p.value.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="spending_charts_container">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="font-bold text-lg text-white font-sans tracking-tight">Spending & Cashflow Analysis</h3>
          <p className="text-xs text-zinc-400">Visual representations of category distributions and cash flow trends</p>
        </div>
        <div className="flex p-1 bg-[#09090b] border border-[#27272a] rounded-xl shrink-0">
          <button
            id="chart_tab_category"
            type="button"
            onClick={() => setActiveChart('category')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeChart === 'category' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <PieIcon size={14} /> Category Share
          </button>
          <button
            id="chart_tab_monthly"
            type="button"
            onClick={() => setActiveChart('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeChart === 'monthly' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 size={14} /> 12-Month Cashflow
          </button>
        </div>
      </div>

      {/* Main Charts stage */}
      <div className="min-h-[300px] flex items-center justify-center relative" id="charts_stage">
        {activeChart === 'category' ? (
          /* Pie/Donut Chart */
          expenses.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#09090b]/20 border border-dashed border-[#27272a] rounded-xl w-full">
              <PieIcon className="mx-auto text-zinc-600 mb-2" size={32} />
              <p className="text-sm text-zinc-400 font-semibold">No spending data to visualize</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                Once you log dynamic or template expenses, a beautiful interactive breakdown of categories will generate here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center w-full">
              <div className="lg:col-span-7 h-[300px] relative" id="donut_chart_wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center total cash display */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">Total spent</span>
                  <span className="text-xl font-bold font-mono text-white">৳{totalAnnualSpending.toLocaleString()}</span>
                  <span className="text-[10px] text-zinc-400 block">/ year</span>
                </div>
              </div>

              {/* Dynamic sidebar legend */}
              <div className="lg:col-span-5 space-y-2 max-h-[280px] overflow-y-auto pr-1 text-xs">
                {pieData.map((item) => {
                  const pct = (item.value / totalAnnualSpending) * 100;
                  return (
                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-[#09090b]/30 border border-[#27272a]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="font-semibold text-zinc-300">{item.name}</span>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-[#fafafa] font-bold">৳{item.value.toLocaleString()}</span>
                        <span className="text-zinc-500 ml-1.5">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* Area Trend Chart */
          <div className="w-full">
            <div className="h-[280px]" id="monthly_trend_chart_wrapper">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `৳${v}`}
                  />
                  <Tooltip content={<CustomMonthlyTooltip />} />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: '#e4e4e7' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Income" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Spending" 
                    stroke="#F43F5E" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSpending)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex items-center gap-2 mt-4 p-3.5 bg-[#09090b] border border-[#27272a] rounded-xl text-zinc-400 text-xs leading-relaxed">
              <Info size={14} className="text-indigo-400 shrink-0" />
              <p>
                **Analysis Info**: This chart incorporates monthly fractions of your salary sources after taxes, overlays direct **"Money Taken From Home"** in their actual logged months, and matches recurring/one-time expenses to trace seasonal trends.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
