import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';
import { soundManager } from '../../audio/soundManager';

interface Particle {
  id: number;
  x: number;
  y: number;
  r: number;
  alpha: number;
  speedY: number;
  speedX: number;
}

interface WaterDrop {
  id: number;
  x: number;
  y: number;
  length: number;
  speed: number;
}

export interface SeedJourneyIntroProps {
  onWaterComplete?: () => void;
}

export const SeedJourneyIntro: React.FC<SeedJourneyIntroProps> = ({ onWaterComplete }) => {
  const { introState, setIntroState } = useStory();
  const containerRef = useRef<HTMLDivElement>(null);
  const seedGroupRef = useRef<SVGGElement>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const soilRef = useRef<SVGPathElement>(null);
  const auraRef = useRef<SVGCircleElement>(null);
  const seedTlRef = useRef<gsap.core.Timeline | null>(null);
  const potTlRef = useRef<gsap.core.Tween | gsap.core.Timeline | null>(null);
  const waterTlRef = useRef<gsap.core.Timeline | null>(null);
  const seedTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const seedStartedRef = useRef(false);

  // Viewport tracking for seamless alignment with HeartTreeAnimation
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
  const [waterDrops, setWaterDrops] = useState<WaterDrop[]>([]);
  const [showHelperText, setShowHelperText] = useState(true);

  const potPos = isDragging || isWatering
    ? { x: restingPotPos.x + dragOffset.x, y: restingPotPos.y + dragOffset.y }
    : restingPotPos;

  // Track if action already completed to prevent duplicate triggers
  const hasWateredRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef({ x: 0, y: 0 });
  const onWaterCompleteRef = useRef(onWaterComplete);

  useEffect(() => {
    onWaterCompleteRef.current = onWaterComplete;
  }, [onWaterComplete]);

  // Global unmount cleanup: kill timelines/tweens + pending timeout.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      seedTlRef.current?.kill();
      potTlRef.current?.kill();
      waterTlRef.current?.kill();
      seedTlRef.current = potTlRef.current = waterTlRef.current = null;
      if (seedTimeoutRef.current !== null) {
        window.clearTimeout(seedTimeoutRef.current);
        seedTimeoutRef.current = null;
      }
    };
  }, []);

  // Floating sparkle embers initialized directly in state
  const [sparkles, setSparkles] = useState<Particle[]>(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 300,
      r: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.7 + 0.3,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.25,
    }))
  );

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const interval = setInterval(() => {
      setSparkles((prev) =>
        prev.map((p) => {
          let nextY = p.y + p.speedY;
          let nextX = p.x + p.speedX;
          if (nextY < -280) nextY = 80;
          if (nextX < -200 || nextX > 200) nextX = (Math.random() - 0.5) * 360;
          return { ...p, x: nextX, y: nextY };
        })
      );
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // SEED FALLING ANIMATION (runs once per introState; resize must not restart it)
  useEffect(() => {
    if (introState !== 'SEED_FALLING') return;
    if (seedStartedRef.current) return;
    seedStartedRef.current = true;

    const seedEl = seedGroupRef.current;
    if (!seedEl) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      soundManager.startAmbient();
    } catch {
      /* noop */
    }

    // Scene 1 — wind-carried seed: curved flight from off-screen (physical, not linear)
    const startX = reduced ? 0 : -dims.w * 0.42;
    const startY = reduced ? 0 : -dims.h * 0.52;
    gsap.set(seedEl, {
      y: startY,
      x: startX,
      scale: reduced ? 1 : 0.85,
      opacity: reduced ? 1 : 0,
      rotation: reduced ? 0 : -42,
      scaleX: 1,
      scaleY: 1,
      filter: 'blur(0px)',
    });

    if (reduced) {
      if (soilRef.current) gsap.set(soilRef.current, { fill: '#240b19' });
      setIntroState('SEED_LANDED');
      if (seedTimeoutRef.current !== null) window.clearTimeout(seedTimeoutRef.current);
      seedTimeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setIntroState('WATERING');
      }, 250);
      return;
    }

    seedTlRef.current?.kill();
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        if (!mountedRef.current) return;
        setIntroState('SEED_LANDED');
        if (seedTimeoutRef.current !== null) window.clearTimeout(seedTimeoutRef.current);
        seedTimeoutRef.current = window.setTimeout(() => {
          if (!mountedRef.current) return;
          setIntroState('WATERING');
        }, 250);
      },
    });
    seedTlRef.current = tl;

      // Wind-blown curved trajectory: gust in → ride the wind → settle.
      // Acceleration/deceleration + rotation + scale + faint motion blur.
      tl.to(seedEl, {
        opacity: 1,
        duration: 0.45,
        ease: 'power1.out',
      })
        .to(
          seedEl,
          {
            x: startX * 0.45,
            y: startY * 0.55,
            rotation: -18,
            scale: 1.06,
            filter: 'blur(2px)',
            duration: 0.9,
            ease: 'power2.out',
          },
          0
        )
        .to(
          seedEl,
          {
            x: startX * 0.08,
            y: startY * 0.18,
            rotation: 10,
            scale: 1.0,
            filter: 'blur(0px)',
            duration: 0.9,
            ease: 'sine.inOut',
          },
          0.9
        )
        .to(
          seedEl,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.5,
            ease: 'power2.in',
          },
          1.8
        )
        // Impact squash and stretch on soil landing
        .to(seedEl, {
          scaleY: 0.7,
          scaleX: 1.35,
          duration: 0.12,
          ease: 'power2.out',
        })
        .to(seedEl, {
          scaleY: 1.08,
          scaleX: 0.94,
          y: -8,
          duration: 0.22,
          ease: 'sine.out',
        })
        .to(seedEl, {
          scaleY: 1,
          scaleX: 1,
          y: 0,
          duration: 0.35,
          ease: 'bounce.out',
        });

      // Gentle soil ripple response (timed to the new ~3.3s landing)
      if (soilRef.current) {
        tl.to(
          soilRef.current,
          {
            fill: '#240b19',
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            overwrite: 'auto',
          },
          3.2
        );
      }

    // NOTE: intentionally no ctx.revert() here — revert would wipe the
    // landed end-state. Timeline is killed on unmount via seedTlRef.
    // dims.h excluded from deps (via seedStartedRef guard) so resize doesn't restart the fall.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [introState, setIntroState]);

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

  // WATERING EXECUTION TRIGGER
  // React owns pot position (outer wrapper); GSAP only tweens inner rotation/opacity/scale.
  const triggerWatering = useCallback(() => {
    if (hasWateredRef.current || isWatering) return;
    hasWateredRef.current = true;
    setIsWatering(true);
    setIsDragging(false);
    setShowHelperText(false);

    const potEl = potRef.current;
    if (!potEl) return;

    // Snap the OUTER wrapper above the seed via state (no GSAP x/y fight).
    setDragOffset({
      x: baseX + 35 - restingPotPos.x,
      y: seedLandingY - 110 - restingPotPos.y,
    });

    waterTlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    waterTlRef.current = tl;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Oscillate the sprinkler arm (small wiggle — it is a sprinkler, not a pot)
    tl.to(potEl, {
      rotation: -12,
      duration: reduced ? 0 : 0.6,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    // Spurt water droplets
    tl.call(() => {
      if (!mountedRef.current) return;
      const drops: WaterDrop[] = Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 14,
        y: Math.random() * 22,
        length: Math.random() * 10 + 6,
        speed: Math.random() * 2 + 3,
      }));
      setWaterDrops(drops);

      try {
        soundManager.playBloomChime();
      } catch {
        /* noop */
      }
    });

    // Pulse seed as it drinks water + glow the aura circle (no filter tween)
    // Reduced motion: skip yoyo pulse, jump to end state.
    const seedEl = seedGroupRef.current;
    if (seedEl) {
      if (reduced) {
        tl.set(seedEl, { scale: 1 });
      } else {
        tl.to(
          seedEl,
          {
            scale: 1.25,
            duration: 0.9,
            ease: 'sine.inOut',
            repeat: 1,
            yoyo: true,
            overwrite: 'auto',
          },
          '+=0.3'
        );
      }
    }
    if (auraRef.current) {
      if (reduced) {
        tl.set(auraRef.current, { opacity: 0.9 });
      } else {
        tl.fromTo(
          auraRef.current,
          { opacity: 0.25 },
          { opacity: 0.9, duration: 0.9, ease: 'sine.inOut', repeat: 1, yoyo: true, overwrite: 'auto' },
          '<'
        );
      }
    }

    // Soil reacts subtly: darkens with moisture
    if (soilRef.current) {
      tl.to(
        soilRef.current,
        {
          fill: '#2e0f21',
          duration: reduced ? 0 : 1.2,
          overwrite: 'auto',
        },
        reduced ? 0 : '+=0.1'
      );
    }

    // Restore pot rotation and gently fade away
    tl.to(
      potEl,
      {
        rotation: 0,
        duration: reduced ? 0 : 0.5,
        ease: 'power1.out',
        overwrite: 'auto',
      },
      reduced ? 0 : '+=1.0'
    );

    tl.to(potEl, {
      opacity: 0,
      scale: 0.7,
      duration: reduced ? 0 : 0.6,
      ease: 'power2.in',
      overwrite: 'auto',
      onComplete: () => {
        if (!mountedRef.current) return;
        setWaterDrops([]);
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
    const t = window.setTimeout(
      () => triggerWatering(),
      reduced ? 2500 : 6000
    );
    return () => window.clearTimeout(t);
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
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-20 select-none"
    >
      {/* Interactive SVG Canvas Area strictly matched to viewport & canvas tree */}
      <svg
        viewBox={`0 0 ${dims.w} ${dims.h}`}
        className="w-full h-full overflow-visible pointer-events-none"
        aria-label="Love Seed Journey"
      >
        <defs>
          {/* Glowing Ruby Seed Gradient */}
          <radialGradient id="seedGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffb3c1" />
            <stop offset="45%" stopColor="#ff4d6d" />
            <stop offset="90%" stopColor="#800f2f" />
            <stop offset="100%" stopColor="#590d22" />
          </radialGradient>

          {/* Soft Filter for Seed Glow */}
          <filter id="seedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Floating Sparkle Embers */}
        <g className="sparkles-layer">
          {sparkles.map((p) => (
            <circle
              key={p.id}
              cx={baseX + p.x}
              cy={seedLandingY - 60 + p.y}
              r={p.r}
              fill="#fff8e7"
              opacity={p.alpha * 0.75}
              style={{ filter: 'drop-shadow(0 0 4px #ffd166)' }}
            />
          ))}
        </g>

        {/* Soil Ground Mound - mathematically identical to HeartTreeAnimation earth mound */}
        <g id="soil-mound">
          <path
            ref={soilRef}
            d={`M 0 ${groundY + 12} C ${dims.w * 0.28} ${groundY - 14}, ${dims.w * 0.65} ${groundY - 10}, ${dims.w * 1.05} ${groundY + 18} L ${dims.w} ${dims.h} L 0 ${dims.h} Z`}
            fill="#1c0814"
          />

          {/* Warm Golden Soil Rim Line */}
          <path
            d={`M 0 ${groundY + 12} C ${dims.w * 0.28} ${groundY - 14}, ${dims.w * 0.65} ${groundY - 10}, ${dims.w * 1.05} ${groundY + 18}`}
            fill="none"
            stroke="rgba(255, 180, 130, 0.42)"
            strokeWidth="1.8"
          />
        </g>

        {/* THE GLOWING LOVE SEED - Lands precisely at tree base coordinate */}
        <g
          ref={seedGroupRef}
          id="love-seed"
          transform={`translate(${baseX}, ${seedLandingY})`}
          style={{ filter: 'drop-shadow(0 0 14px rgba(255, 77, 109, 0.85))' }}
        >
          {/* Pulsing Aura (GSAP animates opacity — no filter tween) */}
          <circle ref={auraRef} cx="0" cy="0" r="16" fill="rgba(255, 77, 109, 0.2)" />

          {/* Stylized Heart Seed Pod */}
          <path
            d="M 0 14 C -10 5, -14 -4, -12 -11 C -10 -18, -2 -17, 0 -11 C 2 -17, 10 -18, 12 -11 C 14 -4, 10 5, 0 14 Z"
            fill="url(#seedGrad)"
            stroke="#ffccd5"
            strokeWidth="1.2"
          />

          {/* Golden Sprout Point Indicator */}
          <circle cx="0" cy="-11" r="2" fill="#ffd166" />
        </g>

        {/* WIND STREAKS — visible gusts carrying the seed (Scene 1) */}
        {introState === 'SEED_FALLING' && (
          <g className="wind-streaks" opacity="0.7">
            {[
              { x1: -320, y1: -260, x2: -160, y2: -230 },
              { x1: -360, y1: -180, x2: -180, y2: -150 },
              { x1: -300, y1: -100, x2: -140, y2: -80 },
              { x1: -260, y1: -320, x2: -120, y2: -290 },
            ].map((s, i) => (
              <line
                key={i}
                x1={baseX + s.x1}
                y1={seedLandingY + s.y1}
                x2={baseX + s.x2}
                y2={seedLandingY + s.y2}
                stroke="rgba(255,214,180,0.5)"
                strokeWidth="1.6"
                strokeLinecap="round"
                className="wind-streak-line"
                style={{ animationDelay: `${i * 0.25}s` } as React.CSSProperties}
              />
            ))}
          </g>
        )}

        {/* WATER ARC — sprinkler → seed (Scene 3): stream + droplets + splash */}
        {waterDrops.length > 0 && (
          <g className="water-arc-stream">
            <path
              d={`M ${baseX + 8} ${seedLandingY - 96} Q ${baseX - 26} ${seedLandingY - 52}, ${baseX} ${seedLandingY - 8}`}
              fill="none"
              stroke="rgba(162,210,255,0.75)"
              strokeWidth="3"
              strokeLinecap="round"
              className="water-stream-path"
              style={{ filter: 'drop-shadow(0 0 5px #64b5f6)' }}
            />
            {waterDrops.map((d, i) => {
              const t = (i + 1) / (waterDrops.length + 1);
              const sx = baseX + 8;
              const sy = seedLandingY - 96;
              const cx = baseX - 26;
              const cy = seedLandingY - 52;
              const ex = baseX;
              const ey = seedLandingY - 8;
              const mt = 1 - t;
              const px = mt * mt * sx + 2 * mt * t * cx + t * t * ex + d.x * 0.4;
              const py = mt * mt * sy + 2 * mt * t * cy + t * t * ey + (d.y % 8);
              return (
                <circle
                  key={d.id}
                  cx={px}
                  cy={py}
                  r={2.4}
                  fill="#cfe8ff"
                  opacity="0.9"
                  className="water-arc-drop"
                  style={{ animationDelay: `${(i % 9) * 0.09}s`, filter: 'drop-shadow(0 0 3px #64b5f6)' } as React.CSSProperties}
                />
              );
            })}
            {/* splash glow at the seed */}
            <ellipse
              cx={baseX}
              cy={seedLandingY + 2}
              rx="20"
              ry="6"
              fill="rgba(162,210,255,0.35)"
              className="water-splash-glow"
            />
          </g>
        )}
      </svg>
      <style>{`
        .wind-streak-line { animation: windStreak 1.1s ease-in-out infinite; }
        @keyframes windStreak {
          0% { opacity: 0; transform: translateX(-14px); }
          40% { opacity: 0.8; }
          100% { opacity: 0; transform: translateX(26px); }
        }
        .water-stream-path {
          stroke-dasharray: 10 8;
          animation: waterDash 0.6s linear infinite;
        }
        @keyframes waterDash { to { stroke-dashoffset: -18; } }
        .water-arc-drop { animation: dropShimmer 0.8s ease-in-out infinite; }
        @keyframes dropShimmer {
          0%, 100% { opacity: 0.55; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        .water-splash-glow { animation: splashPulse 0.9s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes splashPulse {
          0%, 100% { opacity: 0.35; transform: scaleX(0.9); }
          50% { opacity: 0.8; transform: scaleX(1.15); }
        }
        @media (prefers-reduced-motion: reduce) {
          .wind-streak-line, .water-stream-path, .water-arc-drop, .water-splash-glow { animation: none; }
        }
      `}</style>

      {/* INTERACTIVE GARDEN SPRINKLER — outer wrapper owned by React, inner owned by GSAP */}
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
          aria-label="Garden sprinkler. Drag near the seed or press Enter to water."
          className="cursor-pointer"
          style={{ scale: isDragging ? '1.05' : '1' }}
        >
          {/* Sprinkler Visual */}
          <div className="relative group flex flex-col items-center">
            {/* Interaction hint above sprinkler */}
            {showHelperText && (
              <div className="mb-2 px-3 py-1.5 rounded-full bg-[#1c0814]/90 backdrop-blur-md border border-[#a2d2ff]/40 text-[#cfe8ff] text-xs font-sans tracking-wider text-center shadow-lg pointer-events-none animate-pulse">
                Tap the sprinkler — or just watch
                <span className="block text-[10px] text-[#fffdf8]/70">
                  Drag near the seed, press Enter, or let it happen
                </span>
              </div>
            )}

            {/* Garden sprinkler SVG — brass base, stem, oscillating arm, rose head */}
            <div className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_4px_16px_rgba(100,181,246,0.45)]">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
                <defs>
                  <linearGradient id="sprinklerBrass" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffd166" />
                    <stop offset="45%" stopColor="#e8a04c" />
                    <stop offset="100%" stopColor="#8a5a2b" />
                  </linearGradient>
                  <linearGradient id="sprinklerSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#dff1ff" />
                    <stop offset="100%" stopColor="#64b5f6" />
                  </linearGradient>
                </defs>

                {/* ground spike base */}
                <path d="M 44 92 L 56 92 L 50 100 Z" fill="#8a5a2b" />
                <ellipse cx="50" cy="90" rx="12" ry="4" fill="url(#sprinklerBrass)" />

                {/* vertical stem */}
                <rect x="47.5" y="52" width="5" height="40" rx="2.5" fill="url(#sprinklerSteel)" />

                {/* oscillating arm */}
                <rect x="30" y="48" width="44" height="6" rx="3" fill="url(#sprinklerBrass)" />
                {/* left + right rose heads */}
                <circle cx="28" cy="51" r="5" fill="url(#sprinklerSteel)" stroke="#ffd166" strokeWidth="1.5" />
                <circle cx="72" cy="51" r="5" fill="url(#sprinklerSteel)" stroke="#ffd166" strokeWidth="1.5" />
                {/* mist preview dots */}
                <circle cx="22" cy="46" r="1.4" fill="#cfe8ff" opacity="0.8" />
                <circle cx="18" cy="41" r="1" fill="#cfe8ff" opacity="0.6" />
                <circle cx="78" cy="46" r="1.4" fill="#cfe8ff" opacity="0.8" />
                <circle cx="82" cy="41" r="1" fill="#cfe8ff" opacity="0.6" />

                {/* heart emblem on the base */}
                <path
                  d="M 50 84 C 48 81.5, 45 81.5, 45 84 C 45 86.5, 50 89, 50 89.8 C 50 89, 55 86.5, 55 84 C 55 81.5, 52 81.5, 50 84 Z"
                  fill="#fffdf8"
                  opacity="0.9"
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
