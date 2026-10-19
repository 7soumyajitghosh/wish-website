import { useCallback, useState, Component, type ReactNode, lazy, Suspense } from 'react';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StoryProvider, useStory } from './context/StoryContext';
import { CursorGlow } from './components/Effects/CursorGlow';
import { Navigation } from './components/Navigation/Navigation';
import { Footer } from './components/Footer/Footer';
import { Marquee } from './components/Effects/Marquee';
import { scrollToIdWhenReady } from './utils/storyNav';

// Lazy-loaded sections only loaded if explicitly requested (?full=true or ?stormlab)
const StormLab = lazy(() =>
  import('./components/Debug/StormLab').then((m) => ({ default: m.StormLab }))
);
const FinalDestination = lazy(() =>
  import('./components/FinalDestination/FinalDestination').then((m) => ({ default: m.FinalDestination }))
);
const LoveLetter = lazy(() =>
  import('./components/LoveLetter/LoveLetter').then((m) => ({ default: m.LoveLetter }))
);
const WishSection = lazy(() =>
  import('./components/WishSection/WishSection').then((m) => ({ default: m.WishSection }))
);
const FinalMessage = lazy(() =>
  import('./components/FinalMessage/FinalMessage').then((m) => ({ default: m.FinalMessage }))
);
const Journey = lazy(() =>
  import('./components/Journey/Journey').then((m) => ({ default: m.Journey }))
);
const Playground = lazy(() =>
  import('./components/Playground/Playground').then((m) => ({ default: m.Playground }))
);

class SectionErrorBoundary extends Component<
  { children: ReactNode; label?: string },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[SectionErrorBoundary]', this.props.label ?? 'section', error);
  }
  private handleRetry = () => {
    this.setState({ failed: false });
  };
  render() {
    if (this.state.failed) {
      return (
        <section className="section container-prose text-center" aria-label="Experience unavailable">
          <p className="font-serif italic text-lg text-[#f5baa4]">
            This moment could not load — please try again or scroll on to continue the story.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn-ghost btn-sm mt-4 font-serif cursor-pointer"
          >
            Try again
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

const SectionSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div
    aria-hidden="true"
    className="flex min-h-[60vh] items-center justify-center"
  >
    <div className="flex flex-col items-center gap-4 opacity-60">
      <div className="h-10 w-10 animate-pulse rounded-full bg-[#d81b46]/30" />
      <span className="font-serif italic text-sm text-[#f5baa4]">{label}…</span>
    </div>
  </div>
);

const StoryDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div aria-hidden="true" className="relative mx-auto w-full max-w-4xl px-4 sm:px-6">
    <div className="flex items-center gap-3 sm:gap-4 opacity-70">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ffb3c1]/40 to-[#ffb3c1]/40" />
      {label ? (
        <span className="font-serif italic text-xs sm:text-sm text-[#f5baa4] whitespace-nowrap">{label}</span>
      ) : (
        <svg className="h-3.5 w-3.5 text-[#ffb3c1]/80" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      )}
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#ffb3c1]/40 to-[#ffb3c1]/40" />
    </div>
  </div>
);

/**
 * Dedicated Cinematic Experience & Tree standalone view.
 * Kept mounted permanently on localhost without unmounting or auto-scrolling away.
 */
const CinematicOnlyView: React.FC = () => {
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = useCallback(() => {
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <div className="grain-overlay relative min-h-screen h-[100svh] w-screen overflow-hidden bg-[#0d0408] text-[#fffdf8]">
      <h1 className="sr-only">Cinematic Experience & Tree</h1>
      <CursorGlow />

      <main className="w-full h-full relative" id="main-content" tabIndex={-1}>
        <SectionErrorBoundary label="cinematic-tree">
          <CinematicExperience key={replayKey} />
        </SectionErrorBoundary>
      </main>

      {/* Floating replay button to re-experience the tree growth anytime */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={handleReplay}
          className="px-3.5 py-1.5 rounded-full bg-[#1a0812]/80 hover:bg-[#2b0d1e]/90 text-xs font-serif text-[#f5baa4] border border-[#ffb3c1]/30 backdrop-blur-md shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#ffd6a5]"
          title="Replay Tree Growth & Cinematic Experience"
        >
          <svg className="w-3.5 h-3.5 text-[#ffb3c1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Replay Tree</span>
        </button>
      </div>

      <SoundToggle />
    </div>
  );
};

/** Full website view (accessible via ?full=true) */
const FullWebsiteView: React.FC = () => {
  const { isExperienceUnlocked, setIntroState, setPendingTarget } = useStory();
  const [introAlive, setIntroAlive] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setIntroAlive(false);
  }, []);

  return (
    <div className="grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8]">
      <a
        href="#destination"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          if (!isExperienceUnlocked || introAlive) {
            setPendingTarget('#destination');
            setIntroState('EXPERIENCE_UNLOCKED');
          } else {
            scrollToIdWhenReady('destination', { timeoutMs: 4000 });
          }
        }}
      >
        Skip to story
      </a>
      <h1 className="sr-only">Where Love Takes Flight — A Journey of Love</h1>
      <CursorGlow />
      <Navigation />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {introAlive && (
          <SectionErrorBoundary label="intro">
            <CinematicExperience onTransitionComplete={handleIntroComplete} />
          </SectionErrorBoundary>
        )}

        <div className="editorial-ui" inert={!isExperienceUnlocked || introAlive ? true : undefined}>
          <Suspense fallback={<SectionSkeleton label="Loading the story" />}>
            <SectionErrorBoundary label="destination">
              <FinalDestination />
            </SectionErrorBoundary>

            <StoryDivider label="and the story continues…" />

            <SectionErrorBoundary label="love-letter">
              <LoveLetter />
            </SectionErrorBoundary>

            <Marquee words={['love letters', 'slow moments', 'starlit wishes', 'forever']} />

            <SectionErrorBoundary label="make-a-wish">
              <WishSection />
            </SectionErrorBoundary>

            <StoryDivider label="sealed with love" />

            <SectionErrorBoundary label="final-message">
              <FinalMessage />
            </SectionErrorBoundary>

            <Marquee words={['full bloom', 'hearts in flight', 'where love lands', 'always']} />

            <StoryDivider label="play a little" />

            <SectionErrorBoundary label="playground">
              <Playground />
            </SectionErrorBoundary>

            <StoryDivider />

            <SectionErrorBoundary label="journey">
              <Journey />
            </SectionErrorBoundary>
          </Suspense>
        </div>
      </main>
      <Footer />
      <SoundToggle />
    </div>
  );
};

export const App = () => {
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const isStormLab = search.includes('stormlab');
  const isFull = search.includes('full');

  return (
    <StoryProvider>
      {isStormLab ? (
        <Suspense fallback={<SectionSkeleton label="Loading storm stage" />}>
          <StormLab />
        </Suspense>
      ) : isFull ? (
        <FullWebsiteView />
      ) : (
        <CinematicOnlyView />
      )}
    </StoryProvider>
  );
};

export default App;
