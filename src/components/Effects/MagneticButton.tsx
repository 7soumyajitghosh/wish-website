import React, { useRef, useCallback } from 'react';

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

  const onMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (window.matchMedia('(pointer: coarse)').matches) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const nx = Math.max(-1, Math.min(1, dx / (rect.width / 2)));
      const ny = Math.max(-1, Math.min(1, dy / (rect.height / 2)));
      el.style.transform = `translate3d(${(nx * strength).toFixed(2)}px, ${(ny * strength).toFixed(2)}px, 0)`;
    },
    [strength]
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    el.style.transform = 'translate3d(0,0,0)';
    window.setTimeout(() => {
      if (ref.current) ref.current.style.transition = '';
    }, 500);
  }, []);

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`inline-block will-change-transform ${className}`}
      style={{ transition: 'transform 0.18s ease-out' }}
    >
      {children}
    </div>
  );
};

export default MagneticButton;
