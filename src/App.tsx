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
  const { isExperienceUnlocked } = useStory();

  useEffect(() => {
    if (!isExperienceUnlocked) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isExperienceUnlocked]);

  return (
    <div className={`grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8] ${!isExperienceUnlocked ? 'overflow-hidden max-h-screen' : ''}`}>
      <Navigation />
      <main>
        {/* Interactive Heart Tree Experience (owns opening intro overlay & auto-growth journey) */}
        <CinematicExperience />

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
