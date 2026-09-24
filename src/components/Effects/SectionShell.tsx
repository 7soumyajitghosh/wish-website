import React from 'react';
import { Reveal } from './Reveal';

/**
 * SectionShell — one continuous-story wrapper for post-intro sections.
 * Consistent rhythm, layered ambient background, hairline divider,
 * glass panel option. Content/functionality of children unchanged.
 */
export const SectionShell: React.FC<{
  id?: string;
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}> = ({ id, eyebrow, title, subtitle, children, className = '', glass = false }) => {
  return (
    <section id={id} className={`relative overflow-hidden px-6 py-24 md:px-8 md:py-32 ${className}`}>
      {/* layered ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_0%,rgba(168,20,56,0.10),transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb3c1]/25 to-transparent" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl">
        {(eyebrow || title || subtitle) && (
          <div className="mx-auto mb-12 max-w-2xl text-center md:mb-16">
            {eyebrow && (
              <Reveal>
                <p className="mb-4 font-sans text-sm font-medium uppercase tracking-[0.3em] text-[#f5baa4]">
                  {eyebrow}
                </p>
              </Reveal>
            )}
            {title && (
              <Reveal delay={0.08}>
                <h2
                  className="font-serif text-[#fffdf8]"
                  style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1 }}
                >
                  {title}
                </h2>
              </Reveal>
            )}
            {subtitle && (
              <Reveal delay={0.16}>
                <p className="mt-4 font-sans text-base leading-relaxed text-[#fff8eb]/85">{subtitle}</p>
              </Reveal>
            )}
          </div>
        )}
        {glass ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md md:p-10">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

export default SectionShell;
