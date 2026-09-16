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
  color: string;
  rotation: number;
  rotSpeed: number;
  alpha: number;
}

/**
 * Updates in-flight heart particles along the rightward wind vortex.
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
    ph.vx += 0.025 * speed;

    // Graceful sinusoidal attractor flow
    const targetY = groundY - 110 + Math.sin(ph.x * 0.0035 + time * 1.4) * 45;
    ph.vy += (targetY - ph.y) * 0.0016 * speed;
    ph.vy *= 0.98;

    ph.rotation += ph.rotSpeed * speed;

    // Fade out past right screen boundary
    if (ph.x > w * 1.4) {
      ph.alpha -= 0.02 * speed;
    }

    if (ph.alpha <= 0 || ph.x > w * 2.2) {
      particles.splice(i, 1);
    }
  }
}
