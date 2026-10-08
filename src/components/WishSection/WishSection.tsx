import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import gsap from 'gsap';
import { Reveal } from '../Effects/Reveal';
import { MagneticButton } from '../Effects/MagneticButton';
import { scrollToIdWhenReady } from '../../utils/storyNav';

type Wish = {
  id: string;
  text: string;
};

export const WishSection = () => {
  const [wishText, setWishText] = useState('');
  const [wishCount, setWishCount] = useState(0);

  // Draggable Heart Interactive State
  const [isHoldingWish, setIsHoldingWish] = useState(false);
  const [currentWish, setCurrentWish] = useState<Wish | null>(null);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState<{ id: string; text: string; startX: number; startY: number }[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const focusRafRef = useRef(0);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(focusRafRef.current);
    };
  }, []);
  const focusTextarea = useCallback(() => {
    cancelAnimationFrame(focusRafRef.current);
    focusRafRef.current = requestAnimationFrame(() => {
      if (mountedRef.current) textareaRef.current?.focus();
    });
  }, []);

  // Background stars — cached size, IO-gated (no off-screen 60fps).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId = 0;
    let cw = 1;
    let ch = 1;
    let running = true;
    const seedStars = (w: number, h: number) =>
      Array.from({ length: 45 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        velocity: (Math.random() - 0.5) * 0.015,
      }));
    let stars = seedStars(canvas.offsetWidth || 300, canvas.offsetHeight || 300);
    let resizeRaf = 0;
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = Math.max(1, w);
      ch = Math.max(1, h);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Re-seed stars proportionally so they cover the new size (keep 45 stars)
      stars = seedStars(Math.max(1, w), Math.max(1, h));
    };
    const onResize = () => {
      if (resizeRaf) return;
      resizeRaf = requestAnimationFrame(() => {
        resizeRaf = 0;
        resize();
      });
    };
    window.addEventListener('resize', onResize);
    resize();

    // Reduced motion: render one static frame, no RAF loop.
    if (reduced) {
      ctx.clearRect(0, 0, cw, ch);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${star.alpha})`;
        ctx.fill();
      });
      return () => {
        window.removeEventListener('resize', onResize);
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
      };
    }

    let last = performance.now();
    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, cw, ch);
      stars.forEach((star) => {
        star.alpha += star.velocity * dt * 60;
        if (star.alpha <= 0 || star.alpha >= 1) star.velocity *= -1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${star.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!running) {
            running = true;
            last = performance.now();
            animationFrameId = requestAnimationFrame(render);
          }
        } else {
          running = false;
          cancelAnimationFrame(animationFrameId);
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);
    animationFrameId = requestAnimationFrame(render);
    return () => {
      running = false;
      window.removeEventListener('resize', onResize);
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      io.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    // Unique id: Date.now alone collides on rapid double-submit (both items
    // would be removed by one onDone). Random suffix keeps keys stable.
    const newWish = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: wishText.trim(),
    };
    setCurrentWish(newWish);
    setWishText('');

    // Place initial heart in center of viewport, clamped so the ~400px
    // floating card never starts off-screen on short viewports.
    const cx = window.innerWidth / 2;
    const cy = Math.min(window.innerHeight * 0.55, Math.max(220, window.innerHeight - 260));
    setHeartPos({ x: cx, y: cy });
    setIsHoldingWish(true);
  };

  const launchWish = useCallback((x: number, y: number) => {
    if (!isHoldingWish || !currentWish) return;
    setIsDragging(false);
    setIsHoldingWish(false);

    // Launch flying heart from the given position
    const flyingItem = {
      id: currentWish.id,
      text: currentWish.text,
      startX: x,
      startY: y,
    };
    setFlyingHearts((prev) => [...prev, flyingItem]);
    setWishCount((prev) => prev + 1);
    setCurrentWish(null);
    // Return focus so keyboard users land back in the form + hear confirmation.
    focusTextarea();
  }, [isHoldingWish, currentWish, focusTextarea]);

  const cancelWish = useCallback(() => {
    setIsDragging(false);
    setIsHoldingWish(false);
    setCurrentWish(null);
    focusTextarea();
  }, [focusTextarea]);

  const applyHeartTransform = (x: number, y: number) => {
    const el = heartRef.current;
    if (el) el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isHoldingWish) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setHeartPos({ x: e.clientX, y: e.clientY });
    applyHeartTransform(e.clientX, e.clientY);
  };

  // Window-level move/up listeners attach only while dragging. A release
  // counts as a drag-launch only after >10px of movement; a simple tap
  // keeps holding so keyboard users and tap users can use the Launch button.
  // Ref-driven transform during drag (no per-move re-render); state committed on release.
  // launchWish identity changes with currentWish — a stable ref avoids
  // resubscribing window listeners mid-gesture.
  const launchWishRef = useRef(launchWish);
  useEffect(() => {
    launchWishRef.current = launchWish;
  }, [launchWish]);
  useEffect(() => {
    if (!isDragging) return;
    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const flush = () => {
      raf = 0;
      if (pending) {
        applyHeartTransform(pending.x, pending.y);
      }
    };
    const onMove = (e: PointerEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    const onUp = (e: PointerEvent) => {
      if (raf) cancelAnimationFrame(raf);
      const finalPos = pending ?? { x: e.clientX, y: e.clientY };
      setHeartPos(finalPos);
      setIsDragging(false);
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 10) {
        launchWishRef.current(e.clientX, e.clientY);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  // Keyboard alternative: arrows move, Enter launches, Escape cancels.
  const handleHeartKeyDown = (e: React.KeyboardEvent) => {
    const step = 12;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHeartPos((p) => ({ x: Math.max(80, p.x - step), y: p.y }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHeartPos((p) => ({ x: Math.min(window.innerWidth - 80, p.x + step), y: p.y }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x, y: Math.max(120, p.y - step) }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x, y: Math.min(window.innerHeight - 120, p.y + step) }));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      launchWish(heartPos.x, heartPos.y);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelWish();
    }
  };

  const handleSoaringDone = useCallback((id: string) => {
    setFlyingHearts((prev) => prev.filter((h) => h.id !== id));
  }, []);

  return (
    <section 
      id="make-a-wish" 
      className="section relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0d0408]"
      aria-label="Make a Wish Section"
    >
      {/* Background Star Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Decorative ambient glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_60%_45%_at_50%_38%,rgba(216,27,70,0.14),transparent_70%)]"
      />

      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col items-center">
        <Reveal className="w-full flex flex-col items-center">
          <header className="text-center mb-8 sm:mb-10 px-1">
          <span className="eyebrow">
            Celestial Whispers
          </span>
          <h2 className="font-serif text-[#fffdf8] mt-2 mb-3 text-balance break-words" style={{ fontSize: 'clamp(1.75rem,8vw,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}>Make a Wish</h2>
          <p className="font-serif text-[#fff8eb]/85 text-base md:text-lg">
            Close your eyes. Give words to your deepest desire.
          </p>
          </header>
        </Reveal>

        {/* Input Form */}
        {!isHoldingWish && (
          <Reveal delay={0.12} className="w-full flex flex-col items-center">
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
            <div className="w-full relative group">
              <div aria-hidden="true" className="absolute -inset-0.5 bg-gradient-to-r from-[#ffb3c1] to-[#ffd6a5] rounded-2xl opacity-0 group-focus-within:opacity-15 transition-opacity duration-500 blur-sm pointer-events-none" />
              <label htmlFor="wish-text" className="sr-only">
                Your wish (up to 150 characters)
              </label>
              <textarea
                id="wish-text"
                ref={textareaRef}
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Type your wish here..."
                className="relative w-full h-28 sm:h-32 bg-[#220b17]/70 backdrop-blur-md border border-[#ffb3c1]/30 rounded-2xl p-4 sm:p-5 text-[#fffdf8] font-serif resize-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5] focus:border-[#ffb3c1]/70 transition-colors placeholder:text-[#fff8eb]/85 shadow-inner text-base sm:text-lg"
                aria-describedby="wish-count-hint"
                maxLength={150}
              />
              <p id="wish-count-hint" className="mt-2 text-right text-xs font-sans tracking-widest text-[#fff8eb]/80">
                {wishText.trim().length} / 150
              </p>
            </div>

            <MagneticButton>
              <button
                type="submit"
                disabled={!wishText.trim()}
                className="btn-primary font-serif tracking-wide shadow-lg cursor-pointer transition-transform duration-300 hover:scale-[1.03] active:scale-95 disabled:hover:scale-100"
                aria-label="Release My Wish"
              >
                Release My Wish
              </button>
            </MagneticButton>
          </form>
          </Reveal>
        )}

        {/* Wish Count */}
        <div className="mt-12 text-center flex flex-col items-center gap-4">
          <p aria-live="polite" className="text-[#fff8eb]/85 text-sm font-sans tracking-widest uppercase">
            Wishes released in this visit: {wishCount}
          </p>
          {/* Chapter link — keeps every page connected in one flow. */}
          <button
            type="button"
            onClick={() => scrollToIdWhenReady('final-message', { timeoutMs: 4000 })}
            className="font-serif italic text-sm tracking-wide text-[#f5baa4] hover:text-[#ffd6a5] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd6a5] rounded px-2 py-2 min-h-[44px]"
            aria-label="Continue to the final message"
          >
            Continue to the final message →
          </button>
        </div>
      </div>

      {/* ================= DRAGGABLE GLOWING HEART ================= */}
      {isHoldingWish && currentWish && (
        <div
          ref={heartRef}
          role="group"
          tabIndex={0}
          aria-label={`Your wish is ready. Use arrow keys to guide it, Enter to launch, Escape to cancel. Wish: ${currentWish.text}`}
          aria-describedby="wish-drag-help"
          onKeyDown={handleHeartKeyDown}
          className="fixed left-0 top-0 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[320px] flex-col items-center overflow-y-auto select-none focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-4 rounded-2xl p-2 text-center"
          style={{
            transform: `translate(${heartPos.x}px, ${heartPos.y}px) translate(-50%, -50%)`,
          }}
        >
          {/* Pulsing Light Aura (single primary glow) */}
          <div aria-hidden="true" className="absolute inset-0 w-24 h-24 -translate-x-6 -translate-y-6 bg-[#d81b46] rounded-full blur-xl opacity-60 motion-safe:animate-pulse pointer-events-none" />

          {/* Heart Icon — the drag handle (touch-none only here) */}
          <div
            onPointerDown={handlePointerDown}
            className="relative p-4 rounded-full bg-gradient-to-r from-[#a81438] to-[#d81b46] shadow-[0_0_35px_rgba(216,27,70,0.8)] border-2 border-[#fffdf8] cursor-grab active:cursor-grabbing touch-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fffdf8" className="w-10 h-10 drop-shadow-md" aria-hidden="true">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>

          {/* User instruction badge */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-center pointer-events-none shadow-lg w-full max-w-[280px]">
            <p id="wish-drag-help" className="text-sm font-serif text-[#ffd6a5] whitespace-normal break-words">
              Drag to guide your wish, then release to launch <span aria-hidden="true">✨</span>
            </p>
          </div>

          <p className="mt-2 text-[#fffdf8] font-serif text-sm w-full max-w-[280px] text-center drop-shadow-md whitespace-normal break-words">
            &ldquo;{currentWish.text}&rdquo;
          </p>

          {/* No-drag alternatives: launch in place, or cancel */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 pointer-events-auto w-full">
            <MagneticButton strength={4}>
              <button
                type="button"
                onClick={() => launchWish(heartPos.x, heartPos.y)}
                aria-label="Launch wish without dragging"
                className="btn-primary btn-sm font-serif tracking-wide shadow-lg cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
              >
                Launch wish <span aria-hidden="true">✨</span>
              </button>
            </MagneticButton>
            <button
              type="button"
              onClick={cancelWish}
              aria-label="Cancel wish"
              className="btn-ghost btn-sm font-serif tracking-wide cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ================= SOARING WISHES ================= */}
      {flyingHearts.map((item) => (
        <SoaringWishItem
          key={item.id}
          item={item}
          onDone={handleSoaringDone}
        />
      ))}
    </section>
  );
};

const SoaringWishItem = ({
  item,
  onDone,
}: {
  item: { id: string; text: string; startX: number; startY: number };
  onDone: (id: string) => void;
}) => {
  const elRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  const { id: itemId, startX, startY } = item;

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.fromTo(
      el,
      {
        x: startX,
        y: startY,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
        opacity: 1,
      },
      {
        y: -150,
        x: startX + (Math.random() - 0.5) * 120,
        xPercent: -50,
        yPercent: -50,
        scale: 0.25,
        opacity: 0,
        duration: reduced ? 0 : 4.5,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => onDoneRef.current(itemId),
      }
    );
    return () => {
      gsap.killTweensOf(el);
    };
  }, [itemId, startX, startY]);

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      className="fixed z-40 flex flex-col items-center pointer-events-none"
      style={{ left: 0, top: 0 }}
    >
      <div className="relative p-3 rounded-full bg-[#d81b46] shadow-[0_0_30px_#f5baa4]">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fffdf8" className="w-8 h-8">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      <p className="mt-2 text-xs font-serif text-[#ffd6a5] italic max-w-[200px] text-center drop-shadow">
        {item.text}
      </p>
    </div>
  );
};

export default WishSection;
