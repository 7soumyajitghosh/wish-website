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
  const [incomingScene, setIncomingScene] = useState<ExperienceScene | null>(null);
  const [announcement, setAnnouncement] = useState('Heart tree');
  const overlayRef = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(currentScene);
  sceneRef.current = currentScene;
  const isTransitioningRef = useRef(false);

  // Kill any in-flight overlay tween on unmount.
  useEffect(() => {
    return () => {
      if (overlayRef.current) gsap.killTweensOf(overlayRef.current);
      if (sweepRef.current) gsap.killTweensOf(sweepRef.current);
      if (stageRef.current) gsap.killTweensOf(stageRef.current);
      isTransitioningRef.current = false;
    };
  }, []);

  // Premium page-change transition (used for every scene change,
  // including Page 2 constellation → Page 3 love letter):
  // outgoing gently settles back (scale 1 → 1.035, blur 0 → 6px, fade),
  // a deep-plum veil with a warm light sweep wipes through via clip-path,
  // then the incoming scene resolves forward (blur → sharp, 1.035 → 1).
  // Opacity + transform + filter + clip only (GPU-friendly, no layout shift).
  const transitionTo = useCallback((nextScene: ExperienceScene) => {
    const overlay = overlayRef.current;
    const sweep = sweepRef.current;
    const stage = stageRef.current;
    if (isTransitioningRef.current) return;
    if (nextScene === sceneRef.current) return;
    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced motion or missing nodes: instant accessible swap, no flash.
    if (!overlay || !stage || reduced) {
      setCurrentScene(nextScene);
      setIncomingScene(null);
      setAnnouncement(SCENE_LABELS[nextScene]);
      return;
    }
    isTransitioningRef.current = true;
    gsap.killTweensOf([overlay, stage]);
    if (sweep) gsap.killTweensOf(sweep);

    // Block clicks during the passage; overlay has pointer-events:none by default.
    overlay.classList.add('is-active');
    // Keep the incoming scene pre-mounted underneath so there is never
    // an empty/white frame when the veil lifts.
    setIncomingScene(nextScene);

    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        setCurrentScene(nextScene);
        setIncomingScene(null);
        setAnnouncement(SCENE_LABELS[nextScene]);
        // Resolve: veil lifts with a soft upward wipe while the new
        // scene settles forward into focus.
        gsap.timeline({
          defaults: { overwrite: 'auto' },
          onComplete: () => {
            overlay.classList.remove('is-active');
            gsap.set(overlay, { opacity: 0, clipPath: 'inset(0 0 100% 0)' });
            gsap.set(stage, { opacity: 1, scale: 1, filter: 'blur(0px)', clearProps: 'filter' });
            if (sweep) gsap.set(sweep, { opacity: 0, xPercent: -120 });
            isTransitioningRef.current = false;
          },
        })
          .to(stage, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.7, ease: 'power3.out' }, 0)
          .to(overlay, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'power3.inOut' }, 0)
          .to(overlay, { opacity: 0, duration: 0.45, ease: 'power2.out' }, 0.45);
      },
    });

    // Phase 1 — settle the outgoing scene back + draw the veil down.
    tl.set(overlay, { clipPath: 'inset(0 0 0% 0)', opacity: 0 })
      .set(stage, { transformOrigin: '50% 55%' })
      .to(stage, { opacity: 0.55, scale: 1.035, filter: 'blur(6px)', duration: 0.55, ease: 'power2.in' }, 0)
      .to(overlay, { opacity: 1, duration: 0.55, ease: 'power2.inOut' }, 0);
    // Warm light sweep travels with the veil (purely decorative).
    if (sweep) {
      tl.set(sweep, { opacity: 0.85, xPercent: -120 }, 0).to(
        sweep,
        { xPercent: 120, duration: 0.9, ease: 'power2.inOut' },
        0
      );
    }
  }, []);

  const renderScene = (scene: ExperienceScene, hidden: boolean) => (
    <div
      key={scene}
      aria-hidden={hidden}
      style={{
        position: 'absolute',
        inset: 0,
        visibility: hidden ? 'hidden' : 'visible',
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      {scene === 'heartTree' && (
        <HeartTreeScene onComplete={() => transitionTo('constellation')} />
      )}
      {scene === 'constellation' && (
        <ConstellationScene onComplete={() => transitionTo('loveLetter')} />
      )}
      {scene === 'loveLetter' && (
        <LoveLetterScene onComplete={() => transitionTo('flower')} />
      )}
      {scene === 'flower' && (
        <FlowerScene onComplete={() => transitionTo('wish')} />
      )}
      {scene === 'wish' && <WishScene />}
    </div>
  );

  return (
    <div className="love-experience-root">
      {/* Screen-reader announcements for cinematic scene changes */}
      <div className="sr-only" aria-live="polite">
        Now showing: {announcement}
      </div>
      {/* Active Scene — single transforming stage so outgoing/incoming share
          one continuous scale/blur passage (no white flash, no layout shift) */}
      <div ref={stageRef} className="love-experience-stage" style={{ willChange: 'transform, opacity, filter' }}>
        {renderScene(currentScene, false)}
        {incomingScene && incomingScene !== currentScene && renderScene(incomingScene, true)}
      </div>

      {/* Cinematic Transition Overlay — deep-plum veil + warm light sweep.
          Clip-path wipe owns the passage; opacity only softens edges. */}
      <div ref={overlayRef} className="cinematic-transition-overlay" aria-hidden="true">
        <div ref={sweepRef} className="cinematic-transition-sweep" aria-hidden="true" />
      </div>
    </div>
  );
};

export default LoveExperience;
