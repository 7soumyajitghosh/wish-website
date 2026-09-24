import React from 'react';

/**
 * Marquee — Dribbble-style infinite ribbon strip (original).
 * Pure CSS motion, pauses off-screen via IO, static row under reduced motion.
 */
export const Marquee: React.FC<{
  words: string[];
  className?: string;
}> = ({ words, className = '' }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const track = el.querySelector<HTMLElement>('.marquee-track');
    if (!track) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        track.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const row = (hidden: boolean) => (
    <div aria-hidden={hidden} className="flex shrink-0 items-center">
      {words.map((w, i) => (
        <span key={i} className="flex items-center">
          <span className="mx-6 font-serif italic text-lg md:text-xl text-[#f5baa4]/70 whitespace-nowrap">
            {w}
          </span>
          <svg className="h-3 w-3 shrink-0 text-[#d81b46]/70" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={ref} className={`relative overflow-hidden py-5 ${className}`} role="presentation">      <style>{`
        .marquee-track { display: flex; width: max-content; animation: marqueeSlide 28s linear infinite; }
        @keyframes marqueeSlide { to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .marquee-track { animation: none; } }
      `}</style>
      <div className="marquee-track">
        {row(false)}
        {row(true)}
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0d0408] to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0d0408] to-transparent" />
    </div>
  );
};

export default Marquee;
