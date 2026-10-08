import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useStory, STAGE_PROGRESS_MAP } from '../../context/StoryContext';
import { soundManager } from '../../audio/soundManager';

export interface SeedJourneyIntroProps {
  onWaterComplete?: () => void;
}

/**
 * SeedJourneyIntro — the interactive half of the opening.
 *
 * There is exactly ONE tree animation on this site: the canvas
 * HeartTreeAnimation behind this overlay. This component renders UI only
 * (watering can + hints) and walks the shared story state
 * (SEED_FALLING → SEED_LANDED → WATERING → WATERED). No second
 * seed / soil / scene is drawn here — the canvas tree carries the moment.
 */
export const SeedJourneyIntro: React.FC<SeedJourneyIntroProps> = ({ onWaterComplete }) => {
  const { introState, setIntroState, setTargetProgress } = useStory();
  const potRef = useRef<HTMLButtonElement>(null);
  const potTlRef = useRef<gsap.core.Tween | null>(null);
  const waterTlRef = useRef<gsap.core.Timeline | null>(null);
  const seedTimeoutRef = useRef<number | null>(null);
  const landedTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const seedStartedRef = useRef(false);

  // Viewport tracking so the watering can rests near the canvas tree base
  // (same layout math as HeartTreeAnimation).
  const [dims, setDims] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1000,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }));

  useEffect(() => {
    let raf = 0;
    const handleResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setDims({
          w: window.innerWidth,
          h: window.innerHeight,
        });
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const isMobile = dims.w < 768;
  const groundY = dims.h * (isMobile ? 0.74 : 0.72);
  const baseX = dims.w * (isMobile ? 0.48 : 0.44);
  const seedLandingY = groundY - 4;

  // Dragging offset for watering pot — ref-driven transform during drag
  // (no per-mousemove React re-render); committed to state on release.
  // Mobile clamp: resting pos must keep the whole can on-screen
  // (baseX + 130 overflowed 320–360px viewports → horizontal scroll).
  const canSize = isMobile ? 80 : 96;
  const restingPotPos = {
    x: Math.min(baseX + 130, Math.max(16, dims.w - canSize - 16)),
    y: seedLandingY - 150,
  };
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const potWrapRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const applyPotTransform = (ox: number, oy: number) => {
    const el = potWrapRef.current;
    if (el) el.style.transform = `translate(${restingPotPos.x + ox}px, ${restingPotPos.y + oy}px)`;
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [showWater, setShowWater] = useState(false);

  // Spout-tip anchored pour: the rose tip sits ~15% across / 68% down the
  // can SVG, so snap the can to place the TIP directly over the seed and let
  // drops fall straight down (no diagonal drift).
  const spoutOff = { x: canSize * 0.15, y: canSize * 0.68 };
  const seedPos = { x: baseX, y: seedLandingY };
  // Outer-wrapper position that puts the spout tip exactly over the seed.
  const pourPos = { x: seedPos.x - spoutOff.x, y: seedLandingY - 110 };

  const potPos = isDragging || isWatering
    ? { x: restingPotPos.x + dragOffset.x, y: restingPotPos.y + dragOffset.y }
    : restingPotPos;

  // Live spout tip (follows the can); fall distance to the seed.
  const waterSpout = { x: potPos.x + spoutOff.x, y: potPos.y + spoutOff.y };
  const waterFallY = Math.max(40, seedPos.y - waterSpout.y);
  const waterDrops = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const isReduced =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Track if action already completed to prevent duplicate triggers
  const hasWateredRef = useRef(false);
  const autoWaterRef = useRef<number | null>(null);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const onWaterCompleteRef = useRef(onWaterComplete);

  useEffect(() => {
    onWaterCompleteRef.current = onWaterComplete;
  }, [onWaterComplete]);

  // Global unmount cleanup: kill tweens + pending timeouts.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      potTlRef.current?.kill();
      waterTlRef.current?.kill();
      potTlRef.current = waterTlRef.current = null;
      if (seedTimeoutRef.current !== null) {
        window.clearTimeout(seedTimeoutRef.current);
        seedTimeoutRef.current = null;
      }
      if (landedTimeoutRef.current !== null) {
        window.clearTimeout(landedTimeoutRef.current);
        landedTimeoutRef.current = null;
      }
      if (autoWaterRef.current !== null) {
        window.clearTimeout(autoWaterRef.current);
        autoWaterRef.current = null;
      }
    };
  }, []);

  // Droplet window: reveal once the can has slid over the seed (CSS 0.5s
  // slide), then hide before the can fades so water never pours from an
  // invisible can. Reduced motion: splash only, no falling drops.
  // No synchronous setState for the reduced-motion path here (cascading
  // render) — the reduced splash is committed directly in triggerWatering.
  useEffect(() => {
    if (!isWatering || isReduced) return;
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        if (mountedRef.current) setShowWater(true);
      }, 400)
    );
    timers.push(
      window.setTimeout(() => {
        if (mountedRef.current) setShowWater(false);
      }, 1750)
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [isWatering, isReduced]);

  // SEED BEAT (runs once). The one canvas tree reveals the seed via its own
  // inertia easing; timers here only walk the intro state forward.
  useEffect(() => {
    if (introState !== 'SEED_FALLING') return;
    if (seedStartedRef.current) return;
    seedStartedRef.current = true;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      soundManager.startAmbient();
    } catch {
      /* noop */
    }

    // Reveal the seed on the single canvas tree.
    setTargetProgress(STAGE_PROGRESS_MAP[2]);

    seedTimeoutRef.current = window.setTimeout(
      () => {
        if (!mountedRef.current) return;
        setIntroState('SEED_LANDED');
        landedTimeoutRef.current = window.setTimeout(
          () => {
            if (!mountedRef.current) return;
            setIntroState('WATERING');
          },
          reduced ? 250 : 1200
        );
      },
      reduced ? 250 : 2600
    );

    return () => {
      if (seedTimeoutRef.current !== null) {
        window.clearTimeout(seedTimeoutRef.current);
        seedTimeoutRef.current = null;
      }
      if (landedTimeoutRef.current !== null) {
        window.clearTimeout(landedTimeoutRef.current);
        landedTimeoutRef.current = null;
      }
    };
  }, [introState, setIntroState, setTargetProgress]);

  // WATERING POT ENTRANCE
  // Ownership split: React style positions the OUTER wrapper; GSAP only
  // animates opacity/scale/rotation on the INNER (potRef) element.
  useEffect(() => {
    if (introState !== 'WATERING') return;

    const potEl = potRef.current;
    if (!potEl) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    potTlRef.current?.kill();
    const tween = gsap.fromTo(
      potEl,
      { opacity: 0, scale: 0.6, rotation: 15 },
      { opacity: 1, scale: 1, rotation: 0, duration: reduced ? 0 : 1.0, ease: 'back.out(1.4)', overwrite: 'auto' }
    );
    potTlRef.current = tween;

    return () => {
      tween.kill();
      if (potTlRef.current === tween) potTlRef.current = null;
    };
  }, [introState]);

  // WATERING EXECUTION TRIGGER — tips the can, chimes, fades it away, then
  // hands the single tree over to auto-growth. Runs exactly once.
  const triggerWatering = useCallback(() => {
    if (hasWateredRef.current || isWatering) return;
    hasWateredRef.current = true;
    setIsWatering(true);
    setIsDragging(false);
    // Reduced motion: splash renders immediately (no droplet timers).
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setShowWater(true);
    }

    const potEl = potRef.current;

    // Slide the OUTER wrapper so the SPOUT TIP lands directly over the seed
    // (vertical pour — no teleport pop, CSS transition animates it).
    const targetOff = {
      x: pourPos.x - restingPotPos.x,
      y: pourPos.y - restingPotPos.y,
    };
    dragOffsetRef.current = targetOff;
    setDragOffset(targetOff);

    try {
      soundManager.playBloomChime();
    } catch {
      /* noop */
    }

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    waterTlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    waterTlRef.current = tl;

    if (!potEl) {
      setIntroState('WATERED');
      onWaterCompleteRef.current?.();
      return;
    }

    // Tip the watering can forward to pour (small tilt as feedback).
    tl.to(potEl, {
      rotation: -12,
      duration: reduced ? 0 : 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    // Restore pot rotation and gently fade away
    tl.to(
      potEl,
      {
        rotation: 0,
        duration: reduced ? 0 : 0.5,
        ease: 'power1.out',
        overwrite: 'auto',
      },
      reduced ? 0 : '+=0.6'
    );

    tl.to(potEl, {
      opacity: 0,
      scale: 0.7,
      duration: reduced ? 0 : 0.6,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        if (waterTlRef.current === tl) waterTlRef.current = null;
        if (!mountedRef.current) return;
        setIntroState('WATERED');
        // Notify parent of watering completion to launch auto-growth
        onWaterCompleteRef.current?.();
      },
    });
    // NOTE: timeline persists (no ctx.revert); killed on unmount via waterTlRef.
  }, [isWatering, pourPos.x, pourPos.y, restingPotPos.x, restingPotPos.y, setIntroState]);

  // Stable ref to the trigger: its identity changes on every viewport
  // resize (pour/resting positions), which must NOT reset the auto timer.
  const triggerWateringRef = useRef(triggerWatering);
  useEffect(() => {
    triggerWateringRef.current = triggerWatering;
  }, [triggerWatering]);

  // Automatic fallback: if the visitor just watches, water after a beat.
  // Manual drag/tap/Enter still wins (hasWateredRef guard inside triggerWatering).
  // Runs once per WATERING entry — resizes don't restart the countdown.
  useEffect(() => {
    if (introState !== 'WATERING') return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (autoWaterRef.current !== null) window.clearTimeout(autoWaterRef.current);
    autoWaterRef.current = window.setTimeout(
      () => triggerWateringRef.current(),
      reduced ? 2500 : 6000
    );
    return () => {
      if (autoWaterRef.current !== null) {
        window.clearTimeout(autoWaterRef.current);
        autoWaterRef.current = null;
      }
    };
  }, [introState]);

  // Pointer drag event handlers for watering pot (mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (introState !== 'WATERING' || isWatering || hasWateredRef.current) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    // Sync ref with state at drag start (state holds last committed offset).
    dragOffsetRef.current = { ...dragOffset };
    dragStartOffsetRef.current = { ...dragOffset };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isWatering || hasWateredRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const newOffsetX = dragStartOffsetRef.current.x + dx;
    const newOffsetY = dragStartOffsetRef.current.y + dy;

    // Ref-driven move: no re-render while dragging.
    dragOffsetRef.current = { x: newOffsetX, y: newOffsetY };
    applyPotTransform(newOffsetX, newOffsetY);

    // Current absolute pot position
    const currentPotX = restingPotPos.x + newOffsetX;
    const currentPotY = restingPotPos.y + newOffsetY;

    // Target zone: pot is dragged so its spout tip lands over the seed.
    const distToTarget = Math.hypot(currentPotX - pourPos.x, currentPotY - pourPos.y);
    if (distToTarget < 85) {
      setDragOffset({ ...dragOffsetRef.current });
      triggerWatering();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    try {
      target.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    // Commit final offset to state so resting position persists.
    setDragOffset({ ...dragOffsetRef.current });
    setIsDragging(false);
  };

  // Keyboard accessibility: space or enter triggers watering, Escape
  // cancels an in-progress drag (can snaps back to its pre-drag spot).
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && introState === 'WATERING') {
      e.preventDefault();
      triggerWatering();
    } else if (e.key === 'Escape' && isDragging) {
      e.preventDefault();
      dragOffsetRef.current = { ...dragStartOffsetRef.current };
      applyPotTransform(dragOffsetRef.current.x, dragOffsetRef.current.y);
      setDragOffset({ ...dragOffsetRef.current });
      setIsDragging(false);
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-20 select-none">
      {/* captions removed */}

      {/* INTERACTIVE WATERING CAN — outer wrapper owned by React, inner owned by GSAP */}
      {(introState === 'WATERING' || introState === 'SEED_LANDED') && (
        <div
          ref={potWrapRef}
          className="absolute left-0 top-0 pointer-events-auto"
          style={{
            transform: `translate(${potPos.x}px, ${potPos.y}px)`,
            touchAction: 'none',
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
        <button
          ref={potRef}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={triggerWatering}
          onKeyDown={handleKeyDown}
          aria-label="Water the seed to help it grow"
          aria-disabled={isWatering}
          className="cursor-pointer bg-transparent border-0 p-2 -m-2 focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-4 rounded-full"
          style={{ scale: isDragging ? '1.05' : '1' }}
        >
          {/* Watering Can Visual */}
          <div className="relative group flex flex-col items-center">

            {/* Watering can SVG — body, top opening, handle, spout + rose head */}
            <div className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_4px_16px_rgba(100,181,246,0.45)]">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
                {/* spout: tapered arm from body down to the rose */}
                <path
                  d="M 38 58 L 20 66 L 18 60 L 36 52 Z"
                  fill="#9fd3dd"
                  stroke="#14313b"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* rose head */}
                <rect x="10" y="56" width="11" height="12" rx="3" fill="#7fb9c6" stroke="#14313b" strokeWidth="2.5" />
                <circle cx="13.5" cy="60" r="1" fill="#14313b" />
                <circle cx="17" cy="60" r="1" fill="#14313b" />
                <circle cx="13.5" cy="64" r="1" fill="#14313b" />
                <circle cx="17" cy="64" r="1" fill="#14313b" />

                {/* body */}
                <path
                  d="M 38 34 L 66 34 L 70 78 Q 70 84 64 84 L 40 84 Q 34 84 34 78 Z"
                  fill="#9fd3dd"
                  stroke="#14313b"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {/* top rim + opening */}
                <ellipse cx="52" cy="34" rx="14" ry="5" fill="#bfe6ee" stroke="#14313b" strokeWidth="2.5" />
                <ellipse cx="52" cy="34" rx="9" ry="3" fill="#1f7d99" />

                {/* handle */}
                <path
                  d="M 68 40 C 86 40, 88 66, 70 70"
                  fill="none"
                  stroke="#9fd3dd"
                  strokeWidth="6"
                  strokeLinecap="round"
                />

                {/* heart emblem */}
                <path
                  d="M 52 60 C 50 57, 46.5 57, 46.5 60 C 46.5 63, 52 66.5, 52 67.2 C 52 66.5, 57.5 63, 57.5 60 C 57.5 57, 54 57, 52 60 Z"
                  fill="#fffdf8"
                  opacity="0.92"
                />
              </svg>
            </div>
          </div>
          </button>
        </div>
      )}

      {/* WATER DROP ANIMATION — straight vertical pour, spout tip over seed */}
      {isWatering && showWater && (
        <>
          {/* Falling droplets + stream: vertical, from spout tip to seed */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0"
            style={{ transform: `translate(${waterSpout.x}px, ${waterSpout.y}px)` }}
          >
            {/* Thin continuous stream, exactly spout → seed */}
            {!isReduced && (
              <div
                className="absolute top-0"
                style={{
                  left: -1.5,
                  width: 3,
                  height: waterFallY,
                  background: 'linear-gradient(180deg, rgba(162,210,255,0) 0%, rgba(162,210,255,0.7) 40%, rgba(74,168,255,0.7) 100%)',
                  borderRadius: 999,
                  animation: 'water-stream-flow 0.7s ease infinite',
                }}
              />
            )}
            {!isReduced &&
              waterDrops.map((i) => (
                <span
                  key={i}
                  className="water-drop"
                  style={{
                    left: (i % 5) * 3 - 6,
                    animationDelay: `${i * 0.08}s`,
                    animationDuration: '0.7s',
                    ['--fall' as string]: `${waterFallY}px`,
                  }}
                />
              ))}
          </div>

          {/* Splash + soak glow exactly on the seed */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0"
            style={{ transform: `translate(${seedPos.x}px, ${seedPos.y}px)` }}
          >
            {/* Wet soil darkening */}
            <div
              className="absolute animate-fade-in"
              style={{
                left: 0,
                top: -3,
                width: 56,
                height: 14,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(ellipse at center, rgba(20,60,110,0.55) 0%, rgba(20,60,110,0) 70%)',
                borderRadius: '50%',
              }}
            />
            {/* Soak pulse */}
            <div
              className="absolute seed-soak-pulse"
              style={{
                left: 0,
                top: -6,
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(162,210,255,0.85) 0%, rgba(74,168,255,0.35) 45%, transparent 70%)',
                animation: 'seed-soak-pulse 1.1s ease-in-out infinite',
              }}
            />
            {/* Expanding splash rings */}
            {[0, 1].map((r) => (
              <div
                key={r}
                className="absolute water-splash-ring"
                style={{
                  left: 0,
                  top: -2,
                  width: 42,
                  height: 12,
                  borderRadius: '50%',
                  border: '2px solid rgba(186,225,255,0.9)',
                  animation: `water-splash-ring 0.9s ease-out ${r * 0.45}s infinite`,
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SeedJourneyIntro;
