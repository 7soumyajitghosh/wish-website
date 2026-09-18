import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const FloatingHeart = ({ style }: { style: React.CSSProperties }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className="absolute text-rose-400/40"
    style={{ ...style, filter: 'drop-shadow(0 0 4px rgba(255,179,193,0.5))' }}
  >
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const TreeSilhouette = ({ treeRef }: { treeRef: React.RefObject<SVGSVGElement | null> }) => (
  <svg
    ref={treeRef as any}
    viewBox="0 0 200 250"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full max-w-[400px] h-auto drop-shadow-2xl"
    style={{ filter: 'drop-shadow(0 0 20px rgba(216,27,70,0.6))' }}
  >
    {/* Trunk */}
    <path d="M95 240 Q100 200 90 150 Q95 100 100 80 Q105 100 110 150 Q100 200 105 240 Z" fill="#fffdf8" opacity="0.8" />
    
    {/* Branches */}
    <path d="M100 150 Q70 120 40 100" stroke="#fffdf8" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    <path d="M100 130 Q130 100 160 80" stroke="#fffdf8" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    <path d="M100 100 Q80 70 60 50" stroke="#fffdf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <path d="M100 90 Q120 60 140 40" stroke="#fffdf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    <path d="M100 80 Q100 50 100 20" stroke="#fffdf8" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    
    {/* Heart Leaves */}
    <g fill="#d81b46">
      <path d="M40 100 A 10 10 0 0 1 60 100 C 60 115 50 125 40 135 C 30 125 20 115 20 100 A 10 10 0 0 1 40 100 Z" />
      <path d="M160 80 A 12 12 0 0 1 184 80 C 184 98 172 110 160 122 C 148 110 136 98 136 80 A 12 12 0 0 1 160 80 Z" />
      <path d="M60 50 A 8 8 0 0 1 76 50 C 76 62 68 70 60 78 C 52 70 44 62 44 50 A 8 8 0 0 1 60 50 Z" />
      <path d="M140 40 A 9 9 0 0 1 158 40 C 158 54 149 63 140 72 C 131 63 122 54 122 40 A 9 9 0 0 1 140 40 Z" />
      <path d="M100 20 A 15 15 0 0 1 130 20 C 130 42 115 57 100 72 C 85 57 70 42 70 20 A 15 15 0 0 1 100 20 Z" />
      
      {/* Small extra hearts */}
      <path d="M80 80 A 6 6 0 0 1 92 80 C 92 89 86 95 80 101 C 74 95 68 89 68 80 A 6 6 0 0 1 80 80 Z" fill="#ffb3c1" />
      <path d="M120 70 A 5 5 0 0 1 130 70 C 130 78 125 83 120 88 C 115 83 110 78 110 70 A 5 5 0 0 1 120 70 Z" fill="#f5baa4" />
      <path d="M70 120 A 4 4 0 0 1 78 120 C 78 126 74 130 70 134 C 66 130 62 126 62 120 A 4 4 0 0 1 70 120 Z" fill="#ffd6a5" />
    </g>
  </svg>
);

export const FullBloom = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const treeSvgRef = useRef<SVGSVGElement>(null);
  
  // Parallax effect
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !treeContainerRef.current) return;
      
      const rect = sectionRef.current.getBoundingClientRect();
      // Check if section is in viewport
      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        // Calculate scroll progress relative to section (0 to 1)
        const scrollProgress = 1 - (rect.bottom / (window.innerHeight + rect.height));
        
        // Tree moves slightly slower than scroll (translateY down as we scroll down)
        const yOffset = scrollProgress * 100 - 50; 
        treeContainerRef.current.style.transform = `translateY(${yOffset}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for GSAP reveals
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let ctx = gsap.context(() => {});
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ctx.add(() => {
            const tl = gsap.timeline();
            
            // Text fade up
            tl.fromTo(textRef.current,
              { y: 50, opacity: 0 },
              { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" }
            );
            
            // Tree scale in
            if (treeSvgRef.current) {
              tl.fromTo(treeSvgRef.current,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.5, ease: "power2.out" },
                "-=0.8"
              );
            }
          });
          observer.unobserve(section);
        }
        },
        { threshold: 0.25 }
      );

      if (sectionRef.current) {
        observer.observe(sectionRef.current);
      }

      return () => {
        observer.disconnect();
      };
    }, sectionRef);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ctx.revert();
    };
  }, []);

  return (
    <section 
      id="full-bloom" 
      ref={sectionRef}
      className="relative min-h-screen w-full bg-[#0d0408] overflow-hidden flex items-center justify-center py-20"
    >
      {/* Embedded CSS for floating animation */}
      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(1) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-120vh) scale(0.5) rotate(45deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Radial Gradient Glow behind tree */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,20,56,0.2)_0%,rgba(34,11,23,0.4)_50%,transparent_100%)] blur-[80px]" />
      </div>

      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,#0d0408_100%)] z-20" />

      {/* Drifting Heart Particles */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {STATIC_HEARTS.map((h, i) => (
          <FloatingHeart
            key={i}
            style={{
              width: `${h.size}px`,
              height: `${h.size}px`,
              left: `${h.left}%`,
              bottom: '-10%',
              animation: `floatUp ${h.duration}s linear ${h.delay}s infinite`,
              opacity: 0,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-30">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          
          {/* Tree Centered/Left */}
          <div 
            ref={treeContainerRef}
            className="flex-1 flex justify-center md:justify-end w-full will-change-transform"
          >
            <TreeSilhouette treeRef={treeSvgRef} />
          </div>

          {/* Text Content */}
          <div 
            ref={textRef}
            className="flex-1 flex flex-col items-center text-center md:items-start md:text-left max-w-xl opacity-0"
          >
            <span className="text-[#ffd6a5] text-sm md:text-base tracking-[0.3em] uppercase mb-4 font-semibold">
              Stage Twelve
            </span>
            <h2 className="text-[#fffdf8] text-5xl md:text-7xl font-serif mb-8 leading-tight drop-shadow-lg">
              Full Bloom
            </h2>
            <p className="text-[#fff8eb] text-lg md:text-xl font-light italic leading-relaxed opacity-90">
              "In the garden of life, love is the tree that never stops growing."
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
