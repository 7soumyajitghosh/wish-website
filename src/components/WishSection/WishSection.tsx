import { useState, useEffect, useRef, type FormEvent } from 'react';
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
  const [flyingHearts, setFlyingHearts] = useState<{ id: string; text: string; startX: number; startY: number }[]>([]);

  const containerRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartRef = useRef<HTMLDivElement>(null);

  // Background stars
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const stars = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      velocity: (Math.random() - 0.5) * 0.015,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        star.alpha += star.velocity;
        if (star.alpha <= 0 || star.alpha >= 1) star.velocity *= -1;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 253, 248, ${star.alpha})`;
        ctx.fill();
      });
      animationFrameId = requestAnimationFrame(render);
    };

    render();
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

    // Place initial heart in center of screen
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight * 0.55;
    setHeartPos({ x: cx, y: cy });
    setIsHoldingWish(true);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isHoldingWish) return;
    setIsDragging(true);
    setHeartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && isHoldingWish) {
      setHeartPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    if (!isHoldingWish || !currentWish) return;
    setIsDragging(false);
    setIsHoldingWish(false);

    // Launch flying heart from released position
    const flyingItem = {
      id: currentWish.id,
      text: currentWish.text,
      startX: heartPos.x,
      startY: heartPos.y,
    };
    setFlyingHearts((prev) => [...prev, flyingItem]);
    setWishCount((prev) => prev + 1);
    setCurrentWish(null);
  };

  return (
    <section 
      id="make-a-wish" 
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0d0408] py-24 select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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
          <span className="text-xs uppercase tracking-[0.35em] text-[#f5baa4] font-sans">
            Celestial Whispers
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#fffdf8] mt-2 mb-3">Make a Wish</h2>
          <p className="text-base md:text-lg text-[#fff8eb]/80 font-serif italic">
            Close your eyes. Give words to your deepest desire.
          </p>
        </header>

        {/* Input Form */}
        {!isHoldingWish && (
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
            <div className="w-full relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffb3c1] to-[#ffd6a5] rounded-2xl opacity-0 group-focus-within:opacity-40 transition-opacity duration-500 blur-sm pointer-events-none" />
              <textarea
                value={wishText}
                onChange={(e) => setWishText(e.target.value)}
                placeholder="Type your wish here..."
                className="relative w-full h-32 bg-[#220b17]/50 backdrop-blur-md border border-[#ffb3c1]/30 rounded-2xl p-5 text-[#fffdf8] font-serif text-lg resize-none focus:outline-none focus:border-[#ffb3c1]/70 transition-colors placeholder:text-[#fff8eb]/40 shadow-inner"
                aria-label="Wish text input"
                maxLength={150}
              />
            </div>

            <button
              type="submit"
              disabled={!wishText.trim()}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-serif text-lg tracking-wide hover:shadow-[0_0_25px_rgba(245,186,164,0.5)] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Release My Wish"
            >
              Release My Wish
            </button>
          </form>
        )}

        {/* Wish Count */}
        <div className="mt-12 text-center">
          <p className="text-[#fff8eb]/40 text-xs font-sans tracking-widest uppercase">
            Wishes released into the stars: {wishCount}
          </p>
        </div>
      </div>

      {/* ================= DRAGGABLE GLOWING HEART ================= */}
      {isHoldingWish && currentWish && (
        <div
          ref={heartRef}
          onPointerDown={handlePointerDown}
          className="fixed z-50 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none transition-transform"
          style={{
            left: `${heartPos.x}px`,
            top: `${heartPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Pulsing Light Aura */}
          <div className="absolute inset-0 w-24 h-24 -translate-x-6 -translate-y-6 bg-[#ff758f] rounded-full blur-xl opacity-60 animate-pulse pointer-events-none" />

          {/* Heart Icon */}
          <div className="relative p-4 rounded-full bg-gradient-to-r from-[#d81b46] to-[#ff758f] shadow-[0_0_35px_rgba(255,117,143,0.8)] border-2 border-[#fffdf8]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fffdf8" className="w-10 h-10 drop-shadow-md">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>

          {/* User instruction badge */}
          <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-center pointer-events-none shadow-lg">
            <p className="text-xs font-serif text-[#ffd6a5] italic whitespace-nowrap">
              Drag to guide your wish, then release to launch ✨
            </p>
          </div>

          <p className="mt-2 text-[#fffdf8] font-serif text-sm max-w-[200px] text-center drop-shadow-md truncate">
            "{currentWish.text}"
          </p>
        </div>
      )}

      {/* ================= SOARING WISHES ================= */}
      {flyingHearts.map((item) => (
        <SoaringWishItem
          key={item.id}
          item={item}
          onDone={(id) => setFlyingHearts((prev) => prev.filter((h) => h.id !== id))}
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

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      {
        x: item.startX,
        y: item.startY,
        scale: 1,
        opacity: 1,
      },
      {
        y: -150,
        x: item.startX + (Math.random() - 0.5) * 120,
        scale: 0.25,
        opacity: 0,
        duration: 4.5,
        ease: 'power2.in',
        onComplete: () => onDone(item.id),
      }
    );
  }, [item, onDone]);

  return (
    <div
      ref={elRef}
      className="fixed z-40 flex flex-col items-center pointer-events-none -translate-x-1/2 -translate-y-1/2"
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
