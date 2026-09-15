import React from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Eye, Sparkles } from 'lucide-react';
import { STAGES } from '../types';

interface StoryControlsProps {
  currentStage: number;
  stageProgress: number;
  isPlaying: boolean;
  playbackSpeed: number;
  isMuted: boolean;
  onSelectStage: (stage: number) => void;
  onTogglePlay: () => void;
  onNextStage: () => void;
  onPrevStage: () => void;
  onToggleSpeed: () => void;
  onToggleMute: () => void;
  onToggleQA: () => void;
  onToggleFullscreen: () => void;
}

export const StoryControls: React.FC<StoryControlsProps> = ({
  currentStage,
  stageProgress,
  isPlaying,
  playbackSpeed,
  isMuted,
  onSelectStage,
  onTogglePlay,
  onNextStage,
  onPrevStage,
  onToggleSpeed,
  onToggleMute,
  onToggleQA,
  onToggleFullscreen
}) => {
  const currentInfo = STAGES.find((s) => s.id === currentStage) || STAGES[0];

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pointer-events-none pb-4 sm:pb-6 px-3 sm:px-6">
      {/* Stage Title and Subtitle Card */}
      <div className="pointer-events-auto mb-3 flex flex-col items-center text-center max-w-lg transition-all duration-300">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-rose-200/20 backdrop-blur-md mb-1.5 shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span className="text-[10px] sm:text-xs tracking-[0.25em] uppercase text-rose-100/90 font-light">
            Stage {currentStage} of 16
          </span>
        </div>

        <h2 className="font-serif text-xl sm:text-3xl text-[#fff0eb] tracking-wide drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] font-normal">
          {currentInfo.title}
        </h2>

        <p className="text-xs sm:text-sm text-rose-200/80 font-light italic mt-0.5 drop-shadow-[0_1px_6px_rgba(0,0,0,0.7)]">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Main Glass HUD Bar */}
      <div className="pointer-events-auto w-full max-w-2xl p-2.5 sm:p-3 rounded-2xl glass-panel flex flex-col gap-2.5 transition-all">
        {/* Scrubber Progress Bar & 16 Step Notches */}
        <div className="relative w-full flex items-center px-1">
          {/* Continuous progress track */}
          <div className="relative w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-200 via-rose-400 to-pink-500 rounded-full transition-all duration-100"
              style={{
                width: `${((currentStage - 1 + stageProgress) / 15) * 100}%`
              }}
            />
          </div>

          {/* 16 Clickable Stage Markers */}
          <div className="absolute inset-0 flex justify-between items-center pointer-events-none px-0.5">
            {STAGES.map((st) => {
              const isPassed = st.id < currentStage;
              const isCurrent = st.id === currentStage;

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStage(st.id)}
                  title={`${st.id}. ${st.title}`}
                  className={`pointer-events-auto w-3 h-3 rounded-full transition-all transform hover:scale-150 flex items-center justify-center -translate-y-[1px] ${
                    isCurrent
                      ? 'bg-amber-300 ring-4 ring-amber-400/40 scale-125 z-10'
                      : isPassed
                      ? 'bg-rose-400/80'
                      : 'bg-white/30 hover:bg-white/60'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-rose-100/90 text-xs pt-1">
          {/* Left tools: Visual QA & Speed */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleQA}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg glass-button text-[11px] tracking-wider uppercase text-amber-200 hover:text-amber-100"
              title="Compare with Reference Storyboard"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reference QA</span>
            </button>

            <button
              onClick={onToggleSpeed}
              className="px-2 py-1 rounded-lg glass-button text-[11px] font-mono text-rose-200/90"
              title="Change Playback Speed"
            >
              {playbackSpeed}x
            </button>
          </div>

          {/* Center playback controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onPrevStage}
              disabled={currentStage <= 1}
              className="p-1.5 rounded-full glass-button disabled:opacity-30 disabled:pointer-events-none text-rose-100 hover:text-white"
              title="Previous Stage"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              className="p-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-md shadow-rose-950/50 transition-all transform hover:scale-105 active:scale-95"
              title={isPlaying ? 'Pause Journey' : 'Play Journey'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white translate-x-0.5" />}
            </button>

            <button
              onClick={onNextStage}
              disabled={currentStage >= 16}
              className="p-1.5 rounded-full glass-button disabled:opacity-30 disabled:pointer-events-none text-rose-100 hover:text-white"
              title="Next Stage"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Right tools: Sound & Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg glass-button text-rose-200 hover:text-white"
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onToggleFullscreen}
              className="p-1.5 rounded-lg glass-button text-rose-200 hover:text-white hidden sm:block"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
