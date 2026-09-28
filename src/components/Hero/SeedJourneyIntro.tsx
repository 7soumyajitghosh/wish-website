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
  const potRef = useRef<HTMLDivElement>(null);
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
    const handleResize = () => {
      setDims({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = dims.w < 768;
  const groundY = dims.h * (isMobile ? 0.74 : 0.72);
  const baseX = dims.w * (isMobile ? 0.48 : 0.44);
  const seedLandingY = groundY - 4;

  // Dragging offset for watering pot
  const restingPotPos = { x: baseX + 130, y: seedLandingY - 150 };
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [showHelperText, setShowHelperText] = useState(true);

  const potPos = isDragging || isWatering
    ? { x: restingPotPos.x + dragOffset.x, y: restingPotPos.y + dragOffset.y }
    : restingPotPos;

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
    setShowHelperText(false);

    const potEl = potRef.current;

    // Snap the OUTER wrapper above the seed via state (no GSAP x/y fight).
    setDragOffset({
      x: baseX + 35 - restingPotPos.x,
      y: seedLandingY - 110 - restingPotPos.y,
    });

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
        if (!mountedRef.current) return;
        setIntroState('WATERED');
        // Notify parent of watering completion to launch auto-growth
        onWaterCompleteRef.current?.();
      },
    });
    // NOTE: timeline persists (no ctx.revert); killed on unmount via waterTlRef.
  }, [isWatering, baseX, seedLandingY, restingPotPos.x, restingPotPos.y, setIntroState]);

  // Automatic fallback: if the visitor just watches, water after a beat.
  // Manual drag/tap/Enter still wins (hasWateredRef guard inside triggerWatering).
  useEffect(() => {
    if (introState !== 'WATERING') return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (autoWaterRef.current !== null) window.clearTimeout(autoWaterRef.current);
    autoWaterRef.current = window.setTimeout(
      () => triggerWatering(),
      reduced ? 2500 : 6000
    );
    return () => {
      if (autoWaterRef.current !== null) {
        window.clearTimeout(autoWaterRef.current);
        autoWaterRef.current = null;
      }
    };
  }, [introState, triggerWatering]);

  // Pointer drag event handlers for watering pot (mouse + touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (introState !== 'WATERING' || isWatering || hasWateredRef.current) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    dragStartOffsetRef.current = { ...dragOffset };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isWatering || hasWateredRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const newOffsetX = dragStartOffsetRef.current.x + dx;
    const newOffsetY = dragStartOffsetRef.current.y + dy;

    setDragOffset({ x: newOffsetX, y: newOffsetY });

    // Current absolute pot position
    const currentPotX = restingPotPos.x + newOffsetX;
    const currentPotY = restingPotPos.y + newOffsetY;

    // Target zone: pot is dragged near seed landing position
    const distToTarget = Math.hypot(currentPotX - (baseX + 35), currentPotY - (seedLandingY - 110));
    if (distToTarget < 85) {
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
    setIsDragging(false);
  };

  // Keyboard accessibility: space or enter triggers watering
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && introState === 'WATERING') {
      e.preventDefault();
      triggerWatering();
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-20 select-none">
      {/* Quiet caption while the one tree reveals its seed */}
      {(introState === 'SEED_FALLING' || introState === 'SEED_LANDED') && (
        <p
          aria-live="polite"
          className="animate-fade-in pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 font-serif italic text-[#ffd6a5]/90 text-lg whitespace-nowrap"
        >
          A seed takes root…
        </p>
      )}

      {/* INTERACTIVE WATERING CAN — outer wrapper owned by React, inner owned by GSAP */}
      {(introState === 'WATERING' || introState === 'SEED_LANDED') && (
        <div
          className="absolute left-0 top-0 pointer-events-auto"
          style={{
            transform: `translate(${potPos.x}px, ${potPos.y}px)`,
            touchAction: 'none',
          }}
        >
        <div
          ref={potRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={triggerWatering}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Watering can. Drag near the seed or press Enter to water."
          className="cursor-pointer"
          style={{ scale: isDragging ? '1.05' : '1' }}
        >
          {/* Watering Can Visual */}
          <div className="relative group flex flex-col items-center">
            {/* Interaction hint above the can */}
            {showHelperText && (
              <div className="mb-2 px-3 py-1.5 rounded-full bg-[#1c0814]/90 backdrop-blur-md border border-[#a2d2ff]/40 text-[#cfe8ff] text-xs font-sans tracking-wider text-center shadow-lg pointer-events-none animate-pulse">
                Tap the watering can — or just watch
                <span className="block text-[10px] text-[#fffdf8]/70">
                  Drag near the seed, press Enter, or let it happen
                </span>
              </div>
            )}

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
          </div>
        </div>
      )}
    </div>
  );
};

export default SeedJourneyIntro;
