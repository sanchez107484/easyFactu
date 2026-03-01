import { useState } from 'react';

export type SortDir = 'asc' | 'desc';

export interface UseSortTableReturn {
  sortKey: string;
  sortDir: SortDir;
  handleSort: (key: string) => void;
}

/**
 * Generic hook to manage sort state for any table.
 * Usage:
 *   const { sortKey, sortDir, handleSort } = useSortTable('createdAt');
 *   const sorted = sortData(myArray, sortKey, sortDir, (item, key) => item[key]);
 */
export function useSortTable(defaultKey: string, defaultDir: SortDir = 'desc'): UseSortTableReturn {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  return { sortKey, sortDir, handleSort };
}

/**
 * Sorts an array by a given key and direction.
 * @param data - Array to sort
 * @param key  - Column key
 * @param dir  - 'asc' | 'desc'
 * @param getValue - Function that extracts a comparable value from an item by key
 */
export function sortData<T>(
  data: T[],
  key: string,
  dir: SortDir,
  getValue: (item: T, key: string) => string | number,
): T[] {
  return [...data].sort((a, b) => {
    const aVal = getValue(a, key);
    const bVal = getValue(b, key);
    if (aVal < bVal) return dir === 'asc' ? -1 : 1;
    if (aVal > bVal) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}
