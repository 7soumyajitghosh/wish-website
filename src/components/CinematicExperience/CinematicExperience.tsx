import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import HeartTreeAnimation, { type TreeInteractionEvent } from '../HeartTreeAnimation';
import { Hero } from '../Hero/Hero';
import { WindOverlay } from '../Effects/WindOverlay';
import { LightTransition } from '../Effects/LightTransition';
import { AmbientField } from '../Effects/AmbientField';
import { CinematicBars } from '../Effects/CinematicBars';
import {
  useStory,
  STAGE_DESCRIPTIONS,
  STAGE_PROGRESS_MAP,
} from '../../context/StoryContext';

export const CinematicExperience: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const isAutoGrowingRef = useRef(false);
  const autoGrowthTlRef = useRef<gsap.core.Timeline | null>(null);
  const stormTlRef = useRef<gsap.core.Timeline | null>(null);
  // Camera (zoom) + black fade are applied straight to the DOM (no re-renders).
  const camRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const {
    introState,
    setIntroState,
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
    pauseTreeQuote,
    resumeTreeQuote,
  } = useStory();

  const [userWind, setUserWind] = useState(0);
  const [isAutoGrowing, setIsAutoGrowing] = useState(false);
  const [isBloomPaused, setIsBloomPaused] = useState(false);
  const [isStorming, setIsStorming] = useState(false);
  const [transitionPlay, setTransitionPlay] = useState(false);
  const quoteCloseRef = useRef<HTMLButtonElement>(null);

  // Refs mirror unlock flags so the long-lived GSAP onUpdate never closes
  // over stale state (30s timeline would otherwise miss unlock transitions).
  const unlockBloomRef = useRef(isBloomUnlocked);
  const unlockFlightRef = useRef(isFlightUnlocked);
  useEffect(() => {
    unlockBloomRef.current = isBloomUnlocked;
  }, [isBloomUnlocked]);
  useEffect(() => {
    unlockFlightRef.current = isFlightUnlocked;
  }, [isFlightUnlocked]);

  // Camera zoom (direct DOM write — GPU transform, no re-renders).
  // Origin sits at the tree base (~46% x, ~73% y, matching the canvas layout).
  const applyCam = useCallback((z: number) => {
    const el = camRef.current;
    if (el) el.style.transform = `scale(${z})`;
  }, []);

  // Black fade that follows the trailing leaves (direct DOM write).
  const applyFade = useCallback((o: number) => {
    const el = fadeRef.current;
    if (el) el.style.opacity = String(Math.max(0, Math.min(1, o)));
  }, []);

  // Shared finish: leaves gone → unlock → cinematic transition into content.
  const finishCinematic = useCallback(() => {
    if (autoGrowthTlRef.current) {
      autoGrowthTlRef.current.kill();
      autoGrowthTlRef.current = null;
    }
    if (stormTlRef.current) {
      stormTlRef.current.kill();
      stormTlRef.current = null;
    }
    isAutoGrowingRef.current = false;
    setIsAutoGrowing(false);
    setIsBloomPaused(false);
    setIsStorming(false);
    setTargetProgress(STAGE_PROGRESS_MAP[16]);
    unlockBloom();
    unlockFlight();
    // Ease the storm push-in back out instead of snapping 1.12 → 1
    // (snap = visible jump on the handoff frame).
    const camEl = camRef.current;
    if (camEl) {
      gsap.to(camEl, {
        scale: 1,
        duration: 1.2,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => applyCam(1),
      });
    } else {
      applyCam(1);
    }
    // Lift the black fade once the transition takes over.
    const fadeEl = fadeRef.current;
    if (fadeEl) {
      gsap.to(fadeEl, { opacity: 0, duration: 1.4, delay: 0.5, ease: 'power2.out', overwrite: 'auto' });
    }
    setIntroState('EXPERIENCE_UNLOCKED');
    setTransitionPlay(true);

    // Re-sync scroll position inside 550vh container so subsequent scroll continues seamlessly.
    // Instant jump without a behavior flag (broadest ScrollBehavior support);
    // guarded so a missing layout never throws or shifts the page.
    const container = containerRef.current;
    if (container && container.offsetHeight > window.innerHeight) {
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const rawProgress = (STAGE_PROGRESS_MAP[16] - 0.02) / 0.98;
        const targetScrollY = container.offsetTop + rawProgress * totalScrollable;
        if (Number.isFinite(targetScrollY)) window.scrollTo(0, targetScrollY);
      }
    }
  }, [applyCam, setIntroState, setTargetProgress, unlockBloom, unlockFlight]);

  // Phased auto-growth: roots in close-up → slow zoom out → branches → leaves.
  // Pauses at full bloom for the storm beat. Tree code itself is untouched;
  // only targetProgress waypoints + the environmental camera move.
  const startAutoGrowth = useCallback(() => {
    if (isAutoGrowingRef.current) return;
    isAutoGrowingRef.current = true;
    setIsAutoGrowing(true);
    setIsBloomPaused(false);

    if (autoGrowthTlRef.current) {
      autoGrowthTlRef.current.kill();
      autoGrowthTlRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const progressObj = { p: 0.02 };
    const camObj = { z: 1.5 };
    let lastBroadcastTime = 0;
    const broadcast = () => {
      const now = performance.now();
      if (now - lastBroadcastTime > 30 || progressObj.p >= 0.819) {
        lastBroadcastTime = now;
        setTargetProgress(progressObj.p);
      }
      if (progressObj.p >= 0.81 && !unlockBloomRef.current) {
        unlockBloom();
      }
    };

    // Match the seed close-up the intro hands off, then hold it for the roots.
    applyCam(1.5);

    const tl = gsap.timeline({
      onUpdate: broadcast,
      onComplete: () => {
        broadcast();
        isAutoGrowingRef.current = false;
        setIsAutoGrowing(false);
        setIsBloomPaused(true);
      },
    });

    // 0.02 -> 0.06 seed settles, 0.06 -> 0.15 roots extend (close-up)
    tl.to(progressObj, { p: STAGE_PROGRESS_MAP[2], duration: 1.2, ease: 'power1.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[3], duration: 2.8, ease: 'power2.out' })
      .to({}, { duration: 0.6 })
      // Slow zoom back out as the trunk + branches rise
      .to(camObj, {
        z: 1.0,
        duration: 3.2,
        ease: 'power2.inOut',
        overwrite: 'auto',
        onUpdate: () => applyCam(camObj.z),
      })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[5], duration: 2.4, ease: 'power1.inOut' }, '<')
      .to(progressObj, { p: STAGE_PROGRESS_MAP[6], duration: 2.6, ease: 'power2.out' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[7], duration: 2.4, ease: 'power1.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[8], duration: 2.2, ease: 'power1.out' })
      // Leaves unfurl gradually until full cover
      .to(progressObj, { p: STAGE_PROGRESS_MAP[9], duration: 2.0, ease: 'sine.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[10], duration: 2.2, ease: 'power2.out' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[11], duration: 2.0, ease: 'power1.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[12], duration: 2.0, ease: 'power2.out' })
      .to({}, { duration: 0.8 });

    tl.timeScale(prefersReducedMotion ? 3 : 1);

    autoGrowthTlRef.current = tl;
  }, [applyCam, setTargetProgress, unlockBloom]);

  // Storm beat: button-triggered gale blows every leaf off, black follows
  // the trailing leaves, then the page transitions.
  const startStorm = useCallback(() => {
    if (isStorming || !isBloomPaused) return;
    setIsBloomPaused(false);
    setIsStorming(true);
    isAutoGrowingRef.current = true;
    setIsAutoGrowing(true);

    if (stormTlRef.current) {
      stormTlRef.current.kill();
      stormTlRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const progressObj = { p: STAGE_PROGRESS_MAP[12] };
    const camObj = { z: 1.0 };
    let lastBroadcastTime = 0;

    const tl = gsap.timeline({
      onUpdate: () => {
        const now = performance.now();
        if (now - lastBroadcastTime > 30 || progressObj.p >= 0.99) {
          lastBroadcastTime = now;
          setTargetProgress(progressObj.p);
        }
        if (progressObj.p >= 0.9 && !unlockFlightRef.current) {
          unlockFlight();
        }
        // Fade to black following the trailing leaves off-screen.
        applyFade((progressObj.p - 0.93) / 0.07);
      },
      onComplete: () => {
        finishCinematic();
      },
    });

    // Gale: slight push-in + full sweep to destination as leaves detach.
    tl.to(camObj, {
      z: 1.12,
      duration: 6.5,
      ease: 'power1.in',
      overwrite: 'auto',
      onUpdate: () => applyCam(camObj.z),
    })
      .to(
        progressObj,
        { p: STAGE_PROGRESS_MAP[16], duration: 6.5, ease: 'power1.in' },
        0
      );

    tl.timeScale(prefersReducedMotion ? 3 : 1);

    stormTlRef.current = tl;
  }, [applyCam, applyFade, finishCinematic, isBloomPaused, isStorming, setTargetProgress, unlockFlight]);

  // Clean up cinematic timelines on unmount
  useEffect(() => {
    return () => {
      if (autoGrowthTlRef.current) {
        autoGrowthTlRef.current.kill();
        autoGrowthTlRef.current = null;
      }
      if (stormTlRef.current) {
        stormTlRef.current.kill();
        stormTlRef.current = null;
      }
    };
  }, []);

  // Escape hatch for the cinematic: jump straight to the end state.
  const skipAutoGrowth = useCallback(() => {
    finishCinematic();
  }, [finishCinematic]);

  // Background-tab stranding guard: GSAP timers throttle while hidden, so
  // fast-forward the cinematic timelines when the tab becomes visible again.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) {
        if (stormTlRef.current) stormTlRef.current.progress(1);
        else if (autoGrowthTlRef.current) autoGrowthTlRef.current.progress(1);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Move focus to the quote's close button when it appears (keyboard/SR users).
  useEffect(() => {
    if (activeTreeQuote) {
      quoteCloseRef.current?.focus();
    }
  }, [activeTreeQuote]);

  // Calculate scroll within the 550vh story container
  useEffect(() => {
    const handleScroll = () => {
      // Protect auto-growth and intro: ignore scroll events while auto-growing or in intro
      if (isAutoGrowingRef.current) return;
      if (introState !== 'EXPERIENCE_UNLOCKED') return;

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
  }, [introState, isBloomUnlocked, isFlightUnlocked, setTargetProgress]);

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
      <style>{`@keyframes cinematicQuoteIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .cinematic-quote-enter { animation: cinematicQuoteIn 0.3s ease both; } .storm-tint { background: radial-gradient(ellipse at 50% 20%, rgba(30,41,59,0.55) 0%, rgba(13,4,8,0.35) 55%, transparent 80%); animation: stormPulse 1.6s ease-in-out infinite; } @keyframes stormPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } } @media (prefers-reduced-motion: reduce) { .storm-tint { animation: none; opacity: 0.7; } }`}</style>
      {/* Sticky Interactive Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-screen max-h-[100dvh] overflow-hidden flex flex-col justify-between select-none"
      >
        {/* Screen-reader stage announcements */}
        <div className="sr-only" aria-live="polite">
          Stage {currentStage} of 16: {currentInfo.title}
        </div>
        {/* Heart Tree Canvas — camera wrapper (environmental zoom only) */}
        <div
          ref={camRef}
          className="absolute inset-0 z-0 will-change-transform"
          style={{ transformOrigin: '46% 73%' }}
        >
          <HeartTreeAnimation
            targetProgress={targetProgress}
            onTreeInteract={handleTreeInteract}
            onWindChange={handleWindChange}
          />
        </div>

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(13,4,8,0.75)_100%)] z-10" />

        {/* Living sky — automatic tint shifting with the story (environmental only) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[4] transition-opacity duration-1000"
          style={{
            opacity: targetProgress > 0.6 ? 1 : 0,
            background:
              targetProgress >= 0.9
                ? 'radial-gradient(ellipse at 50% 30%, rgba(60,40,140,0.22) 0%, transparent 60%)'
                : 'radial-gradient(ellipse at 50% 35%, rgba(216,27,70,0.16) 0%, transparent 60%)',
          }}
        />

        {/* Scene 5 — full-bloom atmosphere (environmental only, tree untouched) */}
        <div className="absolute inset-0 z-[5] pointer-events-none">
          <AmbientField density={46} />
        </div>

        {/* Storm gale trails (environmental only) */}
        <div className="absolute inset-0 z-[6] pointer-events-none">
          <WindOverlay
            active={isStorming || targetProgress >= 0.86 || currentStage >= 13}
            strength={isStorming ? 2.4 : 1 + Math.abs(userWind) * 0.15}
          />
        </div>

        {/* Storm clouds while the gale blows */}
        {isStorming && <div aria-hidden="true" className="storm-tint pointer-events-none absolute inset-0 z-[7]" />}

        {/* Fade to black following the trailing leaves */}
        <div
          ref={fadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[45] bg-black"
          style={{ opacity: 0 }}
        />

        {/* Cinematic letterbox (automatic film framing) */}
        <CinematicBars visible={introState !== 'EXPERIENCE_UNLOCKED' || isAutoGrowing} />

        {/* ================= INTRO PHASE OVERLAY (Owned by CinematicExperience) ================= */}
        {introState !== 'EXPERIENCE_UNLOCKED' && (
          <div className="absolute inset-0 z-40 pointer-events-auto">
            <Hero onWaterComplete={startAutoGrowth} />
          </div>
        )}

        {/* Skip the ~30s auto-growth (also escapable when throttled/hidden) */}
        {isAutoGrowing && (
          <button
            type="button"
            onClick={skipAutoGrowth}
            aria-label="Skip growth animation"
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-6 py-3 min-h-[44px] rounded-full bg-white/10 backdrop-blur-md border border-[#ffd6a5]/50 text-[#fffdf8] font-serif text-base md:text-lg tracking-wide transition-all hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
          >
            Skip growth →
          </button>
        )}

        {/* ================= STAGE NAVIGATION HUD ================= */}
        <nav
          className={`absolute top-8 left-6 md:left-12 z-30 flex flex-col items-start pointer-events-auto transition-opacity duration-700 ${
            introState === 'INTRO' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="Story Progress"
        >
          <div className="flex items-center gap-3">
            <span className="font-sans text-sm uppercase tracking-[0.3em] text-[#f5baa4] opacity-90">
              Journey
            </span>
            <span className="font-serif text-lg text-[#fffdf8] font-medium tracking-widest">
              {String(currentStage).padStart(2, '0')} <span className="text-[#f5baa4]/60">/ 16</span>
            </span>
          </div>

          {/* Current Stage Title & Subtitle */}
          <div className="mt-2 max-w-xs md:max-w-md rounded-lg bg-gradient-to-b from-black/50 to-transparent px-3 py-2 -ml-3">
            <h2 className="text-xl md:text-3xl font-serif text-[#fffdf8] tracking-wide drop-shadow-md">
              {currentInfo.title}
            </h2>
            <p className="text-sm font-sans text-[#f5baa4]/90 font-normal mt-1 leading-relaxed">
              {currentInfo.subtitle}
            </p>
          </div>
        </nav>

        {/* Vertical Chapter Indicator Dots (Right Edge) */}
        <aside
          className={`absolute right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col items-center gap-2.5 py-4 px-2 rounded-full bg-black/25 backdrop-blur-md border border-white/10 transition-opacity duration-700 ${
            introState === 'INTRO' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          aria-label="Stage Navigation Dots"
        >
          {STAGE_DESCRIPTIONS.map((s) => {
            const isActive = s.id === currentStage;
            const isPassed = s.id < currentStage;
            return (
              <button
                key={s.id}
                onClick={() => jumpToStage(s.id)}
                className="group relative flex items-center justify-center p-3 min-w-[44px] min-h-[44px] cursor-pointer transition-transform hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5] rounded-full"
                aria-label={`Jump to stage ${s.id}: ${s.title}`}
                aria-current={isActive ? 'true' : undefined}
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

        {/* Interactive Tree Hints (Bottom Left) — desktop only, hidden on mobile */}
        <div
          className={`absolute bottom-8 left-6 md:left-12 z-20 pointer-events-none max-w-sm transition-opacity duration-700 hidden sm:block ${
            introState !== 'EXPERIENCE_UNLOCKED' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex flex-col gap-1.5 text-sm text-[#fff8eb]/85 font-sans tracking-wide">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f5baa4]" />
              Scroll to explore stages
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
            role="status"
            aria-live="polite"
            onMouseEnter={pauseTreeQuote}
            onMouseLeave={resumeTreeQuote}
            onFocus={pauseTreeQuote}
            onBlur={resumeTreeQuote}
            className="absolute z-50 w-[min(20rem,calc(100vw-2.5rem))] max-w-xs md:max-w-sm max-h-[60vh] overflow-y-auto p-4 rounded-2xl bg-[#1f0915]/90 backdrop-blur-md border border-[#ffb3c1]/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cinematic-quote-enter pointer-events-auto"
            style={{
              left: `clamp(12px, ${Math.min(Math.max(activeTreeQuote.x - 120, 20), typeof window !== 'undefined' ? Math.max(window.innerWidth - 340, 12) : 20)}px, calc(100vw - 17rem))`,
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
                ref={quoteCloseRef}
                onClick={() => setActiveTreeQuote(null)}
                className="text-white/50 hover:text-white text-xs cursor-pointer min-w-[44px] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#ffd6a5] rounded"
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

        {/* Premium cinematic transition into website content */}
        <LightTransition play={transitionPlay} onDone={() => setTransitionPlay(false)} />

        {/* Storm beat: full bloom reached — summon the gale */}
        {isBloomPaused && !isStorming && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <button
              onClick={startStorm}
              className="btn-primary font-serif shadow-[0_0_30px_rgba(100,181,246,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Summon the storm"
            >
              Summon the storm →
            </button>
            <span className="text-sm font-sans tracking-widest uppercase text-[#cfe8ff]/85">
              The wind takes every leaf
            </span>
          </div>
        )}
        {/* Milestone 1: Canopy formed -> "Let it bloom →" (Available if stage >= 11 and bloom not yet unlocked) */}
        {currentStage >= 11 && !isBloomUnlocked && !isStorming && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <button
              onClick={unlockBloom}
              className="btn-primary font-serif shadow-[0_0_25px_rgba(216,27,70,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Let it bloom"
            >
              Let it bloom →
            </button>
            <span className="text-sm font-sans tracking-widest uppercase text-[#f5baa4]/85">
              Click to awaken the blossoms
            </span>
          </div>
        )}

        {/* Milestone 2: Bloom complete & wind rising -> "Release the hearts →" */}
        {isBloomUnlocked && currentStage >= 12 && !isFlightUnlocked && !isBloomPaused && !isStorming && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <p className="font-serif text-sm text-[#fff8eb]/90 drop-shadow">
              "Some things are meant to take flight."
            </p>
            <button
              onClick={unlockFlight}
              className="btn-primary font-serif shadow-[0_0_30px_rgba(216,27,70,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Release the hearts"
            >
              Release the hearts →
            </button>
          </div>
        )}

        {/* Milestone 3: Flight initiated -> Proceed to Destination */}
        {introState === 'EXPERIENCE_UNLOCKED' && isFlightUnlocked && currentStage >= 14 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
            <p className="font-serif text-sm text-[#ffd6a5] drop-shadow">
              Hearts are sailing across the twilight sky...
            </p>
            <button
              onClick={handleDestinationClick}
              className="btn-ghost font-serif shadow-[0_0_20px_rgba(255,214,165,0.4)] flex items-center gap-2"
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
