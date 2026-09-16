/**
 * Centralized configuration for LoveExperience text, quotes, and timing.
 * Fully editable without modifying animation or rendering code.
 */

export interface LoveLetterData {
  recipient: string;
  date: string;
  paragraphs: string[];
  signOff: string;
  sender: string;
}

export interface WishSceneData {
  title: string;
  subtext: string;
  actionHint: string;
  finalHeader: string;
  finalMessage: string[];
  finalSignature: string;
}

export interface ConstellationData {
  quoteLine1: string;
  quoteLine2: string;
}

export interface ExperienceConfig {
  constellation: ConstellationData;
  loveLetter: LoveLetterData;
  wish: WishSceneData;
}

export const EXPERIENCE_CONFIG: ExperienceConfig = {
  constellation: {
    quoteLine1: "Some feelings don't need a picture.",
    quoteLine2: "They just need to be felt.",
  },

  loveLetter: {
    recipient: "My Dearest,",
    date: "A quiet starlit evening",
    paragraphs: [
      "In a world that is constantly rushing, you are the stillness I always seek. Every ordinary moment becomes precious simply because you are part of it.",
      "Like roots that find their way through stone and branches that reach fearless toward the sun, my love for you has grown quietly, deeply, and unconditionally.",
      "You are my favorite thought before falling asleep, my fondest wish upon every shooting star, and the warmth that stays long after the light fades.",
    ],
    signOff: "Forever & always yours,",
    sender: "With all my heart",
  },

  wish: {
    title: "Make a Wish",
    subtext: "Close your eyes. Make a wish.",
    actionHint: "Tap the glowing heart to release your wish",
    finalHeader: "May All Your Wishes Come True",
    finalMessage: [
      "You are the light in my darkest nights,",
      "the melody in my quietest thoughts,",
      "and the wish my heart will make for a lifetime.",
    ],
    finalSignature: "Forever Together",
  },
};
