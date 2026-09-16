/**
 * Hand-authored botanical branch armature and progressive multi-sample drawing.
 *
 * Characteristics:
 * - Naturally dark charcoal-brown bark across all branch levels (#1f0d09).
 * - Multi-sample round-cap segments for seamless, organic tapering joints.
 * - No glowing branch tips, no rim highlights, no visible joint nodes/circles.
 */
import {
  type Vec2,
  SeededRandom,
  lerp,
  pointOnCubicBezier,
  splitCubicBezier,
  rangeProgress,
  easeOutCubic,
} from '../../../animation/bezierUtils';
import { GROWTH_T } from '../animation/growthTimeline';
import { windDisplace } from '../animation/windTimeline';

export interface TreeBranch {
  p0: Vec2;
  p1: Vec2;
  p2: Vec2;
  p3: Vec2;
  widthStart: number;
  widthEnd: number;
  level: number; // 0 = trunk, 1 = primary, 2 = secondary, 3 = twig
  growStart: number;
  growEnd: number;
}

export interface TwigEndInfo {
  pt: Vec2;
  branchIdx: number;
  angle: number;
}

export function buildBranches(
  baseX: number,
  baseY: number,
  scale: number,
  rng: SeededRandom
): { branches: TreeBranch[]; twigEnds: TwigEndInfo[]; trunkH: number } {
  const branches: TreeBranch[] = [];
  const s = scale;

  // ── 1. TRUNK (Stages 4 & 5, Level 0) ────────────────────────────────
  const trunkH = 160 * s;

  // Segment 0: Lower Trunk (Stage 4)
  const trunkMid: Vec2 = { x: baseX - 14 * s, y: baseY - trunkH * 0.54 };
  branches.push({
    p0: { x: baseX, y: baseY },
    p1: { x: baseX - 6 * s, y: baseY - trunkH * 0.18 },
    p2: { x: baseX - 17 * s, y: baseY - trunkH * 0.38 },
    p3: trunkMid,
    widthStart: 34 * s,
    widthEnd: 24 * s,
    level: 0,
    growStart: GROWTH_T.TRUNK_START,
    growEnd: GROWTH_T.TRUNK_MID,
  });

  // Segment 1: Upper Trunk (Stage 5)
  const trunkTop: Vec2 = { x: baseX + 2 * s, y: baseY - trunkH * 0.98 };
  branches.push({
    p0: trunkMid,
    p1: { x: baseX - 10 * s, y: baseY - trunkH * 0.68 },
    p2: { x: baseX - 2 * s, y: baseY - trunkH * 0.84 },
    p3: trunkTop,
    widthStart: 24 * s,
    widthEnd: 17 * s,
    level: 0,
    growStart: GROWTH_T.TRUNK_MID,
    growEnd: GROWTH_T.TRUNK_END,
  });

  // ── 2. PRIMARY BRANCHES (Stage 6, Level 1) ──────────────────────────
  const leftJunction: Vec2 = { x: baseX - 12 * s, y: baseY - trunkH * 0.58 };
  const rightJunction: Vec2 = { x: baseX + 1 * s, y: baseY - trunkH * 0.85 };

  interface PrimarySpec {
    startPt: Vec2;
    cp1: Vec2;
    cp2: Vec2;
    endPt: Vec2;
    widthStart: number;
    widthEnd: number;
    angle: number;
  }

  const primarySpecs: PrimarySpec[] = [
    // 0: Left Major Bough
    {
      startPt: leftJunction,
      cp1: { x: leftJunction.x - 36 * s, y: leftJunction.y - 18 * s },
      cp2: { x: leftJunction.x - 78 * s, y: leftJunction.y - 12 * s },
      endPt: { x: leftJunction.x - 126 * s, y: leftJunction.y - 18 * s },
      widthStart: 17 * s,
      widthEnd: 9.0 * s,
      angle: -2.95,
    },
    // 1: Left-Upper Bough
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x - 28 * s, y: trunkTop.y - 28 * s },
      cp2: { x: trunkTop.x - 56 * s, y: trunkTop.y - 54 * s },
      endPt: { x: trunkTop.x - 74 * s, y: trunkTop.y - 82 * s },
      widthStart: 14 * s,
      widthEnd: 7.5 * s,
      angle: -2.35,
    },
    // 2: Central Crown Spire
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x - 6 * s, y: trunkTop.y - 36 * s },
      cp2: { x: trunkTop.x + 8 * s, y: trunkTop.y - 74 * s },
      endPt: { x: trunkTop.x + 2 * s, y: trunkTop.y - 114 * s },
      widthStart: 14 * s,
      widthEnd: 7.0 * s,
      angle: -1.57,
    },
    // 3: Right-Upper Bough
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x + 28 * s, y: trunkTop.y - 28 * s },
      cp2: { x: trunkTop.x + 58 * s, y: trunkTop.y - 54 * s },
      endPt: { x: trunkTop.x + 78 * s, y: trunkTop.y - 78 * s },
      widthStart: 13.5 * s,
      widthEnd: 7.0 * s,
      angle: -0.78,
    },
    // 4: Right Major Bough
    {
      startPt: rightJunction,
      cp1: { x: rightJunction.x + 40 * s, y: rightJunction.y - 12 * s },
      cp2: { x: rightJunction.x + 84 * s, y: rightJunction.y - 16 * s },
      endPt: { x: rightJunction.x + 128 * s, y: rightJunction.y - 22 * s },
      widthStart: 15.5 * s,
      widthEnd: 8.0 * s,
      angle: -0.22,
    },
  ];

  interface BranchEndInfo {
    pt: Vec2;
    angle: number;
    width: number;
    branchIdx: number;
  }

  const primaryEnds: BranchEndInfo[] = [];

  primarySpecs.forEach((spec, i) => {
    const idx = branches.length;
    branches.push({
      p0: spec.startPt,
      p1: spec.cp1,
      p2: spec.cp2,
      p3: spec.endPt,
      widthStart: spec.widthStart,
      widthEnd: spec.widthEnd,
      level: 1,
      growStart: GROWTH_T.PRIMARY_START + i * 0.018,
      growEnd: GROWTH_T.PRIMARY_END + i * 0.012,
    });
    primaryEnds.push({
      pt: spec.endPt,
      angle: spec.angle,
      width: spec.widthEnd,
      branchIdx: idx,
    });
  });

  // ── 3. SECONDARY BRANCHES (Stage 7, Level 2) ────────────────────────
  const secondaryEnds: BranchEndInfo[] = [];

  const secondaryConfig = [
    { pIdx: 0, forkT: 0.40, deltaAngle: -0.42, len: 64, widthRatio: 0.72 },
    { pIdx: 0, forkT: 0.72, deltaAngle:  0.38, len: 68, widthRatio: 0.68 },
    { pIdx: 0, forkT: 1.00, deltaAngle: -0.18, len: 66, widthRatio: 0.65 },
    { pIdx: 1, forkT: 0.48, deltaAngle: -0.38, len: 62, widthRatio: 0.70 },
    { pIdx: 1, forkT: 0.82, deltaAngle:  0.36, len: 66, widthRatio: 0.68 },
    { pIdx: 1, forkT: 1.00, deltaAngle: -0.15, len: 66, widthRatio: 0.65 },
    { pIdx: 2, forkT: 0.45, deltaAngle: -0.42, len: 64, widthRatio: 0.70 },
    { pIdx: 2, forkT: 0.75, deltaAngle:  0.40, len: 64, widthRatio: 0.70 },
    { pIdx: 2, forkT: 1.00, deltaAngle:  0.06, len: 68, widthRatio: 0.65 },
    { pIdx: 3, forkT: 0.50, deltaAngle: -0.34, len: 62, widthRatio: 0.70 },
    { pIdx: 3, forkT: 0.82, deltaAngle:  0.36, len: 66, widthRatio: 0.68 },
    { pIdx: 3, forkT: 1.00, deltaAngle:  0.16, len: 68, widthRatio: 0.65 },
    { pIdx: 4, forkT: 0.45, deltaAngle:  0.42, len: 66, widthRatio: 0.72 },
    { pIdx: 4, forkT: 0.75, deltaAngle: -0.32, len: 70, widthRatio: 0.68 },
    { pIdx: 4, forkT: 1.00, deltaAngle:  0.14, len: 72, widthRatio: 0.65 },
    // Interior canopy gap fillers
    { pIdx: 1, forkT: 0.35, deltaAngle:  0.46, len: 58, widthRatio: 0.65 },
    { pIdx: 2, forkT: 0.32, deltaAngle: -0.46, len: 58, widthRatio: 0.65 },
    { pIdx: 2, forkT: 0.38, deltaAngle:  0.46, len: 58, widthRatio: 0.65 },
    { pIdx: 3, forkT: 0.35, deltaAngle: -0.46, len: 58, widthRatio: 0.65 },
    { pIdx: 0, forkT: 0.55, deltaAngle:  0.50, len: 55, widthRatio: 0.62 },
    { pIdx: 4, forkT: 0.55, deltaAngle: -0.50, len: 55, widthRatio: 0.62 },
  ];

  secondaryConfig.forEach((cfg, si) => {
    const pEnd = primaryEnds[cfg.pIdx];
    const pBranch = branches[pEnd.branchIdx];
    const originPt =
      cfg.forkT >= 0.99
        ? pBranch.p3
        : pointOnCubicBezier(pBranch.p0, pBranch.p1, pBranch.p2, pBranch.p3, cfg.forkT);

    const angle = pEnd.angle + cfg.deltaAngle + rng.symmetric() * 0.05;
    const len = (cfg.len + rng.range(-4, 8)) * s;
    const endPt: Vec2 = {
      x: originPt.x + Math.cos(angle) * len,
      y: originPt.y + Math.sin(angle) * len,
    };
    const cp1: Vec2 = {
      x: originPt.x + Math.cos(angle + rng.symmetric() * 0.15) * (len * 0.45),
      y: originPt.y + Math.sin(angle + rng.symmetric() * 0.15) * (len * 0.45),
    };
    const cp2: Vec2 = {
      x: originPt.x + Math.cos(angle) * (len * 0.80),
      y: originPt.y + Math.sin(angle) * (len * 0.80),
    };

    const widthStart = pBranch.widthEnd * cfg.widthRatio;
    const widthEnd = widthStart * 0.52;
    const idx = branches.length;
    const delay = si * 0.004;

    branches.push({
      p0: originPt,
      p1: cp1,
      p2: cp2,
      p3: endPt,
      widthStart,
      widthEnd,
      level: 2,
      growStart: GROWTH_T.SECONDARY_START + delay,
      growEnd: GROWTH_T.SECONDARY_END + delay,
    });

    secondaryEnds.push({
      pt: endPt,
      angle,
      width: widthEnd,
      branchIdx: idx,
    });
  });

  // ── 4. FINE TWIGS (Stage 8, Level 3) ────────────────────────────────
  const twigEnds: TwigEndInfo[] = [];

  secondaryEnds.forEach((sEnd, si) => {
    const twigDeltas = [-0.44, 0.02, 0.42];
    twigDeltas.forEach((tDelta, ti) => {
      const sBranch = branches[sEnd.branchIdx];
      const forkT = ti === 1 ? 1.0 : 0.60 + ti * 0.18;
      const originPt =
        forkT >= 0.99
          ? sBranch.p3
          : pointOnCubicBezier(sBranch.p0, sBranch.p1, sBranch.p2, sBranch.p3, forkT);

      const angle = sEnd.angle + tDelta + rng.symmetric() * 0.08;
      const len = (34 + rng.range(0, 22)) * s;
      const endPt: Vec2 = {
        x: originPt.x + Math.cos(angle) * len,
        y: originPt.y + Math.sin(angle) * len,
      };
      const cp1: Vec2 = {
        x: originPt.x + Math.cos(angle + rng.symmetric() * 0.16) * (len * 0.45),
        y: originPt.y + Math.sin(angle + rng.symmetric() * 0.16) * (len * 0.45),
      };
      const cp2: Vec2 = {
        x: originPt.x + Math.cos(angle) * (len * 0.82),
        y: originPt.y + Math.sin(angle) * (len * 0.82),
      };

      const delay = (si * 3 + ti) * 0.002;
      const idx = branches.length;

      branches.push({
        p0: originPt,
        p1: cp1,
        p2: cp2,
        p3: endPt,
        widthStart: Math.max(1.8 * s, sEnd.width * 0.6),
        widthEnd: 0.9 * s,
        level: 3,
        growStart: GROWTH_T.TWIGS_START + delay,
        growEnd: GROWTH_T.TWIGS_END + delay,
      });

      twigEnds.push({ pt: endPt, branchIdx: idx, angle });
    });
  });

  return { branches, twigEnds, trunkH };
}

export function drawTaperedBranch(
  ctx: CanvasRenderingContext2D,
  branch: TreeBranch,
  growthP: number,
  windStr: number,
  time: number,
  baseX: number,
  baseY: number
) {
  if (growthP <= 0.001) return;

  const gp = easeOutCubic(Math.min(1, growthP));
  const [visible] = splitCubicBezier(branch.p0, branch.p1, branch.p2, branch.p3, gp);
  const [vp0, vp1, vp2, vp3] = visible;

  const startW = branch.widthStart;
  const endW = lerp(branch.widthStart, branch.widthEnd, gp);

  const N = branch.level === 0 ? 32 : branch.level === 1 ? 24 : branch.level === 2 ? 14 : 8;

  const pts: { x: number; y: number; w: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const pt = pointOnCubicBezier(vp0, vp1, vp2, vp3, t);
    const wx = windDisplace(pt.x, pt.y, baseX, baseY, windStr, time);
    const w = lerp(startW, endW, t);
    pts.push({ x: pt.x + wx, y: pt.y, w });
  }

  // Consistent dark natural illustrated wood across all branches
  const branchColor = '#1f0d09';

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = branchColor;

  for (let i = 0; i < N; i++) {
    ctx.beginPath();
    ctx.lineWidth = pts[i].w;
    ctx.moveTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawAllBranches(
  ctx: CanvasRenderingContext2D,
  p: number,
  time: number,
  branches: TreeBranch[],
  windStr: number,
  baseX: number,
  baseY: number,
  scale: number
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Trunk Buttress Base
  if (p >= GROWTH_T.TRUNK_START) {
    const buttressP = easeOutCubic(rangeProgress(p, GROWTH_T.TRUNK_START, GROWTH_T.TRUNK_MID));
    if (buttressP > 0) {
      ctx.save();
      ctx.fillStyle = '#1f0d09';

      // Left flare
      ctx.beginPath();
      ctx.moveTo(baseX - 10 * scale, baseY - 24 * scale * buttressP);
      ctx.quadraticCurveTo(
        baseX - 22 * scale * buttressP,
        baseY + 2 * scale,
        baseX - 38 * scale * buttressP,
        baseY + 10 * scale
      );
      ctx.lineTo(baseX, baseY + 6 * scale);
      ctx.closePath();
      ctx.fill();

      // Right flare
      ctx.beginPath();
      ctx.moveTo(baseX + 8 * scale, baseY - 20 * scale * buttressP);
      ctx.quadraticCurveTo(
        baseX + 18 * scale * buttressP,
        baseY + 2 * scale,
        baseX + 34 * scale * buttressP,
        baseY + 8 * scale
      );
      ctx.lineTo(baseX, baseY + 6 * scale);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  // Progressive Branches
  branches.forEach(branch => {
    const gp = rangeProgress(p, branch.growStart, branch.growEnd);
    if (gp <= 0) return;
    drawTaperedBranch(ctx, branch, gp, windStr, time, baseX, baseY);
  });

  ctx.restore();
}
