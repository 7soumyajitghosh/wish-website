import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * LightTransition — premium cinematic page transition (fade through light +
 * expanding glow + soft blur + particle dissolve) into website content.
 * Plays once when `play` becomes true, then calls onDone.
 */
export const LightTransition: React.FC<{
  play: boolean;
  onDone?: () => void;
}> = ({ play, onDone }) => {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!play) return;
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
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => doneRef.current?.(),
    });
    tl.set(el, { display: 'block', opacity: 0 })
      .to(el, { opacity: 1, duration: 0.5, ease: 'power2.out' })
      .fromTo(
        glow,
        { scale: 0.4, opacity: 0.4 },
        { scale: 2.6, opacity: 1, duration: 1.4, ease: 'power2.inOut' },
        0.1
      )
      .to(el, { opacity: 0, duration: 0.9, ease: 'power2.inOut' }, '-=0.35')
      .set(el, { display: 'none' });
    return () => {
      tl.kill();
    };
  }, [play]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[80] hidden bg-[#fff8eb]"
      style={{ opacity: 0 }}
    >
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(255,214,165,0.95) 0%, rgba(255,179,193,0.75) 40%, rgba(255,248,235,0.4) 65%, transparent 75%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
};

export default LightTransition;
