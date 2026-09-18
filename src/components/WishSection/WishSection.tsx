import { useState, useEffect, useRef, type FormEvent } from 'react';
import gsap from 'gsap';

type Wish = {
  id: string;
  text: string;
};

// SVG Heart Icon
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-[#ffb3c1]">
    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
  </svg>
);

// SVG Sparkle Icon
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#ffd6a5]">
    <path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z" />
  </svg>
);

const FloatingWish = ({ wish, onComplete }: { wish: Wish; onComplete: (id: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const duration = prefersReducedMotion ? 0.1 : 6;
      
      const tl = gsap.timeline({
        onComplete: () => onComplete(wish.id)
      });
      
      if (prefersReducedMotion) {
        tl.to(containerRef.current, { opacity: 0, duration: 0.1, delay: 2 });
      } else {
        tl.fromTo(containerRef.current, 
          { y: 50, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, duration: 1, ease: "back.out(1.5)" }
        )
        .to(containerRef.current, 
          { y: -400, opacity: 0, scale: 0.5, duration: duration - 1, ease: "power1.inOut" },
          "+=0.5"
        );
        
        const sparkles = gsap.utils.toArray('.sparkle');
        sparkles.forEach((sparkle: any) => {
          gsap.to(sparkle, {
            x: () => gsap.utils.random(-80, 80),
            y: () => gsap.utils.random(-80, 80),
            opacity: 0,
            rotation: () => gsap.utils.random(0, 360),
            scale: () => gsap.utils.random(0.2, 1.5),
            duration: () => gsap.utils.random(1.5, 3),
            ease: "power2.out",
            delay: () => gsap.utils.random(0, 1)
          });
        });
      }
    }, containerRef);
    
    return () => ctx.revert();
  }, [wish.id, onComplete]);

  return (
    <div ref={containerRef} className="absolute left-1/2 bottom-[20%] -translate-x-1/2 pointer-events-none flex flex-col items-center z-20">
      <div className="relative flex justify-center items-center">
        <div className="drop-shadow-[0_0_15px_rgba(255,179,193,0.6)]">
          <HeartIcon />
        </div>
        {[...Array(7)].map((_, i) => (
          <div key={i} className="sparkle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <SparkleIcon />
          </div>
        ))}
      </div>
      <p className="mt-3 text-[#fffdf8] font-serif text-lg tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center max-w-[250px] break-words">
        {wish.text}
      </p>
    </div>
  );
};

export const WishSection = () => {
  const [wishText, setWishText] = useState('');
  const [activeWishes, setActiveWishes] = useState<Wish[]>([]);
  const [wishCount, setWishCount] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Background star canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.5,
      alpha: Math.random(),
      velocity: (Math.random() - 0.5) * 0.02
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        if (!prefersReducedMotion) {
          star.alpha += star.velocity;
          if (star.alpha <= 0 || star.alpha >= 1) star.velocity *= -1;
        }

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
    setActiveWishes(prev => [...prev, newWish]);
    setWishCount(prev => prev + 1);
    setWishText('');
    
    setShowConfirmation(true);
    setTimeout(() => {
      setShowConfirmation(false);
    }, 3000);
  };

  const handleWishComplete = (id: string) => {
    setActiveWishes(prev => prev.filter(w => w.id !== id));
  };

  return (
    <section 
      id="make-a-wish" 
      className="relative min-h-[80vh] flex flex-col items-center justify-center overflow-hidden bg-[#0d0408] py-20"
      aria-label="Make a Wish Section"
    >
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full opacity-60 z-0 pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center">
        <header className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-serif text-[#fffdf8] mb-4">Make a Wish</h2>
          <p className="text-lg md:text-xl text-[#fff8eb]/80 font-serif italic">
            Close your eyes. Make a wish. Release it to the stars.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-6">
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffb3c1] to-[#ffd6a5] rounded-xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-500 blur-sm pointer-events-none"></div>
            <textarea
              value={wishText}
              onChange={(e) => setWishText(e.target.value)}
              placeholder="Type your wish here..."
              className="relative w-full h-32 bg-[#220b17]/40 backdrop-blur-md border border-[#ffb3c1]/20 rounded-xl p-4 text-[#fffdf8] font-serif text-lg resize-none focus:outline-none focus:border-[#ffb3c1]/60 transition-colors placeholder:text-[#fff8eb]/40 shadow-inner"
              aria-label="Wish text input"
              maxLength={150}
            />
          </div>

          <button
            type="submit"
            disabled={!wishText.trim()}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-medium text-lg tracking-wide hover:shadow-[0_0_20px_rgba(245,186,164,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:translate-y-0"
            aria-label="Release My Wish"
          >
            Release My Wish
          </button>
        </form>

        <div className="mt-8 h-6 flex flex-col items-center justify-center">
          <p 
            className={`text-[#ffb3c1] text-sm font-medium tracking-wider transition-opacity duration-500 ${showConfirmation ? 'opacity-100' : 'opacity-0'}`}
            aria-live="polite"
          >
            Your wish has been released ✨
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 right-8 z-10">
        <p className="text-[#fff8eb]/50 text-sm font-sans tracking-widest uppercase" aria-live="polite">
          Wishes released: {wishCount}
        </p>
      </div>

      {activeWishes.map(wish => (
        <FloatingWish key={wish.id} wish={wish} onComplete={handleWishComplete} />
      ))}
    </section>
  );
};
