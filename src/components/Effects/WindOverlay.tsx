import { useEffect, useRef } from 'react';

/**
 * WindOverlay — barely-there gale air (Scene 6).
 * Real wind is invisible: you read it in drifting leaves, dust and cloud.
 * So this layer stays whisper-faint — a few long, slow, soft breath-trails
 * plus tiny tumbling leaf chips. Purely environmental: never touches
 * HeartTreeAnimation internals.
 */
export const WindOverlay: React.FC<{ active: boolean; strength?: number }> = ({
  active,
  strength = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ active, strength });
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => {
    stateRef.current = { active, strength };
    // Wake the parked loop on prop change — replaces the old 400ms poll.
    wakeRef.current();
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

    interface Breath {
      x: number; y: number; len: number; sp: number;
      width: number; alpha: number; amp: number; freq: number; phase: number;
    }
    interface Chip {
      x: number; y: number; sp: number; fall: number;
      rx: number; ry: number; rot: number; spin: number; phase: number;
      color: string; alpha: number;
    }
    let breaths: Breath[] = [];
    let chips: Chip[] = [];
    const seed = () => {
      // Few, long, very faint — spaced across the sky, never banded.
      breaths = Array.from({ length: 14 }, (_, i) => ({
        x: Math.random() * w,
        y: (h * (i + 0.5)) / 14 + (Math.random() - 0.5) * (h / 14),
        len: 200 + Math.random() * 160,
        sp: 1.6 + Math.random() * 2.6,
        width: 1 + Math.random() * 1.2,
        alpha: 0.05 + Math.random() * 0.06,
        amp: 4 + Math.random() * 8,
        freq: 0.003 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
      }));
      const chipCols = ['#e8a88f', '#d98a94', '#f2c9a8', '#c9757f'];
      chips = Array.from({ length: 14 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        sp: 1.2 + Math.random() * 1.8,
        fall: -0.15 + Math.random() * 0.45,
        rx: 2.4 + Math.random() * 1.8,
        ry: 1.1 + Math.random() * 0.9,
        rot: Math.random() * Math.PI * 2,
        spin: (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2),
        phase: Math.random() * Math.PI * 2,
        color: chipCols[Math.floor(Math.random() * chipCols.length)],
        alpha: 0.14 + Math.random() * 0.24,
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
      if (!running || !visible) return;
      if (!stateRef.current.active && opacity <= 0.02) return;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    wakeRef.current = ensureLoop;
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
      const t = now * 0.001;
      const target = stateRef.current.active ? 1 : 0;
      opacity += (target - opacity) * Math.min(1, dt * 1.4);
      ctx.clearRect(0, 0, w, h);
      if (opacity > 0.02) {
        const s = stateRef.current.strength;
        // Gusts roll through over seconds — nothing here flickers.
        const gust = 0.8 + 0.2 * Math.sin(t * 0.5) + 0.1 * Math.sin(t * 0.83 + 1.1);
        ctx.lineCap = 'round';

        // Whisper breath-trails: long soft arcs, barely brighter than air.
        for (const b of breaths) {
          b.x += b.sp * dt * 60 * s * (0.5 + opacity * 0.6) * gust;
          if (b.x - b.len > w + 40) {
            b.x = -b.len - Math.random() * 160;
            b.y = Math.random() * h;
          }
          const y0 = b.y + Math.sin(b.x * b.freq + b.phase + t * 0.6) * b.amp;
          const y1 = b.y + Math.sin((b.x - b.len) * b.freq + b.phase + t * 0.6) * b.amp;
          // Dissolve at both ends so trails never pop or end abruptly.
          // Trails live in the sky: dissolve toward the ground line (~72%)
          // so no bright scratches cross the dark soil.
          const headFade = Math.min(1, Math.max(0, (w - b.x + 60) / 160));
          const tailFade = Math.min(1, Math.max(0, (b.x - b.len + 200) / 220));
          const groundFade = Math.min(1, Math.max(0, (h * 0.8 - y0) / (h * 0.12)));
          const a = b.alpha * opacity * Math.min(headFade, Math.min(tailFade, groundFade));
          if (a <= 0.004) continue;
          ctx.strokeStyle = `rgba(255,220,190,${a.toFixed(3)})`;
          ctx.lineWidth = b.width;
          ctx.beginPath();
          ctx.moveTo(b.x - b.len, y1);
          ctx.quadraticCurveTo(b.x - b.len * 0.5, (y0 + y1) / 2, b.x, y0);
          ctx.stroke();
        }

        // Tumbling leaf chips riding the same slow air.
        for (const c of chips) {
          c.x += c.sp * s * gust * dt * 60;
          c.y += (c.fall + Math.sin(t * 1.3 + c.phase) * 0.35) * dt * 60;
          c.rot += c.spin * dt;
          if (c.x > w + 12) {
            c.x = -12;
            c.y = Math.random() * h;
          }
          if (c.y < -12) c.y = h + 12;
          if (c.y > h + 12) c.y = -12;
          const a = c.alpha * opacity;
          if (a <= 0.01) continue;
          ctx.save();
          ctx.globalAlpha = Math.min(1, a);
          ctx.translate(c.x, c.y);
          ctx.rotate(c.rot);
          ctx.fillStyle = c.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, c.rx, c.ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(loop);
    };
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
      cancelAnimationFrame(raf);
      raf = 0;
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
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
