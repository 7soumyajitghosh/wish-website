import React, { useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';

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

  const openLetter = () => {
    if (isOpen) return;
    setIsLetterOpen(true);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.to(sealRef.current, { scale: 1.4, opacity: 0, duration: 0.35, ease: 'power2.inOut' })
        .to(flapRef.current, { rotateX: 180, transformOrigin: 'top', duration: 0.55, ease: 'power2.inOut' }, '-=0.15')
        .to(letterRef.current, { y: -160, zIndex: 30, duration: 0.7, ease: 'power3.out' })
        .to(letterRef.current, { 
          scale: 1.15, 
          y: -70, 
          duration: 0.5, 
          ease: 'power2.out',
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.7)'
        })
        .fromTo('.letter-line', 
          { opacity: 0, y: 15 }, 
          { opacity: 1, y: 0, stagger: 0.15, duration: 0.5, ease: 'power2.out' }, 
          '-=0.3'
        );
    }, containerRef);

    return () => ctx.revert();
  };

  const closeLetter = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isOpen) return;
    setIsLetterOpen(false);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.to('.letter-line', { opacity: 0, y: 10, duration: 0.25, stagger: -0.05, ease: 'power2.in' })
        .to(letterRef.current, { scale: 1, y: 0, duration: 0.5, ease: 'power2.inOut' })
        .to(letterRef.current, { zIndex: 10, duration: 0.05 })
        .to(flapRef.current, { rotateX: 0, duration: 0.5, ease: 'power2.inOut' }, '-=0.1')
        .to(sealRef.current, { scale: 1, opacity: 1, duration: 0.35, ease: 'power2.inOut' });
    }, containerRef);
    
    return () => ctx.revert();
  };

  return (
    <section 
      id="love-letter" 
      className="relative min-h-screen flex flex-col items-center justify-center py-28 bg-[#0d0408] overflow-hidden select-none"
      ref={containerRef}
      aria-label="Love Letter Section"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2a0e1e] via-[#12050c] to-[#0d0408] opacity-80" />
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-6 flex flex-col items-center">
        <header className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.35em] text-[#f5baa4] font-sans">
            A Keepsake of Affection
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-[#fffdf8] mt-2 mb-3">
            The Love Letter
          </h2>
          <p className="text-sm font-sans text-[#fff8eb]/70 italic">
            Written in the stillness between heartbeats
          </p>
        </header>

        {/* Envelope Interactive Unit */}
        <div className="relative flex flex-col items-center mb-10">
          <div 
            className="relative w-[320px] sm:w-[420px] h-[240px] sm:h-[280px] cursor-pointer"
            onClick={isOpen ? undefined : openLetter}
            role="button"
            tabIndex={0}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Love letter is open" : "Click to open the love letter"}
            style={{ perspective: '1000px' }}
          >
            {/* Envelope Back */}
            <div className="absolute inset-0 bg-[#220b17] rounded-xl shadow-2xl overflow-hidden border border-[#d81b46]/30" />

            {/* Letter Paper */}
            <div 
              ref={letterRef}
              className="absolute bottom-2 left-3 right-3 top-2 bg-[#fdfaf2] rounded-lg p-6 sm:p-8 shadow-2xl flex flex-col z-10 border border-[#e5d5c5]"
            >
              <div className="w-full h-full font-serif text-slate-800 flex flex-col text-sm sm:text-[15px] leading-relaxed">
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
                    className="text-xs font-sans uppercase tracking-widest text-[#a81438] hover:text-[#d81b46] font-semibold py-1 px-2 rounded hover:bg-rose-50 transition-colors cursor-pointer"
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
                    className="letter-line absolute -top-3 -right-3 w-8 h-8 bg-[#d81b46] text-[#fffdf8] rounded-full flex items-center justify-center shadow-lg hover:bg-[#a81438] transition-all hover:scale-110 cursor-pointer"
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
              <button
                onClick={openLetter}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-[#d81b46] to-[#f5baa4] text-[#fffdf8] font-serif text-base tracking-wide hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(216,27,70,0.4)] transition-all cursor-pointer"
                aria-label="Open the letter"
              >
                Open the letter
              </button>
            ) : (
              <button
                onClick={(e) => closeLetter(e)}
                className="px-8 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#fffdf8] font-serif text-base tracking-wide transition-all cursor-pointer"
                aria-label="Close letter"
              >
                Close letter
              </button>
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
