import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface FlowerSceneProps {
  onComplete: () => void;
}

export const FlowerScene: React.FC<FlowerSceneProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stemPathRef = useRef<SVGPathElement>(null);
  const leafLeftRef = useRef<SVGGElement>(null);
  const leafRightRef = useRef<SVGGElement>(null);
  const budGroupRef = useRef<SVGGElement>(null);
  const petalsOuterRef = useRef<SVGGElement>(null);
  const petalsMidRef = useRef<SVGGElement>(null);
  const petalsCoreRef = useRef<SVGGElement>(null);
  const firefliesRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(2.2, () => {
            gsap.to(containerRef.current, {
              opacity: 0,
              duration: 1.4,
              ease: 'power2.inOut',
              onComplete,
            });
          });
        },
      });

      // 1. Fade scene in from deep darkness
      tl.fromTo(
        containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, ease: 'power2.out' }
      );

      // 2. Initial spark of life / light beacon
      tl.fromTo(
        '.flower-light-spark',
        { scale: 0, opacity: 0 },
        { scale: 1.4, opacity: 1, duration: 1.2, ease: 'back.out(2)' }
      );

      // Spark drops to earth
      tl.to('.flower-light-spark', {
        y: 80,
        opacity: 0.6,
        duration: 1.0,
        ease: 'power1.in',
      });

      // 3. Stem grows upward via SVG stroke animation
      const stem = stemPathRef.current;
      if (stem) {
        const len = stem.getTotalLength();
        gsap.set(stem, { strokeDasharray: len, strokeDashoffset: len });
        tl.to(
          stem,
          {
            strokeDashoffset: 0,
            duration: 2.2,
            ease: 'power2.out',
          },
          '-=0.2'
        );
      }

      // 4. Leaves unfurl as stem reaches their junction
      tl.fromTo(
        leafLeftRef.current,
        { scale: 0, rotation: 30, transformOrigin: '0% 100%' },
        { scale: 1, rotation: 0, duration: 1.2, ease: 'back.out(1.7)' },
        '-=1.4'
      );

      tl.fromTo(
        leafRightRef.current,
        { scale: 0, rotation: -30, transformOrigin: '100% 100%' },
        { scale: 1, rotation: 0, duration: 1.2, ease: 'back.out(1.7)' },
        '-=1.0'
      );

      // 5. Bud rises and expands at stem apex
      tl.fromTo(
        budGroupRef.current,
        { scale: 0, opacity: 0, transformOrigin: 'center center' },
        { scale: 1, opacity: 1, duration: 1.0, ease: 'power2.out' },
        '-=0.8'
      );

      // 6. Petals bloom: outer layer first
      const outerPetals = petalsOuterRef.current?.children;
      if (outerPetals) {
        tl.fromTo(
          outerPetals,
          { scale: 0.2, opacity: 0, transformOrigin: 'center 80%' },
          {
            scale: 1,
            opacity: 0.95,
            duration: 1.8,
            stagger: 0.12,
            ease: 'power3.out',
          },
          '-=0.2'
        );
      }

      // Mid petals bloom
      const midPetals = petalsMidRef.current?.children;
      if (midPetals) {
        tl.fromTo(
          midPetals,
          { scale: 0.1, opacity: 0, transformOrigin: 'center 75%' },
          {
            scale: 1,
            opacity: 1,
            duration: 1.6,
            stagger: 0.1,
            ease: 'power3.out',
          },
          '-=1.4'
        );
      }

      // Core petals bloom & warm glow center
      const corePetals = petalsCoreRef.current?.children;
      if (corePetals) {
        tl.fromTo(
          corePetals,
          { scale: 0, opacity: 0, transformOrigin: 'center 70%' },
          {
            scale: 1,
            opacity: 1,
            duration: 1.4,
            stagger: 0.08,
            ease: 'back.out(1.5)',
          },
          '-=1.2'
        );
      }

      // 7. Fireflies emerge around blooming flower
      const fireflies = firefliesRef.current?.children;
      if (fireflies) {
        tl.fromTo(
          fireflies,
          { opacity: 0, scale: 0 },
          {
            opacity: 0.85,
            scale: 1,
            duration: 1.5,
            stagger: 0.15,
            ease: 'power1.out',
          },
          '-=0.8'
        );

        // Gentle firefly floating sway
        Array.from(fireflies).forEach((ff, i) => {
          gsap.to(ff, {
            x: `+=${(i % 2 === 0 ? 1 : -1) * (15 + i * 4)}`,
            y: `+=${(i % 3 === 0 ? -1 : 1) * (12 + i * 3)}`,
            duration: 2.5 + i * 0.4,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
          });
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  return (
    <div ref={containerRef} className="flower-scene">
      <div className="flower-ambient-glow" />

      {/* Originating spark of light */}
      <div className="flower-light-spark" />

      {/* SVG Authored Botanical Bloom */}
      <svg
        viewBox="0 0 800 650"
        className="flower-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="stemGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#22110c" />
            <stop offset="60%" stopColor="#3d211a" />
            <stop offset="100%" stopColor="#5c1d28" />
          </linearGradient>

          <linearGradient id="leafGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2c1410" />
            <stop offset="100%" stopColor="#63212f" />
          </linearGradient>

          <radialGradient id="petalGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff0d4" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#f77f98" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a81438" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Stem */}
        <path
          ref={stemPathRef}
          d="M 400 560 C 394 480, 412 400, 396 300 C 392 270, 400 240, 400 215"
          fill="none"
          stroke="url(#stemGrad)"
          strokeWidth="4.2"
          strokeLinecap="round"
        />

        {/* Left Leaf */}
        <g ref={leafLeftRef} transform="translate(397, 410)">
          <path
            d="M 0 0 C -35 -15, -60 5, -85 -10 C -55 -35, -20 -30, 0 0 Z"
            fill="url(#leafGrad)"
            opacity="0.85"
          />
          {/* Leaf vein */}
          <path d="M 0 0 C -30 -12, -60 -10, -80 -10" stroke="#7d2838" strokeWidth="0.9" fill="none" />
        </g>

        {/* Right Leaf */}
        <g ref={leafRightRef} transform="translate(400, 345)">
          <path
            d="M 0 0 C 35 -15, 65 5, 90 -12 C 60 -38, 25 -32, 0 0 Z"
            fill="url(#leafGrad)"
            opacity="0.85"
          />
          {/* Leaf vein */}
          <path d="M 0 0 C 30 -12, 60 -10, 85 -12" stroke="#7d2838" strokeWidth="0.9" fill="none" />
        </g>

        {/* Blooming Flower Head at Apex */}
        <g ref={budGroupRef} transform="translate(400, 210)">
          {/* Outer Layer Petals */}
          <g ref={petalsOuterRef}>
            <path d="M 0 0 C -45 -20, -65 -65, 0 -95 C 65 -65, 45 -20, 0 0 Z" fill="#690d23" />
            <path d="M 0 0 C -60 5, -85 -40, -40 -85 C 0 -60, -10 -20, 0 0 Z" fill="#7a102a" />
            <path d="M 0 0 C 60 5, 85 -40, 40 -85 C 0 -60, 10 -20, 0 0 Z" fill="#7a102a" />
            <path d="M 0 0 C -30 25, -70 5, -65 -35 C -25 -40, -10 -15, 0 0 Z" fill="#8c1332" />
            <path d="M 0 0 C 30 25, 70 5, 65 -35 C 25 -40, 10 -15, 0 0 Z" fill="#8c1332" />
          </g>

          {/* Mid Layer Petals */}
          <g ref={petalsMidRef}>
            <path d="M 0 -10 C -35 -30, -45 -65, 0 -85 C 45 -65, 35 -30, 0 -10 Z" fill="#ab183f" />
            <path d="M 0 -10 C -45 -15, -55 -50, -20 -70 C 5 -45, -5 -25, 0 -10 Z" fill="#be1a46" />
            <path d="M 0 -10 C 45 -15, 55 -50, 20 -70 C -5 -45, 5 -25, 0 -10 Z" fill="#be1a46" />
            <path d="M 0 -10 C -25 15, -45 5, -35 -30 C -10 -25, 0 -15, 0 -10 Z" fill="#d11d4e" />
            <path d="M 0 -10 C 25 15, 45 5, 35 -30 C 10 -25, 0 -15, 0 -10 Z" fill="#d11d4e" />
          </g>

          {/* Core Petals */}
          <g ref={petalsCoreRef}>
            <path d="M 0 -15 C -20 -25, -25 -55, 0 -65 C 25 -55, 20 -25, 0 -15 Z" fill="#e82c5f" />
            <path d="M 0 -15 C -25 -30, -10 -50, 0 -55 C 10 -50, 25 -30, 0 -15 Z" fill="#f74d79" />
            <circle cx="0" cy="-35" r="14" fill="url(#petalGlow)" />
            <circle cx="0" cy="-35" r="5" fill="#fff7e6" />
          </g>
        </g>

        {/* Subtle Atmospheric Fireflies */}
        <g ref={firefliesRef} className="flower-fireflies">
          <circle cx="330" cy="240" r="2.2" fill="#fff5dc" />
          <circle cx="470" cy="260" r="1.8" fill="#ffd2a6" />
          <circle cx="360" cy="160" r="2.4" fill="#fff5dc" />
          <circle cx="440" cy="180" r="2.0" fill="#ffd2a6" />
          <circle cx="310" cy="360" r="1.6" fill="#fff5dc" />
          <circle cx="485" cy="380" r="2.1" fill="#ffd2a6" />
        </g>
      </svg>
    </div>
  );
};
