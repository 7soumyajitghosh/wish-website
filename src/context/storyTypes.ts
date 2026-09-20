export interface TreeQuote {
  text: string;
  type: 'root' | 'branch' | 'heart';
  x: number;
  y: number;
}

export interface WindVector {
  x: number;
  y: number;
  strength: number;
}

export type IntroState =
  | 'INTRO'
  | 'SEED_FALLING'
  | 'SEED_LANDED'
  | 'WATERING'
  | 'WATERED'
  | 'ROOT_GROWTH'
  | 'TREE_GROWTH'
  | 'EXPERIENCE_UNLOCKED';

export interface StoryContextType {
  // Intro & Opening state
  introState: IntroState;
  setIntroState: (state: IntroState) => void;
  isExperienceUnlocked: boolean;
  isStarted: boolean;
  startStory: () => void;

  // Progression state
  currentStage: number;
  targetProgress: number;
  setTargetProgress: (p: number) => void;
  jumpToStage: (stage: number) => void;

  // Milestone transition locks
  isBloomUnlocked: boolean;
  unlockBloom: () => void;
  isFlightUnlocked: boolean;
  unlockFlight: () => void;

  // Interactive Tree Popups & Physics
  activeTreeQuote: TreeQuote | null;
  setActiveTreeQuote: (quote: TreeQuote | null) => void;
  windVector: WindVector;
  setWindVector: (v: WindVector) => void;

  // Final Experience States
  isLetterOpen: boolean;
  setIsLetterOpen: (open: boolean) => void;
  isFinalUnlocked: boolean;
  unlockFinal: () => void;
}

export const STAGE_PROGRESS_MAP: Record<number, number> = {
  1: 0.02,   // Empty Canvas
  2: 0.06,   // Glowing Seed
  3: 0.15,   // Roots Emerge
  4: 0.23,   // Trunk Begins
  5: 0.29,   // Trunk Grows
  6: 0.38,   // Main Branches
  7: 0.48,   // Secondary Branches
  8: 0.58,   // Fine Twigs
  9: 0.65,   // Tiny Buds
  10: 0.72,  // Hearts Bloom
  11: 0.78,  // More Hearts
  12: 0.82,  // Full Bloom
  13: 0.88,  // Wind Begins
  14: 0.94,  // Hearts Fly
  15: 0.98,  // Transition
  16: 1.00,  // Destination
};

export const STAGE_DESCRIPTIONS: { id: number; title: string; subtitle: string }[] = [
  { id: 1, title: 'The Silent Dusk', subtitle: 'A calm twilight where all love begins' },
  { id: 2, title: 'The Glowing Seed', subtitle: 'A spark of quiet affection takes root' },
  { id: 3, title: 'Roots of Devotion', subtitle: 'Growing deep into the silent earth' },
  { id: 4, title: 'The First Reaching', subtitle: 'Rising upward toward warmth and light' },
  { id: 5, title: 'Strength & Grace', subtitle: 'Standing tall through wind and stillness' },
  { id: 6, title: 'Primary Boughs', subtitle: 'Reaching wide across the painted sky' },
  { id: 7, title: 'Branching Pathways', subtitle: 'Every memory branching into tender moments' },
  { id: 8, title: 'Delicate Crown', subtitle: 'Intricate twigs ready to embrace the warmth' },
  { id: 9, title: 'Luminous Buds', subtitle: 'Soft lights whispering sweet promises' },
  { id: 10, title: 'First Blossoms', subtitle: 'Tender heart leaves unfurling into life' },
  { id: 11, title: 'Crimson Symphony', subtitle: 'Ruby petals weaving together' },
  { id: 12, title: 'The Heart Tree', subtitle: 'Full radiant bloom in timeless splendour' },
  { id: 13, title: 'Gentle Evening Breeze', subtitle: 'A stirring in the air, carrying tender whispers' },
  { id: 14, title: 'Hearts Take Flight', subtitle: 'Unfurling into the winds of destiny' },
  { id: 15, title: 'Celestial Stream', subtitle: 'Transforming into starry lights across the sky' },
  { id: 16, title: 'Where Love Takes Flight', subtitle: 'The eternal haven where hearts meet' },
];
