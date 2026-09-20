import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  type TreeQuote,
  type WindVector,
  type StoryContextType,
  type IntroState,
  STAGE_PROGRESS_MAP,
} from './storyTypes';

export * from './storyTypes';

const StoryContext = createContext<StoryContextType | null>(null);

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [introState, setIntroStateInternal] = useState<IntroState>('INTRO');
  const isExperienceUnlocked = introState === 'EXPERIENCE_UNLOCKED';
  const [isStarted, setIsStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [targetProgress, setTargetProgressState] = useState(0.02);
  const [isBloomUnlocked, setIsBloomUnlocked] = useState(false);
  const [isFlightUnlocked, setIsFlightUnlocked] = useState(false);
  const [activeTreeQuote, setActiveTreeQuote] = useState<TreeQuote | null>(null);
  const [windVector, setWindVector] = useState<WindVector>({ x: 0, y: 0, strength: 0 });
  const [isLetterOpen, setIsLetterOpen] = useState(false);
  const [isFinalUnlocked, setIsFinalUnlocked] = useState(false);

  const quoteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setIntroState = useCallback((state: IntroState) => {
    setIntroStateInternal(state);
    if (state === 'EXPERIENCE_UNLOCKED') {
      setIsStarted(true);
      setTargetProgressState(STAGE_PROGRESS_MAP[2]);
      setCurrentStage(2);
    }
  }, []);

  const setTargetProgress = useCallback((p: number) => {
    const clamped = Math.max(0, Math.min(1, p));
    setTargetProgressState(clamped);

    let stage = 1;
    for (let s = 16; s >= 1; s--) {
      if (clamped >= (STAGE_PROGRESS_MAP[s] - 0.03)) {
        stage = s;
        break;
      }
    }
    setCurrentStage(stage);
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
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
      quoteTimeoutRef.current = null;
    }
    setActiveTreeQuote(quote);
    if (quote) {
      quoteTimeoutRef.current = setTimeout(() => {
        setActiveTreeQuote(null);
      }, 4500);
    }
  }, []);

  const unlockFinal = useCallback(() => {
    setIsFinalUnlocked(true);
  }, []);

  return (
    <StoryContext.Provider
      value={{
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
        windVector,
        setWindVector,
        isLetterOpen,
        setIsLetterOpen,
        isFinalUnlocked,
        unlockFinal,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
};

export const useStory = (): StoryContextType => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};
