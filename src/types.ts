export interface Account {
  id: string;
  name: string;
  balance: number;
  color?: string; // Hex color or class
  isDPS?: boolean; // Is it a Deposit Pension Scheme / recurring savings?
  dpsMonthlyInst?: number; // Monthly installment
  dpsTargetAmt?: number; // Target maturity amount
}

export interface IncomeSource {
  id: string;
  name: string;
  amount: number;
  frequency: 'hourly' | 'weekly' | 'monthly' | 'yearly';
  hoursPerWeek?: number; // relevant if hourly
  accountId?: string; // Optional linked account
}

export interface DeductionSettings {
  taxRate: number;      // % tax rate
  pensionRate: number;  // % pension/401k/EPF
  insuranceMonthly: number; // flat monthly health/life insurance
  otherMonthly: number;     // other flat monthly deductions
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  frequency: 'once' | 'weekly' | 'monthly' | 'yearly';
  date: string;
  accountId?: string; // Optional linked account
}

export type ExpenseCategory =
  | 'Housing'
  | 'Food & Dining'
  | 'Transport'
  | 'Utilities'
  | 'Healthcare'
  | 'Education'
  | 'Shopping & Goods'
  | 'Entertainment & Leisure'
  | 'Family Support'
  | 'Savings & Investments'
  | 'Other';

export interface SavingsAnalysis {
  totalIncomeYearly: number;
  totalExpensesYearly: number;
  netSavingsYearly: number;
  savingsRate: number; // percentage
  status: 'Critical' | 'Warning' | 'Healthy' | 'Excellent';
  grade: string;
  insights: string[];
  recommendations: string[];
}
