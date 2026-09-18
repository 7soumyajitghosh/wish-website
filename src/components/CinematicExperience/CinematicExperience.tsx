import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import HeartTreeAnimation from '../HeartTreeAnimation';
import type { HeartTreeHandle } from '../HeartTreeAnimation';

export const CinematicExperience: React.FC = () => {
  const treeRef = useRef<HeartTreeHandle>(null);
  
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  
  const controlsRef = useRef<HTMLDivElement>(null);
  const hideControlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const resetHideControlsTimer = () => {
    setIsControlsVisible(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);
  };

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    section.addEventListener('mousemove', resetHideControlsTimer);
    section.addEventListener('touchstart', resetHideControlsTimer);
    section.addEventListener('click', resetHideControlsTimer);
    
    resetHideControlsTimer();

    return () => {
      section.removeEventListener('mousemove', resetHideControlsTimer);
      section.removeEventListener('touchstart', resetHideControlsTimer);
      section.removeEventListener('click', resetHideControlsTimer);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (controlsRef.current) {
        gsap.to(controlsRef.current, {
          opacity: isControlsVisible ? 1 : 0,
          y: isControlsVisible ? 0 : 20,
          duration: 0.5,
          ease: 'power2.out',
          pointerEvents: isControlsVisible ? 'auto' : 'none',
        });
      }
    });

    return () => ctx.revert();
  }, [isControlsVisible]);

  const handlePlayPause = () => {
    if (isPlaying) {
      treeRef.current?.pause();
    } else {
      treeRef.current?.play();
    }
    setIsPlaying(!isPlaying);
    resetHideControlsTimer();
  };

  const handleReplay = () => {
    treeRef.current?.replay();
    treeRef.current?.play();
    setIsPlaying(true);
    resetHideControlsTimer();
  };

  const handleSpeedChange = () => {
    const newSpeed = playbackSpeed === 0.5 ? 1 : playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 0.5;
    setPlaybackSpeed(newSpeed);
    treeRef.current?.setSpeed(newSpeed);
    resetHideControlsTimer();
  };

  const handleProgressUpdate = (currentProgress: number, currentStage: number) => {
    setProgress(currentProgress);
    setStage(currentStage);
  };

  return (
    <section 
      id="experience" 
      ref={sectionRef}
      className="relative w-full h-[100vh] overflow-hidden bg-[#0d0408] text-[#fffdf8]"
    >
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h2 className="font-serif text-3xl text-[#fff8eb]/80 tracking-wide drop-shadow-md">
          The Heart Tree
        </h2>
      </div>

      <div className="absolute inset-0 z-0">
        <HeartTreeAnimation 
          ref={treeRef}
          autoPlay={true}
          loop={true}
          onProgressUpdate={handleProgressUpdate}
        />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10 z-20">
        <div 
          className="h-full bg-gradient-to-r from-[#f5baa4] to-[#a81438] transition-all duration-300 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Controls Overlay */}
      <div 
        ref={controlsRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col md:flex-row items-center gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <button 
            onClick={handleReplay}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            aria-label="Replay animation"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>

          <button 
            onClick={handlePlayPause}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-[#ffb3c1]"
            aria-label={isPlaying ? "Pause animation" : "Play animation"}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                <path d="M5 3l14 9-14 9V3z" />
              </svg>
            )}
          </button>

          <button 
            onClick={handleSpeedChange}
            className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors text-white min-w-[3rem]"
            aria-label={`Playback speed ${playbackSpeed}x`}
          >
            <span className="font-sans text-sm font-medium">{playbackSpeed}x</span>
          </button>
        </div>

        <div className="hidden md:block w-[1px] h-8 bg-white/20 mx-2" />

        <div className="text-sm font-serif tracking-wider text-[#ffd6a5] whitespace-nowrap">
          Stage {stage} of 16
        </div>
      </div>
    </section>
  );
};

export default CinematicExperience;
