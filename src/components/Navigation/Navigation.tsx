import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const navLinks = [
  { name: 'Story', href: '#story-experience' },
  { name: 'Destination', href: '#destination' },
  { name: 'Love Letter', href: '#love-letter' },
  { name: 'Make a Wish', href: '#make-a-wish' },
  { name: 'Milestones', href: '#journey' },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      // Entrance animation
      gsap.from(navRef.current, {
        y: -100,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2
      });
    }, navRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      if (menuRef.current) {
        menuRef.current.style.transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (isOpen) {
        gsap.to(menuRef.current, {
          x: 0,
          duration: 0.5,
          ease: 'power3.out'
        });
        gsap.fromTo(linksRef.current, 
          { x: 50, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'power2.out', delay: 0.2 }
        );
      } else {
        gsap.to(menuRef.current, {
          x: '100%',
          duration: 0.4,
          ease: 'power3.in'
        });
      }
    }, menuRef);

    return () => ctx.revert();
  }, [isOpen]);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    setIsOpen(false);
    const element = document.querySelector(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled 
          ? 'bg-[#0d0408]/80 backdrop-blur-md py-4 shadow-lg' 
          : 'bg-transparent py-6'
      }`}
      aria-label="Main Navigation"
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <a 
          href="#" 
          className="text-[#fffdf8] font-serif text-2xl tracking-wide hover:text-[#f5baa4] transition-colors"
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
              className="text-[#fff8eb] font-sans text-sm tracking-widest uppercase relative group overflow-hidden"
              onClick={(e) => handleSmoothScroll(e, link.href)}
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f5baa4] transform -translate-x-[101%] group-hover:translate-x-0 transition-transform duration-300 ease-out" />
            </a>
          ))}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden text-[#fffdf8] z-50 relative p-2 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
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
        className="fixed inset-0 bg-[#14070e] z-40 flex flex-col justify-center items-center md:hidden transform translate-x-full"
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col items-center space-y-8">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              ref={(el) => { linksRef.current[index] = el; }}
              href={link.href}
              className="text-[#fffdf8] font-serif text-3xl tracking-wide hover:text-[#f5baa4] transition-colors"
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
