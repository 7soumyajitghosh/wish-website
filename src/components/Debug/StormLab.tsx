import { useEffect, useState } from 'react';
import HeartTreeAnimation from '../HeartTreeAnimation';
import { WindOverlay } from '../Effects/WindOverlay';
import { AmbientField } from '../Effects/AmbientField';

/**
 * TEMPORARY visual test-stage for the storm (dev only, NOT shipped).
 * Fully deterministic: NO auto loop. Progress comes from ?p=0.94 (default)
 * or window.__stormlab.setProgress(p). Reload the page for a fresh tree.
 */
declare global {
  interface Window {
    __stormlab?: { setProgress: (v: number) => void };
  }
}

const initialP = () => {
  try {
    const v = parseFloat(new URLSearchParams(window.location.search).get('p') ?? '');
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.94;
  } catch {
    return 0.94;
  }
};

export const StormLab: React.FC = () => {
  const [p, setP] = useState<number>(initialP);

  useEffect(() => {
    window.__stormlab = {
      setProgress: (v: number) => setP(v),
    };
    return () => {
      delete window.__stormlab;
    };
  }, []);

  return (
    <section aria-label="Storm lab" className="relative h-screen w-full overflow-hidden bg-[#0d0408]">
      <div className="absolute inset-0">
        <HeartTreeAnimation targetProgress={p} initialProgress={p} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(26,8,18,0.42)_100%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <AmbientField density={46} />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <WindOverlay active strength={1.5} />
      </div>
      <div aria-hidden="true" className="storm-clouds pointer-events-none absolute inset-0" />
      <div className="absolute left-4 top-4 z-50 rounded bg-black/60 px-3 py-1 font-mono text-xs text-white">
        p={p.toFixed(3)} HELD
      </div>
    </section>
  );
};

export default StormLab;
