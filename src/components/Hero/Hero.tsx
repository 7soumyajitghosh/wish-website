import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const Hero = () => {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!heroRef.current) return;
    
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.from('.hero-title', {
        y: 40,
        opacity: 0,
        duration: 1.5,
        delay: 0.2
      })
      .from('.hero-subtitle', {
        y: 20,
        opacity: 0,
        duration: 1,
      }, "-=0.8")
      .from('.hero-btn', {
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
      }, "-=0.6")
      .from('.scroll-indicator', {
        opacity: 0,
        y: -15,
        duration: 1,
      }, "-=0.4");
      
    }, heroRef);

    // Simple parallax effect for background gradient
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Only animate if hero is visible
      if (heroRef.current && scrollY <= window.innerHeight) {
         const bg = heroRef.current.querySelector('.hero-bg') as HTMLElement;
         if (bg) {
           bg.style.transform = `translateY(${scrollY * 0.4}px)`;
         }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Particle System
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;

      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4 - 0.2;
        this.opacity = Math.random() * 0.6 + 0.1;
      }

      update(w: number, h: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around screen
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 179, 193, ${this.opacity})`; // rose accent
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 179, 193, 0.8)';
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const w = canvas.width;
      const h = canvas.height;
      // Create ~30 particles
      for (let i = 0; i < 30; i++) {
        particles.push(new Particle(w, h));
      }
    };

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.update(w, h);
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      id="hero" 
      ref={heroRef}
      className="relative w-full h-screen min-h-[600px] overflow-hidden flex flex-col justify-center items-center bg-[#0d0408]"
      aria-label="Welcome"
    >
      {/* Background Gradient with Parallax Target */}
      <div 
        className="hero-bg absolute inset-0 w-full h-[130%] pointer-events-none origin-top"
        style={{
          background: 'linear-gradient(to bottom, #0d0408 0%, #220b17 40%, #14070e 75%, #a81438 100%)',
          top: '-15%',
          left: 0,
        }}
      />

      {/* Floating Particles */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center text-center px-4 max-w-5xl mx-auto w-full">
        
        {/* Subtle Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 max-w-lg bg-[#f5baa4] opacity-10 blur-[100px] rounded-full pointer-events-none" />

        <h1 className="hero-title text-5xl md:text-7xl lg:text-8xl font-serif text-[#fffdf8] tracking-wide leading-tight mb-6 drop-shadow-xl">
          Where Love<br />Takes Flight
        </h1>
        
        <p className="hero-subtitle text-lg md:text-xl lg:text-2xl font-sans text-[#fff8eb] font-light mb-12 max-w-2xl opacity-90 drop-shadow-md">
          A cinematic journey through the 16 stages of love
        </p>

        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <button 
            onClick={() => scrollToSection('experience')}
            className="hero-btn group relative px-8 py-4 rounded-full bg-gradient-to-r from-[#d81b46] to-[#a81438] text-[#fffdf8] font-medium text-lg overflow-hidden transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(216,27,70,0.4)]"
            aria-label="Begin the Journey"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            <span className="relative z-10">Begin the Journey</span>
          </button>

          <button 
            onClick={() => scrollToSection('journey')}
            className="hero-btn group px-8 py-4 rounded-full border-2 border-[#f5baa4] text-[#f5baa4] font-medium text-lg transition-all hover:bg-[#f5baa4] hover:text-[#0d0408] active:scale-95"
            aria-label="Explore the Story"
          >
            Explore the Story
          </button>
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <button 
        onClick={() => scrollToSection('experience')}
        className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-[#f5baa4] opacity-70 hover:opacity-100 transition-opacity flex flex-col items-center cursor-pointer"
        aria-label="Scroll down to content"
      >
        <span className="text-xs font-sans tracking-[0.2em] uppercase mb-2">Scroll</span>
        <svg 
          className="w-6 h-6 animate-bounce" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
};
