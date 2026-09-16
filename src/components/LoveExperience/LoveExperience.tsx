import React, { useState, useCallback, useRef } from 'react';
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

export const LoveExperience: React.FC = () => {
  const [currentScene, setCurrentScene] = useState<ExperienceScene>('heartTree');
  const overlayRef = useRef<HTMLDivElement>(null);

  // Smooth cinematic crossfade between scenes
  const transitionTo = useCallback((nextScene: ExperienceScene) => {
    const overlay = overlayRef.current;
    if (!overlay) {
      setCurrentScene(nextScene);
      return;
    }

    // Fade to black/deep plum overlay
    gsap.to(overlay, {
      opacity: 1,
      duration: 0.9,
      ease: 'power2.inOut',
      onComplete: () => {
        setCurrentScene(nextScene);
        // Fade overlay out
        gsap.to(overlay, {
          opacity: 0,
          duration: 1.1,
          ease: 'power2.inOut',
        });
      },
    });
  }, []);

  return (
    <div className="love-experience-root">
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
