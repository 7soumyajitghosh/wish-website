import { useEffect, useState } from 'react';
import HeartTreeAnimation from '../HeartTreeAnimation';
import { WindOverlay } from '../Effects/WindOverlay';
import { AmbientField } from '../Effects/AmbientField';

/**
 * TEMPORARY visual test-stage for the storm (dev only, NOT shipped).
 * Loops the gale 0.86 -> 1.0 so storm frames can be screenshot instantly.
 * Deterministic control via window.__stormlab.setProgress(p).
 */
declare global {
  interface Window {
    __stormlab?: { setProgress: (v: number) => void; play: () => void };
  }
}

export const StormLab: React.FC = () => {
  const [auto, setAuto] = useState(true);
  const [p, setP] = useState(0.86);

  useEffect(() => {
    window.__stormlab = {
      setProgress: (v: number) => {
        setAuto(false);
        setP(v);
      },
      play: () => setAuto(true),
    };
    return () => {
      delete window.__stormlab;
    };
  }, []);

  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = ((now - t0) / 1000) % 14;
      // 0-9s sweep into the storm, 9-11s hold full flight, 11-14s reset
      let v: number;
      if (t < 9) v = 0.86 + (t / 9) * 0.14;
      else if (t < 11) v = 1.0;
      else v = 0.86;
      setP(v);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  return (
    <section aria-label="Storm lab" className="relative h-screen w-full overflow-hidden bg-[#0d0408]">
      <div className="absolute inset-0">
        <HeartTreeAnimation targetProgress={p} />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(26,8,18,0.42)_100%)]" />
      <div className="absolute inset-0 pointer-events-none">
        <AmbientField density={46} />
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <WindOverlay active strength={1.5} />
      </div>
      <div aria-hidden="true" className="storm-grade pointer-events-none absolute inset-0" style={{ opacity: 1 }} />
      <div aria-hidden="true" className="storm-clouds pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="storm-tint pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="storm-flash pointer-events-none absolute inset-0" />
      <div className="absolute left-4 top-4 z-50 rounded bg-black/60 px-3 py-1 font-mono text-xs text-white">
        p={p.toFixed(3)} {auto ? 'LOOP' : 'HELD'}
      </div>
    </section>
  );
};

export default StormLab;
