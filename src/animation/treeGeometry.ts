/**
 * Hand-authored tree geometry matching the reference storyboard and panel 12.
 *
 * Every branch, root, and heart attachment point is deterministic.
 * A SeededRandom provides organic variation without true randomness,
 * so the EXACT SAME tree structure is produced on every call.
 *
 * Hierarchy:
 * ROOT → TRUNK → PRIMARY BRANCH → SECONDARY BRANCH → TWIG → BUD → HEART
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

export interface SubRoot {
  p0: Vec2; cp: Vec2; p1: Vec2;
  width: number;
}

export interface TreeRoot {
  p0: Vec2; cp: Vec2; p1: Vec2;
  width: number;
  growStart: number;
  growEnd: number;
  isSurface?: boolean;
  subRoots?: SubRoot[];
}

export interface TreeHeart {
  branchIndex: number;   // which branch/twig this heart sits on
  branchT: number;       // parameter along that branch [0,1]
  offsetX: number;       // lateral offset from branch center (leaf petiole)
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
  baseButtress: {
    leftFlare: Vec2[];
    rightFlare: Vec2[];
  };
}

// ─── Heart colour palette (calibrated to reference panel 12) ─────────
// Predominantly deep crimson, ruby red, vibrant strawberry, rose, and blush pink
// with a subtle touch of warm honey gold accents.

const PALETTE_BACK = [
  '#590d22', '#72092c', '#800f2f', '#8f1036', '#a4133c'
];

const PALETTE_MID = [
  '#a4133c', '#c9184a', '#d90429', '#e61c5d', '#ff0054', '#ff2a6d'
];

const PALETTE_FRONT = [
  '#c9184a', '#d90429', '#ff0054', '#ff4d6d', '#ff6b8b', '#ff758f', '#ff8fa3', '#ffa4b6'
];

// ─── Tree Builder ────────────────────────────────────────────────────

export function buildTree(baseX: number, baseY: number, scale: number): TreeData {
  const rng = new SeededRandom(42);
  const branches: TreeBranch[] = [];
  const roots: TreeRoot[] = [];
  const hearts: TreeHeart[] = [];

  const s = scale;

  // ── 1. ROOTS (Stage 3) ──────────────────────────────────────────────
  // Organic root network: surface buttress roots hugging the mound + deep anchor roots
  // Each major root develops secondary rootlets for botanical realism.

  const rootSpecs = [
    // Surface buttress roots (clawing along the mound surface)
    { angle: 2.85, len: 64, width: 4.5, isSurface: true,  subDelta: -0.24, subLen: 32 },
    { angle: 2.50, len: 54, width: 3.8, isSurface: true,  subDelta:  0.22, subLen: 28 },
    { angle: 0.35, len: 62, width: 4.2, isSurface: true,  subDelta:  0.25, subLen: 30 },
    { angle: 0.65, len: 50, width: 3.6, isSurface: true,  subDelta: -0.20, subLen: 26 },
    // Underground anchor roots (fanning out into soil)
    { angle: 2.15, len: 70, width: 3.6, isSurface: false, subDelta:  0.26, subLen: 34 },
    { angle: 1.85, len: 80, width: 4.0, isSurface: false, subDelta: -0.22, subLen: 38 },
    { angle: 1.57, len: 88, width: 4.4, isSurface: false, subDelta:  0.28, subLen: 42 }, // central taproot
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
      growStart: T.ROOTS_START + (i / rootSpecs.length) * 0.035,
      growEnd: T.ROOTS_END + (i / rootSpecs.length) * 0.02,
      isSurface: rs.isSurface,
      subRoots,
    });
  });

  const baseButtress = {
    leftFlare: [
      { x: baseX - 42 * s, y: baseY + 12 * s },
      { x: baseX - 24 * s, y: baseY + 5 * s },
      { x: baseX - 16 * s, y: baseY - 18 * s },
    ],
    rightFlare: [
      { x: baseX + 38 * s, y: baseY + 10 * s },
      { x: baseX + 22 * s, y: baseY + 4 * s },
      { x: baseX + 14 * s, y: baseY - 16 * s },
    ],
  };

  // ── 2. TRUNK (Stages 4 & 5, Level 0) ────────────────────────────────
  // S-curve trunk matching reference:
  // Base at (baseX, baseY), curves gently to the left, arches up towards center.

  const trunkH = 160 * s;

  // Segment 0: Lower Trunk (Stage 4)
  const trunkMid: Vec2 = { x: baseX - 14 * s, y: baseY - trunkH * 0.54 };
  branches.push({
    p0: { x: baseX, y: baseY },
    p1: { x: baseX - 6 * s,  y: baseY - trunkH * 0.18 },
    p2: { x: baseX - 17 * s, y: baseY - trunkH * 0.38 },
    p3: trunkMid,
    widthStart: 34 * s,
    widthEnd: 24 * s,
    level: 0,
    growStart: T.TRUNK_START,
    growEnd: T.TRUNK_MID,
  });

  // Segment 1: Upper Trunk (Stage 5)
  const trunkTop: Vec2 = { x: baseX + 2 * s, y: baseY - trunkH * 0.98 };
  branches.push({
    p0: trunkMid,
    p1: { x: baseX - 10 * s, y: baseY - trunkH * 0.68 },
    p2: { x: baseX - 2 * s,  y: baseY - trunkH * 0.84 },
    p3: trunkTop,
    widthStart: 24 * s,
    widthEnd: 17 * s,
    level: 0,
    growStart: T.TRUNK_MID,
    growEnd: T.TRUNK_END,
  });

  // ── 3. PRIMARY BRANCHES (Stage 6, Level 1) ──────────────────────────
  // 5 organic boughs matching reference:
  // 0: Left Major Bough — departs lower on the trunk (60% height), arches out horizontally to the left.
  // 1: Left-Upper Bough — departs trunkTop, reaches up-left into the canopy.
  // 2: Central Crown Spire — departs trunkTop, reaches straight up into the crown.
  // 3: Right-Upper Bough — departs trunkTop, reaches up-right.
  // 4: Right Major Bough — departs near trunkTop (85% height), sweeps horizontally to the right.

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
    len: number;
  }

  const primarySpecs: PrimarySpec[] = [
    // 0: Left Major Bough (sweeps horizontally out to the left with graceful undulating arch)
    {
      startPt: leftJunction,
      cp1: { x: leftJunction.x - 36 * s, y: leftJunction.y - 18 * s },
      cp2: { x: leftJunction.x - 78 * s, y: leftJunction.y - 12 * s },
      endPt: { x: leftJunction.x - 126 * s, y: leftJunction.y - 18 * s },
      widthStart: 17 * s,
      widthEnd: 9.0 * s,
      angle: -2.95,
      len: 128 * s,
    },
    // 1: Left-Upper Bough (reaches up-left)
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x - 28 * s, y: trunkTop.y - 28 * s },
      cp2: { x: trunkTop.x - 56 * s, y: trunkTop.y - 54 * s },
      endPt: { x: trunkTop.x - 74 * s, y: trunkTop.y - 82 * s },
      widthStart: 14 * s,
      widthEnd: 7.5 * s,
      angle: -2.35,
      len: 112 * s,
    },
    // 2: Central Crown Spire (reaches upward)
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x - 6 * s, y: trunkTop.y - 36 * s },
      cp2: { x: trunkTop.x + 8 * s, y: trunkTop.y - 74 * s },
      endPt: { x: trunkTop.x + 2 * s, y: trunkTop.y - 114 * s },
      widthStart: 14 * s,
      widthEnd: 7.0 * s,
      angle: -1.57,
      len: 116 * s,
    },
    // 3: Right-Upper Bough (reaches up-right)
    {
      startPt: trunkTop,
      cp1: { x: trunkTop.x + 28 * s, y: trunkTop.y - 28 * s },
      cp2: { x: trunkTop.x + 58 * s, y: trunkTop.y - 54 * s },
      endPt: { x: trunkTop.x + 78 * s, y: trunkTop.y - 78 * s },
      widthStart: 13.5 * s,
      widthEnd: 7.0 * s,
      angle: -0.78,
      len: 114 * s,
    },
    // 4: Right Major Bough (sweeps horizontally out to the right towards the wind)
    {
      startPt: rightJunction,
      cp1: { x: rightJunction.x + 40 * s, y: rightJunction.y - 12 * s },
      cp2: { x: rightJunction.x + 84 * s, y: rightJunction.y - 16 * s },
      endPt: { x: rightJunction.x + 128 * s, y: rightJunction.y - 22 * s },
      widthStart: 15.5 * s,
      widthEnd: 8.0 * s,
      angle: -0.22,
      len: 130 * s,
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
      growStart: T.PRIMARY_START + i * 0.014,
      growEnd: T.PRIMARY_END + (i * 0.01),
    });
    primaryEnds.push({
      pt: spec.endPt,
      angle: spec.angle,
      width: spec.widthEnd,
      branchIdx: idx,
    });
  });

  // ── 4. SECONDARY BRANCHES (Stage 7, Level 2) ────────────────────────
  // Both outer canopy armature AND interior volume fill branches to close V-gaps.

  const secondaryEnds: BranchEndInfo[] = [];

  const secondaryConfig = [
    // Outer armature
    // Off Left Major Bough (spec 0)
    { pIdx: 0, forkT: 0.40, deltaAngle: -0.42, len: 64, widthRatio: 0.72 }, // lower-left shelf
    { pIdx: 0, forkT: 0.72, deltaAngle:  0.38, len: 68, widthRatio: 0.68 }, // mid-left upper
    { pIdx: 0, forkT: 1.00, deltaAngle: -0.18, len: 66, widthRatio: 0.65 }, // left outer tip
    // Off Left-Upper Bough (spec 1)
    { pIdx: 1, forkT: 0.48, deltaAngle: -0.38, len: 62, widthRatio: 0.70 },
    { pIdx: 1, forkT: 0.82, deltaAngle:  0.36, len: 66, widthRatio: 0.68 },
    { pIdx: 1, forkT: 1.00, deltaAngle: -0.15, len: 66, widthRatio: 0.65 },
    // Off Central Crown Spire (spec 2)
    { pIdx: 2, forkT: 0.45, deltaAngle: -0.42, len: 64, widthRatio: 0.70 }, // left crest
    { pIdx: 2, forkT: 0.75, deltaAngle:  0.40, len: 64, widthRatio: 0.70 }, // right crest
    { pIdx: 2, forkT: 1.00, deltaAngle:  0.06, len: 68, widthRatio: 0.65 }, // top crown peak
    // Off Right-Upper Bough (spec 3)
    { pIdx: 3, forkT: 0.50, deltaAngle: -0.34, len: 62, widthRatio: 0.70 },
    { pIdx: 3, forkT: 0.82, deltaAngle:  0.36, len: 66, widthRatio: 0.68 },
    { pIdx: 3, forkT: 1.00, deltaAngle:  0.16, len: 68, widthRatio: 0.65 },
    // Off Right Major Bough (spec 4)
    { pIdx: 4, forkT: 0.45, deltaAngle:  0.42, len: 66, widthRatio: 0.72 }, // lower-right arm
    { pIdx: 4, forkT: 0.75, deltaAngle: -0.32, len: 70, widthRatio: 0.68 }, // upper-right arm
    { pIdx: 4, forkT: 1.00, deltaAngle:  0.14, len: 72, widthRatio: 0.65 }, // right windward tip

    // Interior canopy gap fillers (creates continuous lush canopy dome)
    { pIdx: 1, forkT: 0.35, deltaAngle:  0.46, len: 58, widthRatio: 0.65 }, // fills Left-Upper & Central gap
    { pIdx: 2, forkT: 0.32, deltaAngle: -0.46, len: 58, widthRatio: 0.65 }, // fills Central & Left-Upper gap
    { pIdx: 2, forkT: 0.38, deltaAngle:  0.46, len: 58, widthRatio: 0.65 }, // fills Central & Right-Upper gap
    { pIdx: 3, forkT: 0.35, deltaAngle: -0.46, len: 58, widthRatio: 0.65 }, // fills Right-Upper & Central gap
    { pIdx: 0, forkT: 0.55, deltaAngle:  0.50, len: 55, widthRatio: 0.62 }, // fills Left Main & Left-Upper gap
    { pIdx: 4, forkT: 0.55, deltaAngle: -0.50, len: 55, widthRatio: 0.62 }, // fills Right Main & Right-Upper gap
  ];

  secondaryConfig.forEach((cfg, si) => {
    const pEnd = primaryEnds[cfg.pIdx];
    const pBranch = branches[pEnd.branchIdx];
    const originPt = cfg.forkT >= 0.99
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
    const delay = si * 0.0035;

    branches.push({
      p0: originPt,
      p1: cp1,
      p2: cp2,
      p3: endPt,
      widthStart,
      widthEnd,
      level: 2,
      growStart: T.SECONDARY_START + delay,
      growEnd: T.SECONDARY_END + delay,
    });

    secondaryEnds.push({
      pt: endPt,
      angle,
      width: widthEnd,
      branchIdx: idx,
    });
  });

  // ── 5. FINE TWIGS (Stage 8, Level 3) ────────────────────────────────
  // 3 fine twigs per secondary branch, spreading into all directions of the canopy dome.

  interface TwigEndInfo {
    pt: Vec2;
    branchIdx: number;
    angle: number;
  }

  const twigEnds: TwigEndInfo[] = [];

  secondaryEnds.forEach((sEnd, si) => {
    const twigDeltas = [-0.44, 0.02, 0.42];
    twigDeltas.forEach((tDelta, ti) => {
      const sBranch = branches[sEnd.branchIdx];
      const forkT = ti === 1 ? 1.0 : 0.60 + ti * 0.18;
      const originPt = forkT >= 0.99
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

      const delay = (si * 3 + ti) * 0.0018;
      const idx = branches.length;

      branches.push({
        p0: originPt,
        p1: cp1,
        p2: cp2,
        p3: endPt,
        widthStart: Math.max(1.8 * s, sEnd.width * 0.6),
        widthEnd: 0.9 * s,
        level: 3,
        growStart: T.TWIGS_START + delay,
        growEnd: T.TWIGS_END + delay,
      });

      twigEnds.push({ pt: endPt, branchIdx: idx, angle });
    });
  });

  // ── 6. HEARTS (Stages 9–12, Dense Volumetric Canopy & Flight) ───────
  // Target: ~950 deterministic hearts matching the lush, dense canopy in panel 12.
  // 3 depth layers:
  //   Layer 0 (Back): ~240 hearts, deep wine/burgundy, background foliage depth
  //   Layer 1 (Mid):  ~430 hearts, rich crimson/ruby/strawberry red, mid-sized foliage
  //   Layer 2 (Front): ~280 hearts, bright poppy red/rose/blush/honey gold, largest, crisp

  let heartId = 0;
  const crownCenterX = baseX - 8 * s;
  const crownRadiusX = 185 * s;

  // Compute detach order for wind flight (wind flows left to right)
  const detachOrderFor = (x: number, y: number): number => {
    const dx = (x - crownCenterX) / crownRadiusX;
    const dy = (baseY - y) / (trunkH * 1.8);
    const rightBias = 1 - (dx + 1) / 2; // 0 = far right, 1 = far left
    const heightFactor = Math.sin(dy * Math.PI) * 0.15;
    return Math.max(0, Math.min(1, rightBias * 0.78 + heightFactor + rng.next() * 0.18));
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

    const rot = isUnder ? (rng.symmetric() * 0.35) : (rng.symmetric() * 0.85);
    const bloomWave = layer === 2 ? T.BLOOM1_START : (layer === 1 ? T.BLOOM1_START + 0.04 : T.BLOOM2_START);

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

  // 6A. Twig-Tip Clusters (Every twig endpoint gets 2-3 hearts blooming out, ~150 hearts)
  twigEnds.forEach((te) => {
    addHeart(te.branchIdx, 1.0, rng.symmetric() * 3, rng.symmetric() * 3, 2, 1.8);
    addHeart(te.branchIdx, 0.94, (rng.symmetric() * 8 + 5), (rng.symmetric() * 8 - 5), 1, 0.5);
    if (rng.next() < 0.50) {
      addHeart(te.branchIdx, 0.90, (rng.symmetric() * 8 - 5), (rng.symmetric() * 8 - 3), 0, -0.5);
    }
  });

  // 6B. Twig-Body Foliage (Dense alternating leaf pairs along fine twigs, ~420 hearts)
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

  // 6C. Secondary Branch Clusters (~240 hearts around secondary limbs)
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

  // 6D. Primary Branch Foliage & Hanging Underhangs (~150 hearts)
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

  // Sort hearts by layer (0 back → 1 mid → 2 front) for correct depth rendering
  hearts.sort((a, b) => a.layer - b.layer);

  return { branches, roots, hearts, baseButtress };
}
