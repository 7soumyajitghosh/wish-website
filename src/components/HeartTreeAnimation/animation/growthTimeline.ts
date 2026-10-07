/**
 * Growth timeline milestones and programmatic speed calculation.
 *
 * Requirements:
 * - Stages 1–3 (Seed, Roots): 1.0x speed
 * - Stages 4–14 (Trunk, Branches, Bloom, Flight): 1.5x speed
 * - Seamless transition without visual jumps
 */
import { rangeProgress, lerp } from '../../../animation/bezierUtils';
import { BLOOM_T } from './bloomTimeline';
import { WIND_T } from './windTimeline';
import { FLIGHT_T } from './flightTimeline';

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
 * - 1.0x again for Stages 15–16 (transition settles, destination holds)
 * Smoothly blends over each boundary to guarantee zero visual jump.
 */
export function getTimelineSpeed(p: number): number {
  if (p < GROWTH_T.TRUNK_START) {
    return 1.0;
  }
  // Smoothly blend to 1.5x across a 0.03 progress window
  const rampUp = lerp(1.0, 1.5, rangeProgress(p, GROWTH_T.TRUNK_START, GROWTH_T.TRUNK_START + 0.03));
  if (p < FLIGHT_T.FADE_LOOP_START) {
    return rampUp;
  }
  // Flight is over — ease back to calm so the finale settles, no jump:
  // speed is continuous (1.5x at the boundary, 1.0x past the blend window).
  return lerp(1.5, 1.0, rangeProgress(p, FLIGHT_T.FADE_LOOP_START, FLIGHT_T.FADE_LOOP_START + 0.03));
}

/**
 * Single source of truth: map progress [0,1] to stage number [1..16].
 * Thresholds must ascend:
 * seed 0.04 < roots 0.10 < trunk 0.20/0.26 < primary 0.32 < secondary 0.42
 * < twigs 0.52 < buds 0.62 < bloom1 0.68 < bloom2 0.74 < full 0.82
 * < wind 0.84 < detach 0.90 < fade 0.97 < end 1.0
 */
export function getStageFromProgress(p: number): number {
  if (p < GROWTH_T.SEED_START) return 1;
  if (p < GROWTH_T.ROOTS_START) return 2;
  if (p < GROWTH_T.TRUNK_START) return 3;
  if (p < GROWTH_T.TRUNK_MID) return 4;
  if (p < GROWTH_T.PRIMARY_START) return 5;
  if (p < GROWTH_T.SECONDARY_START) return 6;
  if (p < GROWTH_T.TWIGS_START) return 7;
  if (p < BLOOM_T.BUDS_START) return 8;
  if (p < BLOOM_T.BLOOM1_START) return 9;
  if (p < BLOOM_T.BLOOM2_START) return 10;
  if (p < BLOOM_T.FULL_BLOOM) return 11;
  if (p < WIND_T.WIND_START) return 12;
  if (p < FLIGHT_T.DETACH_START) return 13;
  if (p < FLIGHT_T.FADE_LOOP_START) return 14;
  if (p < FLIGHT_T.CYCLE_END) return 15;
  return 16;
}
