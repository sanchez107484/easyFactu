'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveOptions<T> {
  value: T;
  savedValue: T;
  onSave: (value: T) => Promise<void>;
  enabled: boolean;
  debounceMs?: number;
}

interface UseAutosaveResult {
  status: AutosaveStatus;
  hasPendingChanges: boolean;
}

export function useAutosave<T>({
  value,
  savedValue,
  onSave,
  enabled,
  debounceMs = 1500,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);

  // Keep ref up to date so the timer closure always calls the latest version
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const hasPendingChanges = JSON.stringify(value) !== JSON.stringify(savedValue);

  useEffect(() => {
    if (!enabled || !hasPendingChanges) return;

    setStatus('pending');

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);

    timerRef.current = setTimeout(async () => {
      setStatus('saving');
      try {
        await onSaveRef.current(value);
        setStatus('saved');
        savedStatusTimerRef.current = setTimeout(() => setStatus('idle'), 2500);
      } catch {
        setStatus('error');
      }
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, enabled, debounceMs]);

  // Reset to idle when external savedValue syncs back (e.g. on template hydration)
  useEffect(() => {
    if (!hasPendingChanges && status !== 'saving') {
      if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
      setStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedValue]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedStatusTimerRef.current) clearTimeout(savedStatusTimerRef.current);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { status, hasPendingChanges };
}
