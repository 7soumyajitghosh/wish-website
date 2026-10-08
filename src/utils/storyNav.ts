/** Deferred smooth-scroll helper used by the nav when unlocking the intro
 *  gate: unlocking flips body overflow + layout, so we wait two frames
 *  (plus a timeout fallback) before measuring the target.
 *  Single-scroll guarded + reduced-motion safe (auto behavior).
 *  Returns a cancel function so late scrolls never fire after unmount. */
export const scrollToSelectorDeferred = (selector: string): (() => void) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
  let done = false;
  let raf1 = 0;
  let raf2 = 0;
  let timer = 0;
  const run = () => {
    if (done) return;
    done = true;
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior });
  };
  raf1 = requestAnimationFrame(() => {
    raf2 = requestAnimationFrame(run);
  });
  timer = window.setTimeout(run, 350);
  return () => {
    done = true;
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    window.clearTimeout(timer);
  };
};

/** Wait for a lazily-mounted element, then scroll + focus it.
 *  Retries via rAF for up to `timeoutMs` (code-split chunks may still be
 *  loading). Resolves true when the element was found. Cancellable. */
export const scrollToIdWhenReady = (
  targetId: string,
  options?: { timeoutMs?: number; focus?: boolean }
): (() => void) => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return () => {};
  const timeoutMs = options?.timeoutMs ?? 4000;
  const doFocus = options?.focus ?? true;
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';
  let cancelled = false;
  let raf = 0;
  const start = performance.now();

  const finish = (el: Element | null) => {
    if (el) el.scrollIntoView({ behavior });
    else window.scrollTo(0, 0);
    if (doFocus) {
      const focusEl = (el ?? document.getElementById('destination')) as HTMLElement | null;
      if (focusEl) {
        if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
        focusEl.focus({ preventScroll: true });
      }
    }
  };

  const tick = () => {
    if (cancelled) return;
    let el: Element | null = null;
    try {
      el = document.getElementById(targetId) ?? document.querySelector(`#${CSS.escape(targetId)}`);
    } catch {
      el = document.getElementById(targetId);
    }
    if (el || performance.now() - start >= timeoutMs) {
      finish(el);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  // Two frames let a just-unmounted layout settle before measuring.
  raf = requestAnimationFrame(() => {
    if (cancelled) return;
    raf = requestAnimationFrame(tick);
  });
  return () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
};
