import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';

const navLinks = [
  { name: 'Story', href: '#story-experience' },
  { name: 'Destination', href: '#destination' },
  { name: 'Love Letter', href: '#love-letter' },
  { name: 'Make a Wish', href: '#make-a-wish' },
  { name: 'Milestones', href: '#journey' },
];

export function Navigation() {
  const { isExperienceUnlocked } = useStory();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const menuTlRef = useRef<gsap.core.Timeline | null>(null);
  const prevOpenRef = useRef(false);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setIsScrolled(window.scrollY > 50);
    };
    const handleScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Intro + initial menu position (layout effect avoids flash).
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // GSAP owns menu x (no Tailwind translate class); set hidden initial state once.
    if (menuRef.current) gsap.set(menuRef.current, { x: '100%' });
    if (prefersReducedMotion) return;

    const tween = gsap.from(navRef.current, {
      y: -100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      delay: 0.2,
      overwrite: 'auto',
    });
    return () => {
      tween.kill();
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (menuRef.current) {
        menuRef.current.style.transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
      }
      return;
    }

    // Kill (don't revert) so the menu keeps its end-state position.
    menuTlRef.current?.kill();
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
    menuTlRef.current = tl;
    if (isOpen) {
      tl.to(menuRef.current, {
        x: 0,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      const links = linksRef.current.filter(Boolean);
      if (links.length > 0) {
        tl.fromTo(links,
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out' },
          0.2
        );
      }
    } else {
      tl.to(menuRef.current, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in',
        overwrite: 'auto',
      });
    }

    // No effect cleanup here: next run kills the superseded timeline at
    // the top; unmount kills via the effect below. Revert would wipe position.
  }, [isOpen]);

  // Kill menu timeline on unmount (keeps end-state during updates).
  useEffect(() => {
    return () => {
      menuTlRef.current?.kill();
      menuTlRef.current = null;
    };
  }, []);

  // Mobile menu a11y: focus first link on open, return focus on close,
  // Esc closes, and body scroll locks while open.
  useEffect(() => {
    if (isOpen) {
      prevOpenRef.current = true;
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      linksRef.current[0]?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = prevOverflow;
      };
    } else if (prevOpenRef.current) {
      prevOpenRef.current = false;
      toggleRef.current?.focus();
    }
  }, [isOpen]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    setIsOpen(false);
    if (!isExperienceUnlocked && target !== 'body' && target !== '#hero') {
      return;
    }
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out py-4 ${
        isScrolled 
          ? 'bg-[#0d0408]/80 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
      aria-label="Main Navigation"
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <a 
          href="#" 
          className="text-[#fffdf8] font-serif text-2xl tracking-wide hover:text-[#f5baa4] transition-colors focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm"
          onClick={(e) => handleSmoothScroll(e, 'body')}
        >
          A Journey of Love
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-[#fff8eb] font-sans text-sm tracking-widest uppercase relative group overflow-hidden focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm"
              onClick={(e) => handleSmoothScroll(e, link.href)}
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f5baa4] transform -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            </a>
          ))}
        </div>

        {/* Mobile Toggle Button */}
        <button
          ref={toggleRef}
          className="md:hidden text-[#fffdf8] z-50 relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Panel */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className="fixed inset-0 bg-[#14070e] z-40 flex flex-col justify-center items-center md:hidden"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <div className="flex flex-col items-center space-y-8">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              ref={(el) => { linksRef.current[index] = el; }}
              href={link.href}
              tabIndex={isOpen ? 0 : -1}
              className="text-[#fffdf8] font-serif text-3xl tracking-wide hover:text-[#f5baa4] transition-colors focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm"
              onClick={(e) => handleSmoothScroll(e, link.href)}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
