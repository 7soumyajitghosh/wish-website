import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const STAGES = [
  { id: '01', title: 'Empty Canvas', desc: 'A calm twilight sunset over misty hills' },
  { id: '02', title: 'Glowing Seed', desc: 'A radiant heart seed appears on the soil' },
  { id: '03', title: 'Roots Emerge', desc: 'Golden filigree roots branch into the earth' },
  { id: '04', title: 'Trunk Begins', desc: 'A slender trunk reaches upward' },
  { id: '05', title: 'Trunk Grows', desc: 'The trunk grows taller with warm lighting' },
  { id: '06', title: 'Main Branches', desc: 'Primary boughs extend across the sky' },
  { id: '07', title: 'Secondary Branches', desc: 'Natural branching multiplies' },
  { id: '08', title: 'Fine Twigs', desc: 'Intricate network creates the crown' },
  { id: '09', title: 'Tiny Buds', desc: 'Glowing buds ignite at twig tips' },
  { id: '10', title: 'Hearts Bloom', desc: 'First wave of heart leaves unfurls' },
  { id: '11', title: 'More Hearts', desc: 'Ruby hearts fill the canopy' },
  { id: '12', title: 'Full Bloom', desc: 'A lush canopy of glowing hearts' },
  { id: '13', title: 'Wind Begins', desc: 'Gentle wind starts, petals drift' },
  { id: '14', title: 'Hearts Fly', desc: 'Hearts detach in an elegant vortex' },
  { id: '15', title: 'Transition', desc: 'Hearts sweep across the sky' },
  { id: '16', title: 'Love Takes Flight', desc: 'The magical destination' },
];

export const Journey: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              gsap.to(entry.target, {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: 'power3.out',
              });
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: '0px 0px -50px 0px' }
      );

      cardsRef.current.forEach((card) => {
        if (card) {
          gsap.set(card, { y: 50, opacity: 0 });
          observer.observe(card);
        }
      });

      return () => {
        observer.disconnect();
      };
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section 
      id="journey" 
      ref={containerRef}
      className="py-24 px-6 md:px-12 w-full min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #0d0408, #220b17)',
        color: '#fffdf8',
      }}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <header className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif mb-4 tracking-wide text-[#ffb3c1]">
            The Journey
          </h2>
          <div 
            className="w-24 h-px bg-gradient-to-r from-transparent via-[#ffd6a5] to-transparent mx-auto mb-6 opacity-80" 
            aria-hidden="true" 
          />
          <p className="text-lg md:text-xl italic text-[#fff8eb] font-serif opacity-90">
            Sixteen stages from seed to sky
          </p>
        </header>

        <div className="relative">
          {/* Vertical timeline line */}
          <div 
            className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#0d0408] via-[#a81438] to-[#220b17] transform -translate-x-1/2" 
            aria-hidden="true" 
          />

          <div className="flex flex-col gap-12 md:gap-8">
            {STAGES.map((stage, index) => {
              const isEven = index % 2 === 0;
              return (
                <article
                  key={stage.id}
                  ref={(el) => { cardsRef.current[index] = el; }}
                  className={`relative flex flex-col md:flex-row items-start md:items-center w-full group ${
                    isEven ? 'md:justify-start' : 'md:justify-end'
                  }`}
                >
                  {/* Timeline Dot */}
                  <div 
                    className="absolute left-[24px] md:left-1/2 top-8 md:top-1/2 w-4 h-4 rounded-full bg-[#f5baa4] border-4 border-[#0d0408] transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group-hover:scale-150 group-hover:bg-[#ffd6a5] group-hover:shadow-[0_0_15px_#ffd6a5] z-10" 
                    aria-hidden="true" 
                  />

                  {/* Content Card */}
                  <div className={`ml-[56px] md:ml-0 w-[calc(100%-56px)] md:w-[45%] p-6 rounded-2xl bg-[#220b17]/40 border border-[#a81438]/20 backdrop-blur-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(168,20,56,0.15)] hover:bg-[#220b17]/60 hover:border-[#ffb3c1]/30 ${
                    isEven ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'
                  }`}>
                    <div className="flex flex-col md:block">
                      <span className="text-2xl font-serif text-[#ffd6a5] mb-2 block font-bold tracking-wider">
                        {stage.id}
                      </span>
                      <h3 className="text-xl font-serif text-[#ffb3c1] mb-3">
                        {stage.title}
                      </h3>
                      <p className="text-[#fff8eb] opacity-80 leading-relaxed font-sans text-sm md:text-base">
                        {stage.desc}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
