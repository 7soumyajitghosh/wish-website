import { useState, useCallback } from 'react';
import { StoryProvider } from './context/StoryContext';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { HeartTreeAnimation } from './components/HeartTreeAnimation';
import { CursorGlow } from './components/Effects/CursorGlow';
import { SoundToggle } from './components/SoundToggle/SoundToggle';

/** Test page: Cinematic Experience + Heart Tree only */
export const TestCinematic = () => {
  const [introAlive, setIntroAlive] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setIntroAlive(false);
  }, []);

  return (
    <StoryProvider>
      <div className="grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8] overflow-hidden max-h-screen">
        <CursorGlow />
        <SoundToggle />
        {/* Cinematic Experience (includes HeartTreeAnimation internally) */}
        {introAlive && (
          <CinematicExperience onTransitionComplete={handleIntroComplete} />
        )}
        {/* After transition: show just the Heart Tree standalone */}
        {!introAlive && (
          <section className="relative w-full h-screen min-h-screen bg-[#0d0408] text-[#fffdf8] flex items-center justify-center">
            <div className="w-full max-w-6xl h-full p-4">
              <HeartTreeAnimation
                targetProgress={1}
                onTreeInteract={undefined}
                onWindChange={undefined}
              />
            </div>
          </section>
        )}
      </div>
    </StoryProvider>
  );
};

export default TestCinematic;