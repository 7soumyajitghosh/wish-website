import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import gsap from 'gsap';

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
  const [hasMoved, setHasMoved] = useState(false);
  const [flyingHearts, setFlyingHearts] = useState<{ id: string; text: string; startX: number; startY: number }[]>([]);

  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Background stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animationFrameId: number;
    const seedStars = (w: number, h: number) =>
      Array.from({ length: 45 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        velocity: (Math.random() - 0.5) * 0.015,
      }));
    let stars = seedStars(canvas.offsetWidth, canvas.offsetHeight);
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Re-seed stars proportionally so they cover the new size (keep 45 stars)
      stars = seedStars(Math.max(1, w), Math.max(1, h));
    };
    window.addEventListener('resize', resize);
    resize();

    // Reduced motion: render one static frame, no RAF loop.
    if (reduced) {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${star.alpha})`;
        ctx.fill();
      });
      return () => {
        window.removeEventListener('resize', resize);
      };
    }

    let last = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
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

    animationFrameId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!wishText.trim()) return;

    const newWish = { id: Date.now().toString(), text: wishText.trim() };
    setCurrentWish(newWish);
    setWishText('');

    // Place initial heart in center of screen (no transition on placement)
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.55;
    setHeartPos({ x: cx, y: cy });
    setHasMoved(false);
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
  }, [isHoldingWish, currentWish]);

  const cancelWish = useCallback(() => {
    setIsDragging(false);
    setIsHoldingWish(false);
    setCurrentWish(null);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isHoldingWish) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setHeartPos({ x: e.clientX, y: e.clientY });
  };

  // Window-level move/up listeners attach only while dragging. A release
  // counts as a drag-launch only after >10px of movement; a simple tap
  // keeps holding so keyboard users and tap users can use the Launch button.
  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: PointerEvent) => {
      setHeartPos({ x: e.clientX, y: e.clientY });
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 10) setHasMoved(true);
    };
    const onUp = (e: PointerEvent) => {
      setIsDragging(false);
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 10) {
        launchWish(e.clientX, e.clientY);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging, launchWish]);

  // Keyboard alternative: arrows move, Enter launches, Escape cancels.
  const handleHeartKeyDown = (e: React.KeyboardEvent) => {
    const step = 12;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x - step, y: p.y }));
      setHasMoved(true);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x + step, y: p.y }));
      setHasMoved(true);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x, y: p.y - step }));
      setHasMoved(true);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHeartPos((p) => ({ x: p.x, y: p.y + step }));
      setHasMoved(true);
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
      ref={containerRef}
      className="section relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0d0408] py-24 md:py-32 select-none"
      aria-label="Make a Wish Section"
    >
      {/* Background Star Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        <header className="text-center mb-10">
          <span className="text-sm uppercase tracking-[0.35em] text-[#f5baa4] font-sans font-medium">
            Celestial Whispers
          </span>
          <h2 className="font-serif text-[#fffdf8] mt-2 mb-3" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}>Make a Wish</h2>
          <p className="text-base md:text-lg text-[#fff8eb]/85 font-serif">
            Close your eyes. Give words to your deepest desire.
          </p>
        </header>

        {/* Input Form */}
        {!isHoldingWish && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
            <div className="w-full relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffb3c1] to-[#ffd6a5] rounded-2xl opacity-0 group-focus-within:opacity-15 transition-opacity duration-500 blur-sm pointer-events-none" />
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Type your wish here..."
                className="relative w-full h-32 bg-[#220b17]/50 backdrop-blur-md border border-[#ffb3c1]/30 rounded-2xl p-5 text-[#fffdf8] font-serif text-lg resize-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5] focus:border-[#ffb3c1]/70 transition-colors placeholder:text-[#fff8eb]/65 shadow-inner"
                aria-label="Wish text input"
                maxLength={150}
              />
            </div>

            <button
              type="submit"
              disabled={!wishText.trim()}
              className="btn-primary font-serif tracking-wide shadow-lg cursor-pointer"
              aria-label="Release My Wish"
            >
              Release My Wish
            </button>
          </form>
        )}

        {/* Wish Count */}
        <div className="mt-12 text-center">
          <p className="text-[#fff8eb]/70 text-sm font-sans tracking-widest uppercase">
            Wishes released into the stars: {wishCount}
          </p>
        </div>
      </div>

      {/* ================= DRAGGABLE GLOWING HEART ================= */}
      {isHoldingWish && currentWish && (
        <div
          ref={heartRef}
          role="slider"
          tabIndex={0}
          aria-label="Wish position. Use arrow keys to move, Enter to launch, Escape to cancel."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.max(0, Math.min(100, Math.round((heartPos.x / Math.max(1, typeof window !== 'undefined' ? window.innerWidth : 1)) * 100)))}
          aria-valuetext={`Wish at ${Math.round(heartPos.x)} pixels across, ${Math.round(heartPos.y)} pixels down`}
          aria-describedby="wish-drag-help"
          onKeyDown={handleHeartKeyDown}
          className={`fixed left-0 top-0 z-50 flex flex-col items-center select-none focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-4 rounded-2xl ${!isDragging && hasMoved ? 'transition-transform duration-150' : ''}`}
          style={{
            transform: `translate(${heartPos.x}px, ${heartPos.y}px) translate(-50%, -50%)`,
            willChange: 'transform',
          }}
        >
          {/* Pulsing Light Aura (single primary glow) */}
          <div aria-hidden="true" className="absolute inset-0 w-24 h-24 -translate-x-6 -translate-y-6 bg-[#ff758f] rounded-full blur-xl opacity-60 motion-safe:animate-pulse pointer-events-none" />

          {/* Heart Icon — the drag handle (touch-none only here) */}
          <div
            onPointerDown={handlePointerDown}
            className="relative p-4 rounded-full bg-gradient-to-r from-[#d81b46] to-[#ff758f] shadow-[0_0_35px_rgba(255,117,143,0.8)] border-2 border-[#fffdf8] cursor-grab active:cursor-grabbing touch-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fffdf8" className="w-10 h-10 drop-shadow-md" aria-hidden="true">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>

          {/* User instruction badge */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-center pointer-events-none shadow-lg max-w-[min(80vw,300px)]">
            <p id="wish-drag-help" className="text-sm font-serif text-[#ffd6a5] whitespace-normal break-words">
              Drag to guide your wish, then release to launch ✨
            </p>
          </div>

          <p className="mt-2 text-[#fffdf8] font-serif text-sm max-w-[200px] text-center drop-shadow-md whitespace-normal break-words">
            "{currentWish.text}"
          </p>

          {/* No-drag alternatives: launch in place, or cancel */}
          <div className="mt-3 flex items-center gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={() => launchWish(heartPos.x, heartPos.y)}
              aria-label="Launch wish without dragging"
              className="px-5 py-2 min-h-[44px] rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-serif text-sm tracking-wide shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
            >
              Launch wish ✨
            </button>
            <button
              type="button"
              onClick={cancelWish}
              aria-label="Cancel wish"
              className="px-5 py-2 min-h-[44px] rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#fffdf8] font-serif text-sm tracking-wide transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
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
        duration: 4.5,
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
