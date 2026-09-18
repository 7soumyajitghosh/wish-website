import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

const content = {
  recipient: 'My Dearest,',
  date: 'A quiet starlit evening',
  paragraphs: [
    'In a world that is constantly rushing, you are the stillness I always seek. Every ordinary moment becomes precious simply because you are part of it.',
    'Like roots that find their way through stone and branches that reach fearless toward the sun, my love for you has grown quietly, deeply, and unconditionally.',
    'You are my favorite thought before falling asleep, my fondest wish upon every shooting star, and the warmth that stays long after the light fades.'
  ],
  signOff: 'Forever & always yours,',
  sender: 'With all my heart'
};

export const LoveLetter: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  const flapRef = useRef<HTMLDivElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const openLetter = () => {
    if (isOpen) return;
    setIsOpen(true);

    if (isReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.to(sealRef.current, { scale: 1.5, opacity: 0, duration: 0.4, ease: 'power2.inOut' })
        .to(flapRef.current, { rotateX: 180, transformOrigin: 'top', duration: 0.6, ease: 'power2.inOut' }, '-=0.2')
        .to(letterRef.current, { y: -200, zIndex: 30, duration: 0.8, ease: 'power3.out' })
        .to(letterRef.current, { 
          scale: 1.2, 
          y: -100, 
          duration: 0.6, 
          ease: 'power2.out',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        })
        .fromTo('.letter-line', 
          { opacity: 0, y: 20 }, 
          { opacity: 1, y: 0, stagger: 0.2, duration: 0.6, ease: 'power2.out' }, 
          '-=0.4'
        );
    }, containerRef);

    return () => ctx.revert();
  };

  const closeLetter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) return;
    setIsOpen(false);
    
    if (isReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.to('.letter-line', { opacity: 0, y: 10, duration: 0.3, stagger: -0.1, ease: 'power2.in' })
        .to(letterRef.current, { scale: 1, y: 0, duration: 0.6, ease: 'power2.inOut' })
        .to(letterRef.current, { zIndex: 10, duration: 0.1 })
        .to(flapRef.current, { rotateX: 0, duration: 0.6, ease: 'power2.inOut' }, '-=0.1')
        .to(sealRef.current, { scale: 1, opacity: 1, duration: 0.4, ease: 'power2.inOut' });
    }, containerRef);
    
    return () => ctx.revert();
  };

  return (
    <section 
      id="love-letter" 
      className="relative min-h-screen flex flex-col items-center justify-center py-24 bg-[#0d0408] overflow-hidden"
      ref={containerRef}
      aria-label="Love Letter Section"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#220b17] via-[#0d0408] to-[#0d0408] opacity-70"></div>
      
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-serif text-[#ffd6a5] mb-16 text-center">
          Love Letter
        </h2>
        
        {/* Envelope Container */}
        <div 
          className="relative w-full max-w-[320px] sm:max-w-[400px] h-[240px] sm:h-[300px] cursor-pointer"
          onClick={openLetter}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openLetter(); }}
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-label="Open Love Letter"
          style={{ perspective: '1000px' }}
        >
          {/* Envelope Back */}
          <div className="absolute inset-0 bg-[#220b17] rounded-md shadow-2xl overflow-hidden border border-[#d81b46]/20"></div>

          {/* Letter Paper */}
          <div 
            ref={letterRef}
            className={`absolute bottom-2 left-2 right-2 top-2 bg-[#fbf7ef] rounded p-6 shadow-inner flex flex-col ${isReducedMotion && isOpen ? 'scale-110 -translate-y-[100px] z-30' : 'z-10'}`}
          >
            <div ref={textRef} className={`w-full h-full font-serif text-slate-800 flex flex-col text-sm sm:text-base ${isReducedMotion && !isOpen ? 'opacity-0' : ''}`}>
              <div className="letter-line flex justify-between mb-4 italic text-slate-600">
                <span>{content.recipient}</span>
                <span className="text-xs">{content.date}</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 mb-4 pb-4">
                {content.paragraphs.map((text, i) => (
                  <p key={i} className="letter-line leading-relaxed">{text}</p>
                ))}
              </div>
              
              <div className="letter-line mt-auto text-right italic font-semibold text-[#a81438]">
                <p>{content.signOff}</p>
                <p className="mt-1">{content.sender}</p>
              </div>

              {isOpen && (
                <button
                  onClick={closeLetter}
                  className="letter-line absolute -top-4 -right-4 w-8 h-8 bg-[#d81b46] text-[#fffdf8] rounded-full flex items-center justify-center shadow-lg hover:bg-[#a81438] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d81b46]"
                  aria-label="Close Letter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Envelope Front Flaps (Left, Right, Bottom) */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {/* Left flap */}
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[#1c0812] clip-left-flap border-r border-[#d81b46]/10"></div>
            {/* Right flap */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#1c0812] clip-right-flap border-l border-[#d81b46]/10"></div>
            {/* Bottom flap */}
            <div className="absolute bottom-0 left-0 w-full h-[60%] bg-[#2a0e1c] clip-bottom-flap border-t border-[#d81b46]/20 flex items-end justify-center pb-4">
              <span className={`text-[#f5baa4]/70 text-sm font-serif italic transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}>
                A Letter for You
              </span>
            </div>
          </div>

          {/* Envelope Top Flap */}
          <div 
            ref={flapRef}
            className={`absolute top-0 left-0 w-full h-[60%] bg-[#361324] clip-top-flap z-30 shadow-sm border-b border-[#d81b46]/30 ${isReducedMotion && isOpen ? '[transform:rotateX(180deg)]' : ''}`}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Wax Seal */}
            <div 
              ref={sealRef}
              className={`absolute bottom-[-15px] left-1/2 -translate-x-1/2 w-12 h-12 bg-[#a81438] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.3)] flex items-center justify-center border-2 border-[#d81b46] ${isReducedMotion && isOpen ? 'hidden' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ffd6a5]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </div>
          
          {/* Hint text when closed */}
          {!isOpen && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[#fff8eb]/50 text-xs tracking-widest uppercase animate-pulse w-full text-center">
              Tap to open
            </div>
          )}
        </div>
      </div>
      
      {/* Required CSS for custom clip-paths */}
      <style>{`
        .clip-left-flap { clip-path: polygon(0 0, 100% 50%, 0 100%); }
        .clip-right-flap { clip-path: polygon(100% 0, 0 50%, 100% 100%); }
        .clip-bottom-flap { clip-path: polygon(0 100%, 50% 0, 100% 100%); }
        .clip-top-flap { clip-path: polygon(0 0, 100% 0, 50% 100%); }
      `}</style>
    </section>
  );
};
