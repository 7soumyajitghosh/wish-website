import { useEffect, useRef } from 'react';

/**
 * AmbientField — lightweight cinematic ambient canvas.
 * Layered drifting particles + soft mist glows + vignette.
 * GPU-friendly (transform/opacity only), DPR-capped, IO-gated,
 * single RAF, renders one static frame under prefers-reduced-motion.
 */
export const AmbientField: React.FC<{
  density?: number;
  className?: string;
  ariaHidden?: boolean;
}> = ({ density = 70, className = '', ariaHidden = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    interface P {
      x: number; y: number; r: number; a: number;
      vx: number; vy: number; hue: string; tw: number;
    }
    let parts: P[] = [];
    const palette = ['255,179,193', '245,186,164', '255,214,165', '255,248,235'];

    const seed = () => {
      const count = Math.max(24, Math.min(density, Math.floor((w * h) / 22000)));
      parts = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.5,
        a: Math.random() * 0.55 + 0.15,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.28 + 0.05),
        hue: palette[Math.floor(Math.random() * palette.length)],
        tw: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
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

    const draw = (t: number, dt: number) => {
      ctx.clearRect(0, 0, w, h);
      // soft mist glows (2 radial blobs drifting slowly)
      const mx = w * (0.5 + Math.sin(t * 0.00008) * 0.12);
      const my = h * (0.42 + Math.cos(t * 0.00006) * 0.08);
      const mist = ctx.createRadialGradient(mx, my, 0, mx, my, Math.max(w, h) * 0.55);
      mist.addColorStop(0, 'rgba(168,20,56,0.10)');
      mist.addColorStop(0.55, 'rgba(120,20,60,0.05)');
      mist.addColorStop(1, 'rgba(13,4,8,0)');
      ctx.fillStyle = mist;
      ctx.fillRect(0, 0, w, h);

      for (const p of parts) {
        p.tw += dt * 1.6;
        const twinkle = 0.65 + Math.sin(p.tw) * 0.35;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.hue},${(p.a * twinkle).toFixed(3)})`;
        // No per-particle shadowBlur (GPU churn on 200+ frame loops);
        // glow is baked into the low-alpha fill + one mist gradient.
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (reduced) {
      draw(0, 0);
      return () => {
        window.removeEventListener('resize', onResize);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
      };
    }

    let last = performance.now();
    const io = new IntersectionObserver(
      ([entry]) => {
        running = entry.isIntersecting;
        if (running) {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      for (const p of parts) {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
      }
      draw(now, dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      io.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      aria-hidden={ariaHidden}
    />
  );
};

export default AmbientField;
