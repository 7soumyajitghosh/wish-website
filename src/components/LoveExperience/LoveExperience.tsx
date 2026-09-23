import React, { useState, useCallback, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { HeartTreeScene } from './scenes/HeartTreeScene';
import { ConstellationScene } from './scenes/ConstellationScene';
import { LoveLetterScene } from './scenes/LoveLetterScene';
import { FlowerScene } from './scenes/FlowerScene';
import { WishScene } from './scenes/WishScene';
import './LoveExperience.css';

export type ExperienceScene =
  | 'heartTree'
  | 'constellation'
  | 'loveLetter'
  | 'flower'
  | 'wish';

const SCENE_LABELS: Record<ExperienceScene, string> = {
  heartTree: 'Heart tree',
  constellation: 'Constellation',
  loveLetter: 'Love letter',
  flower: 'Flower bloom',
  wish: 'Make a wish',
};

export const LoveExperience: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<ExperienceScene>('heartTree');
  const [announcement, setAnnouncement] = useState('Heart tree');
  const overlayRef = useRef<HTMLDivElement>(null);
  const isTransitioningRef = useRef(false);

  // Kill any in-flight overlay tween on unmount.
  useEffect(() => {
    return () => {
      if (overlayRef.current) gsap.killTweensOf(overlayRef.current);
      isTransitioningRef.current = false;
    };
  }, []);

  // Smooth cinematic crossfade between scenes
  const transitionTo = useCallback((nextScene: ExperienceScene) => {
    const overlay = overlayRef.current;
    if (!overlay) {
      setCurrentScene(nextScene);
      setAnnouncement(SCENE_LABELS[nextScene]);
      return;
    }
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    gsap.killTweensOf(overlay);
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Block clicks during the fade; overlay has pointer-events:none by default.
    overlay.classList.add('is-active');
    // Fade to black/deep plum overlay
    gsap.to(overlay, {
      opacity: 1,
      duration: reduced ? 0 : 0.9,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onComplete: () => {
        setCurrentScene(nextScene);
        setAnnouncement(SCENE_LABELS[nextScene]);
        // Fade overlay out
        gsap.to(overlay, {
          opacity: 0,
          duration: reduced ? 0 : 1.1,
          ease: 'power2.inOut',
          overwrite: 'auto',
          onComplete: () => {
            overlay.classList.remove('is-active');
            isTransitioningRef.current = false;
          },
        });
      },
    });
  }, []);

  return (
    <div className="love-experience-root">
      {/* Screen-reader announcements for cinematic scene changes */}
      <div className="sr-only" aria-live="polite">
        Now showing: {announcement}
      </div>
      {/* Active Scene */}
      <div className="love-experience-stage">
        {currentScene === 'heartTree' && (
          <HeartTreeScene onComplete={() => transitionTo('constellation')} />
        )}
        {currentScene === 'constellation' && (
          <ConstellationScene onComplete={() => transitionTo('loveLetter')} />
        )}
        {currentScene === 'loveLetter' && (
          <LoveLetterScene onComplete={() => transitionTo('flower')} />
        )}
        {currentScene === 'flower' && (
          <FlowerScene onComplete={() => transitionTo('wish')} />
        )}
        {currentScene === 'wish' && <WishScene />}
      </div>

      {/* Cinematic Transition Overlay */}
      <div ref={overlayRef} className="cinematic-transition-overlay" />
    </div>
  );
};

export default LoveExperience;
