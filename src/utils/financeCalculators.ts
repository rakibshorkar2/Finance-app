import { IncomeSource, DeductionSettings, Expense, SavingsAnalysis, ExpenseCategory } from '../types';

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  'Housing': '#3B82F6', // Blue
  'Food & Dining': '#10B981', // Emerald
  'Transport': '#F59E0B', // Amber
  'Utilities': '#06B6D4', // Cyan
  'Healthcare': '#EF4444', // Red
  'Education': '#8B5CF6', // Purple
  'Shopping & Goods': '#EC4899', // Pink
  'Entertainment & Leisure': '#F43F5E', // Rose
  'Family Support': '#14B8A6', // Teal
  'Savings & Investments': '#6366F1', // Indigo
  'Other': '#6B7280' // Gray
};

export const CATEGORY_DESCRIPTIONS: Record<ExpenseCategory, string> = {
  'Housing': 'Rent, mortgage, property tax, maintenance',
  'Food & Dining': 'Groceries, restaurants, fast food, coffee',
  'Transport': 'Fuel, public transit, car maintenance, ride-share',
  'Utilities': 'Electricity, water, gas, internet, phone bills',
  'Healthcare': 'Doctor visits, insurance premiums, prescriptions',
  'Education': 'Tuition, textbooks, courses, training',
  'Shopping & Goods': 'Clothing, electronics, home items',
  'Entertainment & Leisure': 'Movies, concerts, vacations, hobbies',
  'Family Support': 'Money sent back, gifts, child support',
  'Savings & Investments': 'Mutual funds, stocks, emergency reserves',
  'Other': 'Miscellaneous expenses'
};

export function calculateSourceYearly(source: IncomeSource): number {
  switch (source.frequency) {
    case 'hourly':
      return source.amount * (source.hoursPerWeek || 40) * 52;
    case 'weekly':
      return source.amount * 52;
    case 'monthly':
      return source.amount * 12;
    case 'yearly':
      return source.amount;
    default:
      return 0;
  }
}

export function calculateExpenseYearly(expense: Expense): number {
  switch (expense.frequency) {
    case 'once':
      return expense.amount;
    case 'weekly':
      return expense.amount * 52;
    case 'monthly':
      return expense.amount * 12;
    case 'yearly':
      return expense.amount;
    default:
      return 0;
  }
}

export function generateSavingsReport(
  salarySources: IncomeSource[],
  homeInflows: { amount: number; description: string; date: string }[],
  deductions: DeductionSettings,
  expenses: Expense[]
): SavingsAnalysis {
  // 1. Calculate yearly job income (taxable)
  const grossSalaryYearly = salarySources.reduce((sum, src) => sum + calculateSourceYearly(src), 0);

  // 2. Calculate deductions on job income
  const taxDeduction = grossSalaryYearly * (deductions.taxRate / 100);
  const pensionDeduction = grossSalaryYearly * (deductions.pensionRate / 100);
  const insuranceDeduction = deductions.insuranceMonthly * 12;
  const otherDeduction = deductions.otherMonthly * 12;
  const totalDeductions = taxDeduction + pensionDeduction + insuranceDeduction + otherDeduction;

  const netSalaryYearly = Math.max(0, grossSalaryYearly - totalDeductions);

  // 3. Calculate Home Cash Inflows (tax-free "money I take from home")
  const totalHomeInflowsYearly = homeInflows.reduce((sum, item) => sum + item.amount, 0);

  // 4. Combined total annual money available (Take Home Salary + Home Inflows)
  const totalIncomeYearly = netSalaryYearly + totalHomeInflowsYearly;

  // 5. Total annual expenses
  const totalExpensesYearly = expenses.reduce((sum, exp) => sum + calculateExpenseYearly(exp), 0);

  // 6. Net Savings
  const netSavingsYearly = totalIncomeYearly - totalExpensesYearly;
  
  // 7. Savings Rate
  const savingsRate = totalIncomeYearly > 0 ? (netSavingsYearly / totalIncomeYearly) * 100 : 0;

  // 8. Determine Health Status & Grade
  let status: 'Critical' | 'Warning' | 'Healthy' | 'Excellent' = 'Warning';
  let grade = 'C';

  if (savingsRate >= 40) {
    status = 'Excellent';
    grade = 'A+';
  } else if (savingsRate >= 20) {
    status = 'Healthy';
    grade = 'B';
  } else if (savingsRate >= 0) {
    status = 'Warning';
    grade = 'D';
  } else {
    status = 'Critical';
    grade = 'F';
  }

  // 9. Generate Insights & Actionable Recommendations dynamically
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Insight 1: Money Taken From Home relation
  if (totalHomeInflowsYearly > 0) {
    const pct = totalIncomeYearly > 0 ? (totalHomeInflowsYearly / totalIncomeYearly) * 100 : 0;
    insights.push(
      `Personal inflows (money taken from home) make up ${pct.toFixed(1)}% of your total available cash (৳${totalHomeInflowsYearly.toLocaleString()}).`
    );
    if (totalHomeInflowsYearly > totalExpensesYearly) {
      insights.push(`Your personal inflows from home fully cover your total annual expenses of ৳${totalExpensesYearly.toLocaleString()}!`);
    } else {
      const remainingNeed = totalExpensesYearly - totalHomeInflowsYearly;
      insights.push(`Your cash from home covers ${( (totalHomeInflowsYearly / totalExpensesYearly) * 100 ).toFixed(1)}% of your expenses, leaving ৳${remainingNeed.toLocaleString()} to be funded by salary or savings.`);
    }
  } else {
    insights.push(`No personal home inflows recorded yet. All funding relies on your primary income.`);
  }

  // Insight 2: Deductions impact
  const deductionPct = grossSalaryYearly > 0 ? (totalDeductions / grossSalaryYearly) * 100 : 0;
  if (deductionPct > 0) {
    insights.push(
      `Taxes, pension, and fixed deductions absorb ${deductionPct.toFixed(1)}% of your gross annual salary (৳${grossSalaryYearly.toLocaleString()}).`
    );
  }

  // Insight 3: Heavy expenses
  const categoryTotals: Record<ExpenseCategory, number> = {} as any;
  expenses.forEach(exp => {
    const annualVal = calculateExpenseYearly(exp);
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + annualVal;
  });

  const sortedCategories = Object.entries(categoryTotals)
    .map(([cat, val]) => ({ category: cat as ExpenseCategory, val }))
    .sort((a, b) => b.val - a.val);

  if (sortedCategories.length > 0) {
    const topCat = sortedCategories[0];
    const topCatPct = totalExpensesYearly > 0 ? (topCat.val / totalExpensesYearly) * 100 : 0;
    insights.push(
      `Your biggest expense category is ${topCat.category}, consuming ৳${topCat.val.toLocaleString()} annually (${topCatPct.toFixed(1)}% of your total expenses).`
    );

    if (sortedCategories.length > 1) {
      const secondCat = sortedCategories[1];
      insights.push(
        `The runner-up category is ${secondCat.category} at ৳${secondCat.val.toLocaleString()} yearly.`
      );
    }
  } else {
    insights.push(`No expenses tracked yet. Add expenses to generate category analysis.`);
  }

  // Recommendations:
  if (status === 'Excellent') {
    recommendations.push("Fantastic work! You have an outstanding savings rate. Consider routing your extra cash into long-term investment vehicles or index funds.");
    recommendations.push("Ensure you have a 6-month liquid emergency fund established, then automate your savings flow.");
  } else if (status === 'Healthy') {
    recommendations.push("Great job! You are maintaining a healthy budget. Try to challenge yourself to increase your savings rate by 3% to 5% by optimizing your secondary categories.");
    if (sortedCategories.some(c => c.category === 'Food & Dining' && (c.val / totalExpensesYearly) > 0.25)) {
      recommendations.push("Food & Dining exceeds 25% of your expenses. Setting an eating-out allowance can quickly convert to extra savings.");
    }
  } else if (status === 'Warning') {
    recommendations.push("You are living close to your financial line. With a savings rate below 20%, unexpected emergencies could disrupt your finances.");
    recommendations.push("Create a safety buffer. Identify non-essential spending (e.g. Entertainment, Shopping) and try to cut back by 15% immediately.");
    if (sortedCategories.length > 0) {
      recommendations.push(`Target your highest spending category (${sortedCategories[0].category}) for optimization. Even a minor trim here yields massive yearly results.`);
    }
  } else {
    recommendations.push("Urgent attention needed! Your annual spending exceeds your total yearly take-home cash.");
    recommendations.push("Evaluate high-impact structural costs: Could you reduce housing utility consumption, or renegotiate transport costs?");
    recommendations.push("Audit your recurring monthly bills (subscriptions, gym memberships, streaming services) and cancel anything unused.");
    if (totalHomeInflowsYearly > 0 && netSalaryYearly === 0) {
      recommendations.push("Look for opportunities to supplement your personal allowance with a part-time job or freelance work.");
    }
  }

  // General recommendation on "home cash"
  if (totalHomeInflowsYearly > 0 && status === 'Critical') {
    recommendations.push("Since you rely heavily on home inflows but still exceed budget, consider establishing a strict daily cash allowance from your home funds.");
  }

  return {
    totalIncomeYearly,
    totalExpensesYearly,
    netSavingsYearly,
    savingsRate,
    status,
    grade,
    insights,
    recommendations
  };
}
