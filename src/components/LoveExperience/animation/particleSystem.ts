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

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  spawnAmbientStars(count = 60) {
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: 0.8 + Math.random() * 1.8,
        color: Math.random() > 0.3 ? '#fff5dc' : '#ffd1dc',
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
    const colors = ['#fff5dc', '#ffd6a5', '#ff9bb2', '#ff758f', '#ffffff'];
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

  update(dt: number, time: number) {
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

      // Wrap around bounds for ambient stars
      if (p.isStar && p.maxLife > 5000) {
        if (p.x < 0) p.x = this.w;
        if (p.x > this.w) p.x = 0;
        if (p.y < 0) p.y = this.h;
        if (p.y > this.h) p.y = 0;
      } else if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.alpha <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
      ctx.fillStyle = p.color;

      // Subtle 4-point sparkle for larger stars
      if (p.isStar && p.size > 1.8) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
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

      ctx.restore();
    }
  }
}
