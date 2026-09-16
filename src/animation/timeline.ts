/**
 * Timeline constants for the continuous animation.
 * All values are normalized progress [0, 1].
 * There are NO stages — just one continuous t value driving everything.
 * Overlapping ranges create organic, simultaneous growth.
 */

/** Timeline progress milestones */
export const T = {
  // Seed
  SEED_START: 0.04,
  SEED_PEAK: 0.08,
  // Roots
  ROOTS_START: 0.10,
  ROOTS_END: 0.19,
  // Trunk
  TRUNK_START: 0.16,
  TRUNK_MID: 0.22,
  TRUNK_END: 0.28,
  // Primary branches
  PRIMARY_START: 0.28,
  PRIMARY_END: 0.38,
  // Secondary branches
  SECONDARY_START: 0.36,
  SECONDARY_END: 0.46,
  // Twigs
  TWIGS_START: 0.44,
  TWIGS_END: 0.54,
  // Buds
  BUDS_START: 0.55,
  BUDS_END: 0.60,
  // Bloom waves
  BLOOM1_START: 0.60,
  BLOOM1_END: 0.68,
  BLOOM2_START: 0.67,
  BLOOM2_END: 0.75,
  // Full bloom hold
  FULL_BLOOM: 0.76,
  // Wind and flight
  WIND_START: 0.78,
  DETACH_START: 0.82,
  STREAM_PEAK: 0.96,
  // Transition / camera pan
  TRANSITION_START: 0.83,
  DESTINATION_FULL: 0.97,
} as const;

/** Total animation duration in seconds at 1x speed */
export const TOTAL_DURATION = 55;

/** Stage marker for HUD display — derived from progress */
export interface StageMarker {
  id: number;
  title: string;
  subtitle: string;
  progressStart: number;
}

export const STAGE_MARKERS: StageMarker[] = [
  { id: 1,  title: 'Empty Canvas',       subtitle: 'A calm, beautiful background',    progressStart: 0 },
  { id: 2,  title: 'Glowing Seed',       subtitle: 'A tiny glowing seed appears',     progressStart: 0.07 },
  { id: 3,  title: 'Roots Emerge',       subtitle: 'Roots grow into the ground',      progressStart: 0.14 },
  { id: 4,  title: 'Trunk Begins',       subtitle: 'The trunk starts growing',        progressStart: 0.19 },
  { id: 5,  title: 'Trunk Grows',        subtitle: 'The trunk grows taller and thicker', progressStart: 0.25 },
  { id: 6,  title: 'Main Branches',      subtitle: 'Primary branches extend',         progressStart: 0.33 },
  { id: 7,  title: 'Secondary Branches', subtitle: 'More branches grow naturally',    progressStart: 0.41 },
  { id: 8,  title: 'Fine Twigs',         subtitle: 'Small twigs appear',              progressStart: 0.49 },
  { id: 9,  title: 'Tiny Buds',          subtitle: 'Little glowing buds appear',      progressStart: 0.55 },
  { id: 10, title: 'Hearts Blooming',    subtitle: 'First heart leaves appear',       progressStart: 0.62 },
  { id: 11, title: 'More Hearts',        subtitle: 'More hearts fill the branches',   progressStart: 0.70 },
  { id: 12, title: 'Full Bloom',         subtitle: 'A beautiful heart tree',          progressStart: 0.76 },
  { id: 13, title: 'Wind Begins',        subtitle: 'A gentle wind starts',            progressStart: 0.80 },
  { id: 14, title: 'Hearts Fly Away',    subtitle: 'Heart leaves detach and fly',     progressStart: 0.85 },
  { id: 15, title: 'Transition',         subtitle: 'The heart stream leads onward',   progressStart: 0.93 },
  { id: 16, title: 'New Beginning',      subtitle: 'Where love takes flight',         progressStart: 0.98 },
];

/** Derive the display stage number from a progress value */
export function getStageFromProgress(p: number): number {
  for (let i = STAGE_MARKERS.length - 1; i >= 0; i--) {
    if (p >= STAGE_MARKERS[i].progressStart) return STAGE_MARKERS[i].id;
  }
  return 1;
}

/** Get the stage info for a given stage number */
export function getStageInfo(stage: number): StageMarker {
  return STAGE_MARKERS.find(s => s.id === stage) || STAGE_MARKERS[0];
}
