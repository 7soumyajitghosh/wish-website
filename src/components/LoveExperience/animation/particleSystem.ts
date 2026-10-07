/**
 * Particle management for star dust, celestial embers, and heart-to-star particles.
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxAlpha: number;
  life: number;
  maxLife: number;
  twinkleSpeed: number;
  twinklePhase: number;
  isStar?: boolean;
}

export class ParticleEmitter {
  particles: Particle[] = [];
  private w = 0;
  private h = 0;

  /** Max live particles; oldest non-ambient particles are dropped when exceeded. */
  static readonly MAX_PARTICLES = 500;

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  spawnAmbientStars(count = 60) {
    // Additive: keep existing particles (e.g. burst embers) and top up ambient stars up to cap.
    const room = Math.max(0, ParticleEmitter.MAX_PARTICLES - this.particles.length);
    const toSpawn = Math.min(count, room);
    for (let i = 0; i < toSpawn; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.8 + Math.random() * 1.8,
        color: Math.random() > 0.3 ? '#fff8eb' : '#ffb3c1',
        alpha: 0.2 + Math.random() * 0.6,
        maxAlpha: 0.3 + Math.random() * 0.6,
        life: 0,
        maxLife: 10000,
        twinkleSpeed: 0.02 + Math.random() * 0.04,
        twinklePhase: Math.random() * Math.PI * 2,
        isStar: true,
      });
    }
  }

  spawnBurst(cx: number, cy: number, count = 75) {
    const colors = ['#fff8eb', '#ffd6a5', '#ffb3c1', '#ff8fa3', '#ffffff'];
    // Cap total particles: drop oldest burst (non-ambient) particles first.
    const overflow = this.particles.length + count - ParticleEmitter.MAX_PARTICLES;
    if (overflow > 0) {
      let removed = 0;
      this.particles = this.particles.filter((p) => {
        if (removed < overflow && !(p.isStar && p.maxLife > 5000)) {
          removed++;
          return false;
        }
        return true;
      });
      // If still over cap (all ambient), drop oldest regardless.
      if (this.particles.length + count > ParticleEmitter.MAX_PARTICLES) {
        this.particles.splice(0, this.particles.length + count - ParticleEmitter.MAX_PARTICLES);
      }
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 7;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2, // bias upward
        size: 1.2 + Math.random() * 2.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        maxAlpha: 1,
        life: 0,
        maxLife: 90 + Math.random() * 80,
        twinkleSpeed: 0.05 + Math.random() * 0.05,
        twinklePhase: Math.random() * Math.PI * 2,
        isStar: true,
      });
    }
  }

  update(dt: number, _time: number) {
    const speed = dt * 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * speed;
      p.y += p.vy * speed;
      p.life += speed;

      // Twinkle pulsation
      p.twinklePhase += p.twinkleSpeed * speed;
      const pulse = 0.5 + 0.5 * Math.sin(p.twinklePhase);
      p.alpha = Math.min(p.maxAlpha, p.maxAlpha * (0.4 + 0.6 * pulse));

      // Wrap around bounds for ambient stars — fade near edges instead of
      // visible edge-to-edge teleport pop.
      if (p.isStar && p.maxLife > 5000) {
        const m = 12;
        if (p.x < -m) { p.x = this.w + m; p.alpha = 0; }
        else if (p.x > this.w + m) { p.x = -m; p.alpha = 0; }
        if (p.y < -m) { p.y = this.h + m; p.alpha = 0; }
        else if (p.y > this.h + m) { p.y = -m; p.alpha = 0; }
        // Fade back in after wrap.
        if (p.alpha < p.maxAlpha) p.alpha = Math.min(p.maxAlpha, p.alpha + 0.02 * speed);
      } else if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    // Batch by color to avoid 500× save/restore + fillStyle churn.
    let lastColor = '';
    let lastAlpha = -1;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.alpha <= 0.01) continue;

      const a = Math.max(0, Math.min(1, p.alpha));
      if (p.color !== lastColor) {
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.color;
        lastColor = p.color;
      }
      if (a !== lastAlpha) {
        ctx.globalAlpha = a;
        lastAlpha = a;
      }

      // Subtle 4-point sparkle for larger stars (no shadowBlur: per-particle
      // shadows stall 200+ frame loops; cross-glint carries the glow)
      if (p.isStar && p.size > 1.8) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Subtle cross glint
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(p.x - p.size * 1.5, p.y);
        ctx.lineTo(p.x + p.size * 1.5, p.y);
        ctx.moveTo(p.x, p.y - p.size * 1.5);
        ctx.lineTo(p.x, p.y + p.size * 1.5);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
}
