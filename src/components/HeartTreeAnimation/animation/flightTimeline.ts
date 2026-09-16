/**
 * Flight timeline milestones and particle physics for the heart stream.
 *
 * Requirements:
 * - Hearts detach from outer/right branches first, sweeping rightward into a continuous stream.
 * - The tree retains leaves on left/inner branches while the vortex streams to the right.
 * - The bare tree never becomes the dominant final frame.
 * - Supports seamless looping or hold state.
 */

export const FLIGHT_T = {
  // Stage 14: Hearts Fly Away
  DETACH_START: 0.85,
  STREAM_PEAK: 1.05,
  FADE_LOOP_START: 0.95,
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
  rotSpeed: number;
  alpha: number;
  starRatio: number; // 0 = heart, 1 = star
}

/**
 * Updates in-flight heart particles along the rightward and upward wind vortex,
 * gradually transitioning them into luminous star embers.
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
    ph.x += ph.vx * speed;
    ph.y += ph.vy * speed;

    // Sustained wind push rightward
    ph.vx += 0.02 * speed;

    // Upward graceful loft into the celestial night sky
    const targetY = groundY * 0.28 + Math.sin(ph.x * 0.003 + time * 1.6) * 55;
    ph.vy += (targetY - ph.y) * 0.0018 * speed;
    ph.vy *= 0.975;

    ph.rotation += ph.rotSpeed * speed;

    // Gradually shrink and shift into star particle
    ph.starRatio = Math.min(1, ph.starRatio + 0.008 * speed);
    const targetSize = 2.0;
    ph.size = ph.originalSize * (1 - ph.starRatio) + targetSize * ph.starRatio;

    // Fade out past right screen boundary
    if (ph.x > w * 1.35) {
      ph.alpha -= 0.015 * speed;
    }

    if (ph.alpha <= 0 || ph.x > w * 2.2) {
      particles.splice(i, 1);
    }
  }
}
