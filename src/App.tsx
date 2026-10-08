import { useCallback, useEffect, useRef, useState, Component, type ReactNode, lazy, Suspense } from 'react';
import { Navigation } from './components/Navigation/Navigation';
import { CinematicExperience } from './components/CinematicExperience/CinematicExperience';
import { Footer } from './components/Footer/Footer';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { StormLab } from './components/Debug/StormLab';
import { StoryProvider, useStory } from './context/StoryContext';
import { CursorGlow } from './components/Effects/CursorGlow';
import { Marquee } from './components/Effects/Marquee';

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

/** Isolates a crashing cinematic canvas so the story stays readable. */
class SectionErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return (
        <section className="section container-prose text-center" aria-label="Experience unavailable">
          <p className="font-serif italic text-lg text-[#f5baa4]">
            The cinematic moment could not load — please scroll on to continue the story.
          </p>
        </section>
      );
    }
    return this.props.children;
  }
}

const StoryDivider: React.FC<{ label?: string }> = ({ label }) => (
  <div aria-hidden="true" className="relative mx-auto w-full max-w-4xl px-6">
    <div className="flex items-center gap-4 opacity-70">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#ffb3c1]/40 to-[#ffb3c1]/40" />
      {label ? (
        <span className="font-serif italic text-sm text-[#f5baa4]">{label}</span>
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
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (!isExperienceUnlocked || introAlive) return;
    if (hasScrolledRef.current) return;
    hasScrolledRef.current = true;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduced ? 'auto' : 'smooth';

    const consumeTarget = pendingTarget;
    if (consumeTarget) setPendingTarget(null);

    const targetId =
      !consumeTarget || consumeTarget === 'top' || consumeTarget === '#story-experience'
        ? 'destination'
        : consumeTarget.replace(/^#/, '');

    const scrollAndFocus = (el: Element | null) => {
      if (el) el.scrollIntoView({ behavior });
      else window.scrollTo(0, 0);
      const focusEl = (el ?? document.getElementById('destination')) as HTMLElement | null;
      if (focusEl) {
        if (!focusEl.hasAttribute('tabindex')) focusEl.setAttribute('tabindex', '-1');
        focusEl.focus({ preventScroll: true });
      }
    };

    // Two rAFs let the unmounted layout settle; then wait for the lazy chunk.
    let attempts = 0;
    let raf1 = 0;
    let raf2 = 0;
    const tryScroll = () => {
      const el = document.getElementById(targetId) ?? document.querySelector(`#${CSS.escape(targetId)}`);
      if (el || attempts >= 10) {
        scrollAndFocus(el);
        return;
      }
      attempts += 1;
      requestAnimationFrame(tryScroll);
    };
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(tryScroll);
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
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

  return (
    <div className={`grain-overlay min-h-screen bg-[#0d0408] text-[#fffdf8] ${scrollLocked ? 'overflow-hidden max-h-screen' : ''}`}>
      {/* TEMPORARY dev-only storm test-stage (?stormlab). Removed before ship. */}
      {typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stormlab') ? (
        <StormLab />
      ) : (
      <>
      <a href="#main-content" className="skip-link">
        Skip to story
      </a>
      {/* Single h1 for the whole page — the destination headline renders it visually. */}
      <h1 className="sr-only">Where Love Takes Flight — A Journey of Love</h1>
      <CursorGlow />
      <Navigation />
      <main id="main-content">
        {/* Intro landing lives only for the intro experience. After the leaf
            transition completes it is fully unmounted (not hidden). */}
        {introAlive && (
          <SectionErrorBoundary>
            <CinematicExperience onTransitionComplete={handleIntroComplete} />
          </SectionErrorBoundary>
        )}

        {/* Locked sections: hidden from keyboard/AT until the intro unlocks
            AND the landing page is destroyed. */}
        <div inert={!isExperienceUnlocked || introAlive}>
          <Suspense fallback={null}>
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

            <StoryDivider label="play a little" />

            {/* Games & puzzles playground */}
            <Playground />

            <StoryDivider />

            {/* Complete Interactive Milestones Explorer */}
            <Journey />
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
