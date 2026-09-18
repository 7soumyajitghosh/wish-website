import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const FinalMessage = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const subTextRef = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const heartRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set([textRef.current, subTextRef.current, dividerRef.current, heartRef.current], {
        y: 30,
        opacity: 0,
        filter: 'blur(10px)',
      });
    }, sectionRef);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ctx.add(() => {
              gsap.to([textRef.current, dividerRef.current, heartRef.current, subTextRef.current], {
                y: 0,
                opacity: 1,
                filter: 'blur(0px)',
                duration: 1.5,
                stagger: 0.3,
                ease: 'power3.out',
              });
            });
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="final-message"
      ref={sectionRef}
      className="relative flex flex-col items-center justify-center min-h-[80vh] bg-[#0d0408] px-6 py-24 overflow-hidden"
      aria-label="Final Message"
    >
      {/* Subtle Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(13,4,8,0.8)_100%)]"></div>

      <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto text-center">
        <h2
          ref={textRef}
          className="text-4xl md:text-5xl lg:text-7xl font-serif text-[#fffdf8] leading-tight tracking-wide mb-10"
        >
          Somewhere between a beginning and a forever,
          <br className="hidden md:block" /> love takes flight.
        </h2>

        <div className="flex flex-col items-center space-y-6 mb-10">
          <div ref={dividerRef} className="w-24 h-[1px] bg-[#ffd6a5] opacity-70"></div>
          
          <svg
            ref={heartRef}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 text-[#d81b46]"
            aria-hidden="true"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        </div>

        <p
          ref={subTextRef}
          className="text-lg md:text-xl font-serif text-[#ffd6a5] italic tracking-wider opacity-90"
        >
          And in that space, everything beautiful begins.
        </p>
      </div>
    </section>
  );
};
