/**
 * Organic root network generation and rendering.
 *
 * Natural matte soil roots anchoring into the ground mound: tapered
 * strokes that follow their curve while growing, varied lengths and
 * curvature, fine laterals + hair fibrils, depth-based earthy tones.
 * Fresh tips read slightly paler (root cap) with no glow halo so the
 * system stays grounded while the camera/timing carries the focus.
 */
import {
  type Vec2,
  type SeededRandom,
  lerp,
  rangeProgress,
  easeOutCubic,
} from '../../../animation/bezierUtils';
import { GROWTH_T } from '../animation/growthTimeline';

export interface SubRoot {
  p0: Vec2;
  cp: Vec2;
  p1: Vec2;
  width: number;
  widthEnd: number;
}

export interface RootHair {
  /** Position along parent curve [0, 1] */
  t: number;
  /** Length in px (pre-scaled) */
  len: number;
  /** Which side of the root it branches from */
  side: 1 | -1;
  /** Extra downward droop */
  droop: number;
}

export interface TreeRoot {
  p0: Vec2;
  cp: Vec2;
  p1: Vec2;
  width: number;
  widthEnd: number;
  growStart: number;
  growEnd: number;
  isSurface?: boolean;
  /** 0 = deep dark … 1 = warm surface */
  tone: number;
  subRoots?: SubRoot[];
  hairs?: RootHair[];
}

/** Evaluate a quadratic bezier at t */
function pointOnQuad(p0: Vec2, cp: Vec2, p1: Vec2, t: number): Vec2 {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * cp.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * cp.y + t * t * p1.y,
  };
}

/** Tangent of a quadratic bezier at t (normalized) */
function tangentOnQuad(p0: Vec2, cp: Vec2, p1: Vec2, t: number): Vec2 {
  const dx = 2 * (1 - t) * (cp.x - p0.x) + 2 * t * (p1.x - cp.x);
  const dy = 2 * (1 - t) * (cp.y - p0.y) + 2 * t * (p1.y - cp.y);
  const m = Math.hypot(dx, dy) || 1;
  return { x: dx / m, y: dy / m };
}

/**
 * Draw a tapered root along its full quadratic curve, revealing only the
 * portion up to `reveal` [0,1] so the tip genuinely travels the curve.
 */
function strokeTaperedQuad(
  ctx: CanvasRenderingContext2D,
  p0: Vec2,
  cp: Vec2,
  p1: Vec2,
  widthStart: number,
  widthEnd: number,
  style: string,
  reveal: number,
  segments = 14
) {
  if (reveal <= 0.001) return;
  const t = Math.min(1, reveal);
  // Sample the visible sub-curve and taper each step.
  let prev = pointOnQuad(p0, cp, p1, 0);
  const steps = Math.max(3, Math.round(segments * t));
  ctx.strokeStyle = style;
  ctx.lineCap = 'round';
  for (let i = 1; i <= steps; i++) {
    const tt = (i / steps) * t;
    const pt = pointOnQuad(p0, cp, p1, tt);
    ctx.lineWidth = Math.max(0.5, lerp(widthStart, widthEnd, tt));
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    prev = pt;
  }
}

export function buildRoots(
  baseX: number,
  baseY: number,
  scale: number,
  rng: SeededRandom
): TreeRoot[] {
  const roots: TreeRoot[] = [];
  const s = scale;

  interface Spec {
    angle: number; // radians; ~pi/2 points straight down
    len: number;
    width: number;
    depth: number; // 0 shallow surface … 1 deep tap
    surface: boolean;
    order: number; // growth order: taproot first
  }

  // Asymmetric, hand-varied set: one taproot, inner anchors, shallow
  // feeders. No mirrored pairs — real roots never mirror.
  const specs: Spec[] = [
    { angle: 1.57, len: 96, width: 5.0, depth: 1.0, surface: false, order: 0 }, // taproot
    { angle: 1.82, len: 84, width: 4.1, depth: 0.9, surface: false, order: 1 },
    { angle: 1.32, len: 80, width: 3.9, depth: 0.85, surface: false, order: 1 },
    { angle: 2.08, len: 72, width: 3.5, depth: 0.7, surface: false, order: 2 },
    { angle: 1.06, len: 70, width: 3.4, depth: 0.7, surface: false, order: 2 },
    { angle: 2.38, len: 58, width: 3.1, depth: 0.5, surface: false, order: 3 },
    { angle: 0.78, len: 56, width: 3.0, depth: 0.5, surface: false, order: 3 },
    { angle: 1.66, len: 64, width: 3.2, depth: 0.75, surface: false, order: 2 },
    { angle: 1.48, len: 58, width: 2.8, depth: 0.6, surface: false, order: 3 },
    { angle: 2.62, len: 52, width: 3.0, depth: 0.25, surface: true, order: 3 },
    { angle: 0.52, len: 50, width: 2.9, depth: 0.25, surface: true, order: 3 },
    { angle: 2.90, len: 66, width: 3.6, depth: 0.15, surface: true, order: 4 },
    { angle: 0.28, len: 62, width: 3.4, depth: 0.15, surface: true, order: 4 },
    { angle: 2.20, len: 44, width: 2.4, depth: 0.4, surface: false, order: 4 },
    { angle: 0.95, len: 42, width: 2.3, depth: 0.4, surface: false, order: 4 },
  ];

  const span = GROWTH_T.ROOTS_END - GROWTH_T.ROOTS_START;

  specs.forEach((spec) => {
    // Varied length/width so no two roots match.
    const lenJ = 1 + rng.symmetric() * 0.22;
    const len = spec.len * lenJ * s;
    const angle = spec.angle + rng.symmetric() * 0.09;
    const wobble = rng.symmetric(); // S-curve direction

    // Underground roots dive; surface roots hug the mound sideways.
    const sink = spec.surface ? 0.30 + rng.next() * 0.12 : 0.62 + spec.depth * 0.22;
    const ex = baseX + Math.cos(angle) * len;
    const ey = baseY + Math.abs(Math.sin(angle)) * len * sink + (spec.surface ? 1.5 * s : 4 * s);

    // Single control point with perpendicular offset → gentle organic bend.
    // Alternate the offset side for S-variety across neighbours.
    const mx = (baseX + ex) / 2;
    const my = (baseY + ey) / 2;
    const dx = ex - baseX;
    const dy = ey - baseY;
    const m = Math.hypot(dx, dy) || 1;
    const bend = (0.10 + rng.next() * 0.16) * len * (wobble >= 0 ? 1 : -1);
    const cp: Vec2 = {
      x: mx + (-dy / m) * bend + rng.symmetric() * 4 * s,
      y: my + (dx / m) * bend * 0.35 + rng.symmetric() * 3 * s,
    };

    const width = spec.width * (1 + rng.symmetric() * 0.15) * s;

    // Growth timing: taproot first, feeders last; longer roots get a
    // longer window so tip speed stays roughly constant (no popping).
    // Clamped to ROOTS_END so roots never bleed into trunk growth at 0.20.
    const startFrac = 0.04 + spec.order * 0.13 + rng.next() * 0.05;
    const durFrac = 0.38 + (len / (96 * s)) * 0.30;
    const growStart = GROWTH_T.ROOTS_START + startFrac * span;
    const growEnd = Math.min(
      GROWTH_T.ROOTS_END,
      growStart + durFrac * span
    );

    // Two fine laterals on major roots, one (or none) on feeders.
    const subRoots: SubRoot[] = [];
    const nSubs = width > 3.2 * s ? 2 : rng.next() < 0.5 ? 1 : 0;
    for (let k = 0; k < nSubs; k++) {
      const forkT = 0.42 + k * 0.28 + rng.symmetric() * 0.06;
      const origin = pointOnQuad({ x: baseX, y: baseY }, cp, { x: ex, y: ey }, forkT);
      const tan = tangentOnQuad({ x: baseX, y: baseY }, cp, { x: ex, y: ey }, forkT);
      const side: 1 | -1 = (k % 2 === 0) === (wobble >= 0) ? 1 : -1;
      const spread = 0.55 + rng.next() * 0.35;
      const dir = {
        x: tan.x * 0.7 + -tan.y * side * spread,
        y: Math.abs(tan.y * 0.7 + tan.x * side * spread) * 0.9 + 0.25,
      };
      const dm = Math.hypot(dir.x, dir.y) || 1;
      const subL = (16 + rng.next() * 18) * s;
      const subEnd = { x: origin.x + (dir.x / dm) * subL, y: origin.y + (dir.y / dm) * subL };
      const subCp = {
        x: origin.x + (dir.x / dm) * subL * 0.5 + rng.symmetric() * 3 * s,
        y: origin.y + (dir.y / dm) * subL * 0.5,
      };
      subRoots.push({
        p0: origin,
        cp: subCp,
        p1: subEnd,
        width: Math.max(0.9 * s, width * 0.38),
        widthEnd: 0.5 * s,
      });
    }

    // Tiny hair fibrils along the root.
    const hairs: RootHair[] = [];
    const nHairs = 3 + Math.floor(rng.next() * 3);
    let sideFlip: 1 | -1 = rng.next() < 0.5 ? 1 : -1;
    for (let h = 0; h < nHairs; h++) {
      sideFlip = sideFlip === 1 ? -1 : 1;
      hairs.push({
        t: 0.30 + (h / nHairs) * 0.62 + rng.symmetric() * 0.05,
        len: (5 + rng.next() * 7) * s,
        side: sideFlip,
        droop: 0.3 + rng.next() * 0.5,
      });
    }

    roots.push({
      p0: { x: baseX, y: baseY },
      cp,
      p1: { x: ex, y: ey },
      width,
      widthEnd: Math.max(0.6 * s, width * 0.16),
      growStart,
      growEnd,
      isSurface: spec.surface,
      tone: 1 - spec.depth * 0.75 + rng.symmetric() * 0.08,
      subRoots,
      hairs,
    });
  });

  return roots;
}

export function drawRoots(
  ctx: CanvasRenderingContext2D,
  p: number,
  roots: TreeRoot[],
  _time = 0
) {
  ctx.save();
  ctx.lineCap = 'round';

  // Deepest roots first so shallow ones overlap on top.
  const ordered = [...roots].sort((a, b) => a.tone - b.tone);

  for (const root of ordered) {
    const gp = rangeProgress(p, root.growStart, root.growEnd);
    if (gp <= 0) continue;

    const reveal = easeOutCubic(gp);
    const tone = Math.max(0, Math.min(1, root.tone));

    // Neutral matte earth tones: deep umber-grey → soft topsoil taupe.
    // Kept desaturated so the roots sit quietly in the soil.
    const r = Math.round(lerp(46, 118, tone));
    const g = Math.round(lerp(34, 100, tone));
    const b = Math.round(lerp(29, 86, tone));
    const alpha = lerp(0.92, 0.82, tone);
    const body = `rgba(${r}, ${g}, ${b}, ${alpha})`;

    strokeTaperedQuad(ctx, root.p0, root.cp, root.p1, root.width, root.widthEnd, body, reveal, 14);

    // Faint dry-bark ridge along the top edge of surface roots only.
    if (root.isSurface && reveal > 0.1) {
      strokeTaperedQuad(
        ctx,
        { x: root.p0.x, y: root.p0.y - 0.7 },
        { x: root.cp.x, y: root.cp.y - 0.7 },
        { x: root.p1.x, y: root.p1.y - 0.7 },
        root.width * 0.30,
        root.widthEnd * 0.5,
        'rgba(150, 135, 118, 0.18)',
        reveal,
        10
      );
    }

    const tip = pointOnQuad(root.p0, root.cp, root.p1, reveal);

    // Laterals appear once the parent has grown past their fork.
    if (root.subRoots) {
      for (const sub of root.subRoots) {
        // Approximate fork reveal from the parent's growth.
        const subGp = rangeProgress(reveal, 0.40, 1.0);
        if (subGp <= 0) continue;
        strokeTaperedQuad(
          ctx,
          sub.p0,
          sub.cp,
          sub.p1,
          sub.width,
          sub.widthEnd,
          `rgba(${r - 8}, ${g - 4}, ${b - 2}, ${alpha * 0.9})`,
          easeOutCubic(subGp),
          8
        );
      }
    }

    // Hair fibrils: short, darker, drooping with gravity.
    if (root.hairs) {
      ctx.strokeStyle = `rgba(38, 30, 25, ${0.50 * Math.min(1, reveal * 1.2)})`;
      for (const hair of root.hairs) {
        if (reveal < hair.t) continue;
        const hp = rangeProgress(reveal, hair.t, Math.min(1, hair.t + 0.18));
        if (hp <= 0) continue;
        const base = pointOnQuad(root.p0, root.cp, root.p1, hair.t);
        const tan = tangentOnQuad(root.p0, root.cp, root.p1, hair.t);
        // Perpendicular offshoot, biased downward.
        const nx = -tan.y * hair.side;
        const ny = tan.x * hair.side;
        const dirX = nx * 0.8;
        const dirY = Math.abs(ny) * 0.6 + hair.droop;
        const dm = Math.hypot(dirX, dirY) || 1;
        const L = hair.len * easeOutCubic(hp);
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(
          base.x + (dirX / dm) * L * 0.6,
          base.y + (dirY / dm) * L * 0.6,
          base.x + (dirX / dm) * L,
          base.y + (dirY / dm) * L
        );
        ctx.stroke();
      }
    }

    // Fresh root cap: slightly paler + swollen while extending, gone
    // once grown — matte, no halo.
    if (gp < 1) {
      const capA = 0.55 * (1 - gp * 0.6);
      const tan = tangentOnQuad(root.p0, root.cp, root.p1, reveal);
      ctx.fillStyle = `rgba(150, 130, 112, ${capA})`;
      ctx.beginPath();
      ctx.ellipse(tip.x, tip.y, Math.max(1.4, root.widthEnd * 2.1), Math.max(1.1, root.widthEnd * 1.5), Math.atan2(tan.y, tan.x), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
