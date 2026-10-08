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
  // Viewport-dependent value lives in state (not read during render).
  const [glowBlur, setGlowBlur] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 768 ? 8 : 20
  );
  useEffect(() => {
    const onResize = () => setGlowBlur(window.innerWidth <= 768 ? 8 : 20);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
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
    };
  }, [play]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] bg-[#fff8eb]"
      style={{
        opacity: 0,
        visibility: 'hidden',
        willChange: 'opacity, clip-path',
        background:
          'radial-gradient(ellipse at 50% 45%, #fff8eb 0%, #ffd6a5 45%, #ffb3c1 70%, #220b17 100%)',
      }}
    >
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,214,165,0.95) 0%, rgba(255,179,193,0.75) 40%, rgba(255,248,235,0.4) 65%, transparent 75%)',
          filter: `blur(${glowBlur}px)`,
          willChange: 'transform, opacity',
        }}
      />
    </div>
  );
};

export default LightTransition;
