'use client';

import { useEffect, useState } from 'react';

type VisualViewportBox = { height: number; offsetTop: number };

/**
 * Tracks the area left visible by the on-screen keyboard, which `dvh` units do not account for.
 * Returns null when inactive or when the browser does not support the Visual Viewport API.
 */
export function useVisualViewport(isActive: boolean): VisualViewportBox | null {
  const [box, setBox] = useState<VisualViewportBox | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!isActive || !viewport) {
      setBox(null);
      return;
    }

    const update = () => setBox({ height: viewport.height, offsetTop: viewport.offsetTop });
    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, [isActive]);

  return box;
}
