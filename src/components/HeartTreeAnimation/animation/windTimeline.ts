/**
 * Wind simulation timeline and harmonic displacement calculations.
 */
import { rangeProgress } from '../../../animation/bezierUtils';

export const WIND_T = {
  // Stage 13: Wind Begins
  WIND_START: 0.84,
  WIND_PEAK: 0.90,
} as const;

/**
 * Calculates current wind strength based on progress.
 */
export function getWindStrength(p: number): number {
  if (p < WIND_T.WIND_START) return 0;
  if (p < WIND_T.WIND_PEAK) {
    return rangeProgress(p, WIND_T.WIND_START, WIND_T.WIND_PEAK) * 14;
  }
  return 14 + rangeProgress(p, WIND_T.WIND_PEAK, 1.0) * 12;
}

/**
 * Calculates harmonic lateral wind displacement for branches and foliage.
 *
 * A real gale bends the tree first and sways it second: a steady downwind
 * lean (quadratic with height, so tips travel while the trunk holds) plus a
 * slow sway around that lean. Gusts arrive over seconds, not frames.
 */
export function windDisplace(
  x: number,
  y: number,
  baseX: number,
  baseY: number,
  windStr: number,
  time: number
): number {
  if (windStr <= 0) return 0;
  const dx = Math.abs(x - baseX);
  const dy = Math.max(0, baseY - y);
  // Normalized reach: 0 at the roots, ~1+ at the outer crown.
  const reach = (dx + dy * 0.6) / 230;
  const bend = reach * reach * 0.9 + reach * 0.25;
  // Slow gust envelope — swells roll through every ~7–12s.
  const gust =
    0.75 + 0.25 * Math.sin(time * 0.5 + baseX * 0.0015) + 0.12 * Math.sin(time * 0.9 + 1.7);
  // Persistent lean downwind + slow sway around it (periods ~7s and ~12s).
  const lean = 0.6;
  const sway =
    Math.sin(time * 0.85 + y * 0.004 + x * 0.0016) * 0.28 +
    Math.sin(time * 0.5 + y * 0.006 + 0.8) * 0.12;
  return windStr * bend * (lean + sway) * gust;
}
