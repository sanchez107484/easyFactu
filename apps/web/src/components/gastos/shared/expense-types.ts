import { ExpenseCategory, RecurringExpenseFrequency } from '@easyfactura/shared-types';

export interface BaseExpenseAmounts {
  baseAmount: number;
  vatRate: number;
  totalAmount?: number;
}

export interface BaseExpenseData {
  description: string;
  categoryId: string;
  supplierId?: string | null;
  clientId?: string | null;
}

export interface BaseExpenseDates {
  startDate?: string;
  endDate?: string | null;
}

export type PriceMode = 'unit' | 'total';

export interface ExpenseCalculationsState {
  baseAmountRaw: string;
  totalRaw: string;
  userEnteredTotal: number | null;
  calculatedTotal: number;
  vatAmount: number;
}

export interface ExpenseCalculationsActions {
  setBaseAmountRaw: (value: string) => void;
  setTotalRaw: (value: string) => void;
  setUserEnteredTotal: (value: number | null) => void;
  handleBaseAmountBlur: (vatRate: number) => { baseAmount: number; totalAmount?: number };
  handleTotalBlur: (vatRate: number) => { baseAmount: number; totalAmount: number };
  initializeFromExpense: (baseAmount: number, totalAmount: number) => void;
}

export type UseExpenseCalculationsReturn = ExpenseCalculationsState & ExpenseCalculationsActions;
