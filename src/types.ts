export interface StageInfo {
  id: number;
  title: string;
  subtitle: string;
  duration: number;
}

export const STAGES: StageInfo[] = [
  { id: 1, title: 'Empty Canvas', subtitle: 'A calm, beautiful background', duration: 3.5 },
  { id: 2, title: 'Glowing Seed', subtitle: 'A tiny glowing seed appears', duration: 3.0 },
  { id: 3, title: 'Roots Emerge', subtitle: 'Roots grow into the ground', duration: 3.5 },
  { id: 4, title: 'Trunk Begins', subtitle: 'The trunk starts growing', duration: 3.0 },
  { id: 5, title: 'Trunk Grows', subtitle: 'The trunk grows taller and thicker', duration: 3.5 },
  { id: 6, title: 'Main Branches', subtitle: 'Primary branches extend', duration: 3.5 },
  { id: 7, title: 'Secondary Branches', subtitle: 'More branches grow naturally', duration: 3.5 },
  { id: 8, title: 'Fine Twigs', subtitle: 'Small twigs appear', duration: 3.5 },
  { id: 9, title: 'Tiny Buds', subtitle: 'Little glowing buds appear', duration: 3.0 },
  { id: 10, title: 'Hearts Blooming (1)', subtitle: 'First heart leaves appear', duration: 3.5 },
  { id: 11, title: 'Hearts Blooming (2)', subtitle: 'More hearts fill the branches', duration: 3.5 },
  { id: 12, title: 'Full Bloom', subtitle: 'A beautiful heart tree (like your reference)', duration: 4.0 },
  { id: 13, title: 'Wind Begins', subtitle: 'A gentle wind starts', duration: 3.5 },
  { id: 14, title: 'Hearts Fly Away', subtitle: 'Heart leaves detach and fly to the right', duration: 4.0 },
  { id: 15, title: 'Transition', subtitle: 'The heart stream leads to the next page', duration: 3.5 },
  { id: 16, title: 'Next Page', subtitle: 'A beautiful second page appears', duration: 8.0 }
];

export interface Point {
  x: number;
  y: number;
}

export interface BranchNode {
  start: Point;
  end: Point;
  cp1: Point;
  cp2: Point;
  width: number;
  level: number;
  appearStage: number;
  angle: number;
  length: number;
}

export interface HeartLeaf {
  id: number;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  baseSize: number;
  color: string;
  glowColor: string;
  rotation: number;
  wobbleSpeed: number;
  wobblePhase: number;
  appearStage: number;
  isBud: boolean;
  isFlying: boolean;
  vx: number;
  vy: number;
  rotSpeed: number;
  alpha: number;
  flightDelay: number;
}

export interface RootNode {
  start: Point;
  end: Point;
  cp: Point;
  width: number;
  depth: number;
}

export interface EmberParticle {
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
