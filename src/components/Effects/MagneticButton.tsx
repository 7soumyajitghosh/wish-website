import React, { useRef, useCallback, useEffect } from 'react';

/**
 * MagneticButton — spring-like magnetic hover wrapper (Active Theory style micro-interaction).
 * Translates child toward cursor within ~6px, resets with organic easing.
 * Disabled on touch + reduced motion. GPU transform only.
 */
export const MagneticButton: React.FC<{
  children: React.ReactNode;
  className?: string;
  strength?: number;
}> = ({ children, className = '', strength = 6 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number>(0);
  const coarseRef = useRef<boolean | null>(null);
  const reducedRef = useRef<boolean | null>(null);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (coarseRef.current === null)
        coarseRef.current = window.matchMedia('(pointer: coarse)').matches;
      if (reducedRef.current === null)
        reducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (coarseRef.current || reducedRef.current) return;
      // Cache rect on enter (no layout read per mousemove); rAF-throttle writes.
      if (!rectRef.current) rectRef.current = el.getBoundingClientRect();
      const rect = rectRef.current;
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
      const tx = nx * strength;
      const ty = ny * strength;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      });
    },
    [strength]
  );

  const onEnter = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    rectRef.current = el.getBoundingClientRect();
    el.style.willChange = 'transform';
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    rectRef.current = null;
    cancelAnimationFrame(rafRef.current);
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translate3d(0,0,0)';
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      if (ref.current) {
        ref.current.style.transition = '';
        ref.current.style.willChange = 'auto';
      }
      timerRef.current = null;
    }, 500);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      className={`inline-block ${className}`}
      style={{ transition: 'transform 0.18s ease-out' }}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
