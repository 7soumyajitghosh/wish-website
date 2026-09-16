import React, { useEffect, useRef } from 'react';
import {
  rangeProgress,
  clamp01,
  SeededRandom,
} from '../../animation/bezierUtils';
import {
  GROWTH_T,
  BASE_CYCLE_DURATION,
  getTimelineSpeed,
} from './animation/growthTimeline';
import { BLOOM_T } from './animation/bloomTimeline';
import { WIND_T, getWindStrength } from './animation/windTimeline';
import {
  FLIGHT_T,
  type FlyingHeartParticle,
  updateFlyingHearts,
} from './animation/flightTimeline';
import { type TreeData, buildTree } from './tree/treeGeometry';
import { drawRoots } from './tree/roots';
import { drawAllBranches } from './tree/branches';
import {
  drawHeartShape,
  getHeartWorldPos,
  drawBudsAndHearts,
} from './tree/heartAnchors';
import './HeartTreeAnimation.css';

export interface HeartTreeAnimationProps {
  /** Whether the animation begins playing automatically. Default: true */
  autoPlay?: boolean;
  /** Whether the animation automatically loops upon completing heart flight. Default: true */
  loop?: boolean;
  /** Optional starting progress [0, 1] for previewing or testing specific stages. Default: 0 */
  initialProgress?: number;
  /** Optional custom CSS class for the root wrapper */
  className?: string;
  /** Optional inline styles for the root wrapper */
  style?: React.CSSProperties;
}

interface Layout {
  w: number;
  h: number;
  groundY: number;
  baseX: number;
  baseY: number;
  scale: number;
  dpr: number;
  isMobile: boolean;
}

interface AmbientPetal {
  speed: number;
  xRatio: number;
  yOffset: number;
  size: number;
  color: string;
}

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const HeartTreeAnimation: React.FC<HeartTreeAnimationProps> = ({
  autoPlay = true,
  loop = true,
  initialProgress = 0,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<TreeData | null>(null);
  const layoutRef = useRef<Layout>({
    w: 0,
    h: 0,
    groundY: 0,
    baseX: 0,
    baseY: 0,
    scale: 1,
    dpr: 1,
    isMobile: false,
  });

  const progressRef = useRef(initialProgress);
  const isPlayingRef = useRef(autoPlay);
  const loopRef = useRef(loop);
  const fadeAlphaRef = useRef(1); // For smooth loop fading
  const particlesRef = useRef<FlyingHeartParticle[]>([]);
  const embersRef = useRef<Ember[]>([]);
  const detachedRef = useRef<Set<number>>(new Set());

  // Stable ambient petals definition
  const ambientPetalsRef = useRef<AmbientPetal[]>([
    { speed: 18, xRatio: 0.1, yOffset: 30, size: 4.5, color: '#ffb3c1' },
    { speed: 25, xRatio: 0.25, yOffset: 65, size: 5.5, color: '#ffa4b6' },
    { speed: 20, xRatio: 0.45, yOffset: 40, size: 4.8, color: '#ff758f' },
    { speed: 28, xRatio: 0.65, yOffset: 85, size: 5.8, color: '#ffb3c1' },
    { speed: 22, xRatio: 0.8, yOffset: 50, size: 4.2, color: '#ffa4b6' },
    { speed: 19, xRatio: 0.95, yOffset: 70, size: 5.0, color: '#ff758f' },
    { speed: 26, xRatio: 0.35, yOffset: 95, size: 5.2, color: '#ffb3c1' },
    { speed: 21, xRatio: 0.55, yOffset: 25, size: 4.6, color: '#ffa4b6' },
  ]);

  useEffect(() => {
    isPlayingRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Handle container resize & canvas scaling
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width || 0, window.innerWidth || 0, 320);
      const h = Math.max(rect.height || 0, window.innerHeight || 0, 320);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const isMobile = w < 768;
      const groundY = h * (isMobile ? 0.74 : 0.72);
      const baseX = w * (isMobile ? 0.48 : 0.44);
      const baseY = groundY;
      const scale = Math.min(w, h * 1.3) / 800;

      layoutRef.current = { w, h, groundY, baseX, baseY, scale, dpr, isMobile };
      treeRef.current = buildTree(baseX, baseY, scale);

      particlesRef.current = [];
      embersRef.current = [];
      detachedRef.current.clear();

      if (progressRef.current >= FLIGHT_T.DETACH_START && treeRef.current) {
        const detachP = rangeProgress(progressRef.current, FLIGHT_T.DETACH_START, FLIGHT_T.STREAM_PEAK);
        const windStr = getWindStrength(progressRef.current);
        const time = 1.0;
        treeRef.current.hearts.forEach((heart, idx) => {
          if (detachP > heart.detachOrder) {
            detachedRef.current.add(idx);
            const pos = getHeartWorldPos(heart, treeRef.current!.branches, windStr, time, baseX, baseY);
            const age = detachP - heart.detachOrder;
            const dist = age * w * 1.8;
            const px = pos.x + dist + Math.sin(idx * 2.3) * 30;
            const py = groundY - 110
              + Math.sin(px * 0.0035 + time * 1.5 + idx * 0.4) * 35
              - Math.sin(Math.min(1, age * 2.5) * Math.PI) * 45
              + (heart.detachOrder - 0.5) * 50;
            if (px < w * 1.5) {
              particlesRef.current.push({
                x: px,
                y: py,
                vx: 2.2 + (1 - heart.detachOrder) * 3.2 + heart.size * 0.08,
                vy: -0.4 + (heart.detachOrder - 0.5) * 0.4,
                size: heart.size,
                color: heart.color,
                rotation: heart.rotation + age * 8,
                rotSpeed: (heart.detachOrder - 0.5) * 0.06,
                alpha: clamp01(1 - (px - w * 1.2) / (w * 0.3)),
              });
            }
          }
        });
      }
    };

    handleResize();

    const observer = new ResizeObserver(handleResize);
    observer.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!running) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Programmatic timeline progression with dual-speed design:
      // Stages 1–3 = 1.0x (calm seed and roots)
      // Stages 4–14 = 1.5x (organic tree growth, bloom, wind, and flight)
      if (isPlayingRef.current) {
        const speedMultiplier = getTimelineSpeed(progressRef.current);
        const nextP = progressRef.current + (dt / BASE_CYCLE_DURATION) * speedMultiplier;

        if (nextP >= FLIGHT_T.FADE_LOOP_START) {
          if (loopRef.current) {
            // Smooth loop transition: fade out gently during peak flight and reset
            const fadeProgress = (nextP - FLIGHT_T.FADE_LOOP_START) / (FLIGHT_T.CYCLE_END - FLIGHT_T.FADE_LOOP_START);
            fadeAlphaRef.current = Math.max(0, 1 - fadeProgress);
            if (nextP >= FLIGHT_T.CYCLE_END) {
              progressRef.current = 0;
              detachedRef.current.clear();
              particlesRef.current = [];
              embersRef.current = [];
              fadeAlphaRef.current = 1;
            } else {
              progressRef.current = nextP;
            }
          } else {
            progressRef.current = Math.min(FLIGHT_T.CYCLE_END, nextP);
            fadeAlphaRef.current = 1;
          }
        } else {
          progressRef.current = nextP;
          fadeAlphaRef.current = 1;
        }
      }

      const p = progressRef.current;
      const time = now * 0.001;
      const tree = treeRef.current;
      const layout = layoutRef.current;

      if (!tree || layout.w === 0) {
        requestAnimationFrame(loop);
        return;
      }

      const { w, h, groundY, baseX, baseY, scale, dpr } = layout;
      const windStr = getWindStrength(p);

      // --- 1. Heart Detachment Logic (Stage 14 Flight) ---
      if (p >= FLIGHT_T.DETACH_START) {
        const detachP = rangeProgress(p, FLIGHT_T.DETACH_START, FLIGHT_T.STREAM_PEAK);
        tree.hearts.forEach((heart, idx) => {
          if (detachedRef.current.has(idx)) return;
          if (detachP > heart.detachOrder) {
            detachedRef.current.add(idx);
            const pos = getHeartWorldPos(heart, tree.branches, windStr, time, baseX, baseY);
            particlesRef.current.push({
              x: pos.x,
              y: pos.y,
              vx: 2.2 + (1 - heart.detachOrder) * 3.2 + heart.size * 0.08,
              vy: -1.2 + (heart.detachOrder - 0.5) * 1.5,
              size: heart.size,
              color: heart.color,
              rotation: heart.rotation,
              rotSpeed: (heart.detachOrder - 0.5) * 0.06,
              alpha: 1,
            });
          }
        });
      }

      // Update in-flight particles
      updateFlyingHearts(particlesRef.current, dt, time, w, groundY);

      // Update background embers
      const rng = new SeededRandom(Math.floor(time * 100));
      if (embersRef.current.length < 24 && rng.next() < 0.4) {
        embersRef.current.push({
          x: rng.range(0, w),
          y: groundY - rng.range(0, h * 0.55),
          vx: 0.3 + rng.next() * 0.7,
          vy: -0.2 - rng.next() * 0.5,
          size: 1.2 + rng.next() * 2.2,
          color: rng.next() > 0.4 ? '#ffd166' : '#ff758f',
          alpha: 0.2 + rng.next() * 0.5,
          life: 0,
          maxLife: 160 + rng.next() * 140,
        });
      }

      const speedFactor = dt * 60;
      for (let i = embersRef.current.length - 1; i >= 0; i--) {
        const emb = embersRef.current[i];
        emb.x += (emb.vx + (p >= WIND_T.WIND_START ? 1.5 : 0)) * speedFactor;
        emb.y += emb.vy * speedFactor;
        emb.life += speedFactor;
        if (emb.life >= emb.maxLife || emb.x > w * 1.3) {
          embersRef.current.splice(i, 1);
        }
      }

      // --- 2. Render Frame ---
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      if (fadeAlphaRef.current < 1) {
        ctx.globalAlpha = clamp01(fadeAlphaRef.current);
      }

      // A. Sky Gradient
      const skyGrd = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrd.addColorStop(0.0, '#ba8b9d');
      skyGrd.addColorStop(0.25, '#d99dae');
      skyGrd.addColorStop(0.55, '#f5baa4');
      skyGrd.addColorStop(0.82, '#fdd8b0');
      skyGrd.addColorStop(1.0, '#fff5e3');
      ctx.fillStyle = skyGrd;
      ctx.fillRect(0, 0, w, groundY);

      // B. Horizon Sun Glow & Sun Disk
      const sunX = baseX - w * 0.02;
      const sunY = groundY - 10;
      const sunR = Math.max(w, h) * 0.38;
      const sunGrd = ctx.createRadialGradient(sunX, sunY, 6, sunX, sunY, sunR);
      sunGrd.addColorStop(0, 'rgba(255, 250, 230, 0.96)');
      sunGrd.addColorStop(0.08, 'rgba(255, 230, 180, 0.75)');
      sunGrd.addColorStop(0.24, 'rgba(255, 185, 140, 0.40)');
      sunGrd.addColorStop(0.55, 'rgba(235, 145, 155, 0.15)');
      sunGrd.addColorStop(1, 'rgba(200, 130, 150, 0)');
      ctx.fillStyle = sunGrd;
      ctx.fillRect(0, 0, w, groundY + 12);

      const diskGrd = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 18);
      diskGrd.addColorStop(0, 'rgba(255, 255, 248, 0.98)');
      diskGrd.addColorStop(0.45, 'rgba(255, 240, 205, 0.85)');
      diskGrd.addColorStop(1, 'rgba(255, 220, 170, 0)');
      ctx.fillStyle = diskGrd;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
      ctx.fill();

      // C. Distant Mountain Ridges
      ctx.fillStyle = 'rgba(195, 138, 152, 0.38)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(w * 0.2, groundY - 45, w * 0.45, groundY - 20, w * 0.7, groundY - 55);
      ctx.bezierCurveTo(w * 0.85, groundY - 70, w * 0.95, groundY - 35, w * 1.05, groundY - 40);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(182, 114, 126, 0.52)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(w * 0.25, groundY - 25, w * 0.55, groundY - 48, w * 0.8, groundY - 28);
      ctx.bezierCurveTo(w * 0.9, groundY - 18, w * 0.98, groundY - 30, w * 1.05, groundY - 22);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // D. Foreground Earth Mound
      ctx.beginPath();
      ctx.moveTo(0, groundY + 12);
      ctx.bezierCurveTo(w * 0.28, groundY - 14, w * 0.65, groundY - 10, w * 1.05, groundY + 18);
      ctx.lineTo(w, groundY + 18);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const groundGrd = ctx.createLinearGradient(0, groundY - 15, 0, h);
      groundGrd.addColorStop(0.0, '#e58058');
      groundGrd.addColorStop(0.02, '#a5442e');
      groundGrd.addColorStop(0.08, '#3c1b15');
      groundGrd.addColorStop(0.35, '#200e0c');
      groundGrd.addColorStop(1.0, '#100706');
      ctx.fillStyle = groundGrd;
      ctx.fill();

      // Soft sunset rim line on crest
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, groundY + 12);
      ctx.bezierCurveTo(w * 0.28, groundY - 14, w * 0.65, groundY - 10, w * 1.05, groundY + 18);
      ctx.strokeStyle = 'rgba(255, 180, 130, 0.42)';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Fine soil texture marks
      ctx.fillStyle = '#220e0b';
      for (let gx = -10; gx < w + 20; gx += 14) {
        const hOff = Math.sin(gx * 0.05) * 4 + Math.cos(gx * 0.12) * 3;
        const gy = groundY - 6 + Math.sin((gx / w) * Math.PI) * -8;
        ctx.fillRect(gx, gy, 1.8, 5 + hOff);
      }

      // E. Drifting Twilight Landscape Petals
      ambientPetalsRef.current.forEach((ptl, i) => {
        const px = ((time * ptl.speed + ptl.xRatio * w) % (w * 1.3)) - w * 0.15;
        const py = groundY * 0.35 + ptl.yOffset + Math.sin(time * 1.5 + i) * 12;
        const rot = time * 1.2 + i * 0.8;
        drawHeartShape(ctx, px, py, ptl.size, ptl.color, rot, 0.45);
      });

      // F. Tiny Magical Seed (Stages 1–3)
      if (p >= GROWTH_T.SEED_START && p < GROWTH_T.TRUNK_MID) {
        const appear = rangeProgress(p, GROWTH_T.SEED_START, GROWTH_T.SEED_START + 0.02);
        const fadeOut = 1 - rangeProgress(p, GROWTH_T.ROOTS_START, GROWTH_T.TRUNK_MID);
        const seedAlpha = Math.min(appear, fadeOut);

        if (seedAlpha > 0) {
          const pulse = 1 + Math.sin(rangeProgress(p, GROWTH_T.SEED_START, GROWTH_T.ROOTS_START) * Math.PI) * 0.1;
          const coreSize = 3.6 * pulse * scale;
          const haloR = 8 * pulse * scale;

          const seedGrd = ctx.createRadialGradient(baseX, baseY - 2 * scale, 0.5, baseX, baseY - 2 * scale, haloR);
          seedGrd.addColorStop(0, `rgba(255, 245, 215, ${0.28 * seedAlpha})`);
          seedGrd.addColorStop(0.35, `rgba(255, 195, 135, ${0.08 * seedAlpha})`);
          seedGrd.addColorStop(1, 'rgba(255, 195, 135, 0)');

          ctx.save();
          ctx.fillStyle = seedGrd;
          ctx.beginPath();
          ctx.arc(baseX, baseY - 2 * scale, haloR, 0, Math.PI * 2);
          ctx.fill();

          drawHeartShape(ctx, baseX, baseY - 3.5 * scale, coreSize, '#fff5dc', 0, seedAlpha);
          ctx.restore();
        }
      }

      // G. Roots (Stage 3)
      if (p >= GROWTH_T.ROOTS_START) {
        drawRoots(ctx, p, tree.roots);
      }

      // H. Trunk & Branches (Stages 4–8)
      if (p >= GROWTH_T.TRUNK_START) {
        drawAllBranches(ctx, p, time, tree.branches, windStr, baseX, baseY, scale);
      }

      // I. Buds & Heart Leaves (Stages 9–12)
      if (p >= BLOOM_T.BUDS_START) {
        drawBudsAndHearts(
          ctx,
          p,
          time,
          tree.hearts,
          tree.branches,
          windStr,
          baseX,
          baseY,
          detachedRef.current
        );
      }

      // J. Flying Hearts Stream (Stage 14)
      particlesRef.current.forEach(ph => {
        if (ph.alpha <= 0) return;
        const flip3D = Math.cos(time * 3 + ph.rotation * 5);
        const displaySize = ph.size * Math.max(0.35, Math.abs(flip3D));
        drawHeartShape(ctx, ph.x, ph.y, displaySize, ph.color, ph.rotation, ph.alpha);
      });

      // K. Subtle Firefly Embers
      embersRef.current.forEach(emb => {
        const fade = Math.sin((emb.life / emb.maxLife) * Math.PI);
        const a = emb.alpha * fade;
        if (a <= 0) return;
        ctx.save();
        ctx.fillStyle = emb.color;
        ctx.globalAlpha = clamp01(a);
        ctx.beginPath();
        ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => {
      running = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`heart-tree-wrapper ${className}`}
      style={style}
    >
      <canvas ref={canvasRef} className="heart-tree-canvas" />
    </div>
  );
};

export default HeartTreeAnimation;
