/**
 * Growth timeline milestones and programmatic speed calculation.
 *
 * Requirements:
 * - Stages 1–3 (Seed, Roots): 1.0x speed
 * - Stages 4–14 (Trunk, Branches, Bloom, Flight): 1.5x speed
 * - Seamless transition without visual jumps
 */
import { rangeProgress, lerp } from '../../../animation/bezierUtils';

export const GROWTH_T = {
  // Stage 1 & 2: Seed
  SEED_START: 0.04,
  SEED_PEAK: 0.08,

  // Stage 3: Roots
  ROOTS_START: 0.10,
  ROOTS_END: 0.20,

  // Stage 4 & 5: Trunk Growth
  TRUNK_START: 0.20,
  TRUNK_MID: 0.26,
  TRUNK_END: 0.32,

  // Stage 6: Primary Branches
  PRIMARY_START: 0.32,
  PRIMARY_END: 0.44,

  // Stage 7: Secondary Branches
  SECONDARY_START: 0.42,
  SECONDARY_END: 0.54,

  // Stage 8: Fine Twigs
  TWIGS_START: 0.52,
  TWIGS_END: 0.62,
} as const;

/** Base duration in seconds for the entire cycle at 1.0x */
export const BASE_CYCLE_DURATION = 42;

/**
 * Returns the current programmatic speed multiplier:
 * - 1.0x for Stages 1–3 (calm, contemplative seed & roots)
 * - 1.5x for Stages 4–14 (organic growth, bloom, wind, and flight)
 * Smoothly blends over the boundary to guarantee zero visual jump.
 */
export function getTimelineSpeed(p: number): number {
  if (p < GROWTH_T.TRUNK_START) {
    return 1.0;
  }
  // Smoothly blend to 1.5x across a 0.03 progress window
  const blend = rangeProgress(p, GROWTH_T.TRUNK_START, GROWTH_T.TRUNK_START + 0.03);
  return lerp(1.0, 1.5, blend);
}
