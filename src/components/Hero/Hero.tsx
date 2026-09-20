import { useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';
import { SeedJourneyIntro } from './SeedJourneyIntro';

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { introState, startStory } = useStory();

  const handleBegin = () => {
    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        y: -30,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          startStory();
        },
      });
    } else {
      startStory();
    }
  };

  return (
    <section 
      id="hero" 
      ref={heroRef}
      className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col justify-center items-center bg-[#0d0408]"
      aria-label="A Journey of Love Opening"
    >
      {/* Cinematic Deep Dusk Gradient Background */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, #2b0e1e 0%, #170711 50%, #0d0408 100%)',
        }}
      />

      {/* Atmospheric Star-Glint Mist */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,186,164,0.12)_0%,transparent_65%)] pointer-events-none" />

      {/* STEP 1: Initial Landing Content (A JOURNEY OF LOVE & Begin Button) */}
      {introState === 'INTRO' && (
        <div
          ref={contentRef}
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full select-none transition-all"
        >
          <p className="text-sm md:text-base font-sans uppercase tracking-[0.35em] text-[#f5baa4] mb-6 drop-shadow-md">
            A Journey of Love
          </p>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#fffdf8] tracking-wide leading-tight mb-10 drop-shadow-2xl">
            Where Love<br />Takes Flight
          </h1>

          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#f5baa4]/60 to-transparent mb-12" />

          {/* The Begin Action Button */}
          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={handleBegin}
              className="group relative px-10 py-4 rounded-full bg-gradient-to-r from-[#d81b46] to-[#a81438] text-[#fffdf8] font-serif text-xl tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(216,27,70,0.5)] border border-[#ffb3c1]/30 cursor-pointer"
              aria-label="Begin"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative z-10 flex items-center gap-3">
                Begin
                <svg 
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </button>

            <p className="text-xs font-sans tracking-widest text-[#f5baa4]/60 uppercase mt-4 animate-pulse">
              Press Begin to start the journey
            </p>
          </div>
        </div>
      )}

      {/* STEP 2-8: The Interactive Love Seed -> Water -> Roots -> Tree Sequence */}
      {introState !== 'INTRO' && <SeedJourneyIntro />}
    </section>
  );
};
