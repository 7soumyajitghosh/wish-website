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

export const SeedJourneyIntro: React.FC = () => {
  const { introState, setIntroState } = useStory();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const seedGroupRef = useRef<SVGGElement>(null);
  const potRef = useRef<HTMLDivElement>(null);
  const soilRef = useRef<SVGPathElement>(null);

  // Dragging state for watering pot
  const [potPos, setPotPos] = useState({ x: 130, y: -160 });
  const [isDragging, setIsDragging] = useState(false);
  const [isWatering, setIsWatering] = useState(false);
  const [waterDrops, setWaterDrops] = useState<WaterDrop[]>([]);
  const [sparkles, setSparkles] = useState<Particle[]>([]);
  const [showHelperText, setShowHelperText] = useState(true);

  // Track if action already completed to prevent duplicate triggers
  const hasWateredRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const potStartPosRef = useRef({ x: 0, y: 0 });

  // Floating sparkle embers around the scene
  useEffect(() => {
    const items: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 460,
      y: (Math.random() - 0.5) * 380,
      r: Math.random() * 1.8 + 0.6,
      alpha: Math.random() * 0.7 + 0.3,
      speedY: -(Math.random() * 0.4 + 0.1),
      speedX: (Math.random() - 0.5) * 0.25,
    }));
    setSparkles(items);

    const interval = setInterval(() => {
      setSparkles((prev) =>
        prev.map((p) => {
          let nextY = p.y + p.speedY;
          let nextX = p.x + p.speedX;
          if (nextY < -320) nextY = 80;
          if (nextX < -230 || nextX > 230) nextX = (Math.random() - 0.5) * 400;
          return { ...p, x: nextX, y: nextY };
        })
      );
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // STEP 3: SEED FALLING ANIMATION
  useEffect(() => {
    if (introState !== 'SEED_FALLING') return;

    const ctx = gsap.context(() => {
      const seedEl = seedGroupRef.current;
      if (!seedEl) return;

      // Start sound if user previously engaged
      try {
        soundManager.startAmbient();
      } catch {
        /* noop */
      }

      gsap.set(seedEl, {
        y: -360,
        x: 0,
        scale: 0.6,
        opacity: 0,
        rotation: -12,
      });

      const tl = gsap.timeline({
        onComplete: () => {
          setIntroState('SEED_LANDED');
          setTimeout(() => {
            setIntroState('WATERING');
          }, 300);
        },
      });

      // Gentle floating descent with subtle organic sway
      tl.to(seedEl, {
        opacity: 1,
        duration: 0.4,
        ease: 'power1.out',
      })
        .to(
          seedEl,
          {
            x: 18,
            rotation: 8,
            duration: 0.7,
            ease: 'sine.inOut',
          },
          0
        )
        .to(
          seedEl,
          {
            x: -12,
            rotation: -6,
            duration: 0.7,
            ease: 'sine.inOut',
          },
          0.7
        )
        .to(
          seedEl,
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1.8,
            ease: 'power2.in',
          },
          0
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
          y: -10,
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

      // Gentle soil ripple response
      if (soilRef.current) {
        tl.to(
          soilRef.current,
          {
            fill: '#240b19',
            duration: 0.3,
            yoyo: true,
            repeat: 1,
          },
          1.8
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [introState, setIntroState]);

  // STEP 4: WATERING POT ENTRANCE
  useEffect(() => {
    if (introState !== 'WATERING') return;

    const ctx = gsap.context(() => {
      const potEl = potRef.current;
      if (!potEl) return;

      gsap.fromTo(
        potEl,
        {
          opacity: 0,
          scale: 0.6,
          x: 180,
          y: -180,
          rotation: 15,
        },
        {
          opacity: 1,
          scale: 1,
          x: 130,
          y: -150,
          rotation: 0,
          duration: 1.1,
          ease: 'back.out(1.4)',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [introState]);

  // WATERING EXECUTION TRIGGER
  const triggerWatering = useCallback(() => {
    if (hasWateredRef.current || isWatering) return;
    hasWateredRef.current = true;
    setIsWatering(true);
    setIsDragging(false);
    setShowHelperText(false);

    const potEl = potRef.current;
    if (!potEl) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Smoothly snap pot above seed and tilt
      tl.to(potEl, {
        x: 35,
        y: -110,
        rotation: -38,
        duration: 0.6,
        ease: 'power2.out',
      });

      // Spurt water droplets
      tl.call(() => {
        const drops: WaterDrop[] = Array.from({ length: 18 }, (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 12,
          y: Math.random() * 20,
          length: Math.random() * 10 + 6,
          speed: Math.random() * 2 + 3,
        }));
        setWaterDrops(drops);

        // Sound chime
        try {
          soundManager.playBloomChime();
        } catch {
          /* noop */
        }
      });

      // Pulse seed as it drinks water
      const seedEl = seedGroupRef.current;
      if (seedEl) {
        tl.to(
          seedEl,
          {
            scale: 1.25,
            filter: 'drop-shadow(0 0 20px rgba(255, 105, 180, 0.95))',
            duration: 0.9,
            ease: 'sine.inOut',
            repeat: 1,
            yoyo: true,
          },
          '+=0.3'
        );
      }

      // Soil reacts subtly: darkens with moisture & emits warmth
      if (soilRef.current) {
        tl.to(
          soilRef.current,
          {
            fill: '#2e0f21',
            duration: 1.2,
          },
          '+=0.1'
        );
      }

      // Restore pot rotation and gently fade away
      tl.to(potEl, {
        rotation: 0,
        y: -140,
        duration: 0.5,
        ease: 'power1.out',
      }, '+=1.0');

      tl.to(potEl, {
        opacity: 0,
        scale: 0.7,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          setWaterDrops([]);
          setIntroState('WATERED');
          setTimeout(() => {
            setIntroState('ROOT_GROWTH');
          }, 300);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isWatering, setIntroState]);

  // Pointer drag event handlers for watering pot
  const handlePointerDown = (e: React.PointerEvent) => {
    if (introState !== 'WATERING' || isWatering || hasWateredRef.current) return;
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    setIsDragging(true);
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
    potStartPosRef.current = { ...potPos };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isWatering || hasWateredRef.current) return;
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const newX = potStartPosRef.current.x + dx;
    const newY = potStartPosRef.current.y + dy;

    setPotPos({ x: newX, y: newY });

    // Check proximity to the seed (seed is at x: 0, y: 0)
    // Target zone: pot is above seed (x between -60 and 80, y between -160 and -50)
    if (newX >= -60 && newX <= 90 && newY >= -170 && newY <= -50) {
      triggerWatering();
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Keyboard accessibility: space or enter triggers watering
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && introState === 'WATERING') {
      e.preventDefault();
      triggerWatering();
    }
  };

  // STEP 6 & STEP 7: ROOTS FIRST, THEN STEM, BRANCHES & TREE GROWTH
  useEffect(() => {
    if (introState !== 'ROOT_GROWTH') return;

    const ctx = gsap.context(() => {
      const rootPaths = containerRef.current?.querySelectorAll<SVGPathElement>('.intro-root-path');
      const stemPath = containerRef.current?.querySelector<SVGPathElement>('.intro-stem-path');
      const branchPaths = containerRef.current?.querySelectorAll<SVGPathElement>('.intro-branch-path');
      const heartLeaves = containerRef.current?.querySelectorAll<SVGElement>('.intro-heart-leaf');
      const auraEl = containerRef.current?.querySelector('.intro-tree-aura');

      const tl = gsap.timeline({
        onComplete: () => {
          setIntroState('EXPERIENCE_UNLOCKED');
          try {
            soundManager.playBloomChime();
          } catch {
            /* noop */
          }
        },
      });

      // Prepare SVG path strokes for drawing animation
      rootPaths?.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 1,
        });
      });

      if (stemPath) {
        const len = stemPath.getTotalLength();
        gsap.set(stemPath, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 1,
        });
      }

      branchPaths?.forEach((path) => {
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: 1,
        });
      });

      if (heartLeaves) {
        gsap.set(heartLeaves, {
          scale: 0,
          transformOrigin: 'center center',
          opacity: 0,
        });
      }

      // SEQUENCE STEP 6: ROOTS GROW FIRST INTO THE SOIL
      // Taproot draws deep into the earth
      if (rootPaths && rootPaths[0]) {
        tl.to(rootPaths[0], {
          strokeDashoffset: 0,
          duration: 1.4,
          ease: 'power1.inOut',
        });
      }

      // Lateral roots branch out into the soil
      if (rootPaths && rootPaths.length > 1) {
        const lateralRoots = Array.from(rootPaths).slice(1);
        tl.to(
          lateralRoots,
          {
            strokeDashoffset: 0,
            duration: 1.5,
            stagger: 0.12,
            ease: 'power1.out',
          },
          '-=0.6'
        );
      }

      // SEQUENCE STEP 7: ONLY AFTER ROOTS DEVELOP, STEM EMERGES & GROWS
      tl.call(() => {
        setIntroState('TREE_GROWTH');
      });

      // Seed pulses with vitality before sprout
      const seedEl = seedGroupRef.current;
      if (seedEl) {
        tl.to(
          seedEl,
          {
            filter: 'drop-shadow(0 0 24px rgba(255, 180, 200, 1))',
            duration: 0.5,
          },
          '+=0.1'
        );
      }

      // Stem emerges upward
      if (stemPath) {
        tl.to(
          stemPath,
          {
            strokeDashoffset: 0,
            duration: 1.8,
            ease: 'power2.inOut',
          },
          '+=0.2'
        );
      }

      // Main branches curve outward across the sky
      if (branchPaths) {
        tl.to(
          branchPaths,
          {
            strokeDashoffset: 0,
            duration: 1.6,
            stagger: 0.15,
            ease: 'power1.out',
          },
          '-=0.6'
        );
      }

      // Leaves and hearts bloom in rhythmic waves
      if (heartLeaves && heartLeaves.length > 0) {
        // Wave 1: First tender buds
        tl.to(
          Array.from(heartLeaves).slice(0, 16),
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            stagger: 0.04,
            ease: 'back.out(2)',
          },
          '-=0.8'
        );

        // Wave 2: Crimson & ruby heart leaves fill the canopy
        tl.to(
          Array.from(heartLeaves).slice(16),
          {
            scale: 1,
            opacity: 1,
            duration: 1.0,
            stagger: 0.03,
            ease: 'back.out(1.6)',
          },
          '-=0.4'
        );
      }

      // Tree radiant aura expands
      if (auraEl) {
        tl.fromTo(
          auraEl,
          { opacity: 0, scale: 0.6 },
          { opacity: 0.6, scale: 1.1, duration: 1.6, ease: 'sine.out' },
          '-=0.8'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [introState, setIntroState]);

  // Scroll down to existing cinematic experience on unlock
  const handleScrollToExperience = () => {
    const experienceEl = document.getElementById('story-experience');
    if (experienceEl) {
      experienceEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full flex flex-col items-center justify-center overflow-hidden z-20 select-none"
    >
      {/* Interactive SVG Canvas Area */}
      <svg
        ref={svgRef}
        viewBox="-250 -360 500 500"
        className="w-full h-full max-w-4xl max-h-[85vh] overflow-visible"
        aria-label="Love Seed to Heart Tree Journey"
      >
        <defs>
          {/* Glowing Ruby Seed Gradient */}
          <radialGradient id="seedGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffb3c1" />
            <stop offset="45%" stopColor="#ff4d6d" />
            <stop offset="90%" stopColor="#800f2f" />
            <stop offset="100%" stopColor="#590d22" />
          </radialGradient>

          {/* Golden Taproot Gradient */}
          <linearGradient id="rootGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffd166" />
            <stop offset="60%" stopColor="#f5baa4" />
            <stop offset="100%" stopColor="#a8435d" />
          </linearGradient>

          {/* Elegant Organic Trunk Gradient */}
          <linearGradient id="trunkGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f5baa4" />
            <stop offset="40%" stopColor="#e89886" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>

          {/* Heart Leaf Gradients */}
          <linearGradient id="heartPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffccd5" />
            <stop offset="100%" stopColor="#ff4d6d" />
          </linearGradient>
          <linearGradient id="heartRubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff758f" />
            <stop offset="100%" stopColor="#c9184a" />
          </linearGradient>
          <linearGradient id="heartGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff3b0" />
            <stop offset="100%" stopColor="#ffd166" />
          </linearGradient>

          {/* Soft Filter for Tree Glow */}
          <filter id="seedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Floating Sparkle Embers */}
        <g className="sparkles-layer pointer-events-none">
          {sparkles.map((p) => (
            <circle
              key={p.id}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill="#fff8e7"
              opacity={p.alpha * 0.75}
              style={{ filter: 'drop-shadow(0 0 4px #ffd166)' }}
            />
          ))}
        </g>

        {/* Tree Radiant Aura */}
        <circle
          cx="0"
          cy="-170"
          r="160"
          fill="radial-gradient(circle, rgba(245, 186, 164, 0.25) 0%, transparent 70%)"
          className="intro-tree-aura pointer-events-none opacity-0"
        />

        {/* Soil Ground Mound */}
        <g id="soil-mound">
          {/* Deep Underground Fill */}
          <rect x="-260" y="24" width="520" height="180" fill="#0d0408" opacity="0.9" />

          {/* Curved Soil Crest */}
          <path
            ref={soilRef}
            d="M -260 45 C -140 8, -60 2, 0 10 C 60 2, 140 8, 260 45 L 260 180 L -260 180 Z"
            fill="#1c0814"
            className="transition-colors duration-1000"
          />

          {/* Warm Golden Soil Rim Line */}
          <path
            d="M -260 45 C -140 8, -60 2, 0 10 C 60 2, 140 8, 260 45"
            fill="none"
            stroke="#f5baa4"
            strokeWidth="1.5"
            strokeOpacity="0.45"
          />
        </g>

        {/* STEP 6: ROOTS LAYER (UNDERGROUND) */}
        <g id="roots-layer">
          {/* Primary Central Taproot */}
          <path
            d="M 0 16 C 0 35, -5 58, -2 84 C 1 106, -3 124, 0 148"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
            filter="drop-shadow(0 0 6px rgba(255, 209, 102, 0.6))"
          />

          {/* Lateral Left Roots */}
          <path
            d="M -1 32 C -18 48, -44 62, -74 74 C -98 84, -125 94, -145 108"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />
          <path
            d="M -44 62 C -54 78, -68 96, -82 118"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />
          <path
            d="M -74 74 C -86 92, -100 106, -114 128"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />

          {/* Lateral Right Roots */}
          <path
            d="M 1 34 C 20 48, 48 62, 78 74 C 104 84, 130 94, 150 108"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />
          <path
            d="M 48 62 C 58 78, 72 96, 86 118"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />
          <path
            d="M 78 74 C 90 92, 104 106, 118 128"
            fill="none"
            stroke="url(#rootGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="intro-root-path opacity-0"
          />
        </g>

        {/* STEP 7: STEM, TRUNK & BRANCHES (ABOVE GROUND) */}
        <g id="tree-structure-layer">
          {/* Central Trunk */}
          <path
            d="M 0 0 C 0 -40, 4 -85, -2 -135 C -8 -175, 1 -215, 0 -255"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="5.5"
            strokeLinecap="round"
            className="intro-stem-path opacity-0"
            filter="drop-shadow(0 0 10px rgba(245, 186, 164, 0.4))"
          />

          {/* Primary Left Branch */}
          <path
            d="M -1 -110 C -26 -136, -58 -156, -92 -172 C -122 -184, -148 -192, -172 -196"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />

          {/* Primary Right Branch */}
          <path
            d="M 0 -125 C 26 -152, 60 -172, 94 -186 C 124 -198, 150 -206, 174 -210"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="3.4"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />

          {/* Secondary Upper Branches */}
          <path
            d="M -48 -148 C -66 -178, -88 -208, -100 -238 C -110 -262, -116 -280, -118 -295"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />
          <path
            d="M 50 -162 C 68 -192, 88 -218, 102 -248 C 110 -270, 115 -286, 118 -300"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />
          <path
            d="M -2 -215 C -16 -245, -32 -275, -45 -305"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="2.0"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />
          <path
            d="M 0 -215 C 16 -245, 32 -275, 45 -305"
            fill="none"
            stroke="url(#trunkGrad)"
            strokeWidth="2.0"
            strokeLinecap="round"
            className="intro-branch-path opacity-0"
          />
        </g>

        {/* STEP 7: CANOPY HEART LEAVES (BLOSSOMS) */}
        <g id="heart-leaves-layer">
          {[
            // Wave 1: Outer & Primary Branch Tips
            { x: -172, y: -196, r: 12, rot: -25, fill: 'url(#heartRubyGrad)' },
            { x: 174, y: -210, r: 12, rot: 25, fill: 'url(#heartRubyGrad)' },
            { x: -118, y: -295, r: 13, rot: -15, fill: 'url(#heartPinkGrad)' },
            { x: 118, y: -300, r: 13, rot: 15, fill: 'url(#heartPinkGrad)' },
            { x: -45, y: -305, r: 14, rot: -5, fill: 'url(#heartGoldGrad)' },
            { x: 45, y: -305, r: 14, rot: 5, fill: 'url(#heartGoldGrad)' },
            { x: 0, y: -258, r: 15, rot: 0, fill: 'url(#heartPinkGrad)' },
            { x: -92, y: -172, r: 11, rot: -20, fill: 'url(#heartPinkGrad)' },
            { x: 94, y: -186, r: 11, rot: 20, fill: 'url(#heartRubyGrad)' },
            { x: -100, y: -238, r: 12, rot: -30, fill: 'url(#heartRubyGrad)' },
            { x: 102, y: -248, r: 12, rot: 30, fill: 'url(#heartPinkGrad)' },
            { x: -145, y: -185, r: 11, rot: -15, fill: 'url(#heartGoldGrad)' },
            { x: 146, y: -195, r: 11, rot: 15, fill: 'url(#heartGoldGrad)' },
            { x: -68, y: -260, r: 13, rot: -10, fill: 'url(#heartRubyGrad)' },
            { x: 70, y: -265, r: 13, rot: 10, fill: 'url(#heartPinkGrad)' },
            { x: 0, y: -320, r: 16, rot: 0, fill: 'url(#heartGoldGrad)' },

            // Wave 2: Lush Interior Canopy Hearts
            { x: -28, y: -170, r: 11, rot: -12, fill: 'url(#heartPinkGrad)' },
            { x: 30, y: -175, r: 11, rot: 14, fill: 'url(#heartRubyGrad)' },
            { x: -75, y: -200, r: 12, rot: -25, fill: 'url(#heartGoldGrad)' },
            { x: 75, y: -210, r: 12, rot: 22, fill: 'url(#heartPinkGrad)' },
            { x: -35, y: -225, r: 13, rot: -8, fill: 'url(#heartRubyGrad)' },
            { x: 38, y: -230, r: 13, rot: 8, fill: 'url(#heartGoldGrad)' },
            { x: -130, y: -240, r: 10, rot: -35, fill: 'url(#heartPinkGrad)' },
            { x: 132, y: -245, r: 10, rot: 35, fill: 'url(#heartRubyGrad)' },
            { x: -85, y: -270, r: 11, rot: -18, fill: 'url(#heartGoldGrad)' },
            { x: 86, y: -275, r: 11, rot: 18, fill: 'url(#heartPinkGrad)' },
            { x: -20, y: -285, r: 12, rot: -5, fill: 'url(#heartRubyGrad)' },
            { x: 22, y: -290, r: 12, rot: 5, fill: 'url(#heartPinkGrad)' },
            { x: -60, y: -190, r: 10, rot: -15, fill: 'url(#heartRubyGrad)' },
            { x: 62, y: -195, r: 10, rot: 15, fill: 'url(#heartGoldGrad)' },
            { x: -110, y: -160, r: 9, rot: -22, fill: 'url(#heartPinkGrad)' },
            { x: 112, y: -165, r: 9, rot: 22, fill: 'url(#heartRubyGrad)' },
            { x: -15, y: -200, r: 12, rot: 0, fill: 'url(#heartGoldGrad)' },
            { x: 15, y: -205, r: 12, rot: 0, fill: 'url(#heartPinkGrad)' },
          ].map((h, idx) => (
            <g
              key={idx}
              transform={`translate(${h.x}, ${h.y}) rotate(${h.rot}) scale(${h.r / 10})`}
              className="intro-heart-leaf opacity-0"
              filter="drop-shadow(0 0 6px rgba(255, 77, 109, 0.6))"
            >
              <path
                d="M 0 -2 C -4 -7, -9 -7, -9 -2 C -9 3, 0 8, 0 11 C 0 8, 9 3, 9 -2 C 9 -7, 4 -7, 0 -2 Z"
                fill={h.fill}
              />
            </g>
          ))}
        </g>

        {/* STEP 3 & STEP 5: THE GLOWING LOVE SEED */}
        <g
          ref={seedGroupRef}
          id="love-seed"
          transform="translate(0, 0)"
          className="cursor-default"
          style={{ filter: 'drop-shadow(0 0 14px rgba(255, 77, 109, 0.85))' }}
        >
          {/* Pulsing Aura */}
          <circle cx="0" cy="0" r="16" fill="rgba(255, 77, 109, 0.2)" />

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

        {/* WATER DROPS CASCADE */}
        {waterDrops.length > 0 && (
          <g className="water-drops-stream pointer-events-none">
            {waterDrops.map((d) => (
              <line
                key={d.id}
                x1={d.x + 3}
                y1={-80 + d.y}
                x2={d.x}
                y2={-80 + d.y + d.length}
                stroke="#a2d2ff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
                filter="drop-shadow(0 0 3px #64b5f6)"
              />
            ))}
          </g>
        )}
      </svg>

      {/* STEP 4: INTERACTIVE WATERING POT (🫖) */}
      {(introState === 'WATERING' || introState === 'SEED_LANDED') && (
        <div
          ref={potRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={triggerWatering}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label="Interactive Watering Pot. Drag or click to water the seed."
          className={`absolute cursor-grab active:cursor-grabbing transition-transform ${
            isDragging ? 'scale-105' : ''
          }`}
          style={{
            transform: `translate(${potPos.x}px, ${potPos.y}px)`,
            touchAction: 'none',
          }}
        >
          {/* Watering Pot Visual */}
          <div className="relative group flex flex-col items-center">
            {/* Instruction tooltip above pot */}
            {showHelperText && (
              <div className="mb-2 px-3 py-1.5 rounded-full bg-[#1c0814]/90 backdrop-blur-md border border-[#f5baa4]/40 text-[#f5baa4] text-xs font-sans tracking-wider text-center shadow-lg pointer-events-none animate-pulse">
                Water the seed
                <span className="block text-[10px] text-[#fffdf8]/70">
                  Drag 🫖 to seed or tap
                </span>
              </div>
            )}

            {/* Stylized Romantic Watering Pot SVG */}
            <div className="w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_4px_16px_rgba(216,27,70,0.4)]">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffd166" />
                    <stop offset="45%" stopColor="#f5baa4" />
                    <stop offset="100%" stopColor="#a81438" />
                  </linearGradient>
                </defs>

                {/* Handle on right */}
                <path
                  d="M 68 38 C 92 38, 92 72, 68 72"
                  fill="none"
                  stroke="url(#potGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                />

                {/* Spout on left */}
                <path
                  d="M 32 55 L 10 32 L 8 38"
                  fill="none"
                  stroke="url(#potGrad)"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Spout rose head */}
                <ellipse cx="9" cy="34" rx="3" ry="5" fill="#ffd166" transform="rotate(-30 9 34)" />

                {/* Main Pot Vessel */}
                <ellipse cx="50" cy="56" rx="22" ry="18" fill="url(#potGrad)" />

                {/* Pot Neck & Rim */}
                <path d="M 40 40 L 60 40 L 58 45 L 42 45 Z" fill="#ffd166" />

                {/* Engraved Heart Emblem */}
                <path
                  d="M 50 54 C 47 50, 43 50, 43 54 C 43 58, 50 62, 50 64 C 50 62, 57 58, 57 54 C 57 50, 53 50, 50 54 Z"
                  fill="#fffdf8"
                  opacity="0.9"
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* STEP 6 & 7: PROGRESSIVE TEXT PROMPTS */}
      {introState === 'ROOT_GROWTH' && (
        <div className="absolute bottom-12 text-center pointer-events-none transition-all duration-700 animate-pulse">
          <p className="font-serif text-[#f5baa4] text-lg tracking-wider drop-shadow-md">
            Roots of devotion take hold in the silent earth...
          </p>
        </div>
      )}

      {introState === 'TREE_GROWTH' && (
        <div className="absolute bottom-12 text-center pointer-events-none transition-all duration-700">
          <p className="font-serif text-[#fffdf8] text-xl tracking-wide drop-shadow-md">
            Reaching toward the twilight warmth...
          </p>
          <span className="text-xs font-sans tracking-[0.2em] uppercase text-[#f5baa4]/70 mt-1 block">
            Love begins to blossom
          </span>
        </div>
      )}

      {/* STEP 8: EXPERIENCE UNLOCKED CALL TO ACTION */}
      {introState === 'EXPERIENCE_UNLOCKED' && (
        <div className="absolute bottom-8 flex flex-col items-center text-center z-30 transition-all duration-1000">
          <p className="font-serif text-2xl md:text-3xl text-[#fffdf8] tracking-wide drop-shadow-lg mb-2">
            Your love has taken root
          </p>
          <button
            onClick={handleScrollToExperience}
            className="group mt-2 px-8 py-3 rounded-full bg-gradient-to-r from-[#d81b46] to-[#a81438] text-[#fffdf8] font-serif text-base tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(216,27,70,0.5)] border border-[#ffb3c1]/40 flex items-center gap-2 cursor-pointer"
            aria-label="Scroll to explore the journey"
          >
            Scroll to explore the journey
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
