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
    let visible = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface S { x: number; y: number; len: number; sp: number; }
    let streaks: S[] = [];
    const seed = () => {
      streaks = Array.from({ length: 46 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        len: Math.random() * 120 + 40,
        sp: Math.random() * 7 + 3,
      }));
    };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };
    resize();
    let resizeRaf = 0;
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    };
    window.addEventListener('resize', onResize);

    let opacity = 0;
    let last = performance.now();
    const ensureLoop = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const loop = (now: number) => {
      raf = 0;
      if (!running) return;
      // Fully suspend when off-screen or fully faded — no parked 60fps loop.
      if (!visible || (opacity <= 0.02 && !stateRef.current.active)) {
        opacity = stateRef.current.active ? opacity : 0;
        if (opacity > 0) ctx.clearRect(0, 0, w, h);
        return;
      }
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const target = stateRef.current.active ? 1 : 0;
      opacity += (target - opacity) * Math.min(1, dt * 1.4);
      ctx.clearRect(0, 0, w, h);
      if (opacity > 0.02) {
        const s = stateRef.current.strength;
        // Single batched path + one alpha (no per-streak gradient objects).
        ctx.lineWidth = Math.max(1, 1.4 * dpr * 0.75);
        ctx.strokeStyle = `rgba(255,214,180,${(0.28 * opacity).toFixed(3)})`;
        ctx.beginPath();
        for (const st of streaks) {
          st.x += st.sp * dt * 60 * s * (0.6 + opacity);
          if (st.x - st.len > w) {
            st.x = -st.len;
            st.y = Math.random() * h;
          }
          ctx.moveTo(st.x - st.len, st.y);
          ctx.lineTo(st.x, st.y);
        }
        ctx.stroke();
      }
      raf = requestAnimationFrame(loop);
    };
    // Wake the loop when props change (stateRef is updated in the other effect).
    const wakeId = window.setInterval(() => {
      if (running && visible && !raf && (stateRef.current.active || opacity > 0.02)) ensureLoop();
    }, 400);
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) ensureLoop();
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    return () => {
      running = false;
      window.clearInterval(wakeId);
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      window.removeEventListener('resize', onResize);
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
