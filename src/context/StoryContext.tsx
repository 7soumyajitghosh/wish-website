import React, { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  type TreeQuote,
  type WindVector,
  type StoryContextType,
  type IntroState,
  STAGE_PROGRESS_MAP,
} from './storyTypes';
import { getStageFromProgress } from '../components/HeartTreeAnimation/animation/growthTimeline';

// Re-export story constants/types for existing `.../context/StoryContext` imports.
// Explicit constant + type re-exports keep `react/only-export-components`
// (allowConstantExport) quiet, unlike `export *`.
export { STAGE_PROGRESS_MAP, STAGE_DESCRIPTIONS } from './storyTypes';
export type { TreeQuote, WindVector, StoryContextType, IntroState } from './storyTypes';

const StoryContext = createContext<StoryContextType | null>(null);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [introState, setIntroStateInternal] = useState<IntroState>('INTRO');
  const isExperienceUnlocked = introState === 'EXPERIENCE_UNLOCKED';
  const [isStarted, setIsStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [targetProgress, setTargetProgressState] = useState(STAGE_PROGRESS_MAP[1]);
  const [isBloomUnlocked, setIsBloomUnlocked] = useState(false);
  const [isFlightUnlocked, setIsFlightUnlocked] = useState(false);
  const [activeTreeQuote, setActiveTreeQuote] = useState<TreeQuote | null>(null);
  const [windVector, setWindVector] = useState<WindVector>({ x: 0, y: 0, strength: 0 });
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isFinalUnlocked, setIsFinalUnlocked] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const quoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQuoteRef = useRef<TreeQuote | null>(null);

  const clearQuoteTimeout = useCallback(() => {
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
      quoteTimeoutRef.current = null;
    }
  }, []);

  // Leak guard: a pending 8s auto-dismiss must not fire after unmount.
  useEffect(() => {
    const timeoutRef = quoteTimeoutRef;
    const lastRef = lastQuoteRef;
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastRef.current = null;
    };
  }, []);

  const setIntroState = useCallback((state: IntroState) => {
    setIntroStateInternal(state);
    if (state === 'EXPERIENCE_UNLOCKED') {
      setIsStarted(true);
      // Never regress a grown tree: external unlock (nav / Escape) after
      // growth must preserve the max progress, not snap back to the seed.
      setTargetProgressState((prev) => Math.max(prev, STAGE_PROGRESS_MAP[2]));
      setCurrentStage((prev) => Math.max(prev, 2));
    }
  }, []);

  const setTargetProgress = useCallback((p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    setTargetProgressState(clamped);

    // Single source of truth: derive the stage from the actual tree
    // timeline (previously STAGE_PROGRESS_MAP[s] - 0.03 disagreed with the
    // canvas stage mapper, so captions/stages drifted from visuals).
    setCurrentStage(getStageFromProgress(clamped));
  }, []);

  const jumpToStage = useCallback((stage: number) => {
    const validStage = Math.max(1, Math.min(16, stage));
    setCurrentStage(validStage);
    const target = STAGE_PROGRESS_MAP[validStage];
    setTargetProgressState(target);
    if (validStage >= 12) setIsBloomUnlocked(true);
    if (validStage >= 14) setIsFlightUnlocked(true);
  }, []);

  const startStory = useCallback(() => {
    setIntroStateInternal('SEED_FALLING');
  }, []);

  const unlockBloom = useCallback(() => {
    setIsBloomUnlocked(true);
    setTargetProgressState(STAGE_PROGRESS_MAP[12]);
    setCurrentStage(12);
  }, []);

  const unlockFlight = useCallback(() => {
    setIsFlightUnlocked(true);
    setTargetProgressState(STAGE_PROGRESS_MAP[14]);
    setCurrentStage(14);
  }, []);

  const setTreeQuote = useCallback((quote: TreeQuote | null) => {
    clearQuoteTimeout();
    lastQuoteRef.current = quote;
    setActiveTreeQuote(quote);
    if (quote) {
      quoteTimeoutRef.current = setTimeout(() => {
        setActiveTreeQuote(null);
        lastQuoteRef.current = null;
      }, 8000);
    }
  }, [clearQuoteTimeout]);

  // Pause auto-dismiss while hovered/focused; resume restarts the 8s timer.
  const pauseTreeQuote = useCallback(() => {
    clearQuoteTimeout();
  }, [clearQuoteTimeout]);

  const resumeTreeQuote = useCallback(() => {
    clearQuoteTimeout();
    if (lastQuoteRef.current) {
      quoteTimeoutRef.current = setTimeout(() => {
        setActiveTreeQuote(null);
        lastQuoteRef.current = null;
      }, 8000);
    }
  }, [clearQuoteTimeout]);

  const unlockFinal = useCallback(() => {
    setIsFinalUnlocked(true);
  }, []);

  // Memoized value: without this every setTargetProgress broadcast (~10/s
  // during growth/storm) re-renders all useStory consumers even when
  // unrelated fields are unchanged.
  const value = useMemo<StoryContextType>(
    () => ({
      introState,
      setIntroState,
      isExperienceUnlocked,
      isStarted,
      startStory,
      currentStage,
      targetProgress,
      setTargetProgress,
      jumpToStage,
      isBloomUnlocked,
      unlockBloom,
      isFlightUnlocked,
      unlockFlight,
      activeTreeQuote,
      setActiveTreeQuote: setTreeQuote,
      pauseTreeQuote,
      resumeTreeQuote,
      windVector,
      setWindVector,
      isLetterOpen,
      setIsLetterOpen,
      isFinalUnlocked,
      unlockFinal,
      pendingTarget,
      setPendingTarget,
    }),
    [
      introState,
      setIntroState,
      isExperienceUnlocked,
      isStarted,
      startStory,
      currentStage,
      targetProgress,
      setTargetProgress,
      jumpToStage,
      isBloomUnlocked,
      unlockBloom,
      isFlightUnlocked,
      unlockFlight,
      activeTreeQuote,
      setTreeQuote,
      pauseTreeQuote,
      resumeTreeQuote,
      windVector,
      isLetterOpen,
      isFinalUnlocked,
      unlockFinal,
      pendingTarget,
    ]
  );

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};

// Context hook lives alongside its provider by design.
// oxlint-disable-next-line react/only-export-components
export const useStory = (): StoryContextType => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
