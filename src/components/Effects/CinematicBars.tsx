import React from 'react';

/** Cinematic letterbox bars — film feel during the intro/auto-growth. */
export const CinematicBars: React.FC<{ visible: boolean }> = ({ visible }) => (
  <>
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 origin-top bg-black transition-transform transition-opacity duration-1000 ease-out motion-reduce:transition-none motion-reduce:transform-none h-[5vh] md:h-[7vh]"
      style={{ transform: visible ? 'scaleY(1)' : 'scaleY(0)', opacity: visible ? 1 : 0 }}
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 origin-bottom bg-black transition-transform transition-opacity duration-1000 ease-out motion-reduce:transition-none motion-reduce:transform-none h-[5vh] md:h-[7vh]"
      style={{ transform: visible ? 'scaleY(1)' : 'scaleY(0)', opacity: visible ? 1 : 0 }}
    />
  </>
);

export default CinematicBars;
