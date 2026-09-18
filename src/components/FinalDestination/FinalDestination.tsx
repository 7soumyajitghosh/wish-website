import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

const DESTINATION_HEARTS = [
  { left: 10, top: 120, duration: 18, delay: 1.5, size: 18 },
  { left: 25, top: 140, duration: 22, delay: 3.2, size: 24 },
  { left: 40, top: 110, duration: 16, delay: 0.8, size: 14 },
  { left: 55, top: 160, duration: 20, delay: 4.5, size: 26 },
  { left: 70, top: 130, duration: 24, delay: 2.1, size: 20 },
  { left: 85, top: 150, duration: 17, delay: 5.7, size: 22 },
  { left: 18, top: 170, duration: 21, delay: 6.3, size: 16 },
  { left: 34, top: 135, duration: 19, delay: 2.8, size: 28 },
  { left: 62, top: 155, duration: 23, delay: 4.1, size: 15 },
  { left: 78, top: 125, duration: 15, delay: 1.2, size: 25 },
  { left: 48, top: 165, duration: 25, delay: 7.0, size: 19 },
  { left: 92, top: 145, duration: 18, delay: 3.6, size: 21 },
];

const FAIRY_LIGHTS = [
  { left: 5, top: 15, size: 3.5, duration: 2.2, delay: 0.4 },
  { left: 12, top: 28, size: 2.5, duration: 1.8, delay: 1.1 },
  { left: 19, top: 10, size: 4.0, duration: 3.1, delay: 0.2 },
  { left: 26, top: 22, size: 3.0, duration: 2.5, delay: 1.7 },
  { left: 33, top: 8, size: 2.8, duration: 1.9, delay: 0.8 },
  { left: 41, top: 25, size: 3.8, duration: 2.7, delay: 1.4 },
  { left: 49, top: 14, size: 4.2, duration: 3.4, delay: 0.5 },
  { left: 56, top: 20, size: 2.4, duration: 2.1, delay: 1.9 },
  { left: 63, top: 9, size: 3.6, duration: 2.8, delay: 0.7 },
  { left: 71, top: 26, size: 4.5, duration: 3.0, delay: 1.3 },
  { left: 78, top: 12, size: 2.6, duration: 1.7, delay: 0.3 },
  { left: 85, top: 24, size: 3.2, duration: 2.4, delay: 1.6 },
  { left: 93, top: 16, size: 4.1, duration: 3.2, delay: 0.9 },
  { left: 15, top: 32, size: 2.9, duration: 2.0, delay: 1.2 },
  { left: 37, top: 30, size: 3.4, duration: 2.6, delay: 0.6 },
  { left: 52, top: 33, size: 2.7, duration: 1.9, delay: 1.8 },
  { left: 68, top: 31, size: 3.9, duration: 2.9, delay: 0.4 },
  { left: 82, top: 34, size: 4.3, duration: 3.3, delay: 1.5 },
  { left: 22, top: 18, size: 3.1, duration: 2.3, delay: 0.8 },
  { left: 89, top: 29, size: 2.8, duration: 2.2, delay: 1.0 },
];

export const FinalDestination: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const ctx = gsap.context(() => {
      const elements = gsap.utils.toArray('.reveal-element');
      gsap.fromTo(
        elements,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.5,
          stagger: 0.2,
          ease: 'power3.out',
        }
      );

      if (textRef.current) {
        gsap.fromTo(
          textRef.current.children,
          { opacity: 0, scale: 0.9, y: 30 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.5,
            stagger: 0.3,
            ease: 'expo.out',
            delay: 0.5,
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [isVisible]);

  const offset = scrollY * 0.1; // Reduced multiplier for smoother parallax

  return (
    <section
      id="destination"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#14070e] via-[#220b17] to-[#0d0408]"
      aria-label="The Final Destination: Where Love Takes Flight"
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full">
        {/* Glowing heart-shaped sun */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-[10%] w-64 h-64 sm:w-96 sm:h-96 reveal-element z-0 pointer-events-none"
          style={{ transform: `translate(-50%, ${offset * 1.5}px)` }}
        >
          <div className="absolute inset-0 bg-[#d81b46] rounded-full blur-[100px] opacity-40 mix-blend-screen" />
          <svg viewBox="0 0 100 100" className="w-full h-full text-[#ffb3c1] drop-shadow-[0_0_30px_rgba(255,179,193,0.9)] opacity-90">
            <path d="M50 85 C 0 50, 0 10, 50 35 C 100 10, 100 50, 50 85 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Cherry blossom branches - Top Left */}
        <div 
          className="absolute top-0 left-0 w-64 h-64 sm:w-96 sm:h-96 origin-top-left reveal-element z-10 pointer-events-none"
          style={{ transform: `translateY(${offset * -0.5}px)` }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-80">
            <path d="M-10 10 Q 50 20, 80 50 T 150 70 M 30 30 Q 70 80, 100 120" fill="none" stroke="#0a0306" strokeWidth="6" strokeLinecap="round" />
            <circle cx="50" cy="20" r="4" fill="#f5baa4" opacity="0.9" />
            <circle cx="80" cy="50" r="5" fill="#ffb3c1" opacity="0.9" />
            <circle cx="120" cy="65" r="3" fill="#f5baa4" opacity="0.9" />
            <circle cx="150" cy="70" r="6" fill="#ffb3c1" opacity="0.9" />
            <circle cx="60" cy="60" r="4" fill="#f5baa4" opacity="0.9" />
            <circle cx="100" cy="120" r="5" fill="#ffb3c1" opacity="0.9" />
          </svg>
        </div>

        {/* Cherry blossom branches - Top Right */}
        <div 
          className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 origin-top-right reveal-element z-10 pointer-events-none scale-x-[-1]"
          style={{ transform: `scaleX(-1) translateY(${offset * -0.6}px)` }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-80">
            <path d="M-10 20 Q 60 10, 90 60 T 160 80 M 40 40 Q 80 90, 110 130" fill="none" stroke="#0a0306" strokeWidth="6" strokeLinecap="round" />
            <circle cx="60" cy="10" r="4" fill="#f5baa4" opacity="0.9" />
            <circle cx="90" cy="60" r="5" fill="#ffb3c1" opacity="0.9" />
            <circle cx="130" cy="75" r="3" fill="#f5baa4" opacity="0.9" />
            <circle cx="160" cy="80" r="6" fill="#ffb3c1" opacity="0.9" />
            <circle cx="70" cy="70" r="4" fill="#f5baa4" opacity="0.9" />
            <circle cx="110" cy="130" r="5" fill="#ffb3c1" opacity="0.9" />
          </svg>
        </div>

        {/* Winding stone pathway */}
        <div className="absolute bottom-0 left-0 w-full h-[40%] flex justify-center items-end reveal-element z-0">
          <div className="relative w-full h-full flex justify-center">
            <div className="absolute bottom-4 w-32 h-6 bg-[#1a0812] rounded-[100%] opacity-80" />
            <div className="absolute bottom-12 w-24 h-5 bg-[#1a0812] rounded-[100%] opacity-70 -ml-8" />
            <div className="absolute bottom-20 w-16 h-4 bg-[#1a0812] rounded-[100%] opacity-60 ml-12" />
            <div className="absolute bottom-28 w-12 h-3 bg-[#1a0812] rounded-[100%] opacity-50 -ml-4" />
            <div className="absolute bottom-32 w-8 h-2 bg-[#1a0812] rounded-[100%] opacity-40 ml-4" />
          </div>
        </div>

        {/* Victorian Street Lamp */}
        <div 
          className="absolute bottom-0 left-[10%] sm:left-[20%] w-32 h-64 sm:w-48 sm:h-96 reveal-element z-20 pointer-events-none"
          style={{ transform: `translateY(${offset * -0.2}px)` }}
        >
          <svg viewBox="0 0 100 300" className="w-full h-full">
            {/* Base */}
            <path d="M30 300 L70 300 L65 260 L35 260 Z" fill="#070204" />
            <path d="M35 260 L65 260 L60 220 L40 220 Z" fill="#070204" />
            {/* Post */}
            <rect x="45" y="80" width="10" height="140" fill="#070204" />
            {/* Decorative brackets */}
            <path d="M45 100 Q 30 110, 45 140" fill="none" stroke="#070204" strokeWidth="2" />
            <path d="M55 100 Q 70 110, 55 140" fill="none" stroke="#070204" strokeWidth="2" />
            {/* Lamp base */}
            <path d="M35 80 L65 80 L55 60 L45 60 Z" fill="#070204" />
            {/* Glass panels */}
            <path d="M40 60 L60 60 L55 20 L45 20 Z" fill="#ffd6a5" opacity="0.9" />
            {/* Inner glow representation */}
            <circle cx="50" cy="40" r="10" fill="#fffdf8" className="animate-pulse" style={{ animationDuration: '3s' }} />
            {/* Lamp top */}
            <path d="M30 20 L70 20 L50 0 Z" fill="#070204" />
            {/* Glow effect */}
            <circle cx="50" cy="40" r="60" fill="#ffd6a5" opacity="0.15" className="animate-pulse" style={{ mixBlendMode: 'screen' }} />
            <circle cx="50" cy="40" r="30" fill="#ffd6a5" opacity="0.25" className="animate-pulse" style={{ mixBlendMode: 'screen' }} />
          </svg>
        </div>

        {/* Garden Bench */}
        <div 
          className="absolute bottom-10 right-[10%] sm:right-[20%] w-48 h-32 sm:w-64 sm:h-48 reveal-element z-20 pointer-events-none"
          style={{ transform: `translateY(${offset * -0.15}px)` }}
        >
          <svg viewBox="0 0 200 150" className="w-full h-full drop-shadow-2xl">
            {/* Backrest */}
            <rect x="25" y="40" width="150" height="8" rx="2" fill="#070204" />
            <rect x="25" y="55" width="150" height="8" rx="2" fill="#070204" />
            <rect x="25" y="70" width="150" height="8" rx="2" fill="#070204" />
            {/* Vertical back supports */}
            <rect x="35" y="40" width="6" height="40" fill="#070204" />
            <rect x="97" y="40" width="6" height="40" fill="#070204" />
            <rect x="159" y="40" width="6" height="40" fill="#070204" />
            {/* Seat */}
            <path d="M15 85 L185 85 L190 95 L10 95 Z" fill="#0a0306" />
            <path d="M10 95 L190 95 L195 105 L5 105 Z" fill="#070204" />
            {/* Armrests */}
            <path d="M25 60 C 15 60, 15 85, 10 95 L 20 95 C 25 85, 25 65, 35 65 Z" fill="#070204" />
            <path d="M175 60 C 185 60, 185 85, 190 95 L 180 95 C 175 85, 175 65, 165 65 Z" fill="#070204" />
            {/* Legs */}
            <rect x="20" y="105" width="8" height="40" rx="1" fill="#070204" />
            <rect x="172" y="105" width="8" height="40" rx="1" fill="#070204" />
            <rect x="40" y="100" width="6" height="25" rx="1" fill="#040102" />
            <rect x="154" y="100" width="6" height="25" rx="1" fill="#040102" />
          </svg>
        </div>

        {/* Ambient floating hearts (CSS driven) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
          {DESTINATION_HEARTS.map((h, i) => (
            <div
              key={`heart-${i}`}
              className="absolute text-[#ffb3c1] opacity-30 animate-pulse"
              style={{
                left: `${h.left}%`,
                top: `${h.top}%`,
                animation: `floatUp ${h.duration}s linear infinite`,
                animationDelay: `${h.delay}s`,
                width: `${h.size}px`,
                height: `${h.size}px`
              }}
            >
              <svg viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 85 C 0 50, 0 10, 50 35 C 100 10, 100 50, 50 85 Z" />
              </svg>
            </div>
          ))}
        </div>

        {/* Fairy lights (twinkling dots) */}
        <div className="absolute top-0 left-0 w-full h-1/3 pointer-events-none z-10">
          {FAIRY_LIGHTS.map((l, i) => (
            <div
              key={`light-${i}`}
              className="absolute bg-[#ffd6a5] rounded-full animate-pulse"
              style={{
                left: `${l.left}%`,
                top: `${l.top}%`,
                width: `${l.size}px`,
                height: `${l.size}px`,
                animationDuration: `${l.duration}s`,
                animationDelay: `${l.delay}s`,
                boxShadow: '0 0 5px 1px #ffd6a5'
              }}
            />
          ))}
        </div>

        {/* Text Overlay */}
        <div className="absolute inset-0 z-30 flex flex-col justify-center items-center text-center px-4 sm:px-8 pointer-events-none">
          <div ref={textRef} className="max-w-4xl flex flex-col items-center gap-6">
            <span className="text-[#f5baa4] uppercase tracking-[0.3em] text-xs sm:text-sm font-semibold opacity-0">
              The Destination
            </span>
            
            <h2 
              className="text-4xl sm:text-6xl md:text-7xl font-serif text-[#fffdf8] italic drop-shadow-lg opacity-0"
              style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
            >
              Where Love Takes Flight
            </h2>
            
            <p className="text-[#fff8eb] text-lg sm:text-xl md:text-2xl font-light max-w-2xl drop-shadow-md leading-relaxed opacity-0">
              Every seed of kindness planted with love blossoms into an eternal garden of dreams.
            </p>
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) scale(1.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
};
