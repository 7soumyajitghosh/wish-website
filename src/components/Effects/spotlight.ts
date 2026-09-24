import React from 'react';

/**
 * spotlightMove — cursor-following glow for cards (no transform, GSAP-safe).
 * Attach to onPointerMove + add the `spotlight` class (defined in index.css).
 */
export function spotlightMove(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  el.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

export default spotlightMove;
