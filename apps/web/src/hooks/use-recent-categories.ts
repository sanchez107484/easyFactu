'use client';

import { useMemo } from 'react';

const STORAGE_KEY = 'easyfactura_recent_categories';

interface RecentCategory {
  id: string;
  count: number;
  lastUsed: number;
}

function getRecentCategories(): Record<string, RecentCategory> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function updateCategoryUsage(categoryId: string): void {
  const recent = getRecentCategories();
  const now = Date.now();
  if (recent[categoryId]) {
    recent[categoryId].count += 1;
    recent[categoryId].lastUsed = now;
  } else {
    recent[categoryId] = { id: categoryId, count: 1, lastUsed: now };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

function clearRecentCategories(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function useRecentCategories<T extends { id: string; name: string }>(categories: T[]): {
  sortedCategories: T[];
  trackUsage: (categoryId: string) => void;
} {
  const sortedCategories = useMemo(() => {
    const recent = getRecentCategories();
    const sorted = [...categories].sort((a, b) => {
      const aRecent = recent[a.id];
      const bRecent = recent[b.id];
      if (!aRecent && !bRecent) return a.name.localeCompare(b.name, 'es');
      if (!aRecent) return 1;
      if (!bRecent) return -1;
      if (aRecent.count !== bRecent.count) return bRecent.count - aRecent.count;
      return bRecent.lastUsed - aRecent.lastUsed;
    });
    return sorted;
  }, [categories]);

  const trackUsage = (categoryId: string) => {
    updateCategoryUsage(categoryId);
  };

  return { sortedCategories, trackUsage };
}
