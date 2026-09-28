/** Deferred smooth-scroll helper used by the nav when unlocking the intro
 *  gate: unlocking flips body overflow + layout, so we wait two frames
 *  (plus a timeout fallback) before measuring the target. */
export const scrollToSelectorDeferred = (selector: string): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const run = () => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 350);
};
