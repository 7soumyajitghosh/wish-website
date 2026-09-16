/**
 * Heart leaves anchoring, crisp rendering, and bud lifecycle.
 *
 * Characteristics:
 * - Crisp, clearly defined graphic heart-shaped leaves.
 * - Multi-tonal botanical palette: deep crimson, ruby red, vibrant strawberry, rose, and pink.
 * - Subtle botanical depth shadow (rgba(20, 5, 10, 0.20)), strictly NO neon pink bloom.
 * - Rightward wind detachment and flying heart stream.
 */
import {
  type Vec2,
  SeededRandom,
  pointOnCubicBezier,
  clamp01,
  rangeProgress,
  easeOrganicBloom,
  easeOutCubic,
} from '../../../animation/bezierUtils';
import { type TreeBranch, type TwigEndInfo } from './branches';
import { BLOOM_T } from '../animation/bloomTimeline';
import { windDisplace } from '../animation/windTimeline';

export interface TreeHeart {
  branchIndex: number;
  branchT: number;
  offsetX: number;
  offsetY: number;
  size: number;
  color: string;
  rotation: number;
  layer: number; // 0 = back, 1 = mid, 2 = front
  bloomStart: number;
  bloomEnd: number;
  detachOrder: number; // 0 (detaches first, outer right) -> 1 (detaches last, inner left)
}

const PALETTE_BACK = [
  '#5c0d1e', '#730d26', '#87102e', '#9b1336', '#b0163c'
];

const PALETTE_MID = [
  '#a81438', '#bd183f', '#cb1844', '#dc1b4c', '#e62454', '#ee3463'
];

const PALETTE_FRONT = [
  '#c7163f', '#d81b46', '#e62250', '#ed2e5c', '#f4436c', '#f75c80', '#f97696', '#fa92ad', '#f8b4a6'
];

export function buildHearts(
  branches: TreeBranch[],
  twigEnds: TwigEndInfo[],
  baseX: number,
  baseY: number,
  trunkH: number,
  scale: number,
  rng: SeededRandom
): TreeHeart[] {
  const hearts: TreeHeart[] = [];
  const s = scale;
  let heartId = 0;
  const crownCenterX = baseX - 8 * s;
  const crownRadiusX = 185 * s;

  // Detach order: outer right hearts detach first (0.1 to 0.4), mid hearts (0.4 to 0.7),
  // inner/left canopy leaves stay firmly anchored (0.7 to 1.2) so the tree never becomes bare
  const detachOrderFor = (x: number, y: number): number => {
    const dx = (x - crownCenterX) / crownRadiusX;
    const rightToLeft = clamp01((1.2 - dx) / 2.4);
    const dy = (baseY - y) / (trunkH * 1.8);
    const heightFactor = (1 - clamp01(dy)) * 0.10;
    const randomJitter = rng.range(-0.06, 0.06);
    return 0.12 + rightToLeft * 0.95 + heightFactor + randomJitter;
  };

  const addHeart = (
    branchIdx: number,
    bt: number,
    offX: number,
    offY: number,
    layerPref?: number,
    sizeBoost = 0,
    isUnder = false
  ) => {
    const b = branches[branchIdx];
    if (!b) return;
    const clampedT = Math.max(0.08, Math.min(1.0, bt));
    const pt = pointOnCubicBezier(b.p0, b.p1, b.p2, b.p3, clampedT);

    const layerRoll = rng.next();
    const layer = layerPref !== undefined ? layerPref : (layerRoll < 0.25 ? 0 : layerRoll < 0.70 ? 1 : 2);
    const palette = layer === 0 ? PALETTE_BACK : layer === 1 ? PALETTE_MID : PALETTE_FRONT;
    const color = palette[heartId % palette.length];

    const baseSz = layer === 0 ? 7.2 : layer === 1 ? 10.5 : 13.5;
    const size = (baseSz + rng.range(-1.5, 3.5) + sizeBoost) * s;

    const rot = isUnder ? rng.symmetric() * 0.35 : rng.symmetric() * 0.85;
    const bloomWave = layer === 2 ? BLOOM_T.BLOOM1_START : (layer === 1 ? BLOOM_T.BLOOM1_START + 0.04 : BLOOM_T.BLOOM2_START);

    hearts.push({
      branchIndex: branchIdx,
      branchT: clampedT,
      offsetX: offX * s,
      offsetY: offY * s,
      size,
      color,
      rotation: rot,
      layer,
      bloomStart: bloomWave + rng.range(0, 0.05),
      bloomEnd: bloomWave + 0.06 + rng.range(0, 0.03),
      detachOrder: detachOrderFor(pt.x + offX * s, pt.y + offY * s),
    });
    heartId++;
  };

  // 1. Twig-Tip Clusters
  twigEnds.forEach(te => {
    addHeart(te.branchIdx, 1.0, rng.symmetric() * 3, rng.symmetric() * 3, 2, 1.8);
    addHeart(te.branchIdx, 0.94, rng.symmetric() * 8 + 5, rng.symmetric() * 8 - 5, 1, 0.5);
    if (rng.next() < 0.5) {
      addHeart(te.branchIdx, 0.90, rng.symmetric() * 8 - 5, rng.symmetric() * 8 - 3, 0, -0.5);
    }
  });

  // 2. Twig-Body Foliage
  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi];
    if (b.level !== 3) continue;

    const count = 7;
    for (let hi = 0; hi < count; hi++) {
      const bt = 0.15 + (hi / count) * 0.78 + rng.range(-0.04, 0.04);
      const sign = hi % 2 === 0 ? -1 : 1;
      const offX = sign * (5 + rng.range(2, 14));
      const offY = -4 + rng.range(-9, 7);
      addHeart(bi, bt, offX, offY);
    }
  }

  // 3. Secondary Branch Clusters
  for (let bi = 0; bi < branches.length; bi++) {
    const b = branches[bi];
    if (b.level !== 2) continue;

    const count = 12;
    for (let hi = 0; hi < count; hi++) {
      const bt = 0.10 + (hi / count) * 0.84 + rng.range(-0.03, 0.03);
      const sign = hi % 2 === 0 ? -1 : 1;
      const offX = sign * (6 + rng.range(3, 16));
      const offY = -5 + rng.range(-11, 9);
      addHeart(bi, bt, offX, offY);
    }
  }

  // 4. Primary Branch Underhangs
  for (let bi = 2; bi < branches.length; bi++) {
    const b = branches[bi];
    if (b.level !== 1) continue;

    const count = bi === 2 || bi === 6 ? 26 : 16;
    for (let hi = 0; hi < count; hi++) {
      const bt = 0.15 + (hi / count) * 0.80 + rng.range(-0.03, 0.03);
      const isUnder = hi % 4 === 0;
      const offX = rng.symmetric() * 16;
      const offY = isUnder ? rng.range(8, 24) : rng.range(-20, 4);
      addHeart(bi, bt, offX, offY, isUnder ? 2 : undefined, isUnder ? 2.2 : 0, isUnder);
    }
  }

  hearts.sort((a, b) => a.layer - b.layer);
  return hearts;
}

export function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  rotation: number,
  alpha: number
) {
  if (alpha <= 0 || size <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = clamp01(alpha);

  // Subtle clean botanical shadow for leaf depth, strictly NO neon bloom
  ctx.shadowColor = 'rgba(20, 5, 10, 0.20)';
  ctx.shadowBlur = 2.0;
  ctx.shadowOffsetY = 1.0;

  const s = size;
  const top = s * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s * 0.9, s * 0.2, 0, s * 0.95);
  ctx.bezierCurveTo(s * 0.9, s * 0.2, s * 0.5, -s * 0.3, 0, top);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function getHeartWorldPos(
  heart: TreeHeart,
  branches: TreeBranch[],
  windStr: number,
  time: number,
  baseX: number,
  baseY: number
): Vec2 {
  const branch = branches[heart.branchIndex];
  if (!branch) return { x: 0, y: 0 };
  const pt = pointOnCubicBezier(branch.p0, branch.p1, branch.p2, branch.p3, heart.branchT);
  const wx = windDisplace(pt.x + heart.offsetX, pt.y + heart.offsetY, baseX, baseY, windStr, time);
  return { x: pt.x + heart.offsetX + wx, y: pt.y + heart.offsetY };
}

export function drawBudsAndHearts(
  ctx: CanvasRenderingContext2D,
  p: number,
  time: number,
  hearts: TreeHeart[],
  branches: TreeBranch[],
  windStr: number,
  baseX: number,
  baseY: number,
  detached: Set<number>
) {
  hearts.forEach((heart, idx) => {
    if (detached.has(idx)) return;

    const branch = branches[heart.branchIndex];
    if (!branch) return;
    const branchGrown = rangeProgress(p, branch.growStart, branch.growEnd);
    if (branchGrown < heart.branchT) return;

    const pos = getHeartWorldPos(heart, branches, windStr, time, baseX, baseY);

    // Bud phase (Stage 9 only)
    if (p < heart.bloomStart) {
      if (p >= BLOOM_T.BUDS_START) {
        const budP = rangeProgress(p, BLOOM_T.BUDS_START, heart.bloomStart);
        const budScale = easeOutCubic(budP) * (1 + Math.sin(time * 3 + idx * 0.5) * 0.1);
        ctx.save();
        ctx.fillStyle = '#c72b4f';
        ctx.globalAlpha = clamp01(budP * 0.85);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.0 * budScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    // Bloom phase (Stages 10–12)
    const bloomP = rangeProgress(p, heart.bloomStart, heart.bloomEnd);
    const bloomScale = easeOrganicBloom(bloomP);
    const size = heart.size * bloomScale;

    let alpha = clamp01(bloomP);
    if (heart.layer === 0) {
      alpha *= 0.80;
    } else if (heart.layer === 1) {
      alpha *= 0.92;
    } else {
      alpha *= 1.0;
    }

    const wobble = Math.sin(time * 1.8 + idx * 0.7) * 0.04;
    drawHeartShape(ctx, pos.x, pos.y, size, heart.color, heart.rotation + wobble, alpha);
  });
}
