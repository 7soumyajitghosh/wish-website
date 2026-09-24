import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStory, STAGE_DESCRIPTIONS } from '../../context/StoryContext';
import { Reveal } from '../Effects/Reveal';

export const Journey: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const { currentStage, jumpToStage, isExperienceUnlocked, setIntroState } = useStory();

  useEffect(() => {
    const cards = cardsRef.current.filter(Boolean) as HTMLElement[];
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

  const handleCardClick = (stageId: number) => {
    // Unlock first when the experience is still gated, then jump.
    if (!isExperienceUnlocked) {
      setIntroState('EXPERIENCE_UNLOCKED');
    }
    jumpToStage(stageId);
    const storyEl = document.getElementById('story-experience');
    if (storyEl) {
      storyEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="journey" 
      ref={containerRef}
      className="section py-24 md:py-32 px-6 md:px-12 w-full relative overflow-hidden bg-gradient-to-b from-[#0d0408] via-[#1a0812] to-[#0d0408] text-[#fffdf8]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_55%_40%_at_50%_20%,rgba(216,27,70,0.1),transparent_70%)]"
      />
      <div className="max-w-5xl mx-auto relative z-10">
        <Reveal className="text-center mb-16">
          <header className="text-center">
          <span className="text-sm uppercase tracking-[0.35em] text-[#f5baa4] font-sans font-medium">
            Chronicles of Growth
          </span>
          <h2 className="font-serif mt-2 mb-4 tracking-wide text-[#fffdf8]" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}>
            The Sixteen Milestones
          </h2>
          <div 
            className="w-20 h-px bg-gradient-to-r from-transparent via-[#ffd6a5]/60 to-transparent mx-auto mb-4" 
            aria-hidden="true" 
          />
          <p className="text-base text-[#fff8eb]/85 font-serif">
            Select any stage to jump into that chapter of the tree
          </p>
          </header>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGE_DESCRIPTIONS.map((stage, index) => {
            const isCurrent = stage.id === currentStage;
            return (
              <article
                key={stage.id}
                ref={(el) => { cardsRef.current[index] = el; }}
                onClick={() => handleCardClick(stage.id)}
                role="button"
                tabIndex={0}
                aria-label={`Jump to stage ${stage.id}: ${stage.title}`}
                aria-current={isCurrent ? 'true' : undefined}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCardClick(stage.id); } }}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5] ${
                  isCurrent
                    ? 'bg-[#3b1224]/80 border-[#f5baa4] shadow-[0_0_20px_rgba(245,186,164,0.3)] scale-[1.02]'
                    : 'bg-[#190710]/60 border-white/10 hover:border-[#ffb3c1]/40 hover:bg-[#250b18]/80 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-[0_12px_40px_rgba(216,27,70,0.25)]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-sans tracking-widest text-[#f5baa4]">
                    {String(stage.id).padStart(2, '0')}
                  </span>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-[#f5baa4] motion-safe:animate-ping" />
                  )}
                </div>
                <h3 className="text-lg font-serif text-[#fffdf8] font-medium mb-1">
                  {stage.title}
                </h3>
                <p className="text-sm font-sans text-[#fff8eb]/85 leading-relaxed">
                  {stage.subtitle}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Journey;
