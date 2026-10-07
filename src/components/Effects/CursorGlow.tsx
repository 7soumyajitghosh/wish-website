import { useEffect, useRef } from 'react';

/**
 * CursorGlow — subtle cursor-following radial glow (Awwwards-style ambient mouse light).
 * Desktop only (pointer:fine), rAF-lerped, GPU transform, disabled for touch + reduced motion.
 */
export const CursorGlow: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let tx = x;
    let ty = y;
    let raf = 0;
    let visible = false;
    let running = true;
    let lastMove = 0;
    let half = 260;

    const measure = () => {
      half = el.offsetWidth / 2 || 260;
    };
    measure();

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      lastMove = performance.now();
      if (!visible) {
        visible = true;
        el.style.opacity = '1';
      }
      // Restart loop on activity after idle park.
      if (running === false && !document.hidden) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };
    const onLeave = () => {
      visible = false;
      el.style.opacity = '0';
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        const shouldRun = entry.isIntersecting && !document.hidden;
        if (shouldRun && running === false) {
          running = true;
          lastMove = performance.now();
          raf = requestAnimationFrame(loop);
        } else if (!entry.isIntersecting) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    // Fixed fullscreen glow is always intersecting; gate on idle instead.
    // Keep IO for correctness if styles change, but rely on idle park below.
    try { io.observe(el); } catch { /* noop */ }

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (performance.now() - lastMove < 3000) {
        if (running === false) {
          running = true;
          raf = requestAnimationFrame(loop);
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);

    const loop = () => {
      if (!running || document.hidden) {
        running = false;
        return;
      }
      // Park when mouse idle >3s: no transform writes, no frames.
      if (performance.now() - lastMove > 3000) {
        running = false;
        return;
      }
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      // Skip sub-pixel writes when settled.
      if (Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1) {
        el.style.transform = `translate3d(${x - half}px, ${y - half}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    lastMove = performance.now();
    raf = requestAnimationFrame(loop);

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-40 h-[520px] w-[520px] rounded-full opacity-0 transition-opacity duration-700"
      style={{
        background:
          'radial-gradient(circle, rgba(216,27,70,0.10) 0%, rgba(255,179,193,0.06) 35%, transparent 65%)',
      }}
    />
  );
};

export default CursorGlow;
