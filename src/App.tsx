import React, { useState, useRef, useCallback } from 'react';
import { ContinuousAnimation } from './components/ContinuousAnimation';
import { DestinationPage } from './components/DestinationPage';
import { StoryControls } from './components/StoryControls';
import { VisualQAModal } from './components/VisualQAModal';
import { getStageFromProgress, STAGE_MARKERS } from './animation/timeline';
import { soundManager } from './audio/soundManager';
import { Heart, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  // Single progress value drives the entire animation
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isQAModalOpen, setIsQAModalOpen] = useState<boolean>(false);

  // Ref for seeking — animation reads this and nulls it
  const seekTargetRef = useRef<number | null>(null);

  const currentStage = getStageFromProgress(progress);

  const handleProgressUpdate = useCallback((p: number) => {
    setProgress(p);
  }, []);

  const handleSeek = useCallback((p: number) => {
    seekTargetRef.current = p;
    setProgress(p);
    soundManager.startAmbient();
  }, []);

  const handleTogglePlay = () => {
    soundManager.startAmbient();
    setIsPlaying(prev => !prev);
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
    if (!newMute) soundManager.startAmbient();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleReplay = () => {
    seekTargetRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
    soundManager.startAmbient();
  };

  const showDestinationOverlay = progress >= 0.97;

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

      {/* Canvas Animation — always rendered, single continuous world */}
      <ContinuousAnimation
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        seekTargetRef={seekTargetRef}
        onProgressUpdate={handleProgressUpdate}
        isMuted={isMuted}
      />

      {/* Destination overlay — HTML interactive elements over the canvas */}
      {showDestinationOverlay && (
        <DestinationPage
          onReplay={handleReplay}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      )}

      {/* Story Controls HUD */}
      {!showDestinationOverlay && (
        <StoryControls
          progress={progress}
          currentStage={currentStage}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          isMuted={isMuted}
          onSeek={handleSeek}
          onTogglePlay={handleTogglePlay}
          onToggleSpeed={handleToggleSpeed}
          onToggleMute={handleToggleMute}
          onToggleQA={() => setIsQAModalOpen(true)}
          onToggleFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Visual QA Reference Inspector Modal */}
      <VisualQAModal
        currentStage={currentStage}
        isOpen={isQAModalOpen}
        onClose={() => setIsQAModalOpen(false)}
        onSelectStage={(stage: number) => {
          const marker = STAGE_MARKERS.find(s => s.id === stage);
          if (marker) handleSeek(marker.progressStart);
        }}
      />
    </div>
  );
};

export default App;
