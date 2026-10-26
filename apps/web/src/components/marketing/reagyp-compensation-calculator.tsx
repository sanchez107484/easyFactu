'use client';

import { useId, useState } from 'react';
import { REAGYP_COMPENSATION_RATES } from '@easyfactura/shared-constants';
import { round2 } from '@/lib/math';
import { formatCurrency } from '@/lib/utils';

const ACTIVITIES = [
  { rate: REAGYP_COMPENSATION_RATES.AGRICULTURE, label: 'Agrícola o forestal' },
  { rate: REAGYP_COMPENSATION_RATES.LIVESTOCK_FISHING, label: 'Ganadera o pesquera' },
] as const;

const THOUSANDS_ONLY = /^\d{1,3}(\.\d{3})+$/;

/** Parses "1.234,56", "4.500" or "1234.56" into a non-negative number (0 when invalid). */
function parseAmount(raw: string): number {
  const trimmed = raw.trim();
  const usesSpanishFormat = trimmed.includes(',') || THOUSANDS_ONLY.test(trimmed);
  const normalized = usesSpanishFormat ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function ReagypCompensationCalculator() {
  const inputId = useId();
  const [rawAmount, setRawAmount] = useState('4500');
  const [rate, setRate] = useState<number>(REAGYP_COMPENSATION_RATES.AGRICULTURE);

  const amount = parseAmount(rawAmount);
  const compensation = round2((amount * rate) / 100);
  const total = round2(amount + compensation);
  const rateLabel = rate.toLocaleString('es-ES');

  return (
    <div className="rounded-2xl border-2 border-green-200 bg-white p-6 shadow-sm dark:border-green-900 dark:bg-gray-900">
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-semibold text-gray-800 dark:text-gray-200"
      >
        Importe de la venta (sin compensación)
      </label>
      <div className="relative mb-5">
        <input
          id={inputId}
          inputMode="decimal"
          value={rawAmount}
          onChange={(event) => setRawAmount(event.target.value)}
          className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-lg font-semibold text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        />
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          €
        </span>
      </div>
      <fieldset className="mb-6">
        <legend className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
          Tipo de explotación
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACTIVITIES.map((activity) => (
            <label
              key={activity.rate}
              className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-4 py-3 text-sm transition-colors ${rate === activity.rate ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-200 dark:border-gray-700'}`}
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reagyp-activity"
                  checked={rate === activity.rate}
                  onChange={() => setRate(activity.rate)}
                  className="accent-green-600"
                />
                {activity.label}
              </span>
              <span className="font-bold">{activity.rate.toLocaleString('es-ES')} %</span>
            </label>
          ))}
        </div>
      </fieldset>
      <dl
        className="space-y-2 rounded-xl bg-green-50 p-4 text-sm dark:bg-green-950/40"
        aria-live="polite"
      >
        <div className="flex justify-between">
          <dt className="text-gray-600 dark:text-gray-300">Importe de la venta</dt>
          <dd className="font-medium">{formatCurrency(amount)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-600 dark:text-gray-300">Compensación ({rateLabel} %)</dt>
          <dd className="font-medium">{formatCurrency(compensation)}</dd>
        </div>
        <div className="flex justify-between border-t border-green-200 pt-2 text-base dark:border-green-900">
          <dt className="font-bold">Total que te paga el comprador</dt>
          <dd className="font-bold text-green-700 dark:text-green-400">{formatCurrency(total)}</dd>
        </div>
      </dl>
    </div>
  );
}
