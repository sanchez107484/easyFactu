'use client';

import { useEffect } from 'react';
import { captureFirstVisitAttribution } from '@/lib/signup-attribution';

export function SignupAttributionTracker() {
  useEffect(() => {
    captureFirstVisitAttribution();
  }, []);
  return null;
}
