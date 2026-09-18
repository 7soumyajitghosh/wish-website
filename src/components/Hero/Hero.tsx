import { useRef } from 'react';
import { useStory } from '../../context/StoryContext';

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { isStarted, startStory } = useStory();

  const handleBegin = () => {
    startStory();
    const experienceEl = document.getElementById('story-experience');
    if (experienceEl) {
      experienceEl.scrollIntoView({ behavior: 'smooth' });
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

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full select-none">
        
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

          {!isStarted && (
            <p className="text-xs font-sans tracking-widest text-[#f5baa4]/60 uppercase mt-4 animate-pulse">
              Press Begin to start the journey
            </p>
          )}
        </div>
      </div>

      {/* Subtle indicator only after starting */}
      {isStarted && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-[#f5baa4] opacity-80 flex flex-col items-center pointer-events-none animate-bounce">
          <span className="text-[11px] font-sans tracking-[0.25em] uppercase mb-1">Scroll to shape the tree</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </section>
  );
};
