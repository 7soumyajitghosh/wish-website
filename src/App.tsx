import { useCallback, useEffect, useRef, useState, Component, type ReactNode, lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation/Navigation';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { Footer } from './components/Footer/Footer';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StoryProvider, useStory } from './context/StoryContext';
import { CursorGlow } from './components/Effects/CursorGlow';
import { Marquee } from './components/Effects/Marquee';
import { scrollToIdWhenReady } from './utils/storyNav';

// Dev-only storm stage (?stormlab): lazy so it never ships in the prod
// initial bundle — the chunk loads only when the query param is present.
const StormLab = lazy(() =>
  import('./components/Debug/StormLab').then((m) => ({ default: m.StormLab }))
);

// Below-fold sections are code-split: the intro (CinematicExperience) stays
// in the initial bundle while the story sections load in parallel chunks.
// This keeps the initial JS small (was a single 420kB bundle).
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

/** Isolates a crashing section so the rest of the story stays readable.
 *  Logs the failure and offers a retry (transient chunk errors recover). */
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

/** Reserved-height skeleton so lazy chunks don't pop layout (no CLS). */
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

const AppContent = () => {
  const { isExperienceUnlocked, setIntroState, pendingTarget, setPendingTarget } = useStory();
  // Landing intro lives only for the intro experience. Once the leaf
  // transition finishes (signalled via onTransitionComplete), the entire
  // CinematicExperience is unmounted — never merely hidden.
  const [introAlive, setIntroAlive] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setIntroAlive(false);
  }, []);

  // Scroll gate preserves the original cinematic timing: body scroll unlocks
  // the moment the black fade covers the cut so the programmatic jump to
  // #destination under cover works exactly as designed. Interaction (keyboard
  // / AT via inert, buttons via disabled, canvas via pointer-events-none)
  // stays locked until the landing page is destroyed (introAlive false).
  const scrollLocked = !isExperienceUnlocked;

  useEffect(() => {
    if (scrollLocked) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [scrollLocked]);

  // Focus moves to the new page only after the old landing page is gone.
  // During the covered leaf transition we deliberately do not steal focus.
  // A nav link clicked while locked stashes its target in pendingTarget;
  // scrolling here (after unmount) lands correctly since the 100vh intro
  // is already out of the layout. Scrolling earlier would be off by exactly
  // the removed intro height.
  // Runs once per unlock: the consumed flag prevents the pendingTarget=null
  // clearing pass from re-triggering a scroll-to-top over the target section.
  // Single-scroll contract: CinematicExperience never scrolls mid-transition,
  // so this is the ONLY programmatic scroll after the storm — one jump, no
  // double. Below-fold sections are code-split, so we retry a few frames
  // until the target element exists before scrolling/focusing.
  // Below-fold sections are code-split, so we wait (cancellable) until the
  // target element exists before scrolling/focusing — up to 4s on slow
  // networks instead of wrongly falling back to scroll-to-top.
  const hasScrolledRef = useRef(false);
  const scrollCancelRef = useRef<(() => void) | null>(null);
  useEffect(() => () => scrollCancelRef.current?.(), []);
  useEffect(() => {
    if (!isExperienceUnlocked || introAlive) return;
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;

    const consumeTarget = pendingTarget;
    if (consumeTarget) setPendingTarget(null);

    const targetId =
      !consumeTarget || consumeTarget === 'top' || consumeTarget === '#story-experience'
        ? 'destination'
        : consumeTarget.replace(/^#/, '');

    scrollCancelRef.current = scrollToIdWhenReady(targetId, { timeoutMs: 4000 });
  }, [isExperienceUnlocked, introAlive, pendingTarget, setPendingTarget]);

  // Keep the overflow-hidden intro gate escapable via keyboard.
  useEffect(() => {
    if (isExperienceUnlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIntroState('EXPERIENCE_UNLOCKED');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isExperienceUnlocked, setIntroState]);

  // Query-param check runs once (never during render).
  const [isStormLab] = useState(
    () =>
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('stormlab')
  );

  return (
    <div className={`grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8] ${scrollLocked ? 'overflow-hidden max-h-screen' : ''}`}>
      {/* TEMPORARY dev-only storm test-stage (?stormlab). Removed before ship. */}
      {isStormLab ? (
        <Suspense fallback={<SectionSkeleton label="Loading storm stage" />}>
          <StormLab />
        </Suspense>
      ) : (
      <>
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
      {/* Single h1 for the whole page — the destination headline renders it visually. */}
      <h1 className="sr-only">Where Love Takes Flight — A Journey of Love</h1>
      <CursorGlow />
      <Navigation />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        {/* Intro landing lives only for the intro experience. After the leaf
            transition completes it is fully unmounted (not hidden). */}
        {introAlive && (
          <SectionErrorBoundary label="intro">
            <CinematicExperience onTransitionComplete={handleIntroComplete} />
          </SectionErrorBoundary>
        )}

        {/* Locked sections: hidden from keyboard/AT until the intro unlocks
            AND the landing page is destroyed. */}
        <div inert={!isExperienceUnlocked || introAlive ? true : undefined}>
          <Suspense fallback={<SectionSkeleton label="Loading the story" />}>
            {/* The Final Destination: Where Love Takes Flight */}
            <SectionErrorBoundary label="destination">
              <FinalDestination />
            </SectionErrorBoundary>

            <StoryDivider label="and the story continues…" />

            {/* User-Controlled Love Letter */}
            <SectionErrorBoundary label="love-letter">
              <LoveLetter />
            </SectionErrorBoundary>

            <Marquee words={['love letters', 'slow moments', 'starlit wishes', 'forever']} />

            {/* Draggable Wish Release */}
            <SectionErrorBoundary label="make-a-wish">
              <WishSection />
            </SectionErrorBoundary>

            <StoryDivider label="sealed with love" />

            {/* Final Revealed Message */}
            <SectionErrorBoundary label="final-message">
              <FinalMessage />
            </SectionErrorBoundary>

            <Marquee words={['full bloom', 'hearts in flight', 'where love lands', 'always']} />

            <StoryDivider label="play a little" />

            {/* Games & puzzles playground */}
            <SectionErrorBoundary label="playground">
              <Playground />
            </SectionErrorBoundary>

            <StoryDivider />

            {/* Complete Interactive Milestones Explorer */}
            <SectionErrorBoundary label="journey">
              <Journey />
            </SectionErrorBoundary>
          </Suspense>
        </div>
      </main>
      <Footer />
      <SoundToggle />
      </>
      )}
    </div>
  );
};

export const App = () => (
  <StoryProvider>
    <AppContent />
  </StoryProvider>
);

export default App;
