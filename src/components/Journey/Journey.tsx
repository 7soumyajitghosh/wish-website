import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStory, STAGE_DESCRIPTIONS } from '../../context/StoryContext';

export const Journey: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const { currentStage, jumpToStage } = useStory();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
      );

      cardsRef.current.forEach((card) => {
        if (card) {
          gsap.set(card, { y: 30, opacity: 0 });
          observer.observe(card);
        }
      });

      return () => {
        observer.disconnect();
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleCardClick = (stageId: number) => {
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
      className="py-24 px-6 md:px-12 w-full relative overflow-hidden bg-gradient-to-b from-[#0d0408] via-[#1a0812] to-[#0d0408] text-[#fffdf8]"
    >
      <div className="max-w-5xl mx-auto relative z-10">
        <header className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.35em] text-[#f5baa4] font-sans">
            Chronicles of Growth
          </span>
          <h2 className="text-4xl md:text-5xl font-serif mt-2 mb-4 tracking-wide text-[#fffdf8]">
            The Sixteen Milestones
          </h2>
          <div 
            className="w-20 h-px bg-gradient-to-r from-transparent via-[#ffd6a5]/60 to-transparent mx-auto mb-4" 
            aria-hidden="true" 
          />
          <p className="text-sm md:text-base italic text-[#fff8eb]/80 font-serif">
            Select any stage to jump into that chapter of the tree
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {STAGE_DESCRIPTIONS.map((stage, index) => {
            const isCurrent = stage.id === currentStage;
            return (
              <article
                key={stage.id}
                ref={(el) => { cardsRef.current[index] = el; }}
                onClick={() => handleCardClick(stage.id)}
                className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                  isCurrent
                    ? 'bg-[#3b1224]/80 border-[#f5baa4] shadow-[0_0_20px_rgba(245,186,164,0.3)] scale-102'
                    : 'bg-[#190710]/60 border-white/10 hover:border-[#ffb3c1]/40 hover:bg-[#250b18]/80 hover:-translate-y-1'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-sans tracking-widest text-[#f5baa4]">
                    {String(stage.id).padStart(2, '0')}
                  </span>
                  {isCurrent && (
                    <span className="w-2 h-2 rounded-full bg-[#f5baa4] animate-ping" />
                  )}
                </div>
                <h3 className="text-lg font-serif text-[#fffdf8] font-medium mb-1">
                  {stage.title}
                </h3>
                <p className="text-xs font-sans text-[#fff8eb]/70 leading-relaxed">
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
