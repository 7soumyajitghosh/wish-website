import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Reveal — cinematic scroll entrance (staggered fade/rise/blur) via IO + GSAP.
 * Fires once, reduced-motion safe (sets end state), cleans up on unmount.
 */
export const Reveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'section' | 'span' | 'h2' | 'p';
}> = ({ children, className = '', delay = 0, y = 28, as = 'div' }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }
    gsap.set(el, { opacity: 0, y, filter: 'blur(6px)' });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(el, {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          delay,
          ease: 'power3.out',
          overwrite: 'auto',
          onComplete: () => {
            // Release the compositor hint — permanent will-change on every
            // reveal section wastes GPU memory.
            el.style.willChange = 'auto';
          },
        });
        io.disconnect();
      },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      gsap.killTweensOf(el);
    };
  }, [delay, y]);

  const Tag = as as 'div';
  return (
    <Tag ref={ref} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </Tag>
  );
};

export default Reveal;
