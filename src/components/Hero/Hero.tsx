import React, { useEffect, useRef, useCallback } from 'react';
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
  const begunRef = useRef(false);
  const waterDoneRef = useRef(false);
  const { introState, startStory } = useStory();
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const parallaxRaf = useRef<number>(0);
  const parallaxTarget = useRef({ x: 0, y: 0 });

  // Subtle mouse parallax for the opening layers (desktop, no reduced motion).
  // Direct DOM writes via rAF — no per-mousemove React re-render.
  const handleOpeningMove = useCallback((e: React.PointerEvent) => {
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    parallaxTarget.current = { x: nx, y: ny };
    if (parallaxRaf.current) return;
    parallaxRaf.current = requestAnimationFrame(() => {
      parallaxRaf.current = 0;
      const { x, y } = parallaxTarget.current;
      if (glowRef.current)
        glowRef.current.style.transform = `translate3d(${x * 14}px, ${y * 10}px, 0)`;
      if (titleRef.current)
        titleRef.current.style.transform = `translate3d(${x * -8}px, ${y * -6}px, 0)`;
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      tweenRef.current?.kill();
      tweenRef.current = null;
      cancelAnimationFrame(parallaxRaf.current);
    };
  }, []);

  const handleBegin = () => {
    // One-shot: double-clicks must not restart the intro sequence.
    if (begunRef.current) return;
    begunRef.current = true;
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
    // One-shot: the watering timeline fires once; a second call would
    // restart auto-growth and replay the tree.
    if (waterDoneRef.current) return;
    waterDoneRef.current = true;
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
      {/* Readability vignette only — the canvas tree stays visible behind
          this overlay: it is the one and only tree animation. */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(13,4,8,0.55) 0%, transparent 35%, transparent 65%, rgba(13,4,8,0.6) 100%)',
        }}
      />

      {/* OPENING ambience: drifting particles + mist + moon glow (behind content) */}
      {introState === 'INTRO' && (
        <>
          <AmbientField density={80} />
          <div
            aria-hidden="true"
            ref={glowRef}
            className="pointer-events-none absolute inset-0"
            style={{
              transform: 'translate3d(0px, 0px, 0)',
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
        >
          <div ref={titleRef} className="flex flex-col items-center" style={{ transform: 'translate3d(0px, 0px, 0)' }}>
          <p className="text-sm font-sans font-medium uppercase tracking-[0.35em] text-[#f5baa4] mb-6 drop-shadow-md">
            A Journey of Love
          </p>

          <style>{`
            .hero-line { display: block; overflow: hidden; padding-bottom: 0.16em; margin-bottom: -0.16em; }
            .hero-line > span { display: block; animation: heroRise 1s cubic-bezier(0.22,1,0.36,1) both; }
            .hero-line:nth-child(2) > span { animation-delay: 0.14s; }
            @keyframes heroRise { from { opacity: 0; transform: translateY(60px); } to { opacity: 1; transform: translateY(0); } }
            .heart-chain { position: absolute; inset-inline: 0; top: 50%; height: 0; pointer-events: none; }
            .heart-chain > span {
              position: absolute; top: 0; left: 0;
              font-size: clamp(1rem, 2.4vw, 1.6rem); line-height: 1;
              color: #ff6b8d; text-shadow: 0 0 12px rgba(255,77,109,0.95), 0 0 30px rgba(255,77,109,0.55);
              opacity: 0; animation: heartSlide 2.8s linear infinite;
            }
            @keyframes heartSlide {
              0% { opacity: 0; transform: translate(-8vw, 10px) scale(0.7); }
              15% { opacity: 1; }
              80% { opacity: 1; }
              100% { opacity: 0; transform: translate(108vw, -14px) scale(1.15); }
            }
            @media (prefers-reduced-motion: reduce) { .hero-line > span { animation: none; } .heart-chain { display: none; } }
          `}</style>
          <h1 className="relative font-serif text-[#fffdf8] tracking-wide mb-6 drop-shadow-2xl" style={{ fontSize: 'clamp(3rem,8vw,7rem)', lineHeight: 1.14 }}>
            <span className="hero-line"><span>Where Love</span></span>
            <span className="hero-line"><span>Takes Flight</span></span>
            <span aria-hidden="true" className="heart-chain">
              <span style={{ animationDelay: '0.9s' }}>♥️</span>
              <span style={{ animationDelay: '1.15s' }}>♥️</span>
              <span style={{ animationDelay: '1.4s' }}>♥️</span>
              <span style={{ animationDelay: '1.65s' }}>♥️</span>
              <span style={{ animationDelay: '1.9s' }}>♥️</span>
              <span style={{ animationDelay: '2.15s' }}>♥️</span>
              <span style={{ animationDelay: '2.4s' }}>♥️</span>
            </span>
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
          </div>
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
