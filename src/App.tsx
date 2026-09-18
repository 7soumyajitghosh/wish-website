import { Navigation } from './components/Navigation/Navigation';
import { Hero } from './components/Hero/Hero';
import { Journey } from './components/Journey/Journey';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { FullBloom } from './components/FullBloom/FullBloom';
import { FinalDestination } from './components/FinalDestination/FinalDestination';
import { LoveLetter } from './components/LoveLetter/LoveLetter';
import { WishSection } from './components/WishSection/WishSection';
import { FinalMessage } from './components/FinalMessage/FinalMessage';
import { Footer } from './components/Footer/Footer';
import { SoundToggle } from './components/SoundToggle/SoundToggle';

export const App = () => (
  <div className="grain-overlay">
    <Navigation />
    <main>
      <Hero />
      <Journey />
      <CinematicExperience />
      <FullBloom />
      <FinalDestination />
      <LoveLetter />
      <WishSection />
      <FinalMessage />
    </main>
    <Footer />
    <SoundToggle />
  </div>
);

export default App;
