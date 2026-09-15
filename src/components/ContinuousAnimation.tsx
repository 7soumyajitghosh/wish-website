/**
 * ContinuousAnimation — ONE continuous graphical animation.
 *
 * A single `progress` value [0, 1] drives EVERYTHING.
 * No stages, no cuts, no scene switches.
 * The same tree grows, blooms, sheds hearts, and the camera follows them.
 */
import React, { useEffect, useRef } from 'react';
import {
  type Vec2, lerp, pointOnCubicBezier, tangentOnCubicBezier,
  splitCubicBezier, rangeProgress, easeInOutCubic, easeOrganicBloom,
  easeOutCubic, SeededRandom, clamp01,
} from '../animation/bezierUtils';
import { T, TOTAL_DURATION } from '../animation/timeline';
import { type TreeData, type TreeBranch, type TreeHeart, buildTree } from '../animation/treeGeometry';
import { soundManager } from '../audio/soundManager';

// ─── Types ───────────────────────────────────────────────────────────

interface Props {
  isPlaying: boolean;
  playbackSpeed: number;
  seekTargetRef: React.MutableRefObject<number | null>;
  onProgressUpdate: (progress: number) => void;
  isMuted: boolean;
}

interface Layout {
  w: number; h: number;
  groundY: number;
  baseX: number; baseY: number;
  scale: number; dpr: number;
  isMobile: boolean;
}

interface FlyingHeart {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  rotation: number; rotSpeed: number;
  alpha: number;
}

interface Ember {
  x: number; y: number;
  vx: number; vy: number;
  size: number; color: string;
  alpha: number; life: number; maxLife: number;
}

// ─── Heart colours (re-export for external use) ──────────────────────

const HEART_COLORS = [
  '#c9184a', '#a4133c', '#d90429', '#ff0054', '#ff4d6d',
  '#ff758f', '#ff8fa3', '#ffb3c1', '#ffd166', '#ffe3e0',
];

// ─── Camera ──────────────────────────────────────────────────────────

function getCamera(p: number, time: number, w: number) {
  let zoom = 1.0;
  if (p < T.FULL_BLOOM) {
    zoom = 1.0 + rangeProgress(p, 0, T.FULL_BLOOM) * 0.025;
  } else if (p < T.TRANSITION_START) {
    zoom = 1.025 + Math.sin(time * 1.2) * 0.003;
  } else {
    zoom = lerp(1.025, 1.0, easeInOutCubic(rangeProgress(p, T.TRANSITION_START, T.DESTINATION_FULL)));
  }

  let panX = 0;
  if (p >= T.TRANSITION_START) {
    panX = easeInOutCubic(rangeProgress(p, T.TRANSITION_START, T.DESTINATION_FULL)) * w * 1.4;
  }

  return { zoom, panX };
}

// ─── Wind ────────────────────────────────────────────────────────────

function getWindStrength(p: number): number {
  if (p < T.WIND_START) return 0;
  if (p < T.DETACH_START) return rangeProgress(p, T.WIND_START, T.DETACH_START) * 12;
  return 12 + rangeProgress(p, T.DETACH_START, T.STREAM_PEAK) * 18;
}

function windDisplace(x: number, y: number, baseX: number, baseY: number, windStr: number, time: number): number {
  if (windStr <= 0) return 0;
  const dx = Math.abs(x - baseX);
  const dy = Math.max(0, baseY - y);
  const dist = (dx + dy * 0.5) / 250;
  const osc = Math.sin(time * 2.5 + y * 0.008 + x * 0.003) * 0.65
            + Math.sin(time * 1.3 + y * 0.012) * 0.35;
  return windStr * dist * osc;
}

// ─── Drawing: Heart shape ────────────────────────────────────────────

function drawHeartShape(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
  color: string, rotation: number,
  alpha: number, glow: boolean,
) {
  if (alpha <= 0 || size <= 0) return;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = clamp01(alpha);

  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 1.0;
  } else {
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 3;
  }

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

// ─── Drawing: Sky, sun, mountains, ground ────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number) {
  const grd = ctx.createLinearGradient(0, 0, 0, groundY);
  grd.addColorStop(0.0, '#be8fa1');
  grd.addColorStop(0.25, '#dca0b0');
  grd.addColorStop(0.55, '#f6bca5');
  grd.addColorStop(0.82, '#fedbb1');
  grd.addColorStop(1.0, '#fff6e4');
  ctx.fillStyle = grd;
  ctx.fillRect(-w, 0, w * 4, groundY);
}

function drawSunGlow(ctx: CanvasRenderingContext2D, baseX: number, groundY: number, w: number, h: number) {
  const sunX = baseX - w * 0.03;
  const sunY = groundY - 14;
  const sunR = Math.max(w, h) * 0.35;
  const grd = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunR);
  grd.addColorStop(0, 'rgba(255,252,240,0.95)');
  grd.addColorStop(0.12, 'rgba(255,232,185,0.7)');
  grd.addColorStop(0.35, 'rgba(255,186,145,0.35)');
  grd.addColorStop(0.7, 'rgba(235,150,160,0.12)');
  grd.addColorStop(1, 'rgba(200,130,150,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(-w, 0, w * 4, groundY);
}

function drawMountains(ctx: CanvasRenderingContext2D, w: number, groundY: number) {
  ctx.fillStyle = 'rgba(195,138,152,0.38)';
  ctx.beginPath();
  ctx.moveTo(-w, groundY);
  ctx.bezierCurveTo(w * 0.2, groundY - 45, w * 0.45, groundY - 20, w * 0.7, groundY - 55);
  ctx.bezierCurveTo(w * 0.85, groundY - 70, w * 0.95, groundY - 35, w * 1.1, groundY - 40);
  ctx.lineTo(w * 3, groundY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(182,114,126,0.52)';
  ctx.beginPath();
  ctx.moveTo(-w, groundY);
  ctx.bezierCurveTo(w * 0.25, groundY - 25, w * 0.55, groundY - 48, w * 0.8, groundY - 28);
  ctx.bezierCurveTo(w * 0.9, groundY - 18, w * 1.0, groundY - 30, w * 1.1, groundY - 22);
  ctx.lineTo(w * 3, groundY);
  ctx.closePath();
  ctx.fill();
}

function drawGround(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number) {
  ctx.beginPath();
  ctx.moveTo(-w, groundY + 12);
  ctx.bezierCurveTo(w * 0.28, groundY - 12, w * 0.65, groundY - 8, w * 1.1, groundY + 18);
  ctx.lineTo(w * 3, groundY + 18);
  ctx.lineTo(w * 3, h);
  ctx.lineTo(-w, h);
  ctx.closePath();

  const grd = ctx.createLinearGradient(0, groundY - 15, 0, h);
  grd.addColorStop(0.0, '#e58058');
  grd.addColorStop(0.03, '#a34832');
  grd.addColorStop(0.12, '#381c16');
  grd.addColorStop(0.4, '#200f0d');
  grd.addColorStop(1.0, '#100706');
  ctx.fillStyle = grd;
  ctx.fill();

  // Grass texture marks
  ctx.fillStyle = '#220e0b';
  for (let gx = -20; gx < w * 1.2; gx += 16) {
    const hOff = Math.sin(gx * 0.05) * 4 + Math.cos(gx * 0.12) * 3;
    const gy = groundY - 4 + Math.sin((gx / w) * Math.PI) * -8;
    ctx.fillRect(gx, gy, 1.8, 6 + hOff);
  }
}

// ─── Drawing: Seed ───────────────────────────────────────────────────

function drawSeed(ctx: CanvasRenderingContext2D, p: number, time: number, baseX: number, baseY: number, scale: number) {
  const appear = rangeProgress(p, T.SEED_START, T.SEED_PEAK);
  const fadeOut = 1 - rangeProgress(p, T.TRUNK_START, T.TRUNK_END);
  const alpha = Math.min(appear, fadeOut);
  if (alpha <= 0) return;

  const pulse = 1 + Math.sin(time * 5) * 0.18;
  const seedSize = 14 * pulse * scale;

  // Radial glow
  const glowR = 45 * pulse * scale;
  const grd = ctx.createRadialGradient(baseX, baseY - 2, 2, baseX, baseY - 2, glowR);
  grd.addColorStop(0, `rgba(255,245,210,${0.95 * alpha})`);
  grd.addColorStop(0.3, `rgba(255,180,100,${0.6 * alpha})`);
  grd.addColorStop(0.7, `rgba(255,90,120,${0.25 * alpha})`);
  grd.addColorStop(1, 'rgba(255,50,100,0)');
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(baseX, baseY - 2, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Heart seed
  drawHeartShape(ctx, baseX, baseY - 8, seedSize, '#fff4e0', 0, alpha, true);

  // Light rays
  ctx.save();
  ctx.strokeStyle = `rgba(255,235,180,${0.6 * alpha})`;
  ctx.lineWidth = 1.2;
  for (let r = 0; r < 6; r++) {
    const rayAngle = time * 0.8 + r * Math.PI / 3;
    const rLen = (18 + Math.sin(time * 4 + r) * 6) * scale;
    ctx.beginPath();
    ctx.moveTo(baseX, baseY - 6);
    ctx.lineTo(baseX + Math.cos(rayAngle) * rLen, baseY - 6 + Math.sin(rayAngle) * rLen);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Drawing: Roots ──────────────────────────────────────────────────

function drawRoots(
  ctx: CanvasRenderingContext2D, p: number, time: number,
  roots: TreeData['roots'],
) {
  ctx.save();
  ctx.lineCap = 'round';

  roots.forEach(root => {
    const gp = rangeProgress(p, root.growStart, root.growEnd);
    if (gp <= 0) return;

    const growEased = easeOutCubic(gp);
    const curEnd: Vec2 = {
      x: root.p0.x + (root.p1.x - root.p0.x) * growEased,
      y: root.p0.y + (root.p1.y - root.p0.y) * growEased,
    };
    const curCp: Vec2 = {
      x: root.p0.x + (root.cp.x - root.p0.x) * growEased,
      y: root.p0.y + (root.cp.y - root.p0.y) * growEased,
    };

    ctx.beginPath();
    ctx.moveTo(root.p0.x, root.p0.y);
    ctx.quadraticCurveTo(curCp.x, curCp.y, curEnd.x, curEnd.y);

    const isFresh = gp < 1;
    ctx.strokeStyle = isFresh ? '#fed287' : 'rgba(200,150,100,0.7)';
    ctx.shadowColor = '#ffbb55';
    ctx.shadowBlur = isFresh ? 8 : 3;
    ctx.lineWidth = root.width * growEased;
    ctx.stroke();

    // Glowing tip
    if (isFresh && gp > 0.15) {
      ctx.fillStyle = '#fff6d5';
      ctx.beginPath();
      ctx.arc(curEnd.x, curEnd.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.restore();
}

// ─── Drawing: Branches (tapered fill for thick, stroke for thin) ─────

function drawTaperedBranch(
  ctx: CanvasRenderingContext2D,
  branch: TreeBranch,
  growthP: number,
  windStr: number, time: number,
  baseX: number, baseY: number,
) {
  if (growthP <= 0.001) return;

  const gp = easeOutCubic(Math.min(1, growthP));

  // Split bezier to show only grown portion
  const [visible] = splitCubicBezier(branch.p0, branch.p1, branch.p2, branch.p3, gp);
  const [vp0, vp1, vp2, vp3] = visible;

  const startW = branch.widthStart;
  const endW = lerp(branch.widthStart, branch.widthEnd, gp);

  if (branch.level <= 1 && startW > 6) {
    // Filled tapered polygon for trunk/primary
    const N = Math.max(12, Math.ceil(startW * 1.5));
    const leftEdge: Vec2[] = [];
    const rightEdge: Vec2[] = [];

    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = pointOnCubicBezier(vp0, vp1, vp2, vp3, t);
      const tang = tangentOnCubicBezier(vp0, vp1, vp2, vp3, Math.max(0.001, Math.min(0.999, t)));
      const len = Math.sqrt(tang.x * tang.x + tang.y * tang.y) || 1;
      const nx = -tang.y / len;
      const ny = tang.x / len;
      const w = lerp(startW, endW, t) / 2;
      const wx = windDisplace(pt.x, pt.y, baseX, baseY, windStr, time);

      leftEdge.push({ x: pt.x + nx * w + wx, y: pt.y + ny * w });
      rightEdge.push({ x: pt.x - nx * w + wx, y: pt.y - ny * w });
    }

    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    for (let i = N; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();

    ctx.fillStyle = branch.level === 0 ? '#26120e' : '#331711';
    ctx.fill();

    // Highlight edge
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i <= N; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    ctx.strokeStyle = 'rgba(255,175,130,0.25)';
    ctx.lineWidth = Math.max(1, startW * 0.12);
    ctx.stroke();
  } else {
    // Simple stroke for thinner branches
    const wx0 = windDisplace(vp0.x, vp0.y, baseX, baseY, windStr, time);
    const wx1 = windDisplace(vp1.x, vp1.y, baseX, baseY, windStr, time);
    const wx2 = windDisplace(vp2.x, vp2.y, baseX, baseY, windStr, time);
    const wx3 = windDisplace(vp3.x, vp3.y, baseX, baseY, windStr, time);

    ctx.beginPath();
    ctx.moveTo(vp0.x + wx0, vp0.y);
    ctx.bezierCurveTo(
      vp1.x + wx1, vp1.y,
      vp2.x + wx2, vp2.y,
      vp3.x + wx3, vp3.y,
    );
    ctx.strokeStyle = branch.level === 2 ? '#3d2019' : '#4a2a1e';
    ctx.lineWidth = lerp(startW, endW, 0.5);
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawAllBranches(
  ctx: CanvasRenderingContext2D, p: number, time: number,
  branches: TreeBranch[],
  windStr: number, baseX: number, baseY: number,
) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  branches.forEach(branch => {
    const gp = rangeProgress(p, branch.growStart, branch.growEnd);
    if (gp <= 0) return;
    drawTaperedBranch(ctx, branch, gp, windStr, time, baseX, baseY);
  });

  ctx.restore();
}

// ─── Drawing: Buds & Hearts ──────────────────────────────────────────

function getHeartWorldPos(
  heart: TreeHeart, branches: TreeBranch[],
  windStr: number, time: number, baseX: number, baseY: number,
): Vec2 {
  const branch = branches[heart.branchIndex];
  if (!branch) return { x: 0, y: 0 };
  const pt = pointOnCubicBezier(branch.p0, branch.p1, branch.p2, branch.p3, heart.branchT);
  const wx = windDisplace(pt.x + heart.offsetX, pt.y + heart.offsetY, baseX, baseY, windStr, time);
  return { x: pt.x + heart.offsetX + wx, y: pt.y + heart.offsetY };
}

function drawBudsAndHearts(
  ctx: CanvasRenderingContext2D, p: number, time: number,
  tree: TreeData, windStr: number,
  baseX: number, baseY: number,
  detached: Set<number>,
) {
  tree.hearts.forEach((heart, idx) => {
    if (detached.has(idx)) return;

    // Check if the branch this heart is on has finished growing
    const branch = tree.branches[heart.branchIndex];
    if (!branch) return;
    const branchGrown = rangeProgress(p, branch.growStart, branch.growEnd);
    if (branchGrown < heart.branchT) return; // branch hasn't reached this heart yet

    const pos = getHeartWorldPos(heart, tree.branches, windStr, time, baseX, baseY);

    // Bud phase
    if (p < heart.bloomStart) {
      if (p >= T.BUDS_START) {
        const budP = rangeProgress(p, T.BUDS_START, heart.bloomStart);
        const budScale = easeOutCubic(budP) * (1 + Math.sin(time * 4 + idx) * 0.15);
        ctx.save();
        ctx.fillStyle = '#ff9ebb';
        ctx.shadowColor = '#ffa0b0';
        ctx.shadowBlur = 6;
        ctx.globalAlpha = clamp01(budP);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3 * budScale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }

    // Bloom phase
    const bloomP = rangeProgress(p, heart.bloomStart, heart.bloomEnd);
    const bloomScale = easeOrganicBloom(bloomP);
    const size = heart.size * bloomScale;

    // Depth-based alpha & blur
    let alpha = clamp01(bloomP);
    if (heart.layer === 0) alpha *= 0.55;
    else if (heart.layer === 1) alpha *= 0.8;

    const wobble = Math.sin(time * 1.8 + idx * 0.7) * 0.04;

    drawHeartShape(ctx, pos.x, pos.y, size, heart.color, heart.rotation + wobble, alpha, p >= T.FULL_BLOOM);
  });
}

// ─── Drawing: Flying hearts ──────────────────────────────────────────

function drawFlyingHearts(ctx: CanvasRenderingContext2D, time: number, particles: FlyingHeart[]) {
  particles.forEach(ph => {
    if (ph.alpha <= 0) return;
    const flip3D = Math.cos(time * 3 + ph.rotation * 5);
    const displaySize = ph.size * Math.max(0.3, Math.abs(flip3D));
    drawHeartShape(ctx, ph.x, ph.y, displaySize, ph.color, ph.rotation, ph.alpha, true);
  });
}

// ─── Drawing: Embers ─────────────────────────────────────────────────

function drawEmbers(ctx: CanvasRenderingContext2D, time: number, embers: Ember[]) {
  embers.forEach(emb => {
    const fade = Math.sin((emb.life / emb.maxLife) * Math.PI);
    const a = emb.alpha * fade;
    if (a <= 0) return;
    ctx.save();
    ctx.fillStyle = emb.color;
    ctx.shadowColor = emb.color;
    ctx.shadowBlur = 5;
    ctx.globalAlpha = clamp01(a);
    ctx.beginPath();
    ctx.arc(emb.x, emb.y, emb.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ─── Drawing: Destination scene (canvas-drawn) ───────────────────────

function drawDestinationScene(
  ctx: CanvasRenderingContext2D, p: number, time: number,
  destCenterX: number, groundY: number, w: number, h: number,
) {
  const fadeIn = rangeProgress(p, T.TRANSITION_START, T.DESTINATION_FULL);
  if (fadeIn <= 0) return;

  ctx.save();
  ctx.globalAlpha = easeInOutCubic(fadeIn);

  // Twilight sky overlay
  const skyGrd = ctx.createLinearGradient(destCenterX - w * 0.6, 0, destCenterX - w * 0.6, groundY);
  skyGrd.addColorStop(0, '#cf8da6');
  skyGrd.addColorStop(0.3, '#e8a5b8');
  skyGrd.addColorStop(0.6, '#f7c3c8');
  skyGrd.addColorStop(0.9, '#ffd9c5');
  skyGrd.addColorStop(1.0, '#fff0e2');
  ctx.fillStyle = skyGrd;
  ctx.fillRect(destCenterX - w * 0.8, 0, w * 1.6, groundY);

  // Heart-shaped glow (moon)
  const heartGlowX = destCenterX;
  const heartGlowY = h * 0.18;
  const glowR = Math.max(w, h) * 0.22;
  const moonGrd = ctx.createRadialGradient(heartGlowX, heartGlowY, 10, heartGlowX, heartGlowY, glowR);
  moonGrd.addColorStop(0, 'rgba(255,251,230,0.9)');
  moonGrd.addColorStop(0.3, 'rgba(255,220,180,0.5)');
  moonGrd.addColorStop(0.7, 'rgba(255,140,160,0.15)');
  moonGrd.addColorStop(1, 'rgba(200,100,130,0)');
  ctx.fillStyle = moonGrd;
  ctx.beginPath();
  ctx.arc(heartGlowX, heartGlowY, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Heart silhouette in glow
  drawHeartShape(ctx, heartGlowX, heartGlowY - 10, 55, '#fffbe6', 0, 0.9, true);

  // Ground for destination area
  const dGroundGrd = ctx.createLinearGradient(0, groundY, 0, h);
  dGroundGrd.addColorStop(0, '#3a161f');
  dGroundGrd.addColorStop(0.3, '#270e15');
  dGroundGrd.addColorStop(1, '#180911');
  ctx.fillStyle = dGroundGrd;
  ctx.fillRect(destCenterX - w * 0.8, groundY - 5, w * 1.6, h - groundY + 10);

  // Rolling hills
  ctx.fillStyle = '#2b0e16';
  ctx.beginPath();
  ctx.moveTo(destCenterX - w * 0.5, groundY);
  ctx.bezierCurveTo(destCenterX - w * 0.2, groundY - 30, destCenterX + w * 0.1, groundY - 15, destCenterX + w * 0.5, groundY - 25);
  ctx.lineTo(destCenterX + w * 0.5, h);
  ctx.lineTo(destCenterX - w * 0.5, h);
  ctx.closePath();
  ctx.fill();

  // Winding path
  ctx.beginPath();
  ctx.moveTo(destCenterX - 20, groundY + 30);
  ctx.bezierCurveTo(destCenterX + 30, groundY + 60, destCenterX + 80, groundY + 100, destCenterX + 160, h);
  ctx.lineTo(destCenterX + 100, h);
  ctx.bezierCurveTo(destCenterX + 40, groundY + 110, destCenterX - 5, groundY + 70, destCenterX - 40, groundY + 40);
  ctx.closePath();
  const pathGrd = ctx.createLinearGradient(destCenterX, groundY, destCenterX, h);
  pathGrd.addColorStop(0, '#fff2e0');
  pathGrd.addColorStop(0.5, '#ffccd5');
  pathGrd.addColorStop(1, '#c9184a');
  ctx.fillStyle = pathGrd;
  ctx.fill();

  // Lantern lights along path
  const lanternPositions = [
    { x: destCenterX - 10, y: groundY + 35 },
    { x: destCenterX + 25, y: groundY + 55 },
    { x: destCenterX + 65, y: groundY + 85 },
    { x: destCenterX + 110, y: groundY + 120 },
  ];
  lanternPositions.forEach(lp => {
    ctx.save();
    ctx.fillStyle = '#fff9db';
    ctx.shadowColor = '#fff9db';
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(lp.x, lp.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Streetlamp silhouette
  const lampX = destCenterX + 140;
  const lampBaseY = groundY + 10;
  ctx.strokeStyle = '#1b0e10';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lampX, lampBaseY);
  ctx.lineTo(lampX, lampBaseY - 100);
  ctx.stroke();
  // Lamp head
  ctx.fillStyle = '#1b0e10';
  ctx.fillRect(lampX - 8, lampBaseY - 110, 16, 14);
  // Lamp glow
  ctx.save();
  ctx.fillStyle = '#fff5cc';
  ctx.shadowColor = '#ffcc00';
  ctx.shadowBlur = 20;
  ctx.fillRect(lampX - 5, lampBaseY - 107, 10, 8);
  ctx.restore();

  // Bench silhouette
  const benchX = destCenterX + 105;
  const benchY = groundY + 15;
  ctx.fillStyle = '#1b0e10';
  // Seat
  ctx.fillRect(benchX - 25, benchY - 8, 50, 5);
  // Legs
  ctx.fillRect(benchX - 22, benchY - 3, 3, 18);
  ctx.fillRect(benchX + 19, benchY - 3, 3, 18);
  // Back
  ctx.fillRect(benchX - 25, benchY - 22, 50, 4);
  ctx.fillRect(benchX - 25, benchY - 16, 50, 4);

  // Cherry blossom trees (simple silhouettes)
  const treeSilhouettes = [
    { x: destCenterX - w * 0.35, y: groundY, size: 0.6 },
    { x: destCenterX + w * 0.3, y: groundY - 5, size: 0.5 },
  ];
  treeSilhouettes.forEach(ts => {
    // Trunk
    ctx.strokeStyle = '#2b0e16';
    ctx.lineWidth = 5 * ts.size;
    ctx.beginPath();
    ctx.moveTo(ts.x, ts.y);
    ctx.bezierCurveTo(ts.x - 3, ts.y - 40 * ts.size, ts.x + 5, ts.y - 70 * ts.size, ts.x + 2, ts.y - 90 * ts.size);
    ctx.stroke();
    // Blossom crown
    const crownColors = ['#ffb3c1', '#ff758f', '#ff8fa3'];
    for (let ci = 0; ci < 5; ci++) {
      ctx.fillStyle = crownColors[ci % crownColors.length];
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(
        ts.x + 2 + Math.cos(ci * 1.3) * 20 * ts.size,
        ts.y - 90 * ts.size + Math.sin(ci * 1.7) * 15 * ts.size,
        (12 + ci * 3) * ts.size,
        0, Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  });

  ctx.restore();
}

// ─── Update: Particles ───────────────────────────────────────────────

function updateParticles(
  p: number, time: number, dt: number,
  tree: TreeData, layout: Layout,
  particles: FlyingHeart[], embers: Ember[],
  detached: Set<number>,
) {
  const windStr = getWindStrength(p);
  const { w, h, groundY, baseX, baseY } = layout;

  // --- Heart detachment ---
  if (p >= T.DETACH_START && p < T.DESTINATION_FULL) {
    const detachP = rangeProgress(p, T.DETACH_START, T.STREAM_PEAK);
    tree.hearts.forEach((heart, idx) => {
      if (detached.has(idx)) return;
      if (detachP > heart.detachOrder) {
        detached.add(idx);
        const pos = getHeartWorldPos(heart, tree.branches, windStr, time, baseX, baseY);
        particles.push({
          x: pos.x, y: pos.y,
          vx: 3 + heart.detachOrder * 4 + heart.size * 0.2,
          vy: -1.5 + (heart.detachOrder - 0.5) * 2,
          size: heart.size,
          color: heart.color,
          rotation: heart.rotation,
          rotSpeed: (heart.detachOrder - 0.5) * 0.08,
          alpha: 1,
        });
      }
    });
  }

  // --- Update flying hearts ---
  const speed = dt * 60; // normalise to ~60fps
  for (let i = particles.length - 1; i >= 0; i--) {
    const ph = particles[i];
    ph.x += ph.vx * speed;
    ph.y += ph.vy * speed;
    ph.vy += 0.015 * speed; // gentle gravity

    // Wind push
    ph.vx += 0.04 * speed;

    // Stream attractor: gently pull hearts toward a sinusoidal stream path
    const targetY = groundY - 100 + Math.sin(ph.x * 0.004 + time) * 40;
    ph.vy += (targetY - ph.y) * 0.002 * speed;

    ph.rotation += ph.rotSpeed * speed;

    // Fade out when far right
    if (ph.x > w * 2.5) {
      ph.alpha -= 0.03 * speed;
    }

    if (ph.alpha <= 0 || ph.x > w * 3.5) {
      particles.splice(i, 1);
    }
  }

  // --- Embers ---
  const rng = new SeededRandom(Math.floor(time * 100));
  if (embers.length < 30 && rng.next() < 0.5) {
    embers.push({
      x: rng.range(-w * 0.1, w * 1.2),
      y: groundY - rng.range(0, h * 0.5),
      vx: 0.3 + rng.next() * 0.8,
      vy: -0.2 - rng.next() * 0.6,
      size: 1.2 + rng.next() * 2.5,
      color: rng.next() > 0.4 ? '#ffd166' : '#ff758f',
      alpha: 0.2 + rng.next() * 0.6,
      life: 0,
      maxLife: 150 + rng.next() * 150,
    });
  }

  for (let i = embers.length - 1; i >= 0; i--) {
    const emb = embers[i];
    emb.x += (emb.vx + (p >= T.WIND_START ? 2 : 0)) * speed;
    emb.y += emb.vy * speed;
    emb.life += speed;

    if (emb.life >= emb.maxLife || emb.x > w * 2.5) {
      embers.splice(i, 1);
    }
  }
}

// ─── Sound triggers ──────────────────────────────────────────────────

function triggerSounds(p: number, soundFlags: Set<string>, isMuted: boolean) {
  if (isMuted) return;

  const trigger = (key: string, threshold: number, fn: () => void) => {
    if (p >= threshold && !soundFlags.has(key)) {
      soundFlags.add(key);
      fn();
    }
  };

  trigger('ambient', 0, () => soundManager.startAmbient());
  trigger('heartbeat', T.SEED_START, () => soundManager.playHeartbeat());
  trigger('sprout', T.ROOTS_START, () => soundManager.playSproutChime());
  trigger('bloom1', T.BLOOM1_START, () => soundManager.playBloomChime());
  trigger('bloom2', T.BLOOM2_START, () => soundManager.playBloomChime());
  trigger('wind', T.WIND_START, () => soundManager.playWindWhoosh());
  trigger('transition', T.TRANSITION_START, () => soundManager.playTransitionChime());
}

// ─── Master draw ─────────────────────────────────────────────────────

function drawFrame(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  p: number, time: number,
  tree: TreeData,
  particles: FlyingHeart[], embers: Ember[],
  detached: Set<number>,
  clickHearts: FlyingHeart[],
) {
  const { w, h, groundY, baseX, baseY, scale, dpr } = layout;

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, w, h);

  // Camera
  const cam = getCamera(p, time, w);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-w / 2 - cam.panX, -h / 2);

  const windStr = getWindStrength(p);

  // Background
  drawSky(ctx, w, h, groundY);
  drawSunGlow(ctx, baseX, groundY, w, h);
  drawMountains(ctx, w, groundY);
  drawGround(ctx, w, h, groundY);

  // Tree
  if (p >= T.SEED_START) drawSeed(ctx, p, time, baseX, baseY, scale);
  if (p >= T.ROOTS_START) drawRoots(ctx, p, time, tree.roots);
  if (p >= T.TRUNK_START) drawAllBranches(ctx, p, time, tree.branches, windStr, baseX, baseY);
  if (p >= T.BUDS_START) drawBudsAndHearts(ctx, p, time, tree, windStr, baseX, baseY, detached);

  // Flying hearts (world space)
  drawFlyingHearts(ctx, time, particles);

  // Destination (world space, offset to the right)
  const destCenterX = baseX + w * 1.5;
  drawDestinationScene(ctx, p, time, destCenterX, groundY, w, h);

  ctx.restore(); // camera

  // Screen-space effects
  drawEmbers(ctx, time, embers);

  // Click hearts
  for (let i = clickHearts.length - 1; i >= 0; i--) {
    const ch = clickHearts[i];
    ch.x += ch.vx;
    ch.y += ch.vy;
    ch.vy += 0.08;
    ch.rotation += ch.rotSpeed;
    ch.alpha -= 0.015;
    if (ch.alpha <= 0) {
      clickHearts.splice(i, 1);
    } else {
      drawHeartShape(ctx, ch.x, ch.y, ch.size, ch.color, ch.rotation, ch.alpha, true);
    }
  }

  ctx.restore(); // dpr
}

// ─── Component ───────────────────────────────────────────────────────

export const ContinuousAnimation: React.FC<Props> = ({
  isPlaying, playbackSpeed, seekTargetRef, onProgressUpdate, isMuted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const treeRef = useRef<TreeData | null>(null);
  const layoutRef = useRef<Layout>({
    w: 0, h: 0, groundY: 0, baseX: 0, baseY: 0, scale: 1, dpr: 1, isMobile: false,
  });
  const progressRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(playbackSpeed);
  const isMutedRef = useRef(isMuted);
  const particlesRef = useRef<FlyingHeart[]>([]);
  const embersRef = useRef<Ember[]>([]);
  const detachedRef = useRef<Set<number>>(new Set());
  const soundFlagsRef = useRef<Set<string>>(new Set());
  const clickHeartsRef = useRef<FlyingHeart[]>([]);

  // Sync refs
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = playbackSpeed; }, [playbackSpeed]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Setup canvas + tree
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = w * dpr;
      canvas.height = h * dpr;
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
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main animation loop (runs once, reads refs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    let lastTime = performance.now();
    let lastReportTime = 0;

    const loop = (now: number) => {
      if (!running) return;

      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Seek
      if (seekTargetRef.current !== null) {
        const target = seekTargetRef.current;
        seekTargetRef.current = null;

        // If seeking backward, reset state
        if (target < progressRef.current) {
          detachedRef.current.clear();
          particlesRef.current = [];
          soundFlagsRef.current.clear();
        }
        progressRef.current = target;
      }

      // Advance
      if (isPlayingRef.current && progressRef.current < 1) {
        progressRef.current = Math.min(1, progressRef.current + (dt / TOTAL_DURATION) * speedRef.current);
      }

      const p = progressRef.current;
      const time = now * 0.001;
      const tree = treeRef.current;
      const layout = layoutRef.current;

      if (!tree || layout.w === 0) {
        requestAnimationFrame(loop);
        return;
      }

      // Sounds
      triggerSounds(p, soundFlagsRef.current, isMutedRef.current);

      // Update particles
      updateParticles(p, time, dt, tree, layout, particlesRef.current, embersRef.current, detachedRef.current);

      // Draw
      drawFrame(ctx, layout, p, time, tree, particlesRef.current, embersRef.current, detachedRef.current, clickHeartsRef.current);

      // Report progress (throttled ~10fps)
      if (now - lastReportTime > 100) {
        onProgressUpdate(p);
        lastReportTime = now;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    return () => { running = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Click handler
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    soundManager.startAmbient();
    soundManager.playBloomChime();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      clickHeartsRef.current.push({
        x: clickX, y: clickY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 9 + Math.random() * 8,
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 1,
      });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none cursor-pointer">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="absolute inset-0 w-full h-full block"
      />
    </div>
  );
};
