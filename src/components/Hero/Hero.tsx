import React, { useEffect, useRef, useCallback, useState } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';
import { SeedJourneyIntro } from './SeedJourneyIntro';
import { AmbientField } from '../Effects/AmbientField';
import { MagneticButton } from '../Effects/MagneticButton';

export interface HeroProps {
  onWaterComplete?: () => void;
  className?: string;
}

export const Hero: React.FC<HeroProps> = ({ onWaterComplete, className = '' }) => {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const mountedRef = useRef(true);
  const { introState, startStory } = useStory();
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // Subtle mouse parallax for the opening layers (desktop, no reduced motion)
  const handleOpeningMove = useCallback((e: React.PointerEvent) => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    setParallax({ x: nx, y: ny });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      tweenRef.current?.kill();
      tweenRef.current = null;
    };
  }, []);

  const handleBegin = () => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (contentRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(contentRef.current, {
        opacity: 0,
        y: -30,
        duration: reduced ? 0 : 0.6,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          if (!mountedRef.current) return;
          startStory();
        },
      });
    } else {
      startStory();
    }
  };

  const handleWaterComplete = useCallback(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Cross-fade the intro overlay out so canvas HeartTreeAnimation reveals seamlessly
    if (heroRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = gsap.to(heroRef.current, {
        opacity: 0,
        duration: reduced ? 0 : 1.2,
        ease: 'power2.inOut',
        overwrite: 'auto',
        onComplete: () => {
          if (!mountedRef.current) return;
          onWaterComplete?.();
        },
      });
    } else {
      onWaterComplete?.();
    }
  }, [onWaterComplete]);

  return (
    <section 
      id="hero" 
      ref={heroRef}
      className={`relative w-full h-full flex flex-col justify-center items-center select-none ${className}`}
      aria-label="A Journey of Love Opening"
      onPointerMove={introState === 'INTRO' ? handleOpeningMove : undefined}
    >
      {/* Cinematic Deep Dusk Gradient Background - matches initial canvas twilight */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000"
        style={{
          background:
            'radial-gradient(ellipse at 50% 60%, #2b0e1e 0%, #170711 50%, #0d0408 100%)',
          opacity: introState === 'INTRO' ? 1 : 0.85,
        }}
      />

      {/* OPENING ambience: drifting particles + mist + moon glow (behind content) */}
      {introState === 'INTRO' && (
        <>
          <AmbientField density={80} />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              transform: `translate3d(${parallax.x * 14}px, ${parallax.y * 10}px, 0)`,
              transition: 'transform 0.4s ease-out',
              background:
                'radial-gradient(circle at 72% 22%, rgba(255,214,165,0.16) 0%, transparent 32%), radial-gradient(circle at 22% 70%, rgba(216,27,70,0.14) 0%, transparent 36%)',
            }}
          />
        </>
      )}

      {/* Atmospheric Star-Glint Mist */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(245,186,164,0.12)_0%,transparent_65%)] pointer-events-none" />

      {/* STEP 1: Cinematic opening — "Let's Start Our Journey" */}
      {introState === 'INTRO' && (
        <div
          ref={contentRef}
          className="relative z-20 flex flex-col items-center text-center px-6 max-w-4xl mx-auto w-full select-none"
          style={{
            transform: `translate3d(${parallax.x * -8}px, ${parallax.y * -6}px, 0)`,
            transition: 'transform 0.4s ease-out',
          }}
        >
          <p className="text-sm font-sans font-medium uppercase tracking-[0.35em] text-[#f5baa4] mb-6 drop-shadow-md">
            A Journey of Love
          </p>

          <h1 className="font-serif text-[#fffdf8] tracking-wide mb-6 drop-shadow-2xl" style={{ fontSize: 'clamp(3rem,8vw,7rem)', lineHeight: 'var(--leading-tight,1.05)' }}>
            Where Love<br />Takes Flight
          </h1>

          <p className="font-serif italic text-[#ffd6a5]/90 text-lg md:text-xl mb-8 max-w-xl leading-relaxed">
            Something beautiful is about to begin…
          </p>

          <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#f5baa4]/60 to-transparent mb-10" />

          {/* The Begin Action Button */}
          <div className="flex flex-col items-center gap-4">
            <MagneticButton>
              <button
                onClick={handleBegin}
                className="btn-primary group relative overflow-hidden font-serif tracking-wider shadow-[0_0_30px_rgba(216,27,70,0.5)] cursor-pointer"
                aria-label="Let's start our journey"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative z-10 flex items-center gap-3">
                  Let&rsquo;s Start Our Journey
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
            </MagneticButton>

            <p className="text-sm font-sans tracking-widest text-[#f5baa4]/85 uppercase mt-4">
              Sound on recommended · tap to begin
            </p>
          </div>
        </div>
      )}

      {/* STEP 2-5: The Interactive Love Seed -> Water Sequence */}
      {introState !== 'INTRO' && (
        <SeedJourneyIntro onWaterComplete={handleWaterComplete} />
      )}
    </section>
  );
};

export default Hero;
