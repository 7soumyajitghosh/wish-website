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
  const dist = (dx + dy * 0.5) / 250;
  const osc =
    Math.sin(time * 2.5 + y * 0.008 + x * 0.003) * 0.65 +
    Math.sin(time * 1.3 + y * 0.012) * 0.35;
  return windStr * dist * osc;
}
