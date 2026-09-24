import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';
import { Reveal } from '../Effects/Reveal';
import { MagneticButton } from '../Effects/MagneticButton';

const content = {
  recipient: 'My Dearest,',
  date: 'A quiet starlit evening',
  paragraphs: [
    'In a world that is constantly rushing, you are the stillness I always seek. Every ordinary moment becomes luminous simply because you are part of it.',
    'Like roots that find their way through stone and branches that reach fearless toward the sun, my love for you has grown quietly, deeply, and unconditionally.',
    'You are my favorite thought before falling asleep, my fondest wish upon every shooting star, and the warmth that stays long after the daylight fades.'
  ],
  signOff: 'Forever & always yours,',
  sender: 'With all my heart'
};

export const LoveLetter: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  
  const { isLetterOpen: isOpen, setIsLetterOpen } = useStory();
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  // Kill any running envelope timeline on unmount.
  useEffect(() => {
    return () => {
      tlRef.current?.kill();
      tlRef.current = null;
    };
  }, []);

  const killEnvelopeTweens = () => {
    tlRef.current?.kill();
    tlRef.current = null;
    gsap.killTweensOf([sealRef.current, flapRef.current, letterRef.current]);
  };

  const openLetter = () => {
    if (isOpen) return;
    setIsLetterOpen(true);

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = containerRef.current?.querySelectorAll('.letter-line');

    killEnvelopeTweens();
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tlRef.current = tl;

    tl.to(sealRef.current, { scale: 1.4, opacity: 0, duration: reduced ? 0 : 0.35, ease: 'power2.inOut', overwrite: 'auto' })
      .to(flapRef.current, { rotateX: 180, transformOrigin: 'top', duration: reduced ? 0 : 0.55, ease: 'power2.inOut', overwrite: 'auto' }, reduced ? 0 : '-=0.15')
      .to(letterRef.current, { y: -160, duration: reduced ? 0 : 0.7, ease: 'power3.out', overwrite: 'auto' })
      .call(() => {
        if (letterRef.current) gsap.set(letterRef.current, { zIndex: 30 });
      })
      .to(letterRef.current, {
        scale: 1.15,
        y: -70,
        duration: reduced ? 0 : 0.5,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      .call(() => {
        // Single end-state shadow set (avoids interpolating box-shadow every frame).
        if (letterRef.current) letterRef.current.style.boxShadow = '0 30px 60px -12px rgba(0, 0, 0, 0.7)';
      });
    if (lines && lines.length > 0) {
      tl.fromTo(lines,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, stagger: reduced ? 0 : 0.15, duration: reduced ? 0 : 0.5, ease: 'power2.out', overwrite: 'auto' },
        reduced ? 0 : '-=0.3'
      );
    }
  };

  const closeLetter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isOpen) return;
    setIsLetterOpen(false);

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lines = containerRef.current?.querySelectorAll('.letter-line');

    killEnvelopeTweens();
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    tlRef.current = tl;

    if (lines && lines.length > 0) {
      tl.to(lines, { opacity: 0, y: 10, duration: reduced ? 0 : 0.25, stagger: reduced ? 0 : -0.05, ease: 'power2.in', overwrite: 'auto' });
    }
    tl.to(letterRef.current, { scale: 1, y: 0, duration: reduced ? 0 : 0.5, ease: 'power2.inOut', overwrite: 'auto' })
      .call(() => {
        if (letterRef.current) gsap.set(letterRef.current, { zIndex: 10 });
      })
      .to(flapRef.current, { rotateX: 0, duration: reduced ? 0 : 0.5, ease: 'power2.inOut', overwrite: 'auto' }, reduced ? 0 : '-=0.1')
      .to(sealRef.current, { scale: 1, opacity: 1, duration: reduced ? 0 : 0.35, ease: 'power2.inOut', overwrite: 'auto' });
  };

  return (
    <section 
      id="love-letter" 
      className="section relative min-h-screen flex flex-col items-center justify-center py-24 md:py-32 bg-[#0d0408] overflow-hidden select-none"
      ref={containerRef}
      aria-label="Love Letter Section"
    >
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a0e1e] via-[#12050c] to-[#0d0408] opacity-80" />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#ffd6a5]/5 via-transparent to-[#0d0408]/50" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 flex flex-col items-center">
        <Reveal delay={0} className="flex flex-col items-center">
        <header className="text-center mb-10 sm:mb-12">
          <span className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#f5baa4] font-sans font-medium">
            A Keepsake of Affection
          </span>
          <h2 className="font-serif text-[#fffdf8] mt-2 mb-3 text-balance" style={{ fontSize: 'clamp(1.9rem,5vw + 0.5rem,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}>
            The Love Letter
          </h2>
          <p className="text-sm sm:text-base font-sans text-[#fff8eb]/85">
            Written in the stillness between heartbeats
          </p>
        </header>
        </Reveal>

        {/* Envelope Interactive Unit */}
        <div className="relative flex flex-col items-center mb-10">
          <div 
            className="relative cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd6a5] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(216,27,70,0.45)]"
            onClick={isOpen ? undefined : openLetter}
            onKeyDown={(e) => {
              if (isOpen) return;
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openLetter();
              }
            }}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Love letter is open" : "Click to open the love letter"}
            style={{ perspective: '1000px', width: 'min(90vw,420px)', aspectRatio: '4 / 3' }}
          >
            {/* Envelope Back */}
            <div className="absolute inset-0 bg-[#220b17] rounded-xl shadow-2xl overflow-hidden border border-[#d81b46]/30" />

            {/* Letter Paper */}
            <div 
              ref={letterRef}
              className="absolute bottom-2 left-3 right-3 top-2 bg-[#fdfaf2] rounded-lg p-6 sm:p-8 shadow-2xl flex flex-col z-10 border border-[#e5d5c5] transition-shadow duration-300 hover:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5]"
            >
              <div className="w-full h-full font-serif text-slate-800 flex flex-col text-base" style={{ lineHeight: 'var(--leading-relaxed,1.7)' }}>
                <div className="letter-line flex justify-between mb-3 italic text-slate-600 border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-800">{content.recipient}</span>
                  <span className="text-xs">{content.date}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {content.paragraphs.map((text, i) => (
                    <p key={i} className="letter-line text-slate-700 leading-relaxed font-serif">
                      {text}
                    </p>
                  ))}
                </div>
                
                <div className="letter-line mt-auto pt-2 border-t border-slate-200 flex justify-between items-end">
                  <button
                    onClick={(e) => closeLetter(e)}
                    className="text-xs font-sans uppercase tracking-widest text-[#a81438] hover:text-[#d81b46] font-semibold py-1 px-2 min-h-[44px] rounded hover:bg-rose-50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#a81438]"
                  >
                    Close letter
                  </button>
                  <div className="text-right italic">
                    <p className="text-xs text-slate-500">{content.signOff}</p>
                    <p className="font-medium text-[#a81438]">{content.sender}</p>
                  </div>
                </div>

                {isOpen && (
                  <button
                    onClick={(e) => closeLetter(e)}
                    className="letter-line absolute -top-3 -right-3 w-11 h-11 min-w-[44px] min-h-[44px] bg-[#d81b46] text-[#fffdf8] rounded-full flex items-center justify-center shadow-lg hover:bg-[#a81438] transition-colors hover:scale-110 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd6a5]"
                    aria-label="Close Letter"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Envelope Front Flaps */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              <div className="absolute top-0 left-0 w-1/2 h-full bg-[#1e0915] clip-left-flap border-r border-[#d81b46]/20" />
              <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1e0915] clip-right-flap border-l border-[#d81b46]/20" />
              <div className="absolute bottom-0 left-0 w-full h-[60%] bg-[#2a0e1e] clip-bottom-flap border-t border-[#d81b46]/20 flex items-end justify-center pb-4">
                <span className={`text-[#f5baa4]/80 text-xs font-serif italic tracking-widest transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                  Sealed with Care
                </span>
              </div>
            </div>

            {/* Envelope Top Flap */}
            <div 
              ref={flapRef}
              className="absolute top-0 left-0 w-full h-[60%] bg-[#361224] clip-top-flap z-30 shadow-md border-b border-[#d81b46]/30"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Wax Seal */}
              <div 
                ref={sealRef}
                className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-12 h-12 bg-[#a81438] rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center border-2 border-[#d81b46]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ffd6a5]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Primary Action Button Below */}
          <div className="mt-8 flex flex-col items-center">
            {!isOpen ? (
              <MagneticButton>
              <button
                onClick={openLetter}
                className="btn-primary font-serif tracking-wide shadow-[0_0_20px_rgba(216,27,70,0.4)] cursor-pointer transition-all duration-300 hover:shadow-[0_0_28px_rgba(216,27,70,0.55)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd6a5]"
                aria-label="Open the letter"
              >
                Open the letter
              </button>
              </MagneticButton>
            ) : (
              <MagneticButton>
              <button
                onClick={(e) => closeLetter(e)}
                className="btn-ghost font-serif tracking-wide cursor-pointer transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ffd6a5]"
                aria-label="Close letter"
              >
                Close letter
              </button>
              </MagneticButton>
            )}
          </div>
        </div>
      </div>
      
      {/* Clip paths */}
      <style>{`
        .clip-left-flap { clip-path: polygon(0 0, 100% 50%, 0 100%); }
        .clip-right-flap { clip-path: polygon(100% 0, 0 50%, 100% 100%); }
        .clip-bottom-flap { clip-path: polygon(0 100%, 50% 0, 100% 100%); }
        .clip-top-flap { clip-path: polygon(0 0, 100% 0, 50% 100%); }
      `}</style>
    </section>
  );
};

export default LoveLetter;
