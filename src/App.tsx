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
import { CursorGlow } from './components/Effects/CursorGlow';
import { Marquee } from './components/Effects/Marquee';

const StoryDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div aria-hidden="true" className="relative mx-auto w-full max-w-4xl px-6">
    <div className="flex items-center gap-4 opacity-70">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ffb3c1]/40 to-[#ffb3c1]/40" />
      {label ? (
        <span className="font-serif italic text-sm text-[#f5baa4]/80">{label}</span>
      ) : (
        <svg className="h-3.5 w-3.5 text-[#ffb3c1]/60" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#ffb3c1]/40 to-[#ffb3c1]/40" />
    </div>
  </div>
);

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
      <CursorGlow />
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

          <StoryDivider label="and the story continues…" />

          {/* User-Controlled Love Letter */}
          <LoveLetter />

          <Marquee words={['love letters', 'slow moments', 'starlit wishes', 'forever']} />

          {/* Draggable Wish Release */}
          <WishSection />

          <StoryDivider label="sealed with love" />

          {/* Final Revealed Message */}
          <FinalMessage />

          <Marquee words={['full bloom', 'hearts in flight', 'where love lands', 'always']} />

          <StoryDivider />

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
