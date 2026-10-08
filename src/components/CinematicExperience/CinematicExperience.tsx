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
  STAGE_PROGRESS_MAP,
} from '../../context/StoryContext';
import { BLOOM_T } from '../HeartTreeAnimation/animation/bloomTimeline';
import { WIND_T } from '../HeartTreeAnimation/animation/windTimeline';
import { FLIGHT_T } from '../HeartTreeAnimation/animation/flightTimeline';
import { rangeProgress } from '../../animation/bezierUtils';

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

export interface CinematicExperienceProps {
  /** Called once the leaf transition has fully completed and the warm
   *  reveal finished — parent must unmount this entire component. */
  onTransitionComplete?: () => void;
}

export const CinematicExperience: React.FC<CinematicExperienceProps> = ({
  onTransitionComplete,
}) => {
  const isAutoGrowingRef = useRef(false);
  const autoGrowthTlRef = useRef<gsap.core.Timeline | null>(null);
  const stormTlRef = useRef<gsap.core.Timeline | null>(null);
  const stormReadyCallRef = useRef<gsap.core.Tween | null>(null);
  const leavesTlRef = useRef<gsap.core.Timeline | null>(null);
  // One-shot guards: growth can only ever run once, storm only once.
  const hasGrownRef = useRef(false);
  const hasStormedRef = useRef(false);
  // Leaves → destination transition must also run exactly once: the storm
  // onComplete is the only caller, but a recreated/resumed timeline must
  // never replay the unlock + light-transition sequence (double scroll,
  // double LightTransition play = the "page loads twice" jump).
  const hasTransitionedRef = useRef(false);
  // Camera (zoom) + black fade are applied straight to the DOM (no re-renders).
  const camRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const {
    introState,
    setIntroState,
    targetProgress,
    setTargetProgress,
    activeTreeQuote,
    setActiveTreeQuote,
    pauseTreeQuote,
    resumeTreeQuote,
  } = useStory();

  const [userWind, setUserWind] = useState(0);
  const [phase, setPhaseState] = useState<FlowPhase>('idle');
  const [transitionPlay, setTransitionPlay] = useState(false);
  const quoteCloseRef = useRef<HTMLButtonElement>(null);
  // One-shot completion guard: onTransitionComplete must fire exactly once
  // so the parent unmounts this landing page a single time.
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onTransitionComplete);
  useEffect(() => {
    onCompleteRef.current = onTransitionComplete;
  }, [onTransitionComplete]);

  const completeIntro = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  }, []);

  // Ref mirror of the phase so long-lived GSAP callbacks always read the
  // current state instead of a stale closure.
  const phaseRef = useRef<FlowPhase>('idle');
  const setPhase = useCallback((next: FlowPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

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

  // Camera zoom + gentle gale sway (direct DOM write — GPU transform, no re-renders).
  // Origin sits at the tree base (~46% x, ~73% y, matching the canvas layout).
  const applyCam = useCallback((z: number, swayX = 0, swayY = 0) => {
    const el = camRef.current;
    if (el) el.style.transform = `scale(${z}) translate(${swayX}px, ${swayY}px)`;
  }, []);

  // Soft warm veil that follows the trailing leaves (direct DOM write).
  // Capped well below full black so the tree stays visible — this is a
  // luminous dusk cover, never a blackout.
  const applyFade = useCallback((o: number) => {
    const el = fadeRef.current;
    if (el) el.style.opacity = String(Math.max(0, Math.min(0.55, o * 0.55)));
  }, []);

  // ---------------------------------------------------------------------
  // LEAVES → DESTINATION
  // Runs only after the storm has fully completed, so nothing is still
  // animating when we move. The black fade covers the cut, then the warm
  // light transition lifts to reveal the Destination.
  // Single-scroll contract: this timeline NEVER scrolls. The intro is still
  // 100vh tall while it runs, so any scrollIntoView here lands ~one viewport
  // too low; after unmount the layout collapses and App must scroll again —
  // that pre-scroll + post-unmount correction is the visible double jump.
  // Instead we stay put under cover and App performs the one post-unmount
  // scroll once the layout is final.
  // ---------------------------------------------------------------------
  const transitionToDestination = useCallback(() => {
    if (hasTransitionedRef.current) return;
    hasTransitionedRef.current = true;
    setPhase('leavesTransition');

    const fadeEl = fadeRef.current;
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        setPhase('destination');
      },
    });
    leavesTlRef.current = tl;

    tl.to(fadeEl, { opacity: 0.6, duration: 0.45, ease: 'power2.in' })
      .call(() => {
        // Unlock first so body can scroll and destination is accessible
        setIntroState('EXPERIENCE_UNLOCKED');
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
      if (now - lastBroadcastTime > 100 || progressObj.p >= BLOOM_T.FULL_BLOOM - 0.001) {
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
    // Roots get an extended hold + slight push-in so the seed/roots
    // beat reads as its own moment before the wide reveal.
    tl.to(progressObj, { p: STAGE_PROGRESS_MAP[3], duration: 4.4, ease: 'power2.out' })
      .to(camObj, {
        z: 1.58,
        duration: 4.4,
        ease: 'sine.inOut',
        overwrite: 'auto',
        onUpdate: () => applyCam(camObj.z),
      }, '<')
      .to({}, { duration: 1.0 })
      .to(camObj, {
        z: 1.0,
        duration: 3.6,
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
    // Reset camera to grown framing — growth zoom would otherwise stick at ~1.2.
    applyCam(1);
    setPhase('grown');
    stormReadyCallRef.current?.kill();
    stormReadyCallRef.current = gsap.delayedCall(0.4, () => {
      if (phaseRef.current === 'grown') setPhase('stormReady');
    });
  }, [setPhase, setTargetProgress, applyCam]);

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
        if (now - lastBroadcastTime > 100 || progressObj.p >= FLIGHT_T.CYCLE_END - 0.01) {
          lastBroadcastTime = now;
          setTargetProgress(progressObj.p);
        }
        // Soft dusk veil following the trailing leaves — never a blackout.
        applyFade(rangeProgress(progressObj.p, FLIGHT_T.DETACH_START + 0.03, FLIGHT_T.CYCLE_END));
      },
      onComplete: () => {
        // Leaves have all flown away — hand off to the Destination.
        setTargetProgress(STAGE_PROGRESS_MAP[16]);
        transitionToDestination();
      },
    });

    // Gale: a slow, barely-there push-in while the leaves detach and fly.
    tl.to(camObj, {
      z: 1.06,
      duration: 6.5,
      ease: 'power1.inOut',
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

  // Clean up every timeline + direct DOM tween on unmount. Unmounting is
  // the actual destruction of the landing page (not opacity/display hacks):
  // child canvases (HeartTree, AmbientField, WindOverlay) clean their own
  // RAF/IO/RO/listeners, leaf particle arrays are dropped with their refs,
  // and temporary transition elements (fade, light veil) go with this tree.
  useEffect(() => {
    // Copy refs for cleanup: accessing ref.current inside the cleanup
    // reads a potentially-changed value (react-hooks/exhaustive-deps).
    const cam = camRef.current;
    const fade = fadeRef.current;
    return () => {
      autoGrowthTlRef.current?.kill();
      autoGrowthTlRef.current = null;
      stormTlRef.current?.kill();
      stormTlRef.current = null;
      stormReadyCallRef.current?.kill();
      stormReadyCallRef.current = null;
      leavesTlRef.current?.kill();
      leavesTlRef.current = null;
      if (cam) gsap.killTweensOf(cam);
      if (fade) gsap.killTweensOf(fade);
    };
  }, []);

  // External unlock (nav / milestones / Escape) bypasses the cinematic, so
  // kill any orphaned timeline and settle the camera instead of leaving the
  // tree frozen mid-growth. Never interrupts an in-flight leaf transition:
  // storm / leavesTransition must run to completion to preserve the leaf
  // flight path, then the normal LightTransition completion destroys us.
  useEffect(() => {
    if (introState !== 'EXPERIENCE_UNLOCKED') return;
    if (
      phaseRef.current === 'storm' ||
      phaseRef.current === 'leavesTransition' ||
      phaseRef.current === 'destination'
    )
      return;
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

  // Background-tab guard: GSAP timers throttle while hidden. Do NOT
  // fast-forward with progress(1) — that skips growth/storm with an abrupt
  // visual jump plus onComplete side effects from a visibility handler.
  // Simply resume; the timelines continue from their current position.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stormTlRef.current?.pause();
        autoGrowthTlRef.current?.pause();
        return;
      }
      stormTlRef.current?.resume();
      autoGrowthTlRef.current?.resume();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // Move focus to the quote's close button when it appears (keyboard/SR users).
  // Never steal focus during the locked leaf transition.
  // When the quote closes (dismiss or 8s auto-dismiss), return focus to the
  // tree so it is never dropped to <body>.
  const quoteWrapRef = useRef<HTMLDivElement>(null);
  const focusTree = useCallback(() => {
    const tree = camRef.current?.querySelector('.heart-tree-wrapper') as HTMLElement | null;
    (tree ?? camRef.current)?.focus({ preventScroll: true });
  }, []);
  const dismissQuote = useCallback(() => {
    setActiveTreeQuote(null);
    focusTree();
  }, [focusTree, setActiveTreeQuote]);
  const prevQuoteRef = useRef(false);
  useEffect(() => {
    if (activeTreeQuote) {
      prevQuoteRef.current = true;
      if (phaseRef.current === 'storm' || phaseRef.current === 'leavesTransition') return;
      quoteCloseRef.current?.focus();
    } else if (prevQuoteRef.current) {
      prevQuoteRef.current = false;
      // Auto-dismiss path: only reclaim focus if it was inside the quote
      // (click-dismiss already moved it via dismissQuote).
      if (quoteWrapRef.current?.contains(document.activeElement)) focusTree();
    }
  }, [activeTreeQuote, focusTree]);

  // Bypass path (Escape / nav unlock without leaves): the leaf timeline never
  // ran, so there is no LightTransition to signal completion. Destroy this
  // landing component on a tick — App scrolls to the pending nav target
  // (or top) only after unmount, when layout is final.
  useEffect(() => {
    if (introState !== 'EXPERIENCE_UNLOCKED') return;
    if (phaseRef.current !== 'destination') return;
    if (transitionPlay) return;
    if (completedRef.current) return;
    // Leaf path already completed via LightTransition — guard above prevents
    // a second call, this only fires for the bypass path.
    if (hasStormedRef.current) return;
    const t = window.setTimeout(() => {
      completeIntro();
    }, 120);
    return () => window.clearTimeout(t);
  }, [introState, phase, transitionPlay, completeIntro]);

  const handleLightDone = useCallback(() => {
    setTransitionPlay(false);
    // Leaf transition reached its final state and the new page is revealed:
    // destroy the entire landing page (parent unmounts us, running all
    // cleanup above — never opacity/visibility/display hacks).
    completeIntro();
  }, [completeIntro]);

  const handleTreeInteract = useCallback((event: TreeInteractionEvent) => {
    setActiveTreeQuote(event);
  }, [setActiveTreeQuote]);

  const handleWindChange = useCallback((strength: number) => {
    setUserWind(strength);
  }, []);

  const isGrowing = phase === 'growing';
  const isStorming = phase === 'storm';
  const isLeavesTransition = phase === 'leavesTransition';
  // Locked during the leaf flight: no canvas drag, no quote interaction,
  // no CTA re-click — the leaves follow their intended path untouched.
  const isTransitionLocked = isStorming || isLeavesTransition;
  const barsVisible =
    introState !== 'EXPERIENCE_UNLOCKED' || isGrowing || isStorming || isLeavesTransition;

  // Quote popup position: viewport-dependent layout must live in state
  // (not read during render) so SSR/first paint never mismatches.
  // rAF-throttled: raw resize fires per pixel, this only positions a popup.
  const [viewportW, setViewportW] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setViewportW(window.innerWidth);
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  const quoteLeft = activeTreeQuote
    ? Math.max(12, Math.min(activeTreeQuote.x - 120, viewportW - Math.min(320, viewportW - 24) - 12))
    : 12;

  return (
    <section
      id="story-experience"
      className="relative w-full h-[100svh] min-h-[100svh] bg-[#0d0408] text-[#fffdf8]"
      aria-label="Interactive Story Experience"
      aria-busy={isTransitionLocked}
    >
      {/* Sticky Interactive Viewport */}
      <div
        className="sticky top-0 w-full h-[100svh] min-h-[100svh] overflow-hidden flex flex-col justify-between select-none"
      >
        {/* Screen-reader stage announcements removed */}

        {/* Heart Tree Canvas — camera wrapper (environmental zoom only).
            Locked (pointer-events-none + inert canvas) during leaf flight so
            drag-wind can't perturb the intended leaf path. */}
        <div
          ref={camRef}
          tabIndex={-1}
          className={`absolute inset-0 z-0 will-change-transform outline-none ${isTransitionLocked ? 'pointer-events-none' : ''}`}
          style={{ transformOrigin: '46% 73%' }}
          aria-hidden={isTransitionLocked}
        >
          <div className="h-full w-full" inert={isTransitionLocked ? true : undefined}>
            <HeartTreeAnimation
              targetProgress={targetProgress}
              onTreeInteract={isTransitionLocked ? undefined : handleTreeInteract}
              onWindChange={handleWindChange}
            />
          </div>
        </div>

        {/* Soft vignette — kept light so the storm never goes dark */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(26,8,18,0.42)_100%)] z-10" />

        {/* Living sky — warm gale glow that brightens (never darkens) with the story */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[4] transition-opacity duration-1000"
          style={{
            opacity: targetProgress > BLOOM_T.BUDS_START ? 1 : 0,
            background:
              targetProgress >= WIND_T.WIND_PEAK
                ? 'radial-gradient(ellipse at 50% 42%, rgba(255,206,160,0.20) 0%, rgba(255,143,163,0.09) 45%, transparent 65%)'
                : 'radial-gradient(ellipse at 50% 35%, rgba(255,179,193,0.18) 0%, transparent 60%)',
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
            strength={isStorming ? 1.5 : 1 + Math.abs(userWind) * 0.15}
          />
        </div>

        {/* Natural storm sky — soft cloud masses drifting past (no sun added) */}
        {isStorming && (
          <div aria-hidden="true" className="storm-clouds pointer-events-none absolute inset-0 z-[7]" />
        )}

        {/* Warm dusk veil following the trailing leaves (never full black) */}
        <div
          ref={fadeRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[45]"
          style={{
            opacity: 0,
            background:
              'linear-gradient(180deg, rgba(58,22,36,0.85) 0%, rgba(42,14,30,0.75) 45%, rgba(26,8,18,0.9) 100%)',
          }}
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
            className="absolute bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 z-40 px-5 sm:px-6 py-3 min-h-[44px] rounded-full bg-[#1a0812]/85 backdrop-blur-md border border-[#ffb3c1]/40 text-[#fffdf8] font-serif tracking-wide transition-all hover:bg-[#250b18]/90 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 whitespace-nowrap max-w-[calc(100vw-2rem)] text-sm sm:text-base md:text-lg"
          >
            Skip growth →
          </button>
        )}

        {/* Growth focus captions removed */}

        {/* THE single CTA after the tree is fully grown.
            One-shot + locked: hasStormedRef guard prevents re-entry, and the
            CTA unmounts the moment the leaf flight starts so it cannot be
            clicked multiple times during the transition. */}
        {phase === 'stormReady' && (
          <div className="absolute bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 pointer-events-auto flex flex-col items-center gap-3 animate-fade-in w-max max-w-[calc(100vw-2rem)] px-2 text-center">
            <button
              type="button"
              onClick={startStorm}
              className="btn-primary font-serif shadow-[0_0_30px_rgba(216,27,70,0.6)] focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Let the Storm Begin"
            >
              Let the Storm Begin →
            </button>
            <span className="text-xs sm:text-sm font-sans tracking-widest uppercase text-[#ffd6a5] px-2">
              The wind will carry every leaf
            </span>
          </div>
        )}

        {/* ================= FLOATING TREE REFLECTION QUOTE =================
            Kept visible during the locked leaf flight (no visual pop) but
            fully non-interactive via inert + pointer-events-none. */}
        {activeTreeQuote && (
          <div
            ref={quoteWrapRef}
            role="status"
            inert={isTransitionLocked ? true : undefined}
            aria-hidden={isTransitionLocked}
            onMouseEnter={isTransitionLocked ? undefined : pauseTreeQuote}
            onMouseLeave={isTransitionLocked ? undefined : resumeTreeQuote}
            onFocus={isTransitionLocked ? undefined : pauseTreeQuote}
            onBlur={isTransitionLocked ? undefined : resumeTreeQuote}
            className={`absolute z-50 w-[min(20rem,calc(100vw-2.5rem))] max-w-xs md:max-w-sm max-h-[60vh] overflow-y-auto p-4 rounded-2xl bg-[#1f0915]/90 backdrop-blur-md border border-[#ffb3c1]/40 shadow-[0_10px_30px_rgba(0,0,0,0.6)] cinematic-quote-enter ${isTransitionLocked ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{
              left: `${quoteLeft}px`,
              width: 'min(20rem, calc(100vw - 2.5rem))',
              top: `${activeTreeQuote ? Math.max(activeTreeQuote.y - 90, 40) : 40}px`,
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
                onClick={dismissQuote}
                className="text-[#fff8eb]/85 hover:text-[#fffdf8] text-xs cursor-pointer min-w-[44px] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[#ffd6a5] rounded"
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

        {/* Premium cinematic transition into the Destination.
            When it completes, the landing page is destroyed (unmounted). */}
        <LightTransition play={transitionPlay} onDone={handleLightDone} />
      </div>
    </section>
  );
};

export default CinematicExperience;
