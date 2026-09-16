/**
 * Organic root network generation and rendering.
 *
 * Natural dark filigree roots anchoring into the ground mound.
 * No glowing tip circles or artificial halos.
 */
import {
  type Vec2,
  SeededRandom,
  rangeProgress,
  easeOutCubic,
} from '../../../animation/bezierUtils';
import { GROWTH_T } from '../animation/growthTimeline';

export interface SubRoot {
  p0: Vec2;
  cp: Vec2;
  p1: Vec2;
  width: number;
}

export interface TreeRoot {
  p0: Vec2;
  cp: Vec2;
  p1: Vec2;
  width: number;
  growStart: number;
  growEnd: number;
  isSurface?: boolean;
  subRoots?: SubRoot[];
}

export function buildRoots(
  baseX: number,
  baseY: number,
  scale: number,
  rng: SeededRandom
): TreeRoot[] {
  const roots: TreeRoot[] = [];
  const s = scale;

  const rootSpecs = [
    // Surface buttress roots hugging mound
    { angle: 2.85, len: 64, width: 4.5, isSurface: true,  subDelta: -0.24, subLen: 32 },
    { angle: 2.50, len: 54, width: 3.8, isSurface: true,  subDelta:  0.22, subLen: 28 },
    { angle: 0.35, len: 62, width: 4.2, isSurface: true,  subDelta:  0.25, subLen: 30 },
    { angle: 0.65, len: 50, width: 3.6, isSurface: true,  subDelta: -0.20, subLen: 26 },
    // Underground anchor roots fanning out
    { angle: 2.15, len: 70, width: 3.6, isSurface: false, subDelta:  0.26, subLen: 34 },
    { angle: 1.85, len: 80, width: 4.0, isSurface: false, subDelta: -0.22, subLen: 38 },
    { angle: 1.57, len: 88, width: 4.4, isSurface: false, subDelta:  0.28, subLen: 42 },
    { angle: 1.30, len: 78, width: 3.8, isSurface: false, subDelta: -0.24, subLen: 36 },
    { angle: 1.00, len: 68, width: 3.5, isSurface: false, subDelta:  0.22, subLen: 30 },
    { angle: 2.35, len: 48, width: 3.0, isSurface: false, subDelta: -0.18, subLen: 22 },
    { angle: 0.80, len: 50, width: 3.0, isSurface: false, subDelta:  0.20, subLen: 24 },
    { angle: 1.62, len: 60, width: 3.2, isSurface: false, subDelta: -0.26, subLen: 26 },
  ];

  rootSpecs.forEach((rs, i) => {
    const len = rs.len * s;
    const angle = rs.angle + rng.symmetric() * 0.05;
    const ex = baseX + Math.cos(angle) * len;
    const ey = baseY + Math.abs(Math.sin(angle)) * (rs.isSurface ? len * 0.38 : len * 0.74);
    const cpDist = len * 0.52;
    const cp: Vec2 = {
      x: baseX + Math.cos(angle) * cpDist + rng.symmetric() * 5 * s,
      y: baseY + Math.abs(Math.sin(angle)) * (rs.isSurface ? cpDist * 0.40 : cpDist * 0.72),
    };

    const subRoots: SubRoot[] = [];
    const subAngle = angle + rs.subDelta + rng.symmetric() * 0.06;
    const subL = rs.subLen * s;
    const subStart: Vec2 = {
      x: baseX + (ex - baseX) * 0.55,
      y: baseY + (ey - baseY) * 0.55,
    };
    const subEnd: Vec2 = {
      x: subStart.x + Math.cos(subAngle) * subL,
      y: subStart.y + Math.abs(Math.sin(subAngle)) * subL * 0.7,
    };
    subRoots.push({
      p0: subStart,
      cp: {
        x: subStart.x + Math.cos(subAngle) * (subL * 0.5),
        y: subStart.y + Math.abs(Math.sin(subAngle)) * (subL * 0.5),
      },
      p1: subEnd,
      width: rs.width * 0.55 * s,
    });

    roots.push({
      p0: { x: baseX, y: baseY },
      cp,
      p1: { x: ex, y: ey },
      width: rs.width * s,
      growStart: GROWTH_T.ROOTS_START + (i / rootSpecs.length) * 0.04,
      growEnd: GROWTH_T.ROOTS_END + (i / rootSpecs.length) * 0.02,
      isSurface: rs.isSurface,
      subRoots,
    });
  });

  return roots;
}

export function drawRoots(
  ctx: CanvasRenderingContext2D,
  p: number,
  roots: TreeRoot[]
) {
  ctx.save();
  ctx.lineCap = 'round';

  roots.forEach(root => {
    const gp = rangeProgress(p, root.growStart, root.growEnd);
    if (gp <= 0) return;

    const growEased = easeOutCubic(gp);
    const curEnd: Vec2 = {
      x: root.p0.x + (root.p1.x - root.p0.x) * growEased,
      y: root.p0.y + (root.cp.y - root.p0.y) * growEased,
    };
    const curCp: Vec2 = {
      x: root.p0.x + (root.cp.x - root.p0.x) * growEased,
      y: root.p0.y + (root.cp.y - root.p0.y) * growEased,
    };

    ctx.beginPath();
    ctx.moveTo(root.p0.x, root.p0.y);
    ctx.quadraticCurveTo(curCp.x, curCp.y, curEnd.x, curEnd.y);

    // Natural dark organic root color into the soil (no neon or glowing tips)
    ctx.strokeStyle = 'rgba(64, 26, 19, 0.88)';
    ctx.lineWidth = Math.max(1.0, root.width * growEased);
    ctx.stroke();

    if (root.subRoots && gp > 0.45) {
      const subGp = easeOutCubic(rangeProgress(gp, 0.45, 1.0));
      root.subRoots.forEach(sub => {
        const send: Vec2 = {
          x: sub.p0.x + (sub.p1.x - sub.p0.x) * subGp,
          y: sub.p0.y + (sub.p1.y - sub.p0.y) * subGp,
        };
        const scp: Vec2 = {
          x: sub.p0.x + (sub.cp.x - sub.p0.x) * subGp,
          y: sub.p0.y + (sub.cp.y - sub.p0.y) * subGp,
        };
        ctx.beginPath();
        ctx.moveTo(sub.p0.x, sub.p0.y);
        ctx.quadraticCurveTo(scp.x, scp.y, send.x, send.y);
        ctx.strokeStyle = 'rgba(56, 22, 16, 0.78)';
        ctx.lineWidth = Math.max(0.8, sub.width * subGp);
        ctx.stroke();
      });
    }
  });

  ctx.restore();
}
