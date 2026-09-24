import { useEffect, useRef } from 'react';

/**
 * WindOverlay — strong-wind environmental layer (Scene 6).
 * Canvas wind trails + streak particles reacting to progress>=threshold.
 * Purely environmental: never touches HeartTreeAnimation internals.
 */
export const WindOverlay: React.FC<{ active: boolean; strength?: number }> = ({
  active,
  strength = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active, strength });
  useEffect(() => {
    stateRef.current = { active, strength };
  }, [active, strength]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface S { x: number; y: number; len: number; sp: number; a: number; }
    let streaks: S[] = [];
    const seed = () => {
      streaks = Array.from({ length: 46 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: Math.random() * 120 + 40,
        sp: Math.random() * 7 + 3,
        a: Math.random() * 0.35 + 0.1,
      }));
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    window.addEventListener('resize', resize);

    let opacity = 0;
    let last = performance.now();
    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = stateRef.current.active ? 1 : 0;
      opacity += (target - opacity) * Math.min(1, dt * 1.4);
      ctx.clearRect(0, 0, w, h);
      if (opacity > 0.02) {
        const s = stateRef.current.strength;
        for (const st of streaks) {
          st.x += st.sp * dt * 60 * s * (0.6 + opacity);
          if (st.x - st.len > w) {
            st.x = -st.len;
            st.y = Math.random() * h;
          }
          const g = ctx.createLinearGradient(st.x - st.len, st.y, st.x, st.y);
          g.addColorStop(0, 'rgba(255,179,193,0)');
          g.addColorStop(1, `rgba(255,214,180,${(st.a * opacity).toFixed(3)})`);
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(st.x - st.len, st.y);
          ctx.lineTo(st.x, st.y);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-1000"
      style={{ opacity: active ? 1 : 0 }}
    />
  );
};

export default WindOverlay;
