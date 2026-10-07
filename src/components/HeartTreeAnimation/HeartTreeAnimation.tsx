import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import {
  rangeProgress,
  clamp01,
  SeededRandom,
} from '../../animation/bezierUtils';
import { GROWTH_T, getTimelineSpeed } from './animation/growthTimeline';
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

export interface TreeInteractionEvent {
  text: string;
  type: 'root' | 'branch' | 'heart';
  x: number;
  y: number;
}

export interface HeartTreeHandle {
  setProgress: (p: number) => void;
  getProgress: () => number;
  getStage: () => number;
}

export interface HeartTreeAnimationProps {
  /** Target progress [0, 1] driven by user interaction / scroll */
  targetProgress?: number;
  /** Initial progress [0, 1] */
  initialProgress?: number;
  /** Legacy autoplay support (default: false in interactive mode) */
  autoPlay?: boolean;
  /** Legacy loop support */
  loop?: boolean;
  /** Callback fired when complete */
  onComplete?: () => void;
  /** Optional custom CSS class for the root wrapper */
  className?: string;
  /** Optional inline styles for the root wrapper */
  style?: React.CSSProperties;
  /** Callback fired on each frame with current progress [0, 1] */
  onProgressUpdate?: (progress: number, stage: number) => void;
  /** Callback when user clicks or taps an element of the tree */
  onTreeInteract?: (event: TreeInteractionEvent) => void;
  /** Callback when user drags to create wind */
  onWindChange?: (windStrength: number) => void;
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

const HEART_QUOTES = [
  'A heartbeat shared in silence speaks louder than words.',
  'Every blossom here grew from a gentle glance.',
  'You are the warmth in every branch of this tree.',
  'Love is not a moment, but a million quiet choices.',
  'Where devotion grows, beauty blooms without effort.',
  'Every whisper carried by the wind remembers your smile.',
  'Rooted in grace, reaching forever toward you.',
];

/** Max in-flight heart particles; oldest are dropped when exceeded. */
const MAX_PARTICLES = 400;

/** Shared RNG for ambient embers (avoids per-frame allocation). */
const emberRng = new SeededRandom(1234567);

/** Map progress [0,1] to stage number [1..16] (thresholds must ascend:
 * seed 0.04 < roots 0.10 < trunk 0.20/0.26 < primary 0.32 < secondary 0.42
 * < twigs 0.52 < buds 0.62 < bloom1 0.68 < bloom2 0.74 < full 0.82
 * < wind 0.84 < detach 0.90 < fade 0.97 < end 1.0) */
function getStageFromProgress(p: number): number {
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

export const HeartTreeAnimation = forwardRef<HeartTreeHandle, HeartTreeAnimationProps>(({
  targetProgress = 0.02,
  initialProgress = 0.02,
  autoPlay = false,
  loop = false,
  onComplete,
  className = '',
  style,
  onProgressUpdate,
  onTreeInteract,
  onWindChange,
}, ref) => {
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
  const targetProgressRef = useRef(targetProgress);
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onTreeInteractRef = useRef(onTreeInteract);
  const onWindChangeRef = useRef(onWindChange);
  const particlesRef = useRef<FlyingHeartParticle[]>([]);
  const embersRef = useRef<Ember[]>([]);
  const detachedRef = useRef<Set<number>>(new Set());
  const mountedRef = useRef(true);
  const rafRef = useRef<number>(0);
  const decayRafRef = useRef<number>(0);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  const autoPlayRef = useRef(autoPlay);
  const loopRef = useRef(loop);
  const lastProgressCbRef = useRef({ time: 0, progress: -1 });
  // Render loop parks while the canvas is off-screen (one shared sticky
  // viewport + several ambient canvases otherwise burn frames forever).
  const visibleRef = useRef(true);
  const bgCacheRef = useRef<{ key: string; canvas: HTMLCanvasElement } | null>(null);

  // Mouse & Touch interaction state
  const pointerRef = useRef({
    x: -1000,
    y: -1000,
    isDown: false,
    startX: 0,
    startY: 0,
    dragWindX: 0,
    velocity: 0,
    lastX: 0,
    lastTime: 0,
  });

  useEffect(() => {
    targetProgressRef.current = targetProgress;
  }, [targetProgress]);

  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  useEffect(() => {
    onTreeInteractRef.current = onTreeInteract;
  }, [onTreeInteract]);

  useEffect(() => {
    onWindChangeRef.current = onWindChange;
  }, [onWindChange]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(rafRef.current);
      cancelAnimationFrame(decayRafRef.current);
      window.clearTimeout(decayRafRef.current);
    };
  }, []);

  // Imperative handle
  useImperativeHandle(ref, () => ({
    setProgress: (p: number) => {
      targetProgressRef.current = p;
      progressRef.current = p;
    },
    getProgress: () => progressRef.current,
    getStage: () => getStageFromProgress(progressRef.current),
  }), []);

  // Off-screen visibility tracking for the main render loop.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    }, { threshold: 0 });
    io.observe(container);
    return () => io.disconnect();
  }, []);

  // Ambient drifting petals
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

  // Handle container resize & canvas scaling.
  // Geometry rebuilds, but flight/detachment state is preserved: clearing
  // detached hearts + particles here made the bloom visibly replay on
  // every mobile URL-bar resize / orientation nudge.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(rect.width || window.innerWidth || 320, 320);
      const h = Math.max(rect.height || window.innerHeight || 320, 320);
      const prev = layoutRef.current;
      // No-op when nothing changed (breaks RO feedback loops).
      if (Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 && prev.w !== 0) return;
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
    };

    handleResize();

    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        handleResize();
      });
    });
    observer.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Hit testing and click/tap interaction
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointerRef.current.isDown = true;
    pointerRef.current.startX = x;
    pointerRef.current.startY = y;
    pointerRef.current.x = x;
    pointerRef.current.y = y;
    pointerRef.current.lastX = x;
    pointerRef.current.lastTime = performance.now();
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    const dt = Math.max(0.001, (now - pointerRef.current.lastTime) / 1000);
    const vx = (x - pointerRef.current.lastX) / dt;

    pointerRef.current.x = x;
    pointerRef.current.y = y;
    pointerRef.current.velocity = vx;
    pointerRef.current.lastX = x;
    pointerRef.current.lastTime = now;

    if (pointerRef.current.isDown) {
      const deltaX = x - pointerRef.current.startX;
      // Convert drag delta into wind displacement (clamped)
      pointerRef.current.dragWindX = Math.max(-25, Math.min(35, deltaX * 0.15));
      onWindChangeRef.current?.(pointerRef.current.dragWindX);
    }
  }, []);

  // Keyboard alternative to wind-drag: arrows adjust wind, 0/Escape calms it.
  const handleWrapperKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = 4;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -step : step;
      const next = Math.max(-25, Math.min(35, pointerRef.current.dragWindX + delta));
      pointerRef.current.dragWindX = next;
      onWindChangeRef.current?.(next);
    } else if (e.key === '0' || e.key === 'Escape') {
      e.preventDefault();
      pointerRef.current.dragWindX = 0;
      onWindChangeRef.current?.(0);
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const dragDist = Math.hypot(clickX - pointerRef.current.startX, clickY - pointerRef.current.startY);
    pointerRef.current.isDown = false;

    // Smoothly decay drag wind
    cancelAnimationFrame(decayRafRef.current);
    const decayWind = () => {
      if (!mountedRef.current) return;
      pointerRef.current.dragWindX *= 0.92;
      if (Math.abs(pointerRef.current.dragWindX) > 0.1) {
        decayRafRef.current = requestAnimationFrame(decayWind);
      } else {
        pointerRef.current.dragWindX = 0;
      }
    };
    decayRafRef.current = requestAnimationFrame(decayWind);

    // If it's a tap/click (not a long drag), perform hit testing
    if (dragDist < 12) {
      const tree = treeRef.current;
      const layout = layoutRef.current;
      const p = progressRef.current;
      if (!tree || layout.w === 0) return;

      const { baseX, baseY, groundY, scale } = layout;

      // 1. Clicked on Roots?
      if (p >= GROWTH_T.ROOTS_START && clickY >= groundY - 10 && clickY <= groundY + 120 * scale && Math.abs(clickX - baseX) < 140 * scale) {
        onTreeInteractRef.current?.({
          text: 'Every deep love begins in the quiet earth, unnoticed and pure.',
          type: 'root',
          x: clickX,
          y: clickY,
        });
        return;
      }

      // 2. Clicked on Branches / Trunk?
      if (p >= GROWTH_T.TRUNK_START && clickY < groundY && clickY > groundY - 320 * scale && Math.abs(clickX - baseX) < 90 * scale) {
        onTreeInteractRef.current?.({
          text: 'Branches reach out through storms, learning to hold what matters.',
          type: 'branch',
          x: clickX,
          y: clickY,
        });
        return;
      }

      // 3. Clicked on Hearts / Foliage?
      if (p >= BLOOM_T.BUDS_START && tree.hearts.length > 0) {
        const time = performance.now() * 0.001;
        const windStr = Math.max(-35, Math.min(45, getWindStrength(p) + pointerRef.current.dragWindX));
        let closestDist = Infinity;
        let hitHeart = false;

        for (let i = 0; i < tree.hearts.length; i++) {
          const heart = tree.hearts[i];
          if (detachedRef.current.has(i)) continue;
          const pos = getHeartWorldPos(heart, tree.branches, windStr, time, baseX, baseY);
          const d = Math.hypot(clickX - pos.x, clickY - pos.y);
          if (d < 28 * scale && d < closestDist) {
            closestDist = d;
            hitHeart = true;
          }
        }

        if (hitHeart) {
          const quote = HEART_QUOTES[Math.floor(Math.random() * HEART_QUOTES.length)];
          onTreeInteractRef.current?.({
            text: quote,
            type: 'heart',
            x: clickX,
            y: clickY,
          });
          return;
        }
      }
    }
  }, []);

  // Main rendering loop (reactive to user state, no auto-advance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[HeartTreeAnimation] 2D canvas context unavailable; skipping render loop.');
      const fallback = document.createElement('div');
      fallback.textContent = 'Your browser does not support canvas rendering.';
      fallback.className = 'heart-tree-fallback';
      canvas.parentElement?.appendChild(fallback);
      return () => {
        fallback.remove();
      };
    }

    let running = true;
    let lastTime = performance.now();

    const emitProgressThrottled = (progress: number) => {
      const cb = onProgressUpdateRef.current;
      if (!cb) return;
      const now = performance.now();
      const last = lastProgressCbRef.current;
      const dt = now - last.time;
      const dp = Math.abs(progress - last.progress);
      if (dt > 100 || dp > 0.01) {
        last.time = now;
        last.progress = progress;
        cb(progress, getStageFromProgress(progress));
      }
    };

    const loop = (now: number) => {
      if (!running || !mountedRef.current) return;
      // Suspended off-screen: poll at 2fps instead of 60fps heartbeat.
      if (!visibleRef.current) {
        rafRef.current = window.setTimeout(() => {
          if (running && mountedRef.current) {
            lastTime = performance.now();
            rafRef.current = requestAnimationFrame(loop);
          }
        }, 500) as unknown as number;
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Legacy autoplay: advance target toward 1 over time
      if (autoPlayRef.current && targetProgressRef.current < 1) {
        const speed = getTimelineSpeed(progressRef.current);
        targetProgressRef.current = Math.min(1, targetProgressRef.current + dt * speed * 0.05);
      }

      // Smooth inertia interpolation toward user target progress
      const targetP = targetProgressRef.current;
      const currentP = progressRef.current;
      const diff = targetP - currentP;

      if (Math.abs(diff) > 0.0005) {
        const speed = getTimelineSpeed(currentP);
        // Frame-rate independent easing (dt-normalized; 120Hz ≈ 60Hz speed).
        progressRef.current += diff * Math.min(1, 0.09 * speed * dt * 60);
        emitProgressThrottled(progressRef.current);
      }

      // Completion / loop handling (guarded so onComplete fires once per run)
      if (progressRef.current >= 1) {
        if (loopRef.current) {
          progressRef.current = 0;
          targetProgressRef.current = autoPlayRef.current ? 0.02 : targetProgressRef.current;
          completedRef.current = false;
          detachedRef.current.clear();
          particlesRef.current = [];
        } else if (!completedRef.current) {
          completedRef.current = true;
          emitProgressThrottled(1);
          onCompleteRef.current?.();
        }
      } else if (progressRef.current < 0.99) {
        // Allow re-completion if progress is driven back and forward again
        completedRef.current = false;
      }

      // If user scrolls back before detachment, re-attach detached hearts
      if (progressRef.current < FLIGHT_T.DETACH_START && detachedRef.current.size > 0) {
        detachedRef.current.clear();
        particlesRef.current = [];
      }

      const p = progressRef.current;
      const time = now * 0.001;
      const tree = treeRef.current;
      const layout = layoutRef.current;

      if (!tree || layout.w === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const { w, h, groundY, baseX, baseY, scale, dpr } = layout;
      // Combined environmental wind + user drag wind (clamped so storm + full
      // drag can't fling the canopy unrealistically far).
      const naturalWind = getWindStrength(p);
      const windStr = Math.max(-35, Math.min(45, naturalWind + pointerRef.current.dragWindX));

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
              vx: 2.2 + (1 - heart.detachOrder) * 3.2 + heart.size * 0.08 + (pointerRef.current.dragWindX * 0.1),
              vy: -1.2 + (heart.detachOrder - 0.5) * 1.5,
              size: heart.size,
              originalSize: heart.size,
              starRatio: 0,
              color: heart.color,
              rotation: heart.rotation,
              rotSpeed: (heart.detachOrder - 0.5) * 0.06,
              alpha: 1,
            });
            if (particlesRef.current.length > MAX_PARTICLES) {
              particlesRef.current.splice(0, particlesRef.current.length - MAX_PARTICLES);
            }
          }
        });
      }
      // Mobile GPUs choke on hundreds of overlapping heart draws: cap
      // in-flight particles tighter on small screens.
      const particleCap = layout.isMobile ? 160 : MAX_PARTICLES;
      if (particlesRef.current.length > particleCap) {
        particlesRef.current.splice(0, particlesRef.current.length - particleCap);
      }

      // Update in-flight particles
      updateFlyingHearts(particlesRef.current, dt, time, w, groundY);

      // Background embers (shared RNG instance, no per-frame allocation)
      const rng = emberRng;
      if (embersRef.current.length < 24 && rng.next() < 0.3) {
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
        emb.x += (emb.vx + (windStr > 0 ? windStr * 0.15 : 0)) * speedFactor;
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

      // Static background (sky/sun/mountains/ground/soil) — offscreen-cached
      // per size so we don't re-path gradients + geometry every frame.
      const bgKey = `${w | 0}x${h | 0}:${groundY.toFixed(1)}:${baseX.toFixed(1)}`;
      if (!bgCacheRef.current || bgCacheRef.current.key !== bgKey) {
        const bg = document.createElement('canvas');
        bg.width = Math.max(1, Math.floor(w * dpr));
        bg.height = Math.max(1, Math.floor(h * dpr));
        const b = bg.getContext('2d');
        if (b) {
          b.scale(dpr, dpr);
          // A. Sky Gradient
          const skyGrd = b.createLinearGradient(0, 0, 0, groundY);
          skyGrd.addColorStop(0.0, '#ba8b9d');
          skyGrd.addColorStop(0.25, '#d99dae');
          skyGrd.addColorStop(0.55, '#f5baa4');
          skyGrd.addColorStop(0.82, '#fdd8b0');
          skyGrd.addColorStop(1.0, '#fff5e3');
          b.fillStyle = skyGrd;
          b.fillRect(0, 0, w, groundY);

          // B. Horizon Sun Glow & Sun Disk
          const sunX = baseX - w * 0.02;
          const sunY = groundY - 10;
          const sunR = Math.max(w, h) * 0.38;
          const sunGrd = b.createRadialGradient(sunX, sunY, 6, sunX, sunY, sunR);
          sunGrd.addColorStop(0, 'rgba(255, 250, 230, 0.96)');
          sunGrd.addColorStop(0.08, 'rgba(255, 230, 180, 0.75)');
          sunGrd.addColorStop(0.24, 'rgba(255, 185, 140, 0.40)');
          sunGrd.addColorStop(0.55, 'rgba(235, 145, 155, 0.15)');
          sunGrd.addColorStop(1, 'rgba(200, 130, 150, 0)');
          b.fillStyle = sunGrd;
          b.fillRect(0, 0, w, groundY + 12);

          const diskGrd = b.createRadialGradient(sunX, sunY, 0, sunX, sunY, 18);
          diskGrd.addColorStop(0, 'rgba(255, 255, 248, 0.98)');
          diskGrd.addColorStop(0.45, 'rgba(255, 240, 205, 0.85)');
          diskGrd.addColorStop(1, 'rgba(255, 220, 170, 0)');
          b.fillStyle = diskGrd;
          b.beginPath();
          b.arc(sunX, sunY, 18, 0, Math.PI * 2);
          b.fill();

          // C. Distant Mountain Ridges
          b.fillStyle = 'rgba(195, 138, 152, 0.38)';
          b.beginPath();
          b.moveTo(0, groundY);
          b.bezierCurveTo(w * 0.2, groundY - 45, w * 0.45, groundY - 20, w * 0.7, groundY - 55);
          b.bezierCurveTo(w * 0.85, groundY - 70, w * 0.95, groundY - 35, w * 1.05, groundY - 40);
          b.lineTo(w, groundY);
          b.closePath();
          b.fill();

          b.fillStyle = 'rgba(182, 114, 126, 0.52)';
          b.beginPath();
          b.moveTo(0, groundY);
          b.bezierCurveTo(w * 0.25, groundY - 25, w * 0.55, groundY - 48, w * 0.8, groundY - 28);
          b.bezierCurveTo(w * 0.9, groundY - 18, w * 0.98, groundY - 30, w * 1.05, groundY - 22);
          b.lineTo(w, groundY);
          b.closePath();
          b.fill();

          // D. Foreground Earth Mound
          b.beginPath();
          b.moveTo(0, groundY + 12);
          b.bezierCurveTo(w * 0.28, groundY - 14, w * 0.65, groundY - 10, w * 1.05, groundY + 18);
          b.lineTo(w, groundY + 18);
          b.lineTo(w, h);
          b.lineTo(0, h);
          b.closePath();

          const groundGrd = b.createLinearGradient(0, groundY - 15, 0, h);
          groundGrd.addColorStop(0.0, '#e58058');
          groundGrd.addColorStop(0.02, '#a5442e');
          groundGrd.addColorStop(0.08, '#3c1b15');
          groundGrd.addColorStop(0.35, '#200e0c');
          groundGrd.addColorStop(1.0, '#100706');
          b.fillStyle = groundGrd;
          b.fill();

          // Soft rim line
          b.beginPath();
          b.moveTo(0, groundY + 12);
          b.bezierCurveTo(w * 0.28, groundY - 14, w * 0.65, groundY - 10, w * 1.05, groundY + 18);
          b.strokeStyle = 'rgba(255, 180, 130, 0.42)';
          b.lineWidth = 1.8;
          b.stroke();

          // Fine soil marks (static)
          b.fillStyle = '#220e0b';
          for (let gx = -10; gx < w + 20; gx += 14) {
            const hOff = Math.sin(gx * 0.05) * 4 + Math.cos(gx * 0.12) * 3;
            const gy = groundY - 6 + Math.sin((gx / w) * Math.PI) * -8;
            b.fillRect(gx, gy, 1.8, 5 + hOff);
          }
        }
        bgCacheRef.current = { key: bgKey, canvas: bg };
      }
      const bgCanvas = bgCacheRef.current?.canvas;
      if (bgCanvas) {
        ctx.drawImage(bgCanvas, 0, 0, bgCanvas.width, bgCanvas.height, 0, 0, w, h);
      }

      // E. Drifting Twilight Landscape Petals
      ambientPetalsRef.current.forEach((ptl, i) => {
        const px = ((time * ptl.speed + ptl.xRatio * w) % (w * 1.3)) - w * 0.15;
        const py = groundY * 0.35 + ptl.yOffset + Math.sin(time * 1.5 + i) * 12;
        const rot = time * 1.2 + i * 0.8;
        drawHeartShape(ctx, px, py, ptl.size, ptl.color, rot, 0.45);
      });

      // F. The Seed — hero of stages 1–3. Larger, breathing glow with
      // expanding rings, ground light + rising sparks so the camera
      // close-up has something to hold on. Swells before roots, then
      // yields as the trunk takes over.
      if (p >= GROWTH_T.SEED_START && p < GROWTH_T.TRUNK_MID) {
        const appear = rangeProgress(p, GROWTH_T.SEED_START, GROWTH_T.SEED_START + 0.02);
        const swell = 1 + rangeProgress(p, GROWTH_T.SEED_START + 0.02, GROWTH_T.ROOTS_START) * 0.35;
        const fadeOut = 1 - rangeProgress(p, GROWTH_T.ROOTS_START, GROWTH_T.TRUNK_MID);
        const seedAlpha = Math.min(appear, fadeOut);

        if (seedAlpha > 0) {
          const breathe = 1 + Math.sin(time * 3.2) * 0.09 + Math.sin(rangeProgress(p, GROWTH_T.SEED_START, GROWTH_T.ROOTS_START) * Math.PI) * 0.12;
          const pulse = breathe * swell;
          const seedX = baseX;
          const seedY = baseY - 4 * scale;
          const coreSize = 7.2 * pulse * scale;
          const haloR = 30 * pulse * scale;

          // Wide ground light pooling around the seed.
          ctx.save();
          ctx.globalAlpha = seedAlpha;
          const poolGrd = ctx.createRadialGradient(seedX, seedY + 4 * scale, 0, seedX, seedY + 4 * scale, 52 * scale);
          poolGrd.addColorStop(0, `rgba(255, 214, 160, ${0.34 * seedAlpha})`);
          poolGrd.addColorStop(0.5, `rgba(255, 170, 130, ${0.14 * seedAlpha})`);
          poolGrd.addColorStop(1, 'rgba(255, 170, 130, 0)');
          ctx.fillStyle = poolGrd;
          ctx.beginPath();
          ctx.ellipse(seedX, seedY + 4 * scale, 52 * scale, 14 * scale, 0, 0, Math.PI * 2);
          ctx.fill();

          // Halo.
          const seedGrd = ctx.createRadialGradient(seedX, seedY, 0.5, seedX, seedY, haloR);
          seedGrd.addColorStop(0, `rgba(255, 248, 222, ${0.55 * seedAlpha})`);
          seedGrd.addColorStop(0.3, `rgba(255, 205, 150, ${0.28 * seedAlpha})`);
          seedGrd.addColorStop(0.65, `rgba(255, 160, 140, ${0.10 * seedAlpha})`);
          seedGrd.addColorStop(1, 'rgba(255, 160, 140, 0)');
          ctx.fillStyle = seedGrd;
          ctx.beginPath();
          ctx.arc(seedX, seedY, haloR, 0, Math.PI * 2);
          ctx.fill();

          // Two expanding ripple rings (phase-offset by time).
          for (let r = 0; r < 2; r++) {
            const cycle = (time * 0.55 + r * 0.5) % 1;
            const ringR = (6 + cycle * 30) * scale;
            const ringA = (1 - cycle) * 0.4 * seedAlpha;
            if (ringA <= 0.01) continue;
            ctx.strokeStyle = `rgba(255, 226, 185, ${ringA})`;
            ctx.lineWidth = Math.max(1, 2.2 * scale * (1 - cycle * 0.6));
            ctx.beginPath();
            ctx.ellipse(seedX, seedY + 3 * scale, ringR, ringR * 0.38, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Rising sparks around the seed.
          for (let s = 0; s < 7; s++) {
            const t = (time * 0.5 + s / 7) % 1;
            const sx = seedX + Math.sin(s * 2.4 + time * 1.6) * (10 + s * 2.2) * scale;
            const sy = seedY - t * 44 * scale;
            const sa = (1 - t) * 0.85 * seedAlpha;
            if (sa <= 0.02) continue;
            ctx.fillStyle = `rgba(255, 240, 210, ${sa})`;
            ctx.beginPath();
            ctx.arc(sx, sy, (1.1 + (1 - t) * 1.1) * scale, 0, Math.PI * 2);
            ctx.fill();
          }

          // Seed body: warm pink aura heart + bright core heart.
          drawHeartShape(ctx, seedX, seedY, coreSize * 1.45, '#ff8fa3', 0, 0.5 * seedAlpha);
          drawHeartShape(ctx, seedX, seedY - 1 * scale, coreSize, '#fff5dc', 0, seedAlpha);
          ctx.restore();
        }
      }

      // F2. Soil response — cracks + mound glow while roots push out.
      // Runs through the whole roots window so the ground feels alive.
      if (p >= GROWTH_T.SEED_START && p < GROWTH_T.TRUNK_START) {
        const crackP = rangeProgress(p, GROWTH_T.ROOTS_START, GROWTH_T.TRUNK_START);
        if (crackP > 0) {
          ctx.save();
          const n = 5;
          for (let i = 0; i < n; i++) {
            const ang = Math.PI * (0.12 + (i / (n - 1)) * 0.76);
            const len = (14 + (i % 3) * 9) * scale * (0.3 + 0.7 * crackP);
            const x0 = baseX + Math.cos(ang) * 6 * scale;
            const y0 = baseY + 2 * scale;
            const x1 = baseX + Math.cos(ang) * (6 * scale + len);
            const y1 = y0 + Math.sin(ang) * len * 0.28 + 3 * scale * crackP;
            ctx.strokeStyle = `rgba(30, 12, 9, ${0.65 * crackP})`;
            ctx.lineWidth = Math.max(1, 2 * scale * (1 - (i / n) * 0.4));
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.quadraticCurveTo((x0 + x1) / 2, y0 + 2 * scale, x1, y1);
            ctx.stroke();
            // Faint warm edge on the crack lip.
            ctx.strokeStyle = `rgba(255, 190, 140, ${0.22 * crackP})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(x0, y0 - 1);
            ctx.lineTo(x1, y1 - 1);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // G. Roots (Stage 3)
      if (p >= GROWTH_T.ROOTS_START) {
        drawRoots(ctx, p, tree.roots, time);
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

      // J. Flying Hearts Stream (Stage 14) -> Transformation into Stars
      particlesRef.current.forEach(ph => {
        if (ph.alpha <= 0) return;
        if (ph.starRatio > 0.45) {
          ctx.save();
          ctx.globalAlpha = clamp01(ph.alpha);
          ctx.fillStyle = '#fff5dc';
          ctx.beginPath();
          ctx.arc(ph.x, ph.y, Math.max(1.2, ph.size * 0.7), 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = 'rgba(255, 245, 220, 0.65)';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(ph.x - ph.size * 1.5, ph.y);
          ctx.lineTo(ph.x + ph.size * 1.5, ph.y);
          ctx.moveTo(ph.x, ph.y - ph.size * 1.5);
          ctx.lineTo(ph.x, ph.y + ph.size * 1.5);
          ctx.stroke();
          ctx.restore();
        } else {
          const flip3D = Math.cos(time * 3 + ph.rotation * 5);
          const displaySize = ph.size * Math.max(0.35, Math.abs(flip3D));
          drawHeartShape(ctx, ph.x, ph.y, displaySize, ph.color, ph.rotation, ph.alpha);
        }
      });

      // K. Firefly Embers
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

      // L. Subtle Cursor Light Aura on canvas
      if (pointerRef.current.x > 0 && pointerRef.current.x < w && pointerRef.current.y > 0 && pointerRef.current.y < h) {
        const cursorGrd = ctx.createRadialGradient(
          pointerRef.current.x,
          pointerRef.current.y,
          0,
          pointerRef.current.x,
          pointerRef.current.y,
          50
        );
        cursorGrd.addColorStop(0, 'rgba(255, 220, 180, 0.12)');
        cursorGrd.addColorStop(1, 'rgba(255, 220, 180, 0)');
        ctx.fillStyle = cursorGrd;
        ctx.beginPath();
        ctx.arc(pointerRef.current.x, pointerRef.current.y, 50, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.clearTimeout(rafRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`heart-tree-wrapper select-none ${className}`}
      style={style}
      role="application"
      aria-label="Interactive Heart Tree. Drag across the sky to move the wind, or use the arrow keys."
      aria-describedby="heart-tree-wind-help"
      tabIndex={0}
      onKeyDown={handleWrapperKeyDown}
    >
      <p id="heart-tree-wind-help" className="sr-only">
        Use the left and right arrow keys to move the wind. Press 0 or Escape to calm the wind.
      </p>
      <canvas
        ref={canvasRef}
        className="heart-tree-canvas cursor-pointer touch-pan-y"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
});

HeartTreeAnimation.displayName = 'HeartTreeAnimation';

export default HeartTreeAnimation;
