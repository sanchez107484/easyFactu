'use client';

import { useState, useCallback, useMemo } from 'react';
import { round2 } from '@/lib/math';

export interface ExpenseCalculationState {
  baseAmountRaw: string;
  totalRaw: string;
  userEnteredTotal: number | null;
  calculatedTotal: number;
  vatAmount: number;
}

export interface UseExpenseCalculationsOptions {
  initialBaseAmount?: number;
  initialVatRate?: number;
  initialTotalAmount?: number;
}

const formatNumber = (num: number): string =>
  num.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function useExpenseCalculations(options: UseExpenseCalculationsOptions = {}) {
  const { initialBaseAmount = 0, initialVatRate = 21, initialTotalAmount = 0 } = options;

  const [baseAmountRaw, setBaseAmountRaw] = useState<string>(
    initialBaseAmount > 0 ? formatNumber(initialBaseAmount) : '',
  );
  const [totalRaw, setTotalRaw] = useState<string>(
    initialTotalAmount > 0 ? formatNumber(initialTotalAmount) : '',
  );
  const [userEnteredTotal, setUserEnteredTotal] = useState<number | null>(
    initialTotalAmount > 0 ? initialTotalAmount : null,
  );

  const calculateFromBase = useCallback((baseAmount: number, vatRate: number) => {
    const vatAmount = round2(baseAmount * (vatRate / 100));
    const total = round2(baseAmount + vatAmount);
    return { vatAmount, total };
  }, []);

  const calculateFromTotal = useCallback((total: number, vatRate: number) => {
    const baseAmount = round2(total / (1 + vatRate / 100));
    const vatAmount = round2(total - baseAmount);
    return { baseAmount, vatAmount };
  }, []);

  const handleBaseAmountChange = useCallback(
    (value: string, vatRate: number, setBaseAmount: (v: number) => void) => {
      setBaseAmountRaw(value);
      const normalized = value.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        setBaseAmount(num);
        const { total } = calculateFromBase(num, vatRate);
        setTotalRaw(formatNumber(total));
        setUserEnteredTotal(null);
      }
    },
    [calculateFromBase, formatNumber],
  );

  const handleBaseAmountBlur = useCallback(
    (vatRate: number, setBaseAmount: (v: number, validate: boolean) => void) => {
      const normalized = baseAmountRaw.replace(',', '.');
      const num = parseFloat(normalized);
      if (isNaN(num) || num < 0) {
        setBaseAmountRaw('');
        setTotalRaw('');
        setUserEnteredTotal(null);
        setBaseAmount(0, true);
        return { baseAmount: 0, totalAmount: undefined };
      }
      setBaseAmountRaw(formatNumber(num));
      const { total } = calculateFromBase(num, vatRate);
      setTotalRaw(formatNumber(total));
      setUserEnteredTotal(null);
      setBaseAmount(num, true);
      return { baseAmount: num, totalAmount: undefined };
    },
    [baseAmountRaw, formatNumber, calculateFromBase],
  );

  const handleTotalChange = useCallback(
    (value: string, vatRate: number, setBaseAmount: (v: number) => void) => {
      setTotalRaw(value);
      const normalized = value.replace(',', '.');
      const num = parseFloat(normalized);
      if (!isNaN(num) && num >= 0) {
        const { baseAmount } = calculateFromTotal(num, vatRate);
        setBaseAmount(baseAmount);
        setBaseAmountRaw(formatNumber(baseAmount));
        setUserEnteredTotal(num);
      }
    },
    [calculateFromTotal, formatNumber],
  );

  const handleTotalBlur = useCallback(
    (vatRate: number, setBaseAmount: (v: number, validate: boolean) => void) => {
      const normalized = totalRaw.replace(',', '.');
      const num = parseFloat(normalized);
      if (isNaN(num) || num < 0) {
        setTotalRaw('');
        setBaseAmountRaw('');
        setUserEnteredTotal(null);
        setBaseAmount(0, true);
        return { baseAmount: 0, totalAmount: undefined };
      }
      setUserEnteredTotal(num);
      setTotalRaw(formatNumber(num));
      const { baseAmount } = calculateFromTotal(num, vatRate);
      setBaseAmountRaw(formatNumber(baseAmount));
      setBaseAmount(baseAmount, true);
      return { baseAmount, totalAmount: num };
    },
    [totalRaw, formatNumber, calculateFromTotal],
  );

  const initializeFromExpense = useCallback(
    (baseAmount: number, totalAmount: number) => {
      setBaseAmountRaw(baseAmount > 0 ? formatNumber(baseAmount) : '');
      setTotalRaw(totalAmount > 0 ? formatNumber(totalAmount) : '');
      setUserEnteredTotal(totalAmount > 0 ? totalAmount : null);
    },
    [formatNumber],
  );

  const reset = useCallback(() => {
    setBaseAmountRaw('');
    setTotalRaw('');
    setUserEnteredTotal(null);
  }, []);

  const computed = useMemo(() => {
    const normalized = baseAmountRaw.replace(',', '.');
    const baseAmount = parseFloat(normalized) || 0;
    const vatAmount = round2(baseAmount * (initialVatRate / 100));
    const calculatedTotal = round2(baseAmount + vatAmount);
    return {
      baseAmount,
      vatAmount,
      calculatedTotal,
      total: userEnteredTotal ?? calculatedTotal,
      displayTotal: userEnteredTotal ?? calculatedTotal,
    };
  }, [baseAmountRaw, initialVatRate, userEnteredTotal]);

  return {
    baseAmountRaw,
    totalRaw,
    userEnteredTotal,
    setBaseAmountRaw,
    setTotalRaw,
    setUserEnteredTotal,
    handleBaseAmountChange,
    handleBaseAmountBlur,
    handleTotalChange,
    handleTotalBlur,
    initializeFromExpense,
    reset,
    formatNumber,
    computed,
  };
}
