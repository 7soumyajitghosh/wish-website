import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { BranchNode, HeartLeaf, RootNode, EmberParticle, Point } from '../types';
import { soundManager } from '../audio/soundManager';


interface CinematicTreeCanvasProps {
  currentStage: number;
  stageProgress: number;
  isPlaying: boolean;
  onAdvanceToNextPage: () => void;
}

const HEART_COLORS = [
  '#c9184a',
  '#a4133c',
  '#d90429',
  '#ff0054',
  '#ff4d6d',
  '#ff758f',
  '#ff8fa3',
  '#ffb3c1',
  '#ffd166',
  '#ffe3e0',
];

export const CinematicTreeCanvas: React.FC<CinematicTreeCanvasProps> = ({
  currentStage,
  stageProgress,
  onAdvanceToNextPage
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const branchesRef = useRef<BranchNode[]>([]);
  const rootsRef = useRef<RootNode[]>([]);
  const heartsRef = useRef<HeartLeaf[]>([]);
  const embersRef = useRef<EmberParticle[]>([]);
  const clickHeartsRef = useRef<HeartLeaf[]>([]);

  const layoutRef = useRef({
    width: 0,
    height: 0,
    groundY: 0,
    treeBaseX: 0,
    treeBaseY: 0,
    dpr: 1
  });

  const prevStageRef = useRef<number>(currentStage);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [isHovering, setIsHovering] = useState(false);


  const generateTree = useCallback((w: number, h: number) => {
    const isMobile = w < 768;
    const groundY = h * (isMobile ? 0.74 : 0.72);
    const baseX = w * (isMobile ? 0.48 : 0.44);
    const baseY = groundY;

    layoutRef.current = {
      width: w,
      height: h,
      groundY,
      treeBaseX: baseX,
      treeBaseY: baseY,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    };

    const branches: BranchNode[] = [];
    const roots: RootNode[] = [];
    const hearts: HeartLeaf[] = [];

    // 1. Roots (Stage 3)
    const rootCount = 14;
    for (let i = 0; i < rootCount; i++) {
      const angle = (Math.PI / 2) + (Math.random() - 0.5) * 1.5;
      const len = 35 + Math.random() * 55;
      const ex = baseX + Math.cos(angle) * len;
      const ey = baseY + Math.abs(Math.sin(angle)) * len * 0.7;
      const cp = {
        x: baseX + Math.cos(angle) * (len * 0.5) + (Math.random() - 0.5) * 15,
        y: baseY + Math.abs(Math.sin(angle)) * (len * 0.5)
      };
      roots.push({
        start: { x: baseX, y: baseY },
        end: { x: ex, y: ey },
        cp,
        width: 3.5 - (i / rootCount) * 2.2,
        depth: ey - baseY
      });
    }

    // 2. Trunk & Branches (Stages 4 - 8)
    const scale = Math.min(w, h * 1.3) / 800;
    const trunkHeight = 150 * scale;

    const trunkMid: Point = {
      x: baseX - 8 * scale,
      y: baseY - trunkHeight * 0.52
    };

    branches.push({
      start: { x: baseX, y: baseY },
      end: trunkMid,
      cp1: { x: baseX - 12 * scale, y: baseY - trunkHeight * 0.2 },
      cp2: { x: baseX - 10 * scale, y: baseY - trunkHeight * 0.38 },
      width: 28 * scale,
      level: 0,
      appearStage: 4,
      angle: -Math.PI / 2,
      length: trunkHeight * 0.52
    });

    const trunkTop: Point = {
      x: baseX + 4 * scale,
      y: baseY - trunkHeight
    };

    branches.push({
      start: trunkMid,
      end: trunkTop,
      cp1: { x: trunkMid.x + 3 * scale, y: trunkMid.y - trunkHeight * 0.2 },
      cp2: { x: trunkTop.x - 4 * scale, y: trunkTop.y + trunkHeight * 0.15 },
      width: 20 * scale,
      level: 0,
      appearStage: 5,
      angle: -Math.PI / 2 + 0.1,
      length: trunkHeight * 0.48
    });

    const primarySpecs = [
      { angle: -2.35, len: 105 * scale, width: 14 * scale, curve: -0.25 },
      { angle: -1.75, len: 125 * scale, width: 15 * scale, curve: 0.15 },
      { angle: -1.25, len: 130 * scale, width: 15 * scale, curve: -0.1 },
      { angle: -0.75, len: 115 * scale, width: 13 * scale, curve: 0.3 }
    ];

    const primaryEnds: { pt: Point; angle: number; width: number }[] = [];

    primarySpecs.forEach((spec) => {
      const endPt: Point = {
        x: trunkTop.x + Math.cos(spec.angle) * spec.len,
        y: trunkTop.y + Math.sin(spec.angle) * spec.len
      };
      const midDist = spec.len * 0.55;
      const cp1: Point = {
        x: trunkTop.x + Math.cos(spec.angle + spec.curve) * midDist,
        y: trunkTop.y + Math.sin(spec.angle + spec.curve) * midDist
      };
      const cp2: Point = {
        x: trunkTop.x + Math.cos(spec.angle) * (spec.len * 0.85),
        y: trunkTop.y + Math.sin(spec.angle) * (spec.len * 0.85)
      };

      branches.push({
        start: trunkTop,
        end: endPt,
        cp1,
        cp2,
        width: spec.width,
        level: 1,
        appearStage: 6,
        angle: spec.angle,
        length: spec.len
      });

      primaryEnds.push({ pt: endPt, angle: spec.angle, width: spec.width * 0.6 });
    });

    const secondaryEnds: { pt: Point; angle: number; width: number }[] = [];

    primaryEnds.forEach((pEnd) => {
      const forks = [-0.38, 0.34];
      forks.forEach((forkDelta, fIdx) => {
        const angle = pEnd.angle + forkDelta + (Math.random() - 0.5) * 0.1;
        const len = (65 + Math.random() * 25) * scale;
        const endPt: Point = {
          x: pEnd.pt.x + Math.cos(angle) * len,
          y: pEnd.pt.y + Math.sin(angle) * len
        };
        const cp1: Point = {
          x: pEnd.pt.x + Math.cos(angle + (fIdx === 0 ? -0.15 : 0.15)) * (len * 0.5),
          y: pEnd.pt.y + Math.sin(angle + (fIdx === 0 ? -0.15 : 0.15)) * (len * 0.5)
        };
        const cp2: Point = {
          x: pEnd.pt.x + Math.cos(angle) * (len * 0.8),
          y: pEnd.pt.y + Math.sin(angle) * (len * 0.8)
        };

        branches.push({
          start: pEnd.pt,
          end: endPt,
          cp1,
          cp2,
          width: pEnd.width * 0.65,
          level: 2,
          appearStage: 7,
          angle,
          length: len
        });

        secondaryEnds.push({ pt: endPt, angle, width: pEnd.width * 0.45 });
      });
    });

    const twigEnds: { pt: Point; angle: number }[] = [];

    secondaryEnds.forEach((sEnd) => {
      const twigForks = [-0.45, 0.05, 0.42];
      twigForks.forEach((tDelta) => {
        const angle = sEnd.angle + tDelta + (Math.random() - 0.5) * 0.12;
        const len = (38 + Math.random() * 28) * scale;
        const endPt: Point = {
          x: sEnd.pt.x + Math.cos(angle) * len,
          y: sEnd.pt.y + Math.sin(angle) * len
        };
        const cp1: Point = {
          x: sEnd.pt.x + Math.cos(angle) * (len * 0.45),
          y: sEnd.pt.y + Math.sin(angle) * (len * 0.45)
        };
        const cp2: Point = {
          x: sEnd.pt.x + Math.cos(angle) * (len * 0.8),
          y: sEnd.pt.y + Math.sin(angle) * (len * 0.8)
        };

        branches.push({
          start: sEnd.pt,
          end: endPt,
          cp1,
          cp2,
          width: Math.max(1.5, sEnd.width * 0.55),
          level: 3,
          appearStage: 8,
          angle,
          length: len
        });

        twigEnds.push({ pt: endPt, angle });
      });
    });

    let heartIdCounter = 0;

    twigEnds.forEach((tend, idx) => {
      const color = HEART_COLORS[idx % HEART_COLORS.length];
      const baseSize = (10 + Math.random() * 8) * scale;

      hearts.push({
        id: heartIdCounter++,
        x: tend.pt.x,
        y: tend.pt.y,
        baseX: tend.pt.x,
        baseY: tend.pt.y,
        size: baseSize,
        baseSize,
        color,
        glowColor: color,
        rotation: (Math.random() - 0.5) * 0.8,
        wobbleSpeed: 1.5 + Math.random() * 2,
        wobblePhase: Math.random() * Math.PI * 2,
        appearStage: idx % 3 === 0 ? 9 : 10,
        isBud: true,
        isFlying: false,
        vx: 3 + Math.random() * 5,
        vy: -1.5 + Math.random() * 2,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        alpha: 1,
        flightDelay: Math.random() * 1.5
      });
    });

    const crownCenterX = baseX - 10 * scale;
    const crownCenterY = baseY - trunkHeight * 1.25;
    const crownRadiusX = 175 * scale;
    const crownRadiusY = 125 * scale;

    const extraHeartCount = Math.floor(340 * scale);
    for (let i = 0; i < extraHeartCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random());
      const hx = crownCenterX + Math.cos(theta) * crownRadiusX * r + (Math.random() - 0.5) * 35;
      const hy = crownCenterY + Math.sin(theta) * crownRadiusY * r + (Math.random() - 0.5) * 25;

      const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
      const baseSize = (7 + Math.random() * 12) * scale;
      const stageAssigned = i < extraHeartCount * 0.45 ? 11 : 12;

      hearts.push({
        id: heartIdCounter++,
        x: hx,
        y: hy,
        baseX: hx,
        baseY: hy,
        size: baseSize,
        baseSize,
        color,
        glowColor: color,
        rotation: (Math.random() - 0.5) * 1.2,
        wobbleSpeed: 1.2 + Math.random() * 2.2,
        wobblePhase: Math.random() * Math.PI * 2,
        appearStage: stageAssigned,
        isBud: false,
        isFlying: false,
        vx: 4 + Math.random() * 7 + (hx > crownCenterX ? 2 : 0),
        vy: -1.8 + Math.random() * 2.2,
        rotSpeed: (Math.random() - 0.5) * 0.12,
        alpha: 1,
        flightDelay: (1 - (hx - (crownCenterX - crownRadiusX)) / (crownRadiusX * 2)) * 0.8 + Math.random() * 1.2
      });
    }

    branchesRef.current = branches;
    rootsRef.current = roots;
    heartsRef.current = hearts;
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      generateTree(w, h);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generateTree]);

  useEffect(() => {
    if (currentStage !== prevStageRef.current) {
      if (currentStage === 2) {
        soundManager.playHeartbeat();
      } else if (currentStage === 3) {
        soundManager.playSproutChime();
      } else if (currentStage === 9 || currentStage === 10 || currentStage === 11 || currentStage === 12) {
        soundManager.playBloomChime();
      } else if (currentStage === 13 || currentStage === 14) {
        soundManager.playWindWhoosh();
      } else if (currentStage === 15) {
        soundManager.playTransitionChime();
        const timer = setTimeout(() => {
          onAdvanceToNextPage();
        }, 3400);
        return () => clearTimeout(timer);
      }
      prevStageRef.current = currentStage;
    }
  }, [currentStage, onAdvanceToNextPage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    }


    const drawHeart = (
      context: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      size: number,
      color: string,
      rotation: number,
      alpha: number = 1,
      glow: boolean = false
    ) => {
      context.save();
      context.translate(cx, cy);
      context.rotate(rotation);
      context.globalAlpha = Math.max(0, Math.min(1, alpha));

      if (glow) {
        context.shadowColor = color;
        context.shadowBlur = size * 1.2;
      } else {
        context.shadowColor = 'rgba(0,0,0,0.2)';
        context.shadowBlur = 4;
      }

      context.beginPath();
      const topCurveHeight = size * 0.3;
      context.moveTo(0, topCurveHeight);
      context.bezierCurveTo(
        -size * 0.5, -size * 0.3,
        -size * 0.9, size * 0.2,
        0, size * 0.95
      );
      context.bezierCurveTo(
        size * 0.9, size * 0.2,
        size * 0.5, -size * 0.3,
        0, topCurveHeight
      );

      context.fillStyle = color;
      context.fill();
      context.restore();
    };

    const render = () => {
      if (!isRunning) return;
      const now = performance.now();
      const t = (now - startTimeRef.current) * 0.001;
      const { width: w, height: h, groundY, treeBaseX, treeBaseY, dpr } = layoutRef.current;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      // 1. SKY GRADIENT
      const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGradient.addColorStop(0.0, '#be8fa1');
      skyGradient.addColorStop(0.25, '#dca0b0');
      skyGradient.addColorStop(0.55, '#f6bca5');
      skyGradient.addColorStop(0.82, '#fedbb1');
      skyGradient.addColorStop(1.0, '#fff6e4');

      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, w, groundY);

      // 2. SUNSET SUN DISK & RADIAL ATMOSPHERE
      const sunX = treeBaseX - w * 0.03;
      const sunY = groundY - 14;
      const sunRadius = Math.max(w, h) * 0.35;

      const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
      sunGlow.addColorStop(0, 'rgba(255, 252, 240, 0.95)');
      sunGlow.addColorStop(0.12, 'rgba(255, 232, 185, 0.7)');
      sunGlow.addColorStop(0.35, 'rgba(255, 186, 145, 0.35)');
      sunGlow.addColorStop(0.7, 'rgba(235, 150, 160, 0.12)');
      sunGlow.addColorStop(1, 'rgba(200, 130, 150, 0)');

      ctx.fillStyle = sunGlow;
      ctx.fillRect(0, 0, w, groundY);

      // Distant mountain ridges
      ctx.fillStyle = 'rgba(195, 138, 152, 0.38)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(w * 0.2, groundY - 45, w * 0.45, groundY - 20, w * 0.7, groundY - 55);
      ctx.bezierCurveTo(w * 0.85, groundY - 70, w * 0.95, groundY - 35, w, groundY - 40);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(182, 114, 126, 0.52)';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.bezierCurveTo(w * 0.25, groundY - 25, w * 0.55, groundY - 48, w * 0.8, groundY - 28);
      ctx.bezierCurveTo(w * 0.9, groundY - 18, w * 0.96, groundY - 30, w, groundY - 22);
      ctx.lineTo(w, groundY);
      ctx.closePath();
      ctx.fill();

      // 3. FOREGROUND GROUND HILL
      ctx.beginPath();
      ctx.moveTo(0, groundY + 12);
      ctx.bezierCurveTo(w * 0.28, groundY - 12, w * 0.65, groundY - 8, w, groundY + 18);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();

      const groundGradient = ctx.createLinearGradient(0, groundY - 15, 0, h);
      groundGradient.addColorStop(0.0, '#e58058');
      groundGradient.addColorStop(0.03, '#a34832');
      groundGradient.addColorStop(0.12, '#381c16');
      groundGradient.addColorStop(0.4, '#200f0d');
      groundGradient.addColorStop(1.0, '#100706');

      ctx.fillStyle = groundGradient;
      ctx.fill();

      ctx.fillStyle = '#220e0b';
      for (let gx = 0; gx < w; gx += 16) {
        const hOffset = Math.sin(gx * 0.05) * 4 + Math.cos(gx * 0.12) * 3;
        const gy = groundY - 4 + Math.sin(gx / w * Math.PI) * -8;
        ctx.fillRect(gx, gy, 1.8, 6 + hOffset);
      }

      // 4. STAGE 2: GLOWING SEED
      if (currentStage >= 2 && currentStage <= 5) {
        const seedPulse = 1 + Math.sin(t * 5) * 0.18;
        const seedSize = (currentStage === 2 ? 14 : 11) * seedPulse;
        const seedAlpha = currentStage >= 4 ? Math.max(0, 1 - (currentStage - 4 + stageProgress)) : 1;

        if (seedAlpha > 0) {
          const seedGlow = ctx.createRadialGradient(treeBaseX, treeBaseY - 2, 2, treeBaseX, treeBaseY - 2, 45 * seedPulse);
          seedGlow.addColorStop(0, 'rgba(255, 245, 210, 0.95)');
          seedGlow.addColorStop(0.3, 'rgba(255, 180, 100, 0.6)');
          seedGlow.addColorStop(0.7, 'rgba(255, 90, 120, 0.25)');
          seedGlow.addColorStop(1, 'rgba(255, 50, 100, 0)');

          ctx.fillStyle = seedGlow;
          ctx.beginPath();
          ctx.arc(treeBaseX, treeBaseY - 2, 45 * seedPulse, 0, Math.PI * 2);
          ctx.fill();

          drawHeart(ctx, treeBaseX, treeBaseY - 8, seedSize, '#fff4e0', 0, seedAlpha, true);

          ctx.save();
          ctx.strokeStyle = 'rgba(255, 235, 180, 0.6)';
          ctx.lineWidth = 1.2;
          for (let r = 0; r < 6; r++) {
            const rayAngle = (t * 0.8) + (r * Math.PI / 3);
            const rLen = 18 + Math.sin(t * 4 + r) * 6;
            ctx.beginPath();
            ctx.moveTo(treeBaseX, treeBaseY - 6);
            ctx.lineTo(treeBaseX + Math.cos(rayAngle) * rLen, treeBaseY - 6 + Math.sin(rayAngle) * rLen);
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // 5. STAGE 3: ROOTS EMERGE
      if (currentStage >= 3) {
        const rootProgress = currentStage === 3 ? Math.min(1, stageProgress * 1.2) : 1;
        ctx.save();

        rootsRef.current.forEach((root) => {
          ctx.beginPath();
          ctx.moveTo(root.start.x, root.start.y);

          const curEnd = {
            x: root.start.x + (root.end.x - root.start.x) * rootProgress,
            y: root.start.y + (root.end.y - root.start.y) * rootProgress
          };
          const curCp = {
            x: root.start.x + (root.cp.x - root.start.x) * rootProgress,
            y: root.start.y + (root.cp.y - root.start.y) * rootProgress
          };

          ctx.quadraticCurveTo(curCp.x, curCp.y, curEnd.x, curEnd.y);

          const isFresh = currentStage === 3;
          ctx.strokeStyle = isFresh ? '#fed287' : 'rgba(240, 175, 120, 0.7)';
          ctx.shadowColor = '#ffbb55';
          ctx.shadowBlur = isFresh ? 8 : 3;
          ctx.lineWidth = root.width * rootProgress;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (isFresh && rootProgress > 0.4) {
            ctx.fillStyle = '#fff6d5';
            ctx.beginPath();
            ctx.arc(curEnd.x, curEnd.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();
      }

      // 6. STAGES 4 - 8: TRUNK & BRANCH SKELETON
      if (currentStage >= 4) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        branchesRef.current.forEach((b) => {
          if (currentStage < b.appearStage) return;

          const branchProg = currentStage === b.appearStage ? Math.min(1, stageProgress * 1.3) : 1;
          if (branchProg <= 0) return;

          const ex = b.start.x + (b.end.x - b.start.x) * branchProg;
          const ey = b.start.y + (b.end.y - b.start.y) * branchProg;
          const cp1x = b.start.x + (b.cp1.x - b.start.x) * branchProg;
          const cp1y = b.start.y + (b.cp1.y - b.start.y) * branchProg;
          const cp2x = b.start.x + (b.cp2.x - b.start.x) * branchProg;
          const cp2y = b.start.y + (b.cp2.y - b.start.y) * branchProg;

          let windOffset = 0;
          if (currentStage >= 13) {
            const windStrength = currentStage === 13 ? 0.03 : currentStage === 14 ? 0.06 : 0.09;
            windOffset = Math.sin(t * 3 + b.level) * windStrength * b.length;
          }

          ctx.beginPath();
          ctx.moveTo(b.start.x, b.start.y);
          ctx.bezierCurveTo(cp1x + windOffset * 0.4, cp1y, cp2x + windOffset * 0.7, cp2y, ex + windOffset, ey);

          ctx.strokeStyle = b.level === 0 ? '#26120e' : '#331711';
          ctx.lineWidth = b.width;
          ctx.stroke();

          if (b.level <= 1) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(b.start.x - b.width * 0.35, b.start.y);
            ctx.bezierCurveTo(
              cp1x - b.width * 0.3, cp1y,
              cp2x - b.width * 0.25, cp2y,
              ex - b.width * 0.2, ey
            );
            ctx.strokeStyle = 'rgba(255, 175, 130, 0.45)';
            ctx.lineWidth = Math.max(1, b.width * 0.22);
            ctx.stroke();
            ctx.restore();
          }
        });

        ctx.restore();
      }

      // 7. STAGES 9 - 15: BUDS, HEARTS & FLIGHT DYNAMICS
      if (currentStage >= 9) {
        heartsRef.current.forEach((heart) => {
          if (currentStage < heart.appearStage) return;

          if (currentStage === 9 && heart.isBud) {
            const budScale = Math.min(1, stageProgress * 1.5) * (1 + Math.sin(t * 4 + heart.wobblePhase) * 0.15);
            ctx.save();
            ctx.fillStyle = '#ff9ebb';
            ctx.shadowColor = '#ffa0b0';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(heart.baseX, heart.baseY, 3.5 * budScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
          }

          const bloomScale = currentStage === heart.appearStage
            ? Math.min(1, Math.max(0.1, stageProgress * 1.4))
            : 1;

          let currentX = heart.baseX;
          let currentY = heart.baseY;
          let currentRot = heart.rotation;
          let currentAlpha = 1;
          let currentSize = heart.size * bloomScale;

          if (currentStage === 13) {
            const rustle = Math.sin(t * heart.wobbleSpeed + heart.wobblePhase);
            currentX += rustle * 3.5 + 2;
            currentRot += rustle * 0.15 + 0.1;
          } else if (currentStage >= 14) {
            heart.isFlying = true;
            const flightTime = Math.max(0, (currentStage === 14 ? stageProgress : 1 + stageProgress) * 3 - heart.flightDelay);

            if (flightTime > 0) {
              const speedMultiplier = currentStage === 15 ? 1.6 : 1.0;
              const dx = (heart.vx * 65 * speedMultiplier) * flightTime;
              const dy = Math.sin(flightTime * 2.5 + heart.wobblePhase) * 22 - (flightTime * 35);
              currentX = heart.baseX + dx;
              currentY = heart.baseY + dy;
              currentRot += heart.rotSpeed * flightTime * 15;

              const flip3D = Math.cos(flightTime * 5 + heart.wobblePhase);
              currentSize = heart.size * Math.max(0.2, Math.abs(flip3D) * 1.1);

              if (currentX > w + 60) {
                currentAlpha = 0;
              } else if (currentX > w * 0.85) {
                currentAlpha = Math.max(0, 1 - (currentX - w * 0.85) / (w * 0.2));
              }
            }
          }

          if (currentAlpha > 0) {
            drawHeart(
              ctx,
              currentX,
              currentY,
              currentSize,
              heart.color,
              currentRot,
              currentAlpha,
              currentStage >= 12
            );
          }
        });
      }

      // 8. INTERACTIVE CLICK HEARTS
      for (let i = clickHeartsRef.current.length - 1; i >= 0; i--) {
        const ch = clickHeartsRef.current[i];
        ch.x += ch.vx;
        ch.y += ch.vy;
        ch.vy += 0.08;
        ch.rotation += ch.rotSpeed;
        ch.alpha -= 0.015;

        if (ch.alpha <= 0) {
          clickHeartsRef.current.splice(i, 1);
        } else {
          drawHeart(ctx, ch.x, ch.y, ch.size, ch.color, ch.rotation, ch.alpha, true);
        }
      }

      // 9. AMBIENT DRIFTING EMBERS
      if (embersRef.current.length < 35 && Math.random() < 0.4) {
        embersRef.current.push({
          x: Math.random() * w,
          y: groundY - Math.random() * (h * 0.5),
          vx: 0.3 + Math.random() * 0.8,
          vy: -0.2 - Math.random() * 0.6,
          size: 1.2 + Math.random() * 2.5,
          color: Math.random() > 0.4 ? '#ffd166' : '#ff758f',
          alpha: 0.2 + Math.random() * 0.7,
          life: 0,
          maxLife: 150 + Math.random() * 150
        });
      }

      for (let i = embersRef.current.length - 1; i >= 0; i--) {
        const emb = embersRef.current[i];
        emb.x += emb.vx + (currentStage >= 13 ? 2.5 : 0);
        emb.y += emb.vy;
        emb.life++;

        const emberFade = Math.sin((emb.life / emb.maxLife) * Math.PI);
        const finalAlpha = emb.alpha * emberFade;

        if (emb.life >= emb.maxLife || emb.x > w + 20) {
          embersRef.current.splice(i, 1);
        } else {
          ctx.save();
          ctx.fillStyle = emb.color;
          ctx.shadowColor = emb.color;
          ctx.shadowBlur = 6;
          ctx.globalAlpha = Math.max(0, finalAlpha);
          ctx.beginPath();
          ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 10. STAGE 15: CINEMATIC HEART STREAM VORTEX
      if (currentStage === 15) {
        ctx.save();
        const streamProgress = stageProgress;
        const ribbonCount = 28;

        for (let r = 0; r < ribbonCount; r++) {
          const streamPhase = (t * 2 + r * 0.15) % 1;
          const sx = treeBaseX + (w * 0.95 - treeBaseX) * streamPhase;
          const sy = treeBaseY - 120 + Math.sin(streamPhase * Math.PI * 2 + r) * 45 - (streamPhase * 90);
          const sSize = 12 + Math.sin(r) * 6;
          const sColor = HEART_COLORS[r % HEART_COLORS.length];
          const sAlpha = Math.sin(streamPhase * Math.PI);

          drawHeart(ctx, sx, sy, sSize, sColor, streamPhase * 5, sAlpha * streamProgress, true);
        }
        ctx.restore();
      }

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [currentStage, stageProgress]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    soundManager.startAmbient();
    soundManager.playBloomChime();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      clickHeartsRef.current.push({
        id: Math.random(),
        x: clickX,
        y: clickY,
        baseX: clickX,
        baseY: clickY,
        size: 9 + Math.random() * 8,
        baseSize: 12,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        glowColor: '#ff758f',
        rotation: Math.random() * Math.PI * 2,
        wobbleSpeed: 2,
        wobblePhase: 0,
        appearStage: 1,
        isBud: false,
        isFlying: false,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        flightDelay: 0
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none cursor-pointer">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="absolute inset-0 w-full h-full block"
      />
      <div className={`absolute top-6 left-6 pointer-events-none transition-opacity duration-500 ${isHovering ? 'opacity-75' : 'opacity-0'}`}>
        <p className="text-xs text-rose-200/70 tracking-widest font-light uppercase drop-shadow">
          ✨ Tap canvas to release hearts
        </p>
      </div>
    </div>
  );
};
