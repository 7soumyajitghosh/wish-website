import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { EXPERIENCE_CONFIG } from '../config/experienceConfig';

interface LoveLetterSceneProps {
  onComplete: () => void;
}

export const LoveLetterScene: React.FC<LoveLetterSceneProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const envelopeRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [canProceed, setCanProceed] = useState(false);
  const hasContinuedRef = useRef(false);
  const continueTlRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    return () => {
      continueTlRef.current?.kill();
      continueTlRef.current = null;
    };
  }, []);

  // Fallback: allow proceeding even if the GSAP reveal chain fails.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setCanProceed(true);
    }, 15000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion: jump to end state, no staged choreography.
    if (reduced) {
      gsap.set(containerRef.current, { opacity: 1 });
      gsap.set(envelopeRef.current, { y: 0, scale: 0.92, opacity: 0.15 });
      gsap.set(sealRef.current, { scale: 1.3, opacity: 0 });
      gsap.set(flapRef.current, { rotateX: 180 });
      gsap.set(letterRef.current, { y: 0, scale: 1.05 });
      if (letterRef.current) {
        letterRef.current.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.65)';
      }
      const items = contentRef.current?.querySelectorAll('.letter-text-item');
      if (items) gsap.set(items, { opacity: 1, y: 0, filter: 'blur(0px)' });
      setCanProceed(true);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

      // 1. Scene fade-in
      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.2, ease: 'power2.out' }
      );

      // 2. Envelope float-in entrance
      tl.fromTo(
        envelopeRef.current,
        { y: 60, scale: 0.85, opacity: 0, rotation: -2 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1.6,
          ease: 'back.out(1.4)',
        },
        '-=0.4'
      );

      // 3. Wax seal break / fade
      tl.to(
        sealRef.current,
        {
          scale: 1.3,
          opacity: 0,
          duration: 0.6,
          ease: 'power2.in',
        },
        '+=0.4'
      );

      // 4. Envelope flap opens (3D perspective rotate)
      tl.to(
        flapRef.current,
        {
          rotateX: 180,
          transformPerspective: 800,
          duration: 1.0,
          ease: 'power2.inOut',
          overwrite: 'auto',
        },
        '-=0.2'
      );

      // 5. Letter paper slides upward out of the envelope pocket
      tl.to(
        letterRef.current,
        {
          y: -140,
          duration: 1.2,
          ease: 'power2.out',
        }
      );

      // 6. Letter paper expands to the center stage & settles
      tl.to(
        letterRef.current,
        {
          y: 0,
          scale: 1.05,
          duration: 1.4,
          ease: 'power3.inOut',
          overwrite: 'auto',
        }
      ).call(() => {
        // Discrete end-state sets (no per-frame zIndex/boxShadow interpolation).
        if (letterRef.current) {
          gsap.set(letterRef.current, { zIndex: 30 });
          letterRef.current.style.boxShadow = '0 24px 60px rgba(0, 0, 0, 0.65)';
        }
      });

      // 7. Envelope dims and gently drops back
      tl.to(
        envelopeRef.current,
        {
          opacity: 0.15,
          scale: 0.92,
          duration: 1.2,
          ease: 'power2.out',
        },
        '-=1.2'
      );

      // 8. Text elements reveal with soft blur clearing
      const textElements = contentRef.current?.querySelectorAll('.letter-text-item');
      if (textElements) {
        tl.fromTo(
          textElements,
          { opacity: 0, y: 12, filter: 'blur(4px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.4,
            stagger: 0.35,
            ease: 'power2.out',
            onComplete: () => {
              setCanProceed(true);
            },
          },
          '-=0.4'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleContinue = () => {
    if (hasContinuedRef.current) return;
    hasContinuedRef.current = true;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    continueTlRef.current?.kill();
    continueTlRef.current = gsap.to(containerRef.current, {
      opacity: 0,
      scale: 0.98,
      duration: reduced ? 0 : 1.2,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onComplete,
    });
  };

  const { loveLetter } = EXPERIENCE_CONFIG;

  return (
    <div ref={containerRef} className="love-letter-scene">
      <div className="letter-scene-atmosphere" />

      {/* 3D Envelope Container */}
      <div ref={envelopeRef} className="envelope-wrapper">
        {/* Envelope Back Body */}
        <div className="envelope-back" />

        {/* Flap */}
        <div ref={flapRef} className="envelope-flap">
          <svg viewBox="0 0 400 160" className="envelope-flap-svg">
            <polygon points="0,0 400,0 200,160" fill="#2d0b17" />
          </svg>
        </div>

        {/* Wax Seal */}
        <div ref={sealRef} className="envelope-wax-seal">
          <svg viewBox="0 0 60 60" className="wax-seal-svg">
            <circle cx="30" cy="30" r="28" fill="#8c122b" />
            <circle cx="30" cy="30" r="24" fill="#a81438" stroke="#750d24" strokeWidth="1.5" />
            {/* Heart Seal Stamp */}
            <path
              d="M30 40 C20 30, 16 22, 22 17 C26 13, 30 18, 30 18 C30 18, 34 13, 38 17 C44 22, 40 30, 30 40 Z"
              fill="#5a0918"
            />
          </svg>
        </div>

        {/* Letter Parchment */}
        <div ref={letterRef} className="letter-paper">
          <div ref={contentRef} className="letter-content">
            <div className="letter-header letter-text-item">
              <span className="letter-recipient">{loveLetter.recipient}</span>
              <span className="letter-date">{loveLetter.date}</span>
            </div>

            <div className="letter-body">
              {loveLetter.paragraphs.map((p, idx) => (
                <p key={idx} className="letter-paragraph letter-text-item">
                  {p}
                </p>
              ))}
            </div>

            <div className="letter-footer letter-text-item">
              <p className="letter-signoff">{loveLetter.signOff}</p>
              <p className="letter-sender">{loveLetter.sender}</p>
            </div>
          </div>
        </div>

        {/* Envelope Front Pocket (cuts in V-shape) */}
        <div className="envelope-front">
          <svg viewBox="0 0 400 240" className="envelope-front-svg">
            <polygon points="0,0 200,140 400,0 400,240 0,240" fill="#380e1e" />
            <polygon points="0,240 200,135 400,240" fill="#260814" />
          </svg>
        </div>
      </div>

      {/* Elegant Continuation Prompt */}
      {canProceed && (
        <button
          onClick={handleContinue}
          className="letter-continue-btn"
          aria-label="Continue the experience"
        >
          <span>Continue</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
};
