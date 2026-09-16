/**
 * Bloom timeline milestones for buds, heart blooming waves, and Stage 12 Full Bloom.
 */
export const BLOOM_T = {
  // Stage 9: Tiny Buds (strictly after twigs finish growing)
  BUDS_START: 0.62,
  BUDS_END: 0.68,

  // Stage 10: Hearts Blooming (Wave 1: front-facing foreground leaves)
  BLOOM1_START: 0.68,
  BLOOM1_END: 0.76,

  // Stage 11: More Hearts (Wave 2: mid-layer and volume fill)
  BLOOM2_START: 0.74,
  BLOOM2_END: 0.82,

  // Stage 12: Full Bloom (canopy in full lush glory)
  FULL_BLOOM: 0.82,
} as const;
