/**
 * Flight timeline milestones and particle physics for the heart stream.
 *
 * Requirements:
 * - Hearts detach from outer/right branches first, sweeping rightward into a continuous stream.
 * - The wave travels inward and leftward so every leaf is blowing in the
 *   wind by the cycle end (storyboard panel 15: bare tree, stream departed).
 * - The dusk veil covers the final cut, so the bare tree is a passing
 *   frame, never the resting state.
 * - Supports seamless looping or hold state.
 */

export const FLIGHT_T = {
  // Stage 14: Hearts Fly Away (must start AFTER full bloom 0.82 + wind peak
  // 0.90, otherwise hearts detach mid-bloom and stage 13 is unreachable)
  DETACH_START: 0.90,
  STREAM_PEAK: 0.98,
  FADE_LOOP_START: 0.97,
  CYCLE_END: 1.0,
} as const;

export interface FlyingHeartParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  originalSize: number;
  color: string;
  rotation: number;
  /** Net tumble rate in rad/s (signed — leaves spin either way). */
  rotSpeed: number;
  alpha: number;
  starRatio: number; // 0 = heart, 1 = star
  /** Seconds since detachment — drives the peel-off ramp. */
  age: number;
  /** Random 0..1 seed driving each leaf's unique flutter path. */
  seed: number;
  /** Phase offset for the flutter sine waves. */
  flutterPhase: number;
  /** Flutter frequency in rad/s — smaller leaves flutter faster. */
  flutterSpeed: number;
  /** Vertical flutter amplitude in px — a gentle dance, not a bounce. */
  swayAmp: number;
}

/**
 * Updates in-flight heart particles the way real leaves ride a gale.
 *
 * - Each leaf keeps its own sky lane (seeded) instead of converging on one
 *   line, so the stream reads as a scattered drift, not a magnet pull.
 * - Newly detached leaves peel off slowly: a brief eddy swirl behind the
 *   canopy, then a ~1.5s ramp up to cruising speed.
 * - Gusts arrive over seconds and steer the cruise target — velocity never
 *   jitters frame-to-frame.
 * - Leaves tumble with a slow net spin plus an oscillatory flutter tilt
 *   (applied at render time); size never pulses.
 */
export function updateFlyingHearts(
  particles: FlyingHeartParticle[],
  dt: number,
  time: number,
  w: number,
  groundY: number
) {
  const speed = dt * 60;
  for (let i = particles.length - 1; i >= 0; i--) {
    const ph = particles[i];
    ph.age += dt;
    const seedAngle = ph.seed * Math.PI * 2;

    // Slow living gust — periods of ~5–10s, shared air all leaves feel.
    const gust =
      1 +
      0.22 * Math.sin(time * 0.6 + seedAngle) +
      0.1 * Math.sin(time * 1.1 + seedAngle * 1.7);

    // The leaf's own lane across the sky: spread through the upper air with
    // a slow travelling wave, plus its personal flutter dance.
    const lane =
      groundY * (0.3 + ph.seed * 0.22) +
      Math.sin(ph.seed * 17.3) * 30;
    const flutter =
      Math.sin(time * ph.flutterSpeed + ph.flutterPhase) * ph.swayAmp;
    const targetY =
      lane +
      Math.sin(ph.x * 0.0022 + time * 0.7 + seedAngle) * 18 +
      flutter;

    // Peel-off: ease from a loiter near the canopy up to cruise over ~1.6s.
    const ramp = 1 - Math.exp(-ph.age / 0.55);
    const cruise = (5.6 + (1 - ph.seed) * 2.4) * (0.85 + 0.15 * gust);
    ph.vx += (cruise - ph.vx) * Math.min(1, 0.03 * speed);
    ph.vx = Math.min(ph.vx, 8.4);

    // Brief eddy right after detachment: the leaf hesitates and lifts as it
    // tears free instead of launching like a projectile.
    const eddy = Math.max(0, 1 - ph.age * 2);
    ph.x += (ph.vx * ramp * (0.9 + 0.1 * gust) - eddy * 0.7) * speed;
    ph.x += Math.sin(time * ph.flutterSpeed * 0.5 + ph.flutterPhase) * 0.45 * speed;

    // Weak spring to the lane (leaves drift, they don't home in) with a
    // whisper of gravity settling and buoyant embers rising late in flight.
    ph.vy += (targetY - ph.y) * 0.0011 * speed;
    ph.vy += 0.018 * speed;
    ph.vy -= ph.starRatio * 0.05 * speed;
    ph.vy -= eddy * 1.6 * speed;
    const maxFall = 2.4;
    const maxRise = -3.2;
    ph.vy = Math.max(maxRise, Math.min(maxFall, ph.vy));
    ph.y += ph.vy * speed;

    // Slow net tumble; the back-and-forth flutter tilt is added at render.
    ph.rotation += ph.rotSpeed * dt;

    // Stay a big red heart for the whole visible flight — only the oldest,
    // farthest-downwind travellers melt softly into an ember.
    ph.starRatio = Math.min(1, ph.starRatio + 0.0012 * speed);
    const eased =
      ph.starRatio * ph.starRatio * (3 - 2 * ph.starRatio);
    const targetSize = 3.2;
    ph.size = ph.originalSize * (1 - eased) + targetSize * eased;

    // Hold full opacity across the sky; fade only once past the edge.
    if (ph.x > w * 1.25) {
      ph.alpha -= 0.014 * speed;
    }

    if (ph.alpha <= 0 || ph.x > w * 2.2) {
      particles.splice(i, 1);
    }
  }
}
