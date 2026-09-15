import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CinematicTreeCanvas } from './components/CinematicTreeCanvas';
import { DestinationPage } from './components/DestinationPage';
import { StoryControls } from './components/StoryControls';
import { VisualQAModal } from './components/VisualQAModal';
import { STAGES } from './types';
import { soundManager } from './audio/soundManager';
import { Heart, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageProgress, setStageProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isQAModalOpen, setIsQAModalOpen] = useState<boolean>(false);

  const lastTimeRef = useRef<number>(0);
  const progressRef = useRef<number>(0);


  // Auto-play stage advance loop
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dt = (now - lastTimeRef.current) * 0.001;
      lastTimeRef.current = now;

      if (isPlaying && currentStage < 16) {
        const stageInfo = STAGES[currentStage - 1] || STAGES[0];
        const stageDuration = (stageInfo.duration || 3.5) / playbackSpeed;

        progressRef.current += dt / stageDuration;

        if (progressRef.current >= 1) {
          progressRef.current = 0;
          setCurrentStage((prev) => {
            if (prev < 16) {
              return prev + 1;
            }
            return prev;
          });
        }
        setStageProgress(Math.min(1, progressRef.current));
      }

      animId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, currentStage, playbackSpeed]);

  const handleSelectStage = useCallback((stage: number) => {
    setCurrentStage(stage);
    progressRef.current = 0;
    setStageProgress(0);
    soundManager.startAmbient();
  }, []);

  const handleNextStage = () => {
    if (currentStage < 16) {
      handleSelectStage(currentStage + 1);
    }
  };

  const handlePrevStage = () => {
    if (currentStage > 1) {
      handleSelectStage(currentStage - 1);
    }
  };

  const handleTogglePlay = () => {
    soundManager.startAmbient();
    setIsPlaying((prev) => !prev);
  };

  const handleToggleSpeed = () => {
    const speeds = [0.5, 1.0, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  const handleToggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    soundManager.setMuted(newMute);
    if (!newMute) {
      soundManager.startAmbient();
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReplay = () => {
    setCurrentStage(1);
    progressRef.current = 0;
    setStageProgress(0);
    setIsPlaying(true);
    soundManager.startAmbient();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#12090b] text-[#fdf6f0] select-none">
      {/* Top Editorial Header */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 py-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
          <span className="font-serif text-xs sm:text-sm tracking-[0.25em] uppercase text-rose-100/90 font-light drop-shadow-md">
            A Journey of Love
          </span>
          <span className="hidden md:inline text-rose-300/40 text-xs">—</span>
          <span className="hidden md:inline text-[11px] tracking-widest text-rose-200/60 uppercase font-light">
            From a Seed to a New Beginning
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsQAModalOpen(true)}
            className="px-3 py-1 rounded-full glass-button text-[11px] text-amber-200 hover:text-amber-100 tracking-wider uppercase flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Visual QA Inspector</span>
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      {currentStage === 16 ? (
        <DestinationPage
          onReplay={handleReplay}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : (
        <>
          <CinematicTreeCanvas
            currentStage={currentStage}
            stageProgress={stageProgress}
            isPlaying={isPlaying}
            onAdvanceToNextPage={() => handleSelectStage(16)}
          />

          <StoryControls
            currentStage={currentStage}
            stageProgress={stageProgress}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            isMuted={isMuted}
            onSelectStage={handleSelectStage}
            onTogglePlay={handleTogglePlay}
            onNextStage={handleNextStage}
            onPrevStage={handlePrevStage}
            onToggleSpeed={handleToggleSpeed}
            onToggleMute={handleToggleMute}
            onToggleQA={() => setIsQAModalOpen(true)}
            onToggleFullscreen={handleToggleFullscreen}
          />
        </>
      )}

      {/* Visual QA Reference Inspector Modal */}
      <VisualQAModal
        currentStage={currentStage}
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        onSelectStage={handleSelectStage}
      />
    </div>
  );
};

export default App;
