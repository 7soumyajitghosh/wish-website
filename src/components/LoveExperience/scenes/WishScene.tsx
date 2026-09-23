import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import { EXPERIENCE_CONFIG } from '../config/experienceConfig';
import { ParticleEmitter } from '../animation/particleSystem';

export const WishScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);

  const [hasWished, setHasWished] = useState(false);
  const emitterRef = useRef<ParticleEmitter>(new ParticleEmitter());
  const rafRef = useRef<number | null>(null);
  const wishTlRef = useRef<gsap.core.Timeline | null>(null);
  const mountedRef = useRef(true);
  const wishedRef = useRef(false);

  // Track mounted state + kill handler timeline on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      wishTlRef.current?.kill();
      wishTlRef.current = null;
    };
  }, []);

  // Setup canvas and particle animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      emitterRef.current.resize(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      emitterRef.current.update(dt, now * 0.001);
      emitterRef.current.draw(ctx);

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Entrance animation
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Fade in scene
      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: reduced ? 0 : 1.6, ease: 'power2.out' }
      );

      // Pulse the interactive heart orb (skip infinite sway when reduced motion)
      if (!reduced) {
        gsap.to(orbRef.current, {
          scale: 1.08,
          duration: 1.5,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          overwrite: 'auto',
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Handle click on heart orb
  // NOTE: hasWished state is set only after the prompt fade completes so the
  // prompt node stays mounted for its exit tween (conditional render below).
  const handleWish = useCallback(() => {
    if (wishedRef.current) return;
    wishedRef.current = true;

    const orb = orbRef.current;
    if (!orb) return;

    // Kill the infinite entrance pulse so it doesn't fight the wish timeline
    gsap.killTweensOf(orb);

    const rect = orb.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Trigger rich particle burst
    emitterRef.current.spawnBurst(cx, cy, 90);

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const tl = gsap.timeline();
    wishTlRef.current = tl;

    // 1. Orb scales up slightly with luminous flash
    tl.to(orb, {
      scale: 1.35,
      filter: 'drop-shadow(0 0 45px rgba(255, 230, 180, 0.9))',
      duration: reduced ? 0 : 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });

    // 2. Prompt fades out (one-shot; node stays mounted until onComplete)
    tl.to(
      promptRef.current,
      {
        opacity: 0,
        y: -20,
        duration: reduced ? 0 : 0.8,
        ease: 'power2.in',
        overwrite: 'auto',
        onComplete: () => {
          if (!mountedRef.current) return;
          setHasWished(true);
        },
      },
      reduced ? 0 : '-=0.3'
    );

    // 3. Heart orb ascends gracefully into the cosmos
    tl.to(orb, {
      y: -window.innerHeight * 0.7,
      scale: 0.2,
      opacity: 0,
      duration: reduced ? 0 : 2.2,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onComplete: () => {
        if (!mountedRef.current) return;
        // Ignite full celestial starry sky
        emitterRef.current.spawnAmbientStars(80);
      },
    });

    // 4. Background shifts into rich deep starry night sky (scoped to container)
    const backdropGlow = containerRef.current?.querySelectorAll('.wish-backdrop-glow');
    if (backdropGlow && backdropGlow.length > 0) {
    tl.to(
      backdropGlow,
      {
        opacity: 0.85,
        duration: reduced ? 0 : 3.0,
        ease: 'power2.out',
        overwrite: 'auto',
      },
      reduced ? 0 : '-=1.5'
    );
    }

    // 5. Final message fades in with cinematic elegance
    // Filter tweens below are one-shot entrance reveals (no per-frame loop).
    const finaleElements = finaleRef.current?.querySelectorAll('.finale-reveal-item');
    if (finaleElements) {
      tl.fromTo(
        finaleElements,
        { opacity: 0, y: 20, filter: 'blur(8px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: reduced ? 0 : 2.2,
          stagger: reduced ? 0 : 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
        },
        reduced ? 0 : '-=0.8'
      );
    }
  }, []);

  const { wish } = EXPERIENCE_CONFIG;

  return (
    <div ref={containerRef} className="wish-scene">
      {/* Dynamic starlit background canvas */}
      <canvas ref={canvasRef} className="wish-canvas" aria-hidden="true" />

      {/* Atmospheric nebula/twilight glow */}
      <div className="wish-backdrop-glow" />

      {/* Centered Interactive Section */}
      <div className="wish-center-container">
        {/* Interactive Wishing Heart Orb */}
        <button
          ref={orbRef}
          className={`wish-heart-orb ${hasWished ? 'wished' : ''}`}
          onClick={handleWish}
          disabled={hasWished}
          aria-label="Make a wish"
        >
          <svg viewBox="0 0 100 100" className="wish-heart-svg">
            <defs>
              <radialGradient id="heartCoreGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#fff8e7" />
                <stop offset="35%" stopColor="#ff758f" />
                <stop offset="70%" stopColor="#c7163f" />
                <stop offset="100%" stopColor="#5c0d1e" />
              </radialGradient>
              <filter id="orbGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing Heart */}
            <path
              d="M 50 85 C 20 62, 8 46, 12 30 C 15 16, 30 14, 42 22 C 46 25, 50 30, 50 30 C 50 30, 54 25, 58 22 C 70 14, 85 16, 88 30 C 92 46, 80 62, 50 85 Z"
              fill="url(#heartCoreGrad)"
              filter="url(#orbGlow)"
            />
            {/* Sparkle highlight */}
            <circle cx="36" cy="28" r="4.5" fill="#fffdf8" opacity="0.8" />
            <circle cx="44" cy="24" r="2" fill="#fffdf8" opacity="0.6" />
          </svg>
        </button>

        {/* Initial Prompt */}
        {!hasWished && (
          <div ref={promptRef} className="wish-prompt-container">
            <h2 className="wish-title">{wish.title}</h2>
            <p className="wish-subtext">{wish.subtext}</p>
            <span className="wish-hint">{wish.actionHint}</span>
          </div>
        )}

        {/* Final Message Reveal */}
        <div ref={finaleRef} className="wish-finale-container">
          <h2 className="finale-header finale-reveal-item">{wish.finalHeader}</h2>
          <div className="finale-body">
            {wish.finalMessage.map((line, idx) => (
              <p key={idx} className="finale-line finale-reveal-item">
                {line}
              </p>
            ))}
          </div>
          <div className="finale-signature finale-reveal-item">
            <span className="signature-ornament">✦</span>
            <p className="signature-text">{wish.finalSignature}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
