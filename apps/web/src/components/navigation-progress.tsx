'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Top progress bar that appears on every internal navigation.
 * Listens to anchor clicks to start, and resets when the pathname/search
 * params change (= navigation complete). No external dependencies.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const trickleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTrickle = () => {
    if (trickleRef.current) {
      clearInterval(trickleRef.current);
      trickleRef.current = null;
    }
  };

  const start = () => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }
    stopTrickle();
    setVisible(true);
    setProgress(15);
    trickleRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 90) return current;
        const remaining = 90 - current;
        const increment = Math.max(0.5, remaining * 0.08);
        return current + increment;
      });
    }, 200);
  };

  const done = () => {
    stopTrickle();
    setProgress(100);
    finishTimeoutRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);
  };

  // Intercept clicks on internal links to start the bar immediately.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Skip external, hash-only, downloads and target=_blank
      if (
        href.startsWith('http') ||
        href.startsWith('//') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#') ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }

      try {
        const destination = new URL(anchor.href, window.location.href);
        if (destination.origin !== window.location.origin) return;
        // Same path + same search -> no real navigation
        if (
          destination.pathname === window.location.pathname &&
          destination.search === window.location.search
        ) {
          return;
        }
      } catch {
        return;
      }

      start();
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, []);

  // When the route actually changes, finish the bar.
  useEffect(() => {
    done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      stopTrickle();
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-0.5">
      <div
        className="h-full bg-primary shadow-[0_0_8px_hsl(var(--primary)),0_0_4px_hsl(var(--primary))] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
