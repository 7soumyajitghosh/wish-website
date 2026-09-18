import { Navigation } from './components/Navigation/Navigation';
import { Hero } from './components/Hero/Hero';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { FinalDestination } from './components/FinalDestination/FinalDestination';
import { LoveLetter } from './components/LoveLetter/LoveLetter';
import { WishSection } from './components/WishSection/WishSection';
import { FinalMessage } from './components/FinalMessage/FinalMessage';
import { Journey } from './components/Journey/Journey';
import { Footer } from './components/Footer/Footer';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StoryProvider } from './context/StoryContext';

export const App = () => (
  <StoryProvider>
    <div className="grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8]">
      <Navigation />
      <main>
        {/* 1. Cinematic Opening */}
        <Hero />

        {/* 2. Interactive Heart Tree Experience (Scroll, Direct Tree Interactions, Let it Bloom, Release Hearts) */}
        <CinematicExperience />

        {/* 3. The Final Destination: Where Love Takes Flight */}
        <FinalDestination />

        {/* 4. User-Controlled Love Letter */}
        <LoveLetter />

        {/* 5. Draggable Wish Release */}
        <WishSection />

        {/* 6. Final Revealed Message */}
        <FinalMessage />

        {/* 7. Complete Interactive Milestones Explorer */}
        <Journey />
      </main>
      <Footer />
      <SoundToggle />
    </div>
  </StoryProvider>
);

export default App;
