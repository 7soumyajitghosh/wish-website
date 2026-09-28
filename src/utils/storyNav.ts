import { STAGE_PROGRESS_MAP } from '../context/storyTypes';

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth-scroll to a raw document Y, instant when reduced motion is preferred. */
export const scrollToY = (y: number): void => {
  if (typeof window === 'undefined' || !Number.isFinite(y)) return;
  window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
};

/**
 * Scroll so the sticky story viewport shows the given stage.
 * The story container maps scroll [offsetTop, offsetTop + scrollable] to
 * progress [0.02, 1.0], so landing at the stage's own offset means the tree
 * is already there — no visible sweep/replay through earlier stages.
 */
export const scrollToStagePosition = (stage: number): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const container = document.getElementById('story-experience');
  if (!container) return;
  const validStage = Math.max(1, Math.min(16, stage));
  const totalScrollable = container.offsetHeight - window.innerHeight;
  if (totalScrollable <= 0) {
    container.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return;
  }
  const target = STAGE_PROGRESS_MAP[validStage] ?? 0.02;
  const rawProgress = Math.max(0, Math.min(1, (target - 0.02) / 0.98));
  scrollToY(container.offsetTop + rawProgress * totalScrollable);
};

/**
 * Deferred variant for unlock-then-scroll flows: unlocking flips
 * body overflow + container layout, so wait two frames (plus a timeout
 * fallback) before measuring the stage offset.
 */
export const scrollToStagePositionDeferred = (stage: number): void => {
  if (typeof window === 'undefined') return;
  const run = () => scrollToStagePosition(stage);
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 350);
};

/** Deferred smooth-scroll to a selector (used by nav when unlocking first). */
export const scrollToSelectorDeferred = (selector: string): void => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const run = () => {
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };
  requestAnimationFrame(() => requestAnimationFrame(run));
  window.setTimeout(run, 350);
};
