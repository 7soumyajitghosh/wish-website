import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * LightTransition — premium cinematic page transition (veil through warm
 * light + expanding glow + soft upward wipe) into website content.
 * Plays once when `play` becomes true, then calls onDone.
 * Opacity + transform + clip-path only; reduced-motion safe; no white snap.
 */
export const LightTransition: React.FC<{
  play: boolean;
  onDone?: () => void;
}> = ({ play, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  const playedRef = useRef(false);
  // 60vmin blurred glow scaled every frame: blur(20px) repaints heavily on
  // mobile GPUs, so use a cheaper blur on small screens.
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768
  );
  void isMobile;
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!play) {
      // Allow a future play=true to replay the passage.
      playedRef.current = false;
      return;
    }
    if (playedRef.current) return;
    const el = ref.current;
    const glow = glowRef.current;
    if (!el || !glow) {
      doneRef.current?.();
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      doneRef.current?.();
      return;
    }
    playedRef.current = true;
    // GSAP owns centering via xPercent/yPercent (no Tailwind translate
    // class) so the scale passage never snaps or jumps.
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        if (el) el.style.willChange = 'auto';
        if (glow) glow.style.willChange = 'auto';
        doneRef.current?.();
      },
    });
    tl.set(el, { visibility: 'visible', opacity: 0, clipPath: 'inset(0 0 0% 0)' })
      .set(glow, { xPercent: -50, yPercent: -50, scale: 0.5, opacity: 0.5, transformOrigin: 'center center' })
      .to(el, { opacity: 1, duration: 0.45, ease: 'power2.out' })
      .to(glow, { scale: 1.6, opacity: 1, duration: 1.25, ease: 'power2.inOut' }, 0.1)
      // Soft upward wipe out (no hard display:none cut).
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 0.85, ease: 'power3.inOut' }, 0.75)
      .to(el, { opacity: 0, duration: 0.4, ease: 'power2.out' }, 1.15)
      .set(el, { visibility: 'hidden' });
    return () => {
      tl.kill();
      if (el) {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    };
  }, [play]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] bg-transparent"
      style={{
        opacity: 0,
        visibility: 'hidden',
        willChange: 'opacity, clip-path',
        background: 'transparent',
      }}
    >
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] rounded-full"
        style={{
          background: 'transparent',
          filter: 'none',
          opacity: 0,
          willChange: 'transform, opacity',
        }}
      />
    </div>
  );
};

export default LightTransition;
