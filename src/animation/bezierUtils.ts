/**
 * Bezier curve utilities for progressive branch drawing.
 * Uses De Casteljau's algorithm for splitting curves.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Evaluate a cubic bezier at parameter t */
export function pointOnCubicBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  return {
    x: uu * u * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + tt * t * p3.x,
    y: uu * u * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + tt * t * p3.y,
  };
}

/** Tangent vector of cubic bezier at parameter t */
export function tangentOnCubicBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

/**
 * Split a cubic bezier at parameter t using De Casteljau's algorithm.
 * Returns [firstHalf, secondHalf] where each is [P0, P1, P2, P3].
 */
export function splitCubicBezier(
  p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number
): [[Vec2, Vec2, Vec2, Vec2], [Vec2, Vec2, Vec2, Vec2]] {
  const q0 = lerpVec2(p0, p1, t);
  const q1 = lerpVec2(p1, p2, t);
  const q2 = lerpVec2(p2, p3, t);
  const r0 = lerpVec2(q0, q1, t);
  const r1 = lerpVec2(q1, q2, t);
  const s = lerpVec2(r0, r1, t);
  return [
    [p0, q0, r0, s],
    [s, r1, q2, p3],
  ];
}

/** Clamp value to [0, 1] */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Smooth progress within a range: returns 0 when t<=start, 1 when t>=end */
export function rangeProgress(t: number, start: number, end: number): number {
  if (end <= start) return t >= start ? 1 : 0;
  return clamp01((t - start) / (end - start));
}

// --- Easing functions ---

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/**
 * Organic bloom easing: 0 → 0.7 → 1.05 → 1.0
 * Creates a natural overshoot-and-settle for hearts blooming.
 */
export function easeOrganicBloom(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  if (t < 0.4) return (t / 0.4) * 0.7;
  if (t < 0.75) return 0.7 + ((t - 0.4) / 0.35) * 0.35;
  return 1.05 - ((t - 0.75) / 0.25) * 0.05;
}

/**
 * Deterministic pseudo-random number generator.
 * Produces the same sequence for the same seed — critical for
 * ensuring the tree always looks identical.
 */
export class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  /** Returns a value in [-1, 1] */
  symmetric(): number {
    return this.next() * 2 - 1;
  }
}
