import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';

export const FinalMessage = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const messageCardRef = useRef<HTMLDivElement>(null);

  const { isFinalUnlocked, unlockFinal } = useStory();
  const [unlocked, setUnlocked] = useState(isFinalUnlocked);

  const handleTakeFinalStep = () => {
    setUnlocked(true);
    unlockFinal();

    const ctx = gsap.context(() => {
      gsap.fromTo(
        messageCardRef.current,
        { opacity: 0, y: 30, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1.6, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.final-fade-item',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.3, duration: 1.2, ease: 'power2.out', delay: 0.3 }
      );
    }, sectionRef);

    return () => ctx.revert();
  };

  return (
    <section
      id="final-message"
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center min-h-[85vh] bg-[#0d0408] px-6 py-28 overflow-hidden select-none"
      aria-label="Final Message"
    >
      {/* Subtle Vignette & Warm Glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(13,4,8,0.85)_100%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#f5baa4]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto text-center">
        {!unlocked ? (
          /* The 'One last thing...' Gated Prompt */
          <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
            <span className="text-xs uppercase tracking-[0.4em] text-[#f5baa4] font-sans">
              The Journey's Crest
            </span>
            <h2 className="text-4xl md:text-5xl font-serif text-[#fffdf8] font-normal tracking-wide">
              One last thing...
            </h2>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#ffd6a5]/60 to-transparent my-2" />
            <p className="text-sm md:text-base font-serif italic text-[#fff8eb]/80 max-w-md">
              Before you step away, there is a quiet truth waiting to be unveiled.
            </p>

            <button
              onClick={handleTakeFinalStep}
              className="mt-4 px-10 py-4 rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-serif text-lg tracking-wider hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(216,27,70,0.5)] border border-white/20 transition-all cursor-pointer"
              aria-label="Take the final step"
            >
              Take the final step
            </button>
          </div>
        ) : (
          /* The Grand Revealed Message */
          <div ref={messageCardRef} className="flex flex-col items-center">
            <span className="final-fade-item text-xs uppercase tracking-[0.4em] text-[#f5baa4] font-sans mb-8">
              Forever Remembered
            </span>

            <h2 className="final-fade-item text-4xl md:text-6xl lg:text-7xl font-serif text-[#fffdf8] leading-tight tracking-wide mb-10 drop-shadow-2xl">
              Somewhere between a beginning and a forever,
              <br className="hidden md:block" /> love takes flight.
            </h2>

            <div className="final-fade-item flex flex-col items-center space-y-6 mb-10">
              <div className="w-28 h-[1px] bg-[#ffd6a5] opacity-70" />
              
              <div className="p-3 rounded-full bg-[#d81b46]/20 border border-[#d81b46]/40 shadow-[0_0_20px_rgba(216,27,70,0.5)]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 text-[#f5baa4]"
                  aria-hidden="true"
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
            </div>

            <p className="final-fade-item text-xl md:text-2xl font-serif text-[#ffd6a5] italic tracking-wider opacity-95 max-w-2xl">
              And in that space, everything beautiful begins.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default FinalMessage;
