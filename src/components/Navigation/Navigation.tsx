import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { useStory } from '../../context/StoryContext';

const navLinks = [
  { name: 'Story', href: '#story-experience' },
  { name: 'Destination', href: '#destination' },
  { name: 'Love Letter', href: '#love-letter' },
  { name: 'Make a Wish', href: '#make-a-wish' },
  { name: 'Play & Puzzles', href: '#playground' },
  { name: 'Milestones', href: '#journey' },
];

export function Navigation() {
  const { isExperienceUnlocked, setIntroState, setPendingTarget } = useStory();
  const [activeSection, setActiveSection] = useState<string | null>(null);
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
      // Functional set: no re-render when the state doesn't actually change.
      setIsScrolled((prev) => {
        const next = window.scrollY > 50;
        return prev === next ? prev : next;
      });
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

  useEffect(() => {
    if (!isExperienceUnlocked) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (document.querySelector('#story-experience')) return;
      const candidates = navLinks.filter((link) => link.href !== '#story-experience')
        .map((link) => ({ href: link.href, el: document.querySelector(link.href) }))
        .filter((item): item is { href: string; el: Element } => !!item.el);
      let current = candidates[0]?.href ?? null;
      for (const item of candidates) {
        if (item.el.getBoundingClientRect().top <= window.innerHeight * 0.35) current = item.href;
      }
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = candidates.at(-1)?.href ?? current;
      setActiveSection(current);
    };
    const request = () => { if (!frame) frame = requestAnimationFrame(update); };
    request();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', request); window.removeEventListener('resize', request); };
  }, [isExperienceUnlocked]);

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
  // Esc closes, focus stays trapped inside while open, and body scroll
  // locks while open (re-asserted if the intro gate unlocks underneath).
  useEffect(() => {
    if (isOpen) {
      prevOpenRef.current = true;
      document.body.style.overflow = 'hidden';
      linksRef.current[0]?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
          return;
        }
        // Simple focus trap: wrap Tab around the toggle + menu links.
        if (e.key === 'Tab') {
          const toggle = toggleRef.current;
          const links = linksRef.current.filter((el): el is HTMLAnchorElement => el !== null);
          if (!toggle && links.length === 0) return;
          const first: HTMLElement = toggle ?? links[0];
          const last: HTMLElement = links.length > 0 ? links[links.length - 1] : toggle as HTMLElement;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener('keydown', onKey);
      return () => {
        window.removeEventListener('keydown', onKey);
        // Gate-aware restore: the intro gate (App) and this menu are the
        // only body-overflow writers. Restore the gate's state, not a stale
        // snapshot — unlocking mid-menu must not leave the page scrollable
        // under an open menu, nor locked after the menu closes.
        document.body.style.overflow = isExperienceUnlocked ? '' : 'hidden';
      };
    } else if (prevOpenRef.current) {
      prevOpenRef.current = false;
      toggleRef.current?.focus();
    }
  }, [isOpen, isExperienceUnlocked]);

  const prefersReducedMotion = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const smoothScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    setIsOpen(false);
    // The intro gate is escapable: clicking a link unlocks the experience.
    // While locked, never scroll here — the 100vh intro is still mounted so
    // any measurement is off by a viewport after it unmounts. Stash the
    // target and let App scroll once the landing page is destroyed.
    if (target === 'body') {
      if (!isExperienceUnlocked) {
        setPendingTarget('top');
        setIntroState('EXPERIENCE_UNLOCKED');
        return;
      }
      smoothScrollToTop();
      return;
    }
    // The landing intro is fully unmounted after its leaf transition, so
    // #story-experience no longer exists — fall back to the new top page
    // (#destination at scroll 0) instead of leaving a dead link.
    const fallbackToTop = () => smoothScrollToTop();
    if (!isExperienceUnlocked) {
      setPendingTarget(target);
      setIntroState('EXPERIENCE_UNLOCKED');
      return;
    }
    if (target === '#story-experience' && !document.querySelector('#story-experience')) {
      fallbackToTop();
      return;
    }
    const element = document.querySelector(target);
    if (element) {
      if (prefersReducedMotion()) {
        (element as HTMLElement).scrollIntoView();
      } else {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === '#destination') {
      fallbackToTop();
    }
  };

  return (
    <>
    <nav
      ref={navRef}
      className={`editorial-nav fixed top-0 left-0 w-full z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'bg-[#0d0408]/85 backdrop-blur-md shadow-lg py-2.5'
          : 'bg-transparent py-4'
      }`}
      aria-label="Main Navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <a
          href="#main-content"
          className="relative z-50 text-[#fffdf8] font-serif tracking-wide hover:text-[#f5baa4] transition-colors focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm truncate max-w-[62vw] sm:max-w-none text-lg sm:text-2xl"
          onClick={(e) => handleSmoothScroll(e, 'body')}
        >
          A Journey of Love
        </a>

        {/* Desktop Links */}
        <div className="hidden xl:flex space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              aria-current={activeSection === link.href ? 'location' : undefined}
              className="text-[#fff8eb] font-sans text-sm tracking-widest uppercase relative group overflow-hidden py-2 focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm"
              onClick={(e) => handleSmoothScroll(e, link.href)}
            >
              {link.name}
              <span aria-hidden="true" className="absolute bottom-0 left-0 w-full h-[1px] bg-[#f5baa4] transform -translate-x-[101%] group-hover:translate-x-0 group-focus-within:translate-x-0 group-focus-visible:translate-x-0 transition-transform duration-300 ease-out" />
            </a>
          ))}
        </div>

        {/* Mobile Toggle Button */}
        <button
          ref={toggleRef}
          className="xl:hidden text-[#fffdf8] z-50 relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-md"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
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

    </nav>

      {/* Mobile Menu Panel — hidden (not just off-screen) when closed so it
          skips paint + never intercepts touches */}
      <div
        ref={menuRef}
        id="mobile-menu"
        className="fixed inset-0 h-[100dvh] bg-[#14070e] z-40 flex flex-col justify-center items-center xl:hidden overflow-y-auto py-24 px-4"
        style={{
          visibility: isOpen ? 'visible' : 'hidden',
          // Delay hiding until the GSAP slide-out (~0.4s) finishes so the
          // close animation still plays; hidden afterwards skips paint.
          transition: isOpen ? 'visibility 0s' : 'visibility 0s linear 0.45s',
        }}
        aria-hidden={!isOpen}
        inert={!isOpen ? true : undefined}
      >
        <div className="flex flex-col items-center space-y-2 sm:space-y-4 w-full">
          {navLinks.map((link, index) => (
            <a
              key={link.name}
              ref={(el) => { linksRef.current[index] = el; }}
              href={link.href}
              aria-current={activeSection === link.href ? 'location' : undefined}
              tabIndex={isOpen ? 0 : -1}
              className="text-[#fffdf8] font-serif tracking-wide hover:text-[#f5baa4] transition-colors focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2 rounded-sm px-4 py-2 min-h-[44px] inline-flex items-center justify-center text-center text-2xl sm:text-3xl"
              onClick={(e) => handleSmoothScroll(e, link.href)}
            >
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
