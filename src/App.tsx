import { useEffect } from 'react';
import { Navigation } from './components/Navigation/Navigation';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { FinalDestination } from './components/FinalDestination/FinalDestination';
import { LoveLetter } from './components/LoveLetter/LoveLetter';
import { WishSection } from './components/WishSection/WishSection';
import { FinalMessage } from './components/FinalMessage/FinalMessage';
import { Journey } from './components/Journey/Journey';
import { Footer } from './components/Footer/Footer';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StoryProvider, useStory } from './context/StoryContext';

const AppContent = () => {
  const { isExperienceUnlocked, setIntroState } = useStory();

  useEffect(() => {
    if (!isExperienceUnlocked) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
      // Move focus into the unlocked experience for keyboard/SR users.
      const el = document.getElementById('story-experience');
      if (el) {
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
        (el as HTMLElement).focus({ preventScroll: true });
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExperienceUnlocked]);

  // Keep the overflow-hidden intro gate escapable via keyboard.
  useEffect(() => {
    if (isExperienceUnlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIntroState('EXPERIENCE_UNLOCKED');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExperienceUnlocked, setIntroState]);

  return (
    <div className={`grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8] ${!isExperienceUnlocked ? 'overflow-hidden max-h-screen' : ''}`}>
      <Navigation />
      {/* Visible escape hatch: skip the locked intro at any time. */}
      {!isExperienceUnlocked && (
        <button
          type="button"
          onClick={() => setIntroState('EXPERIENCE_UNLOCKED')}
          aria-label="Skip intro and enter the experience"
          className="fixed bottom-6 left-6 z-[70] px-6 py-3 min-h-[44px] rounded-full bg-white/10 backdrop-blur-md border border-[#ffd6a5]/50 text-[#fffdf8] font-serif text-base tracking-wide transition-all hover:bg-white/20 hover:scale-105 active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] focus-visible:outline-offset-2"
        >
          Skip intro →
        </button>
      )}
      <main>
        {/* Interactive Heart Tree Experience (owns opening intro overlay & auto-growth journey) */}
        <CinematicExperience />

        {/* Locked sections: hidden from keyboard/AT until the intro unlocks. */}
        <div inert={!isExperienceUnlocked}>
          {/* The Final Destination: Where Love Takes Flight */}
          <FinalDestination />

          {/* User-Controlled Love Letter */}
          <LoveLetter />

          {/* Draggable Wish Release */}
          <WishSection />

          {/* Final Revealed Message */}
          <FinalMessage />

          {/* Complete Interactive Milestones Explorer */}
          <Journey />
        </div>
      </main>
      <Footer />
      <SoundToggle />
    </div>
  );
};

export const App = () => (
  <StoryProvider>
    <AppContent />
  </StoryProvider>
);

export default App;
