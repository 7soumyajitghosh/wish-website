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

/**
 * One-way story flow. There is no transition backwards and no scroll-driven
 * growth: watering is the only entry into `growing`, and each phase is
 * entered exactly once.
 *
 *   idle → watering → growing → grown → stormReady → storm
 *        → leavesTransition → destination
 */
type FlowPhase =
  | 'idle'
  | 'watering'
  | 'growing'
  | 'grown'
  | 'stormReady'
  | 'storm'
  | 'leavesTransition'
  | 'destination';

export const CinematicExperience: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const isAutoGrowingRef = useRef(false);
  const autoGrowthTlRef = useRef<gsap.core.Timeline | null>(null);
  const stormTlRef = useRef<gsap.core.Timeline | null>(null);
  const stormReadyCallRef = useRef<gsap.core.Tween | null>(null);
  const leavesTlRef = useRef<gsap.core.Timeline | null>(null);
  // One-shot guards: growth can only ever run once, storm only once.
  const hasGrownRef = useRef(false);
  const hasStormedRef = useRef(false);
  // Camera (zoom) + black fade are applied straight to the DOM (no re-renders).
  const camRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const {
    introState,
    setIntroState,
    currentStage,
    targetProgress,
    setTargetProgress,
    isFlightUnlocked,
    activeTreeQuote,
    setActiveTreeQuote,
    pauseTreeQuote,
    resumeTreeQuote,
  } = useStory();

  const [userWind, setUserWind] = useState(0);
  const [phase, setPhaseState] = useState<FlowPhase>('idle');
  const [transitionPlay, setTransitionPlay] = useState(false);
  const quoteCloseRef = useRef<HTMLButtonElement>(null);

  // Ref mirror of the phase so long-lived GSAP callbacks always read the
  // current state instead of a stale closure.
  const phaseRef = useRef<FlowPhase>('idle');
  const setPhase = useCallback((next: FlowPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  // Refs mirror unlock flags so the long-lived GSAP onUpdate never closes
  // over stale state.
  const unlockFlightRef = useRef(isFlightUnlocked);
  useEffect(() => {
    unlockFlightRef.current = isFlightUnlocked;
  }, [isFlightUnlocked]);

  // Intro close-up: when the seed beat starts, push the ONE camera toward
  // the tree base so the canvas seed carries the moment. Killed on sight
  // by growth / external unlock so tweens never fight (no jump).
  useEffect(() => {
    if (hasGrownRef.current) return;
    if (introState === 'INTRO' || introState === 'EXPERIENCE_UNLOCKED') return;
    const camEl = camRef.current;
    if (!camEl) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const tween = gsap.to(camEl, {
      scale: 1.5,
      duration: reduced ? 0 : 1.6,
      ease: 'power2.inOut',
      overwrite: 'auto',
    });
    return () => {
      tween.kill();
    };
  }, [introState]);

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

  // ---------------------------------------------------------------------
  // LEAVES → DESTINATION
  // Runs only after the storm has fully completed, so nothing is still
  // animating when we move. The black fade covers the cut, then the warm
  // light transition lifts to reveal the Destination. No scroll required.
  // ---------------------------------------------------------------------
  const transitionToDestination = useCallback(() => {
    setPhase('leavesTransition');

    const fadeEl = fadeRef.current;
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        setPhase('destination');
      },
    });
    leavesTlRef.current = tl;

    tl.to(fadeEl, { opacity: 1, duration: 0.45, ease: 'power2.in' })
      .call(() => {
        // Unlock first so body can scroll and destination is accessible
        setIntroState('EXPERIENCE_UNLOCKED');
      })
      .call(() => {
        // Fully covered by black — move instantly to Destination
        const destEl = document.getElementById('destination');
        if (destEl) {
          destEl.scrollIntoView();
          window.scrollTo(0, destEl.offsetTop);
        }
      }, undefined, '+=0.05')
      .call(() => {
        setTransitionPlay(true);
      }, undefined, '+=0.15');
  }, [setIntroState, setPhase]);

  // ---------------------------------------------------------------------
  // TREE GROWTH — ONE TIME ONLY, triggered only by the watering action.
  // ---------------------------------------------------------------------
  const startAutoGrowth = useCallback(() => {
    // Hard one-shot guard: growth can never run twice, for any reason.
    if (hasGrownRef.current || isAutoGrowingRef.current) return;
    // Watering is the only legal trigger (intro === idle/watering).
    if (phaseRef.current !== 'idle' && phaseRef.current !== 'watering') return;
    hasGrownRef.current = true;
    isAutoGrowingRef.current = true;
    setPhase('growing');

    if (autoGrowthTlRef.current) {
      autoGrowthTlRef.current.kill();
      autoGrowthTlRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The intro already played the seed beat, so growth continues from the
    // landed seed — replaying 0.02 → 0.06 here showed the seed a 2nd time.
    const progressObj = { p: STAGE_PROGRESS_MAP[2] };
    const camObj = { z: 1.5 };
    let lastBroadcastTime = 0;
    const broadcast = () => {
      const now = performance.now();
      if (now - lastBroadcastTime > 30 || progressObj.p >= 0.819) {
        lastBroadcastTime = now;
        setTargetProgress(progressObj.p);
      }
    };

    // Growth completed → the tree stays fully grown until the storm starts.
    const onGrown = () => {
      isAutoGrowingRef.current = false;
      setTargetProgress(STAGE_PROGRESS_MAP[12]);
      setPhase('grown');
      // Small beat before the single CTA appears.
      stormReadyCallRef.current?.kill();
      stormReadyCallRef.current = gsap.delayedCall(0.5, () => {
        if (phaseRef.current === 'grown') setPhase('stormReady');
      });
    };

    // The intro close-up already holds ~1.5 on the single camera; take
    // ownership of it (killing that tween) instead of snapping — no jump.
    if (camRef.current) gsap.killTweensOf(camRef.current);
    setTargetProgress(STAGE_PROGRESS_MAP[2]);

    const tl = gsap.timeline({
      onUpdate: broadcast,
      onComplete: onGrown,
    });

    // Roots in close-up → camera pulls back → trunk, branches, leaves.
    tl.to(progressObj, { p: STAGE_PROGRESS_MAP[3], duration: 2.8, ease: 'power2.out' })
      .to({}, { duration: 0.6 })
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
      .to(progressObj, { p: STAGE_PROGRESS_MAP[9], duration: 2.0, ease: 'sine.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[10], duration: 2.2, ease: 'power2.out' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[11], duration: 2.0, ease: 'power1.inOut' })
      .to(progressObj, { p: STAGE_PROGRESS_MAP[12], duration: 2.0, ease: 'power2.out' })
      .to({}, { duration: 0.8 });

    tl.timeScale(prefersReducedMotion ? 3 : 1);

    autoGrowthTlRef.current = tl;
  }, [applyCam, setPhase, setTargetProgress]);

  // Escape hatch during growth: jump to the fully grown state. It never
  // starts the storm — the storm still requires the CTA click.
  const skipGrowth = useCallback(() => {
    if (!isAutoGrowingRef.current) return;
    if (autoGrowthTlRef.current) {
      autoGrowthTlRef.current.kill();
      autoGrowthTlRef.current = null;
    }
    isAutoGrowingRef.current = false;
    setTargetProgress(STAGE_PROGRESS_MAP[12]);
    setPhase('grown');
    stormReadyCallRef.current?.kill();
    stormReadyCallRef.current = gsap.delayedCall(0.4, () => {
      if (phaseRef.current === 'grown') setPhase('stormReady');
    });
  }, [setPhase, setTargetProgress]);

  // ---------------------------------------------------------------------
  // STORM — only from the grown/stormReady state and only on CTA click.
  // ---------------------------------------------------------------------
  const startStorm = useCallback(() => {
    if (hasStormedRef.current) return;
    if (phaseRef.current !== 'stormReady') return;
    hasStormedRef.current = true;
    setPhase('storm');

    if (stormTlRef.current) {
      stormTlRef.current.kill();
      stormTlRef.current = null;
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Start from exactly the grown state so the tree never jumps.
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
        // Fade to black following the trailing leaves off-screen.
        applyFade((progressObj.p - 0.93) / 0.07);
      },
      onComplete: () => {
        // Leaves have all flown away — hand off to the Destination.
        setTargetProgress(STAGE_PROGRESS_MAP[16]);
        transitionToDestination();
      },
    });

    // Gale: slight push-in + full sweep as the leaves detach and fly.
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
  }, [applyCam, applyFade, setPhase, setTargetProgress, transitionToDestination]);

  // Clean up every timeline on unmount.
  useEffect(() => {
    return () => {
      autoGrowthTlRef.current?.kill();
      autoGrowthTlRef.current = null;
      stormTlRef.current?.kill();
      stormTlRef.current = null;
      stormReadyCallRef.current?.kill();
      stormReadyCallRef.current = null;
      leavesTlRef.current?.kill();
      leavesTlRef.current = null;
    };
  }, []);

  // External unlock (nav / milestones / Escape) bypasses the cinematic, so
  // kill any orphaned timeline and settle the camera instead of leaving the
  // tree frozen mid-growth.
  useEffect(() => {
    if (introState !== 'EXPERIENCE_UNLOCKED') return;
    if (phaseRef.current === 'destination' || phaseRef.current === 'leavesTransition') return;
    autoGrowthTlRef.current?.kill();
    autoGrowthTlRef.current = null;
    stormTlRef.current?.kill();
    stormTlRef.current = null;
    stormReadyCallRef.current?.kill();
    stormReadyCallRef.current = null;
    isAutoGrowingRef.current = false;
    if (camRef.current) gsap.killTweensOf(camRef.current);
    applyCam(1);
    applyFade(0);
    setPhase('destination');
  }, [introState, applyCam, applyFade, setPhase]);

  // Background-tab stranding guard: GSAP timers throttle while hidden, so
  // fast-forward only the timeline that is actively playing.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) return;
      if (stormTlRef.current?.isActive()) stormTlRef.current.progress(1);
      else if (autoGrowthTlRef.current?.isActive()) autoGrowthTlRef.current.progress(1);
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

  const handleTreeInteract = useCallback((event: TreeInteractionEvent) => {
    setActiveTreeQuote(event);
  }, [setActiveTreeQuote]);

  const handleWindChange = useCallback((strength: number) => {
    setUserWind(strength);
  }, []);

  const currentInfo = STAGE_DESCRIPTIONS.find((s) => s.id === currentStage) || STAGE_DESCRIPTIONS[0];

  const isGrowing = phase === 'growing';
  const isStorming = phase === 'storm';
  const isLeavesTransition = phase === 'leavesTransition';
  const barsVisible =
    introState !== 'EXPERIENCE_UNLOCKED' || isGrowing || isStorming || isLeavesTransition;

  return (
    <section
      id="story-experience"
      ref={containerRef}
      className="relative w-full h-[100svh] bg-[#0d0408] text-[#fffdf8]"
      aria-label="Interactive Story Experience"
    >
      <style>{`@keyframes cinematicQuoteIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .cinematic-quote-enter { animation: cinematicQuoteIn 0.3s ease both; } .storm-tint { background: radial-gradient(ellipse at 50% 20%, rgba(30,41,59,0.55) 0%, rgba(13,4,8,0.35) 55%, transparent 80%); animation: stormPulse 1.6s ease-in-out infinite; } @keyframes stormPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } } @media (prefers-reduced-motion: reduce) { .storm-tint { animation: none; opacity: 0.7; } }`}</style>
      {/* Sticky Interactive Viewport */}
      <div
        ref={stickyRef}
        className="sticky top-0 w-full h-[100svh] overflow-hidden flex flex-col justify-between select-none"
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
            active={isStorming || isLeavesTransition}
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
        <CinematicBars visible={barsVisible} />

        {/* ================= INTRO PHASE OVERLAY ================= */}
        {introState !== 'EXPERIENCE_UNLOCKED' && (
          <div className={`absolute inset-0 z-40 ${phase !== 'idle' && phase !== 'watering' ? 'pointer-events-none' : 'pointer-events-auto'}`}>
            <Hero onWaterComplete={startAutoGrowth} />
          </div>
        )}

        {/* Optional skip during growth (never starts the storm) */}
        {isGrowing && (
          <button
            type="button"
            onClick={skipGrowth}
            aria-label="Skip growth animation"
            className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 px-6 py-3 min-h-[44px] rounded-full bg-white/10 backdrop-blur-md border border-[#ffd6a5]/50 text-[#fffdf8] font-serif text-base md:text-lg tracking-wide transition-all hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
          >
            Skip growth →
          </button>
        )}

        {/* THE single CTA after the tree is fully grown */}
        {phase === 'stormReady' && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-3 animate-fade-in">
            <button
              type="button"
              onClick={startStorm}
              className="btn-primary font-serif shadow-[0_0_30px_rgba(100,181,246,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
              aria-label="Let the Storm Begin"
            >
              Let the Storm Begin →
            </button>
            <span className="text-sm font-sans tracking-widest uppercase text-[#cfe8ff]/85">
              The wind will carry every leaf
            </span>
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

        {/* Premium cinematic transition into the Destination */}
        <LightTransition play={transitionPlay} onDone={() => setTransitionPlay(false)} />
      </div>
    </section>
  );
};

export default CinematicExperience;
