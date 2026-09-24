import React from 'react';

/** Cinematic letterbox bars — film feel during the intro/auto-growth. */
export const CinematicBars: React.FC<{ visible: boolean }> = ({ visible }) => (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-black transition-all duration-1000"
      style={{ height: visible ? '7vh' : '0vh', opacity: visible ? 1 : 0 }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-black transition-all duration-1000"
      style={{ height: visible ? '7vh' : '0vh', opacity: visible ? 1 : 0 }}
    />
  </>
);

/** Chapter caption — automatic cinematic subtitle for the current beat. */
export const SceneCaption: React.FC<{ kicker: string; title: string }> = ({ kicker, title }) => (
  <div className="pointer-events-none absolute left-1/2 top-[11%] z-30 -translate-x-1/2 text-center px-6">
    <p className="font-sans text-[11px] font-medium uppercase tracking-[0.4em] text-[#f5baa4]/80">
      {kicker}
    </p>
    <p className="mt-1 font-serif italic text-[#fffdf8]/95 text-lg md:text-xl drop-shadow-[0_0_16px_rgba(255,179,193,0.45)]">
      {title}
    </p>
  </div>
);

export default CinematicBars;
