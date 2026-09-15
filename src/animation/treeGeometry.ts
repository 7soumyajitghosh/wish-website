/**
 * Hand-authored tree geometry.
 *
 * Every branch, root, and heart attachment point is deterministic.
 * A SeededRandom provides organic variation without true randomness,
 * so the SAME tree is produced on every call with the same inputs.
 */
import { type Vec2, SeededRandom, pointOnCubicBezier } from './bezierUtils';
import { T } from './timeline';

// ─── Data types ──────────────────────────────────────────────────────

export interface TreeBranch {
  p0: Vec2; p1: Vec2; p2: Vec2; p3: Vec2;
  widthStart: number;
  widthEnd: number;
  level: number;        // 0 = trunk, 1 = primary, 2 = secondary, 3 = twig
  growStart: number;     // progress when growth begins
  growEnd: number;       // progress when fully grown
}

export interface TreeRoot {
  p0: Vec2; cp: Vec2; p1: Vec2;
  width: number;
  growStart: number;
  growEnd: number;
}

export interface TreeHeart {
  branchIndex: number;   // which branch this heart sits on
  branchT: number;       // parameter along that branch [0,1]
  offsetX: number;       // lateral offset from branch center
  offsetY: number;
  size: number;
  color: string;
  rotation: number;
  layer: number;         // 0 = back, 1 = mid, 2 = front
  bloomStart: number;
  bloomEnd: number;
  detachOrder: number;   // 0 → detaches first, 1 → detaches last
}

export interface TreeData {
  branches: TreeBranch[];
  roots: TreeRoot[];
  hearts: TreeHeart[];
}

// ─── Heart colour palette ────────────────────────────────────────────

const HEART_COLORS = [
  '#c9184a', '#a4133c', '#d90429', '#ff0054', '#ff4d6d',
  '#ff758f', '#ff8fa3', '#ffb3c1', '#ffd166', '#ffe3e0',
];

// ─── Builder ─────────────────────────────────────────────────────────

export function buildTree(baseX: number, baseY: number, scale: number): TreeData {
  const rng = new SeededRandom(42);
  const branches: TreeBranch[] = [];
  const roots: TreeRoot[] = [];
  const hearts: TreeHeart[] = [];

  const s = scale; // shorthand

  // ── Roots ─────────────────────────────────────
  const rootSpecs = [
    { angle: 1.8,  len: 52 }, { angle: 2.1,  len: 45 },
    { angle: 1.2,  len: 58 }, { angle: 0.9,  len: 42 },
    { angle: 2.5,  len: 40 }, { angle: 0.6,  len: 48 },
    { angle: 1.55, len: 62 }, { angle: 2.7,  len: 38 },
    { angle: 0.4,  len: 35 }, { angle: 1.0,  len: 50 },
    { angle: 2.3,  len: 43 }, { angle: 1.7,  len: 55 },
  ];
  rootSpecs.forEach((rs, i) => {
    const len = rs.len * s;
    const angle = rs.angle + rng.symmetric() * 0.08;
    const ex = baseX + Math.cos(angle) * len;
    const ey = baseY + Math.abs(Math.sin(angle)) * len * 0.7;
    const cpDist = len * 0.55;
    roots.push({
      p0: { x: baseX, y: baseY },
      cp: {
        x: baseX + Math.cos(angle) * cpDist + rng.symmetric() * 8 * s,
        y: baseY + Math.abs(Math.sin(angle)) * cpDist,
      },
      p1: { x: ex, y: ey },
      width: (3.2 - (i / rootSpecs.length) * 1.8) * s,
      growStart: T.ROOTS_START + (i / rootSpecs.length) * 0.03,
      growEnd: T.ROOTS_END + (i / rootSpecs.length) * 0.02,
    });
  });

  // ── Trunk (2 segments, level 0) ───────────────
  const trunkH = 155 * s;

  const trunkMid: Vec2 = { x: baseX - 8 * s, y: baseY - trunkH * 0.52 };
  branches.push({
    p0: { x: baseX, y: baseY },
    p1: { x: baseX - 12 * s, y: baseY - trunkH * 0.20 },
    p2: { x: baseX - 10 * s, y: baseY - trunkH * 0.38 },
    p3: trunkMid,
    widthStart: 28 * s, widthEnd: 22 * s,
    level: 0,
    growStart: T.TRUNK_START,
    growEnd: T.TRUNK_MID,
  });

  const trunkTop: Vec2 = { x: baseX + 4 * s, y: baseY - trunkH };
  branches.push({
    p0: trunkMid,
    p1: { x: trunkMid.x + 3 * s, y: trunkMid.y - trunkH * 0.20 },
    p2: { x: trunkTop.x - 4 * s, y: trunkTop.y + trunkH * 0.15 },
    p3: trunkTop,
    widthStart: 22 * s, widthEnd: 16 * s,
    level: 0,
    growStart: T.TRUNK_MID,
    growEnd: T.TRUNK_END,
  });

  // ── Primary branches (4, level 1) ─────────────
  const primarySpecs = [
    { angle: -2.35, len: 105, width: 14, curve: -0.25 },
    { angle: -1.75, len: 125, width: 15, curve:  0.15 },
    { angle: -1.25, len: 130, width: 15, curve: -0.10 },
    { angle: -0.75, len: 115, width: 13, curve:  0.30 },
  ];

  interface BranchEnd { pt: Vec2; angle: number; width: number; branchIdx: number }
  const primaryEnds: BranchEnd[] = [];

  primarySpecs.forEach((spec, i) => {
    const len = spec.len * s;
    const endPt: Vec2 = {
      x: trunkTop.x + Math.cos(spec.angle) * len,
      y: trunkTop.y + Math.sin(spec.angle) * len,
    };
    const midDist = len * 0.55;
    const cp1: Vec2 = {
      x: trunkTop.x + Math.cos(spec.angle + spec.curve) * midDist,
      y: trunkTop.y + Math.sin(spec.angle + spec.curve) * midDist,
    };
    const cp2: Vec2 = {
      x: trunkTop.x + Math.cos(spec.angle) * (len * 0.85),
      y: trunkTop.y + Math.sin(spec.angle) * (len * 0.85),
    };
    const idx = branches.length;
    branches.push({
      p0: trunkTop, p1: cp1, p2: cp2, p3: endPt,
      widthStart: spec.width * s, widthEnd: spec.width * 0.55 * s,
      level: 1,
      growStart: T.PRIMARY_START + i * 0.018,
      growEnd: T.PRIMARY_END + i * 0.012,
    });
    primaryEnds.push({ pt: endPt, angle: spec.angle, width: spec.width * 0.55 * s, branchIdx: idx });
  });

  // ── Secondary branches (2 per primary, level 2) ──
  const secondaryEnds: BranchEnd[] = [];

  primaryEnds.forEach((pEnd, pi) => {
    const forks = [-0.38, 0.34];
    forks.forEach((forkDelta, fi) => {
      const angle = pEnd.angle + forkDelta + rng.symmetric() * 0.06;
      const len = (65 + rng.range(0, 25)) * s;
      const endPt: Vec2 = {
        x: pEnd.pt.x + Math.cos(angle) * len,
        y: pEnd.pt.y + Math.sin(angle) * len,
      };
      const fSign = fi === 0 ? -1 : 1;
      const cp1: Vec2 = {
        x: pEnd.pt.x + Math.cos(angle + fSign * 0.15) * (len * 0.5),
        y: pEnd.pt.y + Math.sin(angle + fSign * 0.15) * (len * 0.5),
      };
      const cp2: Vec2 = {
        x: pEnd.pt.x + Math.cos(angle) * (len * 0.8),
        y: pEnd.pt.y + Math.sin(angle) * (len * 0.8),
      };
      const delay = (pi * 2 + fi) * 0.01;
      const idx = branches.length;
      branches.push({
        p0: pEnd.pt, p1: cp1, p2: cp2, p3: endPt,
        widthStart: pEnd.width, widthEnd: pEnd.width * 0.55,
        level: 2,
        growStart: T.SECONDARY_START + delay,
        growEnd: T.SECONDARY_END + delay,
      });
      secondaryEnds.push({ pt: endPt, angle, width: pEnd.width * 0.45, branchIdx: idx });
    });
  });

  // ── Twigs (3 per secondary, level 3) ──────────
  const twigEnds: { pt: Vec2; branchIdx: number }[] = [];

  secondaryEnds.forEach((sEnd, si) => {
    const twigForks = [-0.45, 0.05, 0.42];
    twigForks.forEach((tDelta, ti) => {
      const angle = sEnd.angle + tDelta + rng.symmetric() * 0.08;
      const len = (38 + rng.range(0, 28)) * s;
      const endPt: Vec2 = {
        x: sEnd.pt.x + Math.cos(angle) * len,
        y: sEnd.pt.y + Math.sin(angle) * len,
      };
      const cp1: Vec2 = {
        x: sEnd.pt.x + Math.cos(angle) * (len * 0.45),
        y: sEnd.pt.y + Math.sin(angle) * (len * 0.45),
      };
      const cp2: Vec2 = {
        x: sEnd.pt.x + Math.cos(angle) * (len * 0.8),
        y: sEnd.pt.y + Math.sin(angle) * (len * 0.8),
      };
      const delay = (si * 3 + ti) * 0.004;
      const idx = branches.length;
      branches.push({
        p0: sEnd.pt, p1: cp1, p2: cp2, p3: endPt,
        widthStart: Math.max(1.5 * s, sEnd.width), widthEnd: 1.0 * s,
        level: 3,
        growStart: T.TWIGS_START + delay,
        growEnd: T.TWIGS_END + delay,
      });
      twigEnds.push({ pt: endPt, branchIdx: idx });
    });
  });

  // ── Hearts ─────────────────────────────────────
  let heartId = 0;
  const crownCenterX = baseX - 10 * s;
  const crownCenterY = baseY - trunkH * 1.25;
  const crownRadiusX = 175 * s;

  // Helper: compute detach order (0=first to fly, 1=last)
  const detachOrderFor = (x: number, y: number): number => {
    // Right-side hearts detach first (wind blows left-to-right),
    // outer hearts before inner
    const dx = (x - crownCenterX) / crownRadiusX;
    const normalised = 1 - (dx + 1) / 2; // 0 = far right, 1 = far left
    return normalised * 0.8 + rng.next() * 0.2;
  };

  // 1) Twig-tip hearts (24 hearts)
  twigEnds.forEach((te) => {
    const color = HEART_COLORS[heartId % HEART_COLORS.length];
    hearts.push({
      branchIndex: te.branchIdx,
      branchT: 1.0,
      offsetX: rng.symmetric() * 3 * s,
      offsetY: rng.symmetric() * 3 * s,
      size: (10 + rng.range(0, 6)) * s,
      color,
      rotation: rng.symmetric() * 0.6,
      layer: 2,
      bloomStart: T.BLOOM1_START + rng.range(0, 0.04),
      bloomEnd: T.BLOOM1_START + 0.06 + rng.range(0, 0.03),
      detachOrder: detachOrderFor(te.pt.x, te.pt.y),
    });
    heartId++;
  });

  // 2) Branch-attached hearts (~60 hearts along secondary & primary branches)
  for (let bi = 2; bi < branches.length; bi++) {
    const b = branches[bi];
    if (b.level > 2) continue; // skip twigs
    const pointsPerBranch = b.level === 1 ? 5 : 3;
    for (let pi = 0; pi < pointsPerBranch; pi++) {
      const bt = 0.25 + (pi / pointsPerBranch) * 0.6 + rng.range(0, 0.08);
      const pt = pointOnCubicBezier(b.p0, b.p1, b.p2, b.p3, Math.min(1, bt));
      const color = HEART_COLORS[heartId % HEART_COLORS.length];
      hearts.push({
        branchIndex: bi,
        branchT: Math.min(1, bt),
        offsetX: rng.symmetric() * 12 * s,
        offsetY: rng.symmetric() * 10 * s,
        size: (8 + rng.range(0, 10)) * s,
        color,
        rotation: rng.symmetric() * 0.8,
        layer: rng.next() > 0.5 ? 1 : 2,
        bloomStart: T.BLOOM1_START + 0.03 + rng.range(0, 0.06),
        bloomEnd: T.BLOOM1_END + rng.range(0, 0.04),
        detachOrder: detachOrderFor(pt.x, pt.y),
      });
      heartId++;
    }
  }

  // 3) Crown-fill hearts (~220 hearts distributed near branches)
  const fillCount = Math.floor(220 * Math.min(s, 1.5));
  for (let i = 0; i < fillCount; i++) {
    // Pick a random branch (weighted toward outer ones)
    const bIdx = 2 + Math.floor(rng.next() * (branches.length - 2));
    const b = branches[bIdx];
    const bt = rng.range(0.15, 0.95);
    const pt = pointOnCubicBezier(b.p0, b.p1, b.p2, b.p3, bt);
    // Offset from branch with Gaussian-like distribution
    const spreadX = (rng.symmetric() + rng.symmetric()) * 18 * s;
    const spreadY = (rng.symmetric() + rng.symmetric()) * 14 * s;
    const hx = pt.x + spreadX;
    const hy = pt.y + spreadY;

    const color = HEART_COLORS[heartId % HEART_COLORS.length];
    const isBack = rng.next() < 0.3;
    hearts.push({
      branchIndex: bIdx,
      branchT: bt,
      offsetX: spreadX,
      offsetY: spreadY,
      size: (6 + rng.range(0, 12)) * s,
      color,
      rotation: rng.symmetric() * 1.0,
      layer: isBack ? 0 : rng.next() > 0.4 ? 1 : 2,
      bloomStart: T.BLOOM2_START + rng.range(0, 0.08),
      bloomEnd: T.BLOOM2_END + rng.range(0, 0.03),
      detachOrder: detachOrderFor(hx, hy),
    });
    heartId++;
  }

  // Sort hearts by layer so back hearts are drawn first
  hearts.sort((a, b) => a.layer - b.layer);

  return { branches, roots, hearts };
}
