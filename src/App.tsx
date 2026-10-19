import { useCallback, useState, Component, type ReactNode, lazy, Suspense } from 'react';
import { HomePage } from './pages/HomePage';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StoryProvider, useStory } from './context/StoryContext';
import { Navigation } from './components/Navigation/Navigation';
import { Footer } from './components/Footer/Footer';
import { Marquee } from './components/Effects/Marquee';
import { scrollToIdWhenReady } from './utils/storyNav';

// Lazy-loaded story sections: not part of the initial bundle, so the
// intro (HomePage) paints fast and the rest streams in behind a skeleton.
const StormLab = lazy(() =>
  import('./components/Debug/StormLab').then((m) => ({ default: m.StormLab }))
);
const DestinationPage = lazy(() =>
  import('./pages/DestinationPage').then((m) => ({ default: m.DestinationPage }))
);
const LoveLetterPage = lazy(() =>
  import('./pages/LoveLetterPage').then((m) => ({ default: m.LoveLetterPage }))
);
const WishPage = lazy(() =>
  import('./pages/WishPage').then((m) => ({ default: m.WishPage }))
);
const FinalMessagePage = lazy(() =>
  import('./pages/FinalMessagePage').then((m) => ({ default: m.FinalMessagePage }))
);
const JourneyPage = lazy(() =>
  import('./pages/JourneyPage').then((m) => ({ default: m.JourneyPage }))
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
  return (
    <div className="grain-overlay relative min-h-screen h-[100svh] w-screen overflow-hidden bg-[#0d0408] text-[#fffdf8]">
      <h1 className="sr-only">Cinematic Experience & Tree</h1>

      <main className="w-full h-full relative" id="main-content" tabIndex={-1}>
        <SectionErrorBoundary label="cinematic-tree">
          <HomePage />
        </SectionErrorBoundary>
      </main>

      <SoundToggle />
    </div>
  );
};

/** Full website view — the default route (`/`). */
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
      <Navigation />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {introAlive && (
          <SectionErrorBoundary label="intro">
            <HomePage onTransitionComplete={handleIntroComplete} />
          </SectionErrorBoundary>
        )}

        <div className="editorial-ui" inert={!isExperienceUnlocked || introAlive ? true : undefined}>
          <Suspense fallback={<SectionSkeleton label="Loading the story" />}>
            <SectionErrorBoundary label="destination">
              <DestinationPage />
            </SectionErrorBoundary>

            <StoryDivider label="and the story continues…" />

            <SectionErrorBoundary label="love-letter">
              <LoveLetterPage />
            </SectionErrorBoundary>

            <Marquee words={['love letters', 'slow moments', 'starlit wishes', 'forever']} />

            <SectionErrorBoundary label="make-a-wish">
              <WishPage />
            </SectionErrorBoundary>

            <StoryDivider label="sealed with love" />

            <SectionErrorBoundary label="final-message">
              <FinalMessagePage />
            </SectionErrorBoundary>

            <Marquee words={['full bloom', 'hearts in flight', 'where love lands', 'always']} />

            <StoryDivider label="play a little" />

            <SectionErrorBoundary label="playground">
              <Playground />
            </SectionErrorBoundary>

            <StoryDivider />

            <SectionErrorBoundary label="journey">
              <JourneyPage />
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
  // Routing is query-param based (the site is a single page driven by hash
  // anchors, so no client-side router and no Vercel rewrite rules are needed).
  //   ?stormlab  -> storm debug stage
  //   ?cinematic -> tree-only view
  //   (default)  -> full website, so `/` shows the whole story on deploy
  const isStormLab = search.includes('stormlab');
  const isCinematicOnly = search.includes('cinematic');

  return (
    <StoryProvider>
      {isStormLab ? (
        <Suspense fallback={<SectionSkeleton label="Loading storm stage" />}>
          <StormLab />
        </Suspense>
      ) : isCinematicOnly ? (
        <CinematicOnlyView />
      ) : (
        <FullWebsiteView />
      )}
    </StoryProvider>
  );
};

export default App;
