'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// three.js is split into its own chunk and only fetched once the browser is idle, so it never competes with first paint.
const Lattice = dynamic(() => import('./Lattice'), { ssr: false });

export function HeroLattice() {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((f: () => void) => window.setTimeout(f, 200));
    const id = idle(() => setMount(true), { timeout: 1200 } as IdleRequestOptions);
    return () => (window.cancelIdleCallback ?? window.clearTimeout)(id as number);
  }, []);
  return mount ? <Lattice /> : null;
}
