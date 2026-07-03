import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Lightbulb, 
  Compass, 
  HelpCircle, 
  Sliders, 
  CheckCircle, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { Expense, IncomeSource, DeductionSettings } from '../types';
import { generateSavingsReport } from '../utils/financeCalculators';

interface SavingsReportCardProps {
  salarySources: IncomeSource[];
  homeInflows: { id: string; amount: number; description: string; date: string }[];
  deductions: DeductionSettings;
  expenses: Expense[];
}

export default function SavingsReportCard({
  salarySources,
  homeInflows,
  deductions,
  expenses
}: SavingsReportCardProps) {
  // Simulator State: Percentage reduction of non-essential expenses
  const [optimizationRate, setOptimizationRate] = useState<number>(15);

  // Generate the core analysis report
  const analysis = useMemo(() => {
    return generateSavingsReport(salarySources, homeInflows, deductions, expenses);
  }, [salarySources, homeInflows, deductions, expenses]);

  // Calculate simulated outcomes
  const nonEssentialExpenses = useMemo(() => {
    // Non-essentials are categories other than Housing, Utilities, Healthcare, Education
    const nonEssentialCategories = [
      'Food & Dining', 
      'Transport', 
      'Shopping & Goods', 
      'Entertainment & Leisure', 
      'Other'
    ];
    return expenses
      .filter(exp => nonEssentialCategories.includes(exp.category))
      .reduce((sum, exp) => {
        // convert to yearly
        const freq = exp.frequency;
        let yearlyVal = exp.amount;
        if (freq === 'weekly') yearlyVal = exp.amount * 52;
        else if (freq === 'monthly') yearlyVal = exp.amount * 12;
        return sum + yearlyVal;
      }, 0);
  }, [expenses]);

  const simulatedSavings = useMemo(() => {
    const potentialCut = nonEssentialExpenses * (optimizationRate / 100);
    const newExpenses = Math.max(0, analysis.totalExpensesYearly - potentialCut);
    const newSavings = analysis.totalIncomeYearly - newExpenses;
    const newSavingsRate = analysis.totalIncomeYearly > 0 ? (newSavings / analysis.totalIncomeYearly) * 100 : 0;
    
    return {
      potentialCut,
      newExpenses,
      newSavings,
      newSavingsRate
    };
  }, [analysis, nonEssentialExpenses, optimizationRate]);

  // Status/Grade colors & layouts
  const gradeStyles = {
    'A+': { bg: 'bg-emerald-950/20', text: 'text-emerald-400', border: 'border-emerald-500/20', badge: 'bg-emerald-500' },
    'B': { bg: 'bg-teal-950/20', text: 'text-teal-400', border: 'border-teal-500/20', badge: 'bg-teal-500' },
    'D': { bg: 'bg-amber-950/20', text: 'text-amber-400', border: 'border-amber-500/20', badge: 'bg-amber-500' },
    'F': { bg: 'bg-rose-950/20', text: 'text-rose-400', border: 'border-rose-500/20', badge: 'bg-rose-500' }
  }[analysis.grade] || { bg: 'bg-zinc-950/20', text: 'text-zinc-400', border: 'border-[#27272a]', badge: 'bg-zinc-500' };

  return (
    <div className="liquid-glass p-6 shadow-sm transition-all duration-300 hover:border-[#3f3f46]/40" id="savings_report_card_container">
      {/* Title */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2.5 bg-indigo-950/40 text-indigo-400 rounded-xl border border-indigo-900/30">
          <Award size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white font-sans tracking-tight">Automated Savings Report</h3>
          <p className="text-xs text-zinc-400">Customized performance scores, analytical insights, and simulations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6" id="report_top_split">
        {/* Grade Display Panel */}
        <div className={`lg:col-span-4 p-5 rounded-xl border ${gradeStyles.border} ${gradeStyles.bg} flex flex-col items-center justify-center text-center`} id="report_grade_panel">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 mb-1">Financial Grade</span>
          <div className="relative mb-2">
            {/* Pulsing ring */}
            <div className={`absolute -inset-1 rounded-full opacity-30 blur-sm ${gradeStyles.badge}`}></div>
            <div className="relative w-20 h-20 rounded-full bg-[#09090b] border border-[#27272a] flex items-center justify-center">
              <span className={`text-3xl font-extrabold font-mono ${gradeStyles.text}`}>{analysis.grade}</span>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${gradeStyles.badge} text-zinc-950 uppercase`}>
            {analysis.status}
          </span>
          <p className="text-[11px] text-zinc-400 mt-3 font-mono">
            Savings Rate: {analysis.savingsRate.toFixed(1)}%
          </p>
        </div>

        {/* Dynamic Insights Panel */}
        <div className="lg:col-span-8 space-y-3 bg-[#09090b]/40 p-4 rounded-xl border border-[#27272a]" id="report_insights_panel">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 uppercase tracking-widest mb-1">
            <Lightbulb size={14} className="text-amber-400 animate-pulse" />
            <span>Key Budget Insights</span>
          </div>
          <div className="space-y-2.5">
            {analysis.insights.map((insight, i) => (
              <div key={i} className="flex gap-2 text-xs text-zinc-300 leading-relaxed">
                <span className="text-amber-400 select-none font-mono">▸</span>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      <div className="mb-6 p-4 bg-[#09090b]/40 border border-[#27272a] rounded-xl" id="report_recommendations_panel">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200 uppercase tracking-widest mb-3">
          <Compass size={14} className="text-indigo-400" />
          <span>Tailored Recommendations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.recommendations.map((rec, i) => (
            <div key={i} className="flex gap-2.5 p-3 bg-[#09090b]/30 rounded-lg border border-[#27272a] hover:border-[#3f3f46] transition-all text-xs text-zinc-300 leading-relaxed">
              <CheckCircle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <p>{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What-if Simulator */}
      <div className="p-5 bg-indigo-950/10 border border-indigo-900/30 rounded-xl" id="what_if_simulator">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders size={15} className="text-indigo-400" />
            <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-widest">"What-If" Spending Optimizer</h4>
          </div>
          <span className="text-[10px] bg-indigo-900/40 border border-indigo-800/40 text-indigo-300 px-2 py-0.5 rounded-full font-mono font-semibold">
            Flexible Non-Essential Simulator
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 mb-4 leading-relaxed">
          Non-essential expenses (Dining, Transport, Shopping, Entertainment, Misc) currently cost you **৳{nonEssentialExpenses.toLocaleString()}/yr**. 
          Slide to simulate cutting back on these categories and watch your savings skyrocket.
        </p>

        {nonEssentialExpenses === 0 ? (
          <p className="text-xs italic text-zinc-500 text-center py-2">
            No non-essential expenses logged. Add dining, shopping, or leisure items to run optimizations!
          </p>
        ) : (
          <div className="space-y-4">
            {/* Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-400">Optimize Non-Essentials by:</span>
                <span className="text-indigo-400 font-mono text-sm">{optimizationRate}% Reduction</span>
              </div>
              <input
                id="simulator_range_slider"
                type="range"
                min="5"
                max="75"
                step="5"
                value={optimizationRate}
                onChange={e => setOptimizationRate(parseInt(e.target.value) || 15)}
                className="w-full accent-indigo-500 bg-zinc-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono font-semibold">
                <span>5% (Conservative)</span>
                <span>40% (Moderate)</span>
                <span>75% (Aggressive)</span>
              </div>
            </div>

            {/* Dynamic Comparison Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" id="simulator_stats_grid">
              <div className="bg-[#09090b]/60 p-3 rounded-lg border border-[#27272a] text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Yearly Cash Saved</span>
                <span className="text-base font-extrabold font-mono text-emerald-400">
                  +৳{simulatedSavings.potentialCut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Extra Cash</span>
              </div>

              <div className="bg-[#09090b]/60 p-3 rounded-lg border border-[#27272a] text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">New Spending</span>
                <span className="text-base font-extrabold font-mono text-rose-400">
                  ৳{simulatedSavings.newExpenses.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">Optimized Budget</span>
              </div>

              <div className="bg-[#09090b]/60 p-3 rounded-lg border border-[#27272a] text-center">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">New Savings Rate</span>
                <span className="text-base font-extrabold font-mono text-indigo-400">
                  {simulatedSavings.newSavingsRate.toFixed(1)}%
                </span>
                <span className="text-[9px] text-zinc-400 block mt-0.5">
                  Up from {analysis.savingsRate.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Action text */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-300 bg-[#09090b]/30 p-2.5 rounded-lg border border-[#27272a]">
              <Zap size={11} className="text-yellow-500 animate-pulse" />
              <span>Saving just **৳{(simulatedSavings.potentialCut / 12).toFixed(0)} / month** creates **৳{simulatedSavings.potentialCut.toLocaleString(undefined, { maximumFractionDigits: 0 })}** extra liquid savings in 1 year!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
