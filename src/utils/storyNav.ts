/** Deferred smooth-scroll helper used by the nav when unlocking the intro
 *  gate: unlocking flips body overflow + layout, so we wait two frames
 *  (plus a timeout fallback) before measuring the target.
 *  Single-scroll guarded + reduced-motion safe (auto behavior). */
export const scrollToSelectorDeferred = (selector: string): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 350);
};
