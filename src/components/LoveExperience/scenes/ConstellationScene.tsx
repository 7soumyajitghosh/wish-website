import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { EXPERIENCE_CONFIG } from '../config/experienceConfig';

interface ConstellationSceneProps {
  onComplete: () => void;
}

interface StarPoint {
  id: string;
  x: number;
  y: number;
  size: number;
  twinkleDelay: number;
}

// 14 authored heart constellation nodes
const CONSTELLATION_STARS: StarPoint[] = [
  { id: 's0', x: 400, y: 470, size: 3.6, twinkleDelay: 0.0 }, // Bottom apex
  { id: 's1', x: 465, y: 395, size: 2.8, twinkleDelay: 0.15 },
  { id: 's2', x: 520, y: 310, size: 3.2, twinkleDelay: 0.3 },
  { id: 's3', x: 540, y: 225, size: 3.0, twinkleDelay: 0.45 },
  { id: 's4', x: 510, y: 155, size: 3.4, twinkleDelay: 0.6 },
  { id: 's5', x: 445, y: 130, size: 2.9, twinkleDelay: 0.75 },
  { id: 's6', x: 405, y: 175, size: 2.6, twinkleDelay: 0.9 },
  { id: 's7', x: 400, y: 205, size: 3.5, twinkleDelay: 1.05 }, // Top cusp
  { id: 's8', x: 395, y: 175, size: 2.6, twinkleDelay: 1.2 },
  { id: 's9', x: 355, y: 130, size: 2.9, twinkleDelay: 1.35 },
  { id: 's10', x: 290, y: 155, size: 3.4, twinkleDelay: 1.5 },
  { id: 's11', x: 260, y: 225, size: 3.0, twinkleDelay: 1.65 },
  { id: 's12', x: 280, y: 310, size: 3.2, twinkleDelay: 1.8 },
  { id: 's13', x: 335, y: 395, size: 2.8, twinkleDelay: 1.95 },
  // Inner stars
  { id: 's14', x: 360, y: 265, size: 2.4, twinkleDelay: 2.1 },
  { id: 's15', x: 440, y: 265, size: 2.4, twinkleDelay: 2.25 },
  { id: 's16', x: 400, y: 335, size: 2.7, twinkleDelay: 2.4 },
];

export const ConstellationScene: React.FC<ConstellationSceneProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const text1Ref = useRef<HTMLParagraphElement>(null);
  const text2Ref = useRef<HTMLParagraphElement>(null);
  const linesGroupRef = useRef<SVGGElement>(null);
  const starsGroupRef = useRef<SVGGElement>(null);
  const mountedRef = useRef(true);
  const holdCallRef = useRef<ReturnType<typeof gsap.delayedCall> | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const finishScene = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  };

  // 15s fallback: never strand the visitor if GSAP fails or timers throttle.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (mountedRef.current) finishScene();
    }, 15000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Reduced-motion: jump straight to the end state, no perpetual twinkle
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.set(starsGroupRef.current?.children ?? [], { scale: 1, opacity: 1, transformBox: 'fill-box' });
      gsap.set(text1Ref.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      gsap.set(text2Ref.current, { opacity: 1, y: 0, filter: 'blur(0px)' });
      finishScene();
      return () => {
        mountedRef.current = false;
      };
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (!mountedRef.current) return;
          // Allow contemplative reading pause before transitioning to love letter
          holdCallRef.current = gsap.delayedCall(1.6, () => {
            if (!mountedRef.current) return;
            finishScene();
          });
        },
      });

      // 1. Initial fade-in of celestial backdrop
      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: 'power2.out' }
      );

      // 2. Sequentially light up constellation stars
      const starElements = starsGroupRef.current?.children;
      if (starElements) {
        tl.fromTo(
          starElements,
          { scale: 0, opacity: 0, transformOrigin: 'center center' },
          {
            scale: 1,
            opacity: 1,
            duration: 0.8,
            stagger: 0.08,
            ease: 'back.out(2.0)',
            transformBox: 'fill-box',
            overwrite: 'auto',
          },
          '-=0.8'
        );
      }

      // 3. Draw connecting constellation lines
      const lineElements = linesGroupRef.current?.children;
      if (lineElements) {
        Array.from(lineElements).forEach(el => {
          const path = el as SVGPathElement;
          const len = path.getTotalLength?.() || 200;
          gsap.set(path, {
            strokeDasharray: len,
            strokeDashoffset: len,
            opacity: 0.7,
          });
        });

        tl.to(
          lineElements,
          {
            strokeDashoffset: 0,
            duration: 2.4,
            stagger: 0.06,
            ease: 'power1.inOut',
          },
          '-=1.2'
        );
      }

      // 4. Reveal line 1 of cinematic text
      tl.fromTo(
        text1Ref.current,
        { opacity: 0, y: 16, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 2.0,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        '-=1.0'
      );

      // 5. Reveal line 2 of cinematic text with subtle pause
      tl.fromTo(
        text2Ref.current,
        { opacity: 0, y: 14, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 2.0,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        '+=0.8'
      );

      // 6. Gentle collective twinkle loop — sequenced AFTER entrance so it
      // never fights the scale-in; scoped to this container only.
      const starCores = containerRef.current?.querySelectorAll('.constellation-star-core');
      if (starCores && starCores.length > 0) {
        tl.to(
          starCores,
          {
            scale: 1.25,
            opacity: 0.85,
            duration: 1.8,
            repeat: -1,
            yoyo: true,
            stagger: 0.15,
            ease: 'sine.inOut',
            transformBox: 'fill-box',
            transformOrigin: 'center center',
            overwrite: 'auto',
          },
          '+=0.2'
        );
      }
    }, containerRef);

    return () => {
      mountedRef.current = false;
      holdCallRef.current?.kill();
      ctx.revert();
    };
  }, [onComplete]);

  // Constellation contour path string
  const mainContourPath =
    'M 400 470 L 465 395 L 520 310 L 540 225 L 510 155 L 445 130 L 405 175 L 400 205 L 395 175 L 355 130 L 290 155 L 260 225 L 280 310 L 335 395 Z';

  return (
    <div ref={containerRef} className="constellation-scene">
      <div className="constellation-sky-glow" />

      {/* Always-available escape hatch: never depend solely on auto-advance */}
      <button
        type="button"
        onClick={finishScene}
        aria-label="Skip constellation scene"
        className="absolute top-6 right-6 z-20 px-6 py-3 min-h-[44px] rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#fffdf8] font-sans text-sm tracking-widest uppercase transition-all hover:bg-white/20 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
      >
        Skip →
      </button>

      {/* SVG Constellation */}
      <svg
        viewBox="0 0 800 600"
        className="constellation-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8e7" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#f5baa4" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#a81438" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Lines connecting stars */}
        <g ref={linesGroupRef} className="constellation-lines">
          <path d={mainContourPath} className="constellation-line" />
          {/* Inner accent connector lines */}
          <path d="M 335 395 L 360 265 L 400 205" className="constellation-line-inner" />
          <path d="M 465 395 L 440 265 L 400 205" className="constellation-line-inner" />
          <path d="M 360 265 L 400 335 L 440 265" className="constellation-line-inner" />
          <path d="M 400 335 L 400 470" className="constellation-line-inner" />
        </g>

        {/* Stars */}
        <g ref={starsGroupRef} className="constellation-stars">
          {CONSTELLATION_STARS.map(st => (
            <g key={st.id} transform={`translate(${st.x}, ${st.y})`}>
              {/* Soft halo */}
              <circle r={st.size * 3.2} fill="url(#starGlow)" opacity="0.4" />
              {/* Star Core */}
              <circle
                r={st.size}
                fill="#fffdf8"
                className="constellation-star-core"
              />
              {/* Fine starlight sparkle glint */}
              <line
                x1={-st.size * 1.8}
                y1={0}
                x2={st.size * 1.8}
                y2={0}
                stroke="#fff8e7"
                strokeWidth="0.6"
                opacity="0.75"
              />
              <line
                x1={0}
                y1={-st.size * 1.8}
                x2={0}
                y2={st.size * 1.8}
                stroke="#fff8e7"
                strokeWidth="0.6"
                opacity="0.75"
              />
            </g>
          ))}
        </g>
      </svg>

      {/* Cinematic Text Reveal */}
      <div className="constellation-text-container">
        <p ref={text1Ref} className="constellation-quote-line line-1">
          {EXPERIENCE_CONFIG.constellation.quoteLine1}
        </p>
        <p ref={text2Ref} className="constellation-quote-line line-2">
          {EXPERIENCE_CONFIG.constellation.quoteLine2}
        </p>
      </div>
    </div>
  );
};
