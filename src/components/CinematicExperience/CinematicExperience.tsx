import React, { useRef, useEffect, useState, useCallback } from 'react';
import HeartTreeAnimation, { type TreeInteractionEvent } from '../HeartTreeAnimation';
import {
  useStory,
  STAGE_DESCRIPTIONS,
} from '../../context/StoryContext';

export const CinematicExperience: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  const {
    currentStage,
    targetProgress,
    setTargetProgress,
    jumpToStage,
    isBloomUnlocked,
    unlockBloom,
    isFlightUnlocked,
    unlockFlight,
    activeTreeQuote,
    setActiveTreeQuote,
  } = useStory();

  const [userWind, setUserWind] = useState(0);

  // Calculate scroll within the 600vh story container
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;

      const currentScrolled = -rect.top;
      const rawProgress = Math.max(0, Math.min(1, currentScrolled / totalScrollable));

      // Map raw scroll [0, 1] to story progress [0.02, 1.0]
      // Respect user milestone locks:
      let mappedP = 0.02 + rawProgress * 0.98;

      // Milestone 1 Lock: Before unlocking bloom, clamp at Stage 11 (0.81)
      if (!isBloomUnlocked && mappedP > 0.81) {
        mappedP = 0.81;
      }
      // Milestone 2 Lock: Before unlocking flight, clamp at Stage 13 (0.90)
      else if (!isFlightUnlocked && mappedP > 0.90) {
        mappedP = 0.90;
      }

      setTargetProgress(mappedP);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isBloomUnlocked, isFlightUnlocked, setTargetProgress]);

  const handleTreeInteract = useCallback((event: TreeInteractionEvent) => {
    setActiveTreeQuote(event);
  }, [setActiveTreeQuote]);

  const handleWindChange = useCallback((strength: number) => {
    setUserWind(strength);
  }, []);

  const currentInfo = STAGE_DESCRIPTIONS.find((s) => s.id === currentStage) || STAGE_DESCRIPTIONS[0];

  const handleDestinationClick = () => {
    const destEl = document.getElementById('destination');
    if (destEl) {
      destEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="story-experience"
      ref={containerRef}
      className="relative w-full bg-[#0d0408] text-[#fffdf8]"
      style={{ height: '550vh' }}
      aria-label="Interactive Story Experience"
    >
      {/* Sticky Interactive Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between select-none"
      >
        {/* Heart Tree Canvas */}
        <div className="absolute inset-0 z-0">
          <HeartTreeAnimation
            targetProgress={targetProgress}
            onTreeInteract={handleTreeInteract}
            onWindChange={handleWindChange}
          />
        </div>

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(13,4,8,0.75)_100%)] z-10" />

        {/* ================= STAGE NAVIGATION HUD (Editorial, non-video) ================= */}
        <nav
          className="absolute top-8 left-6 md:left-12 z-30 flex flex-col items-start pointer-events-auto"
          aria-label="Story Progress"
        >
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs uppercase tracking-[0.3em] text-[#f5baa4] opacity-90">
              Journey
            </span>
            <span className="font-serif text-lg text-[#fffdf8] font-medium tracking-widest">
              {String(currentStage).padStart(2, '0')} <span className="text-[#f5baa4]/60">/ 16</span>
            </span>
          </div>

          {/* Current Stage Title & Subtitle */}
          <div className="mt-2 max-w-xs md:max-w-md">
            <h2 className="text-2xl md:text-3xl font-serif text-[#fffdf8] tracking-wide drop-shadow-md">
              {currentInfo.title}
            </h2>
            <p className="text-xs md:text-sm font-sans text-[#f5baa4]/90 font-light mt-1 italic leading-relaxed">
              {currentInfo.subtitle}
            </p>
          </div>
        </nav>

        {/* Vertical Chapter Indicator Dots (Right Edge) */}
        <aside
          className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center gap-2.5 py-4 px-2 rounded-full bg-black/25 backdrop-blur-md border border-white/10"
          aria-label="Stage Navigation Dots"
        >
          {STAGE_DESCRIPTIONS.map((s) => {
            const isActive = s.id === currentStage;
            const isPassed = s.id < currentStage;
            return (
              <button
                key={s.id}
                onClick={() => jumpToStage(s.id)}
                className="group relative flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-125"
                aria-label={`Jump to stage ${s.id}: ${s.title}`}
              >
                <span
                  className={`block rounded-full transition-all duration-300 ${
                    isActive
                      ? 'w-2.5 h-2.5 bg-[#f5baa4] shadow-[0_0_8px_#f5baa4]'
                      : isPassed
                      ? 'w-1.5 h-1.5 bg-[#ffb3c1]/70'
                      : 'w-1.5 h-1.5 bg-white/25 group-hover:bg-white/60'
                  }`}
                />
                {/* Tooltip on hover */}
                <span className="absolute right-7 px-2.5 py-1 rounded bg-[#1c0812]/90 border border-[#ffb3c1]/30 text-[#fffdf8] font-serif text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg">
                  {s.id}. {s.title}
                </span>
              </button>
            );
          })}
        </aside>

        {/* Interactive Tree Hints (Bottom Left) */}
        <div className="absolute bottom-8 left-6 md:left-12 z-20 pointer-events-none max-w-sm">
          <div className="flex flex-col gap-1.5 text-xs text-[#fff8eb]/60 font-sans tracking-wide">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5baa4]" />
              Scroll to grow the tree
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffb3c1]" />
              Tap roots, branch, or hearts to reflect
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ffd6a5]" />
              Drag across the sky to move the wind
            </span>
          </div>
        </div>

        {/* Active Wind feedback (Subtle) */}
        {Math.abs(userWind) > 1 && (
          <div className="absolute bottom-8 right-6 md:right-28 z-20 pointer-events-none flex items-center gap-2 text-xs font-sans text-[#ffd6a5]/80 uppercase tracking-widest animate-pulse">
            <span>Wind: {userWind > 0 ? 'East breeze →' : '← West breeze'}</span>
          </div>
        )}

        {/* ================= FLOATING TREE REFLECTION QUOTE ================= */}
        {activeTreeQuote && (
          <div
            className="absolute z-40 max-w-xs md:max-w-sm p-4 rounded-2xl bg-[#1f0915]/90 backdrop-blur-md border border-[#ffb3c1]/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-300 pointer-events-auto"
            style={{
              left: `${Math.min(Math.max(activeTreeQuote.x - 120, 20), window.innerWidth - 280)}px`,
              top: `${Math.max(activeTreeQuote.y - 90, 40)}px`,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-[#f5baa4]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-[10px] font-sans uppercase tracking-widest text-[#f5baa4]">
                  {activeTreeQuote.type}
                </span>
              </div>
              <button
                onClick={() => setActiveTreeQuote(null)}
                className="text-white/50 hover:text-white text-xs cursor-pointer"
                aria-label="Dismiss message"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm font-serif text-[#fffdf8] italic leading-relaxed">
              "{activeTreeQuote.text}"
            </p>
          </div>
        )}

        {/* ================= USER-TRIGGERED TRANSITION ACTIONS ================= */}
        {/* Milestone 1: Canopy formed -> "Let it bloom →" */}
        {currentStage >= 11 && !isBloomUnlocked && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 animate-bounce">
            <button
              onClick={unlockBloom}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-serif text-lg shadow-[0_0_25px_rgba(216,27,70,0.6)] border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Let it bloom"
            >
              Let it bloom →
            </button>
            <span className="text-xs font-sans tracking-widest uppercase text-[#f5baa4]/80">
              Click to awaken the blossoms
            </span>
          </div>
        )}

        {/* Milestone 2: Bloom complete & wind rising -> "Release the hearts →" */}
        {isBloomUnlocked && currentStage >= 12 && !isFlightUnlocked && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3 animate-bounce">
            <p className="font-serif italic text-sm text-[#fff8eb]/90 drop-shadow">
              "Some things are meant to take flight."
            </p>
            <button
              onClick={unlockFlight}
              className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#d81b46] to-[#a81438] text-[#fffdf8] font-serif text-lg shadow-[0_0_30px_rgba(216,27,70,0.7)] border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              aria-label="Release the hearts"
            >
              Release the hearts →
            </button>
          </div>
        )}

        {/* Milestone 3: Flight initiated -> Proceed to Destination */}
        {isFlightUnlocked && currentStage >= 14 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <p className="font-serif italic text-sm text-[#ffd6a5] drop-shadow">
              Hearts are sailing across the twilight sky...
            </p>
            <button
              onClick={handleDestinationClick}
              className="group px-8 py-3.5 rounded-full bg-white/10 backdrop-blur-md border border-[#ffd6a5]/50 text-[#fffdf8] font-serif text-lg shadow-[0_0_20px_rgba(255,214,165,0.4)] transition-all hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
              aria-label="Follow the hearts to the destination"
            >
              <span>Follow the hearts</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CinematicExperience;
