/**
 * Shared types for the project.
 * Stage data has moved to animation/timeline.ts.
 * These basic geometric types are kept for backward compatibility.
 */

export interface Point {
  x: number;
  y: number;
}

// Re-export timeline types for any consumers still using the old API
export { STAGE_MARKERS as STAGES, type StageMarker as StageInfo } from './animation/timeline';
