import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { spotlightMove } from '../Effects/spotlight';
import { STAGE_DESCRIPTIONS } from '../../context/StoryContext';
import { Reveal } from '../Effects/Reveal';

export const Journey: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const cards = cardsRef.current.filter((el): el is HTMLElement => el !== null);
    // Cards stay visible by default (no-JS / GSAP-fail fallback); hidden
    // via gsap.set only when JS runs, then revealed on intersection.
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: no observer support — show all cards immediately.
      gsap.set(cards, { y: 0, opacity: 1 });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              y: 0,
              opacity: 1,
              duration: reduced ? 0 : 0.8,
              ease: 'power3.out',
              overwrite: 'auto',
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const ctx = gsap.context(() => {
      cards.forEach((card) => {
        gsap.set(card, { y: 30, opacity: 0 });
        observer.observe(card);
      });
    }, containerRef);

    return () => {
      ctx.revert();
      observer.disconnect();
    };
  }, []);

  // Read-only milestone gallery. Jumping back into the tree scrubbed the
  // growth animation a second time, so the cards no longer drive state.
  return (
    <section 
      id="journey" 
      ref={containerRef}
      className="section px-4 sm:px-6 md:px-12 w-full relative overflow-hidden bg-gradient-to-b from-[#0d0408] via-[#1a0812] to-[#0d0408] text-[#fffdf8]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_40%_at_50%_20%,rgba(216,27,70,0.1),transparent_70%)]"
      />
      <div className="max-w-5xl mx-auto relative z-10">
        <Reveal className="text-center mb-10 sm:mb-16">
          <header className="text-center px-1">
          <span className="eyebrow">
            Chronicles of Growth
          </span>
          <h2 className="font-serif mt-2 mb-4 tracking-wide text-[#fffdf8] text-balance break-words" style={{ fontSize: 'clamp(1.75rem,8vw,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}>
            The Sixteen Milestones
          </h2>
          <div 
            className="w-20 h-px bg-gradient-to-r from-transparent via-[#ffd6a5]/60 to-transparent mx-auto mb-4" 
            aria-hidden="true" 
          />
          <p className="font-serif text-[#fff8eb]/85 text-sm sm:text-base">
            Sixteen chapters, from the first spark of a seed to where love lands
          </p>
          </header>
        </Reveal>

        <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 list-none p-0 m-0">
          {STAGE_DESCRIPTIONS.map((stage, index) => (
            <li key={stage.id} value={stage.id} className="h-full">
            <article
              ref={(el) => { cardsRef.current[index] = el; }}
              aria-labelledby={`milestone-${stage.id}-title`}
              onPointerMove={spotlightMove}
              className="spotlight h-full p-5 rounded-2xl border bg-[#190710]/60 border-white/10 hover:border-[#ffb3c1]/40 hover:bg-[#250b18]/80"
            >
              <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-sans tracking-widest text-[#f5baa4]">
                  {String(stage.id).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-sans tracking-widest uppercase text-[#fff8eb]/85">
                  {stage.id} / 16
                </span>
              </div>
              <h3 id={`milestone-${stage.id}-title`} className="text-lg font-serif text-[#fffdf8] font-medium mb-1">
                {stage.title}
              </h3>
              <p className="text-sm font-sans text-[#fff8eb]/90 leading-relaxed">
                {stage.subtitle}
              </p>
              </div>
            </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Journey;
