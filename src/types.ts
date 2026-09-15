/**
 * Shared types for the project.
 * Stage data has moved to animation/timeline.ts.
 * These basic geometric types are kept for backward compatibility.
 */

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

// Re-export timeline types for any consumers still using the old API
export { STAGE_MARKERS as STAGES, type StageMarker as StageInfo } from './animation/timeline';

