import React, { useLayoutEffect, useRef } from 'react';
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
}> = ({ children, className = '', delay = 0, y = 16, as = 'div' }) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    // Opacity + transform only (no blur filter — non-composited repaint).
    // visibility:hidden until revealed: invisible content must not be
    // focusable or exposed to AT. No-JS never runs this, so content stays
    // visible without JS.
    gsap.set(el, { opacity: 0, y, visibility: 'hidden' });
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(el, {
          opacity: 1,
          y: 0,
          visibility: 'visible',
          duration: 0.6,
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

  const Tag = as as unknown as React.ElementType;
  return (
    <Tag ref={ref} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </Tag>
  );
};

export default Reveal;
