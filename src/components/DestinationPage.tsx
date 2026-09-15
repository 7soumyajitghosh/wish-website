import React, { useState, useEffect, useRef } from 'react';
import { Heart, Send, RotateCcw, Volume2, VolumeX, BookOpen } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

import confetti from 'canvas-confetti';

interface DestinationPageProps {
  onReplay: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface FloatingWish {
  id: number;
  text: string;
  x: number;
  y: number;
  progress: number;
  color: string;
}

export const DestinationPage: React.FC<DestinationPageProps> = ({
  onReplay,
  isMuted,
  onToggleMute
}) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [customWish, setCustomWish] = useState('');
  const [wishes, setWishes] = useState<FloatingWish[]>([]);
  const [wishCount, setWishCount] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background drifting petals canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Petal {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      rot: number;
      rotSpeed: number;
      color: string;
      alpha: number;
    }

    const petals: Petal[] = [];
    const colors = ['#ffccd5', '#ffb3c1', '#ff758f', '#ffa69e', '#ffd166'];

    for (let i = 0; i < 45; i++) {
      petals.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 5 + Math.random() * 8,
        vx: 0.5 + Math.random() * 1.5,
        vy: 0.8 + Math.random() * 1.2,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.04,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.4 + Math.random() * 0.5
      });
    }

    let time = 0;
    const drawPetal = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      petals.forEach((p) => {
        p.x += p.vx + Math.sin(time + p.rot) * 0.6;
        p.y += p.vy;
        p.rot += p.rotSpeed;

        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
        if (p.x > width + 20) {
          p.x = -20;
        }

        drawPetal(p);
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    const wishText = customWish.trim() || 'A prayer for endless joy & gentle love';
    soundManager.playBloomChime();

    // Trigger sweet heart confetti
    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#ff4d6d', '#ff758f', '#ffd166', '#fff']
      });
    } catch {}

    const newWish: FloatingWish = {
      id: Date.now(),
      text: wishText,
      x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 140,
      y: window.innerHeight * 0.75,
      progress: 0,
      color: '#ffd166'
    };

    setWishes((prev) => [...prev, newWish]);
    setCustomWish('');
    setWishCount((c) => c + 1);

    // Animate wish floating upwards into the heart sun
    const interval = setInterval(() => {
      setWishes((prev) =>
        prev
          .map((w) => (w.id === newWish.id ? { ...w, progress: w.progress + 0.015, y: w.y - 3 } : w))
          .filter((w) => w.progress < 1)
      );
    }, 30);

    setTimeout(() => {
      clearInterval(interval);
      setWishes((prev) => prev.filter((w) => w.id !== newWish.id));
    }, 4000);
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden select-none bg-[#180911]">
      {/* Background canvas for petal drift */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

      {/* Atmospheric Landscape Art (Matching Panel 16) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {/* Twilight Sky Gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #cf8da6 0%, #e8a5b8 20%, #f7c3c8 45%, #ffd9c5 70%, #fff0e2 100%)'
          }}
        />

        {/* The Radiant Heart Sun */}
        <div className="absolute top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          {/* Outer Sun Glow */}
          <div className="w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-amber-100/70 via-rose-200/50 to-pink-300/30 blur-3xl animate-pulse-glow" />
          {/* Inner Golden Heart Silhouette */}
          <div className="absolute animate-float">
            <svg
              viewBox="0 0 100 100"
              className="w-32 h-32 sm:w-44 sm:h-44 fill-[#fffbe6] drop-shadow-[0_0_35px_rgba(255,230,170,0.95)] filter drop-shadow-[0_0_70px_rgba(255,140,160,0.8)]"
            >
              <path d="M50 88.9L43.5 83C20.4 62.1 5.2 48.3 5.2 31.4C5.2 17.6 16 6.8 29.8 6.8C37.6 6.8 45 10.4 50 16.2C55 10.4 62.4 6.8 70.2 6.8C84 6.8 94.8 17.6 94.8 31.4C94.8 48.3 79.6 62.1 56.5 83.1L50 88.9Z" />
            </svg>
          </div>
        </div>

        {/* Winding Illuminated Rose Petal Pathway */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff2e0" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#ffccd5" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#ff758f" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c9184a" stopOpacity="0.95" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Rolling landscape mounds */}
          <path
            d="M 0 650 Q 250 610, 500 660 T 1000 640 L 1000 1000 L 0 1000 Z"
            fill="#3a161f"
            opacity="0.9"
          />
          <path
            d="M 0 710 Q 300 680, 600 730 T 1000 700 L 1000 1000 L 0 1000 Z"
            fill="#270e15"
          />

          {/* Winding petal path leading towards heart sun */}
          <path
            d="M 500 520 Q 520 620, 650 710 T 920 1000 L 760 1000 Q 560 740, 480 620 Q 450 540, 500 520 Z"
            fill="url(#pathGradient)"
            filter="url(#glow)"
          />

          {/* Fairy light lanterns along the pathway */}
          {[
            { cx: 505, cy: 535, r: 3 },
            { cx: 520, cy: 580, r: 4 },
            { cx: 555, cy: 640, r: 5 },
            { cx: 610, cy: 690, r: 5.5 },
            { cx: 680, cy: 750, r: 6 },
            { cx: 760, cy: 830, r: 7 },
            { cx: 860, cy: 920, r: 8 }
          ].map((pt, i) => (
            <circle
              key={i}
              cx={pt.cx}
              cy={pt.cy}
              r={pt.r}
              fill="#fff9db"
              filter="url(#glow)"
              opacity="0.95"
            />
          ))}
        </svg>

        {/* Victorian Streetlamp & Bench (Right Foreground) */}
        <div className="absolute right-[6%] sm:right-[12%] bottom-[12%] sm:bottom-[15%] flex items-end gap-3 pointer-events-none z-10">
          {/* Wooden & Iron Park Bench */}
          <div className="relative">
            <svg viewBox="0 0 140 90" className="w-24 sm:w-36 h-auto drop-shadow-lg">
              {/* Backrest slats */}
              <rect x="20" y="22" width="95" height="6" rx="2" fill="#582a20" />
              <rect x="20" y="32" width="95" height="6" rx="2" fill="#582a20" />
              <rect x="20" y="42" width="95" height="6" rx="2" fill="#582a20" />
              {/* Seat slats */}
              <rect x="18" y="54" width="100" height="7" rx="2" fill="#421f18" />
              {/* Cast iron legs & armrests */}
              <path
                d="M 22 45 Q 15 50, 18 82 M 110 45 Q 118 50, 115 82 M 15 55 L 30 55 M 105 55 L 120 55"
                stroke="#1b0e10"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </div>

          {/* Antique Victorian Streetlamp */}
          <div className="relative flex flex-col items-center">
            {/* Lamp Lantern Glow */}
            <div className="absolute -top-6 w-32 h-32 rounded-full bg-amber-200/40 blur-xl animate-pulse" />
            <svg viewBox="0 0 70 240" className="w-12 sm:w-16 h-auto drop-shadow-xl">
              {/* Finial spire */}
              <polygon points="35,10 32,22 38,22" fill="#1b0e10" />
              {/* Lantern cap */}
              <path d="M 20 28 L 50 28 L 44 22 L 26 22 Z" fill="#1b0e10" />
              {/* Glowing glass chamber */}
              <polygon points="22,28 48,28 44,52 26,52" fill="#fff5cc" />
              {/* Warm lantern flame/bulb */}
              <circle cx="35" cy="40" r="6" fill="#ffb703" filter="drop-shadow(0 0 8px #fff)" />
              {/* Cage bars */}
              <line x1="28" y1="28" x2="30" y2="52" stroke="#1b0e10" strokeWidth="2" />
              <line x1="42" y1="28" x2="40" y2="52" stroke="#1b0e10" strokeWidth="2" />
              {/* Lantern base & bracket */}
              <path d="M 24 52 L 46 52 L 38 65 L 32 65 Z" fill="#1b0e10" />
              {/* Lamp post column */}
              <rect x="32.5" y="65" width="5" height="150" fill="#1b0e10" />
              {/* Base pedestal */}
              <path d="M 22 215 L 48 215 L 45 235 L 25 235 Z" fill="#1b0e10" />
            </svg>
          </div>
        </div>

        {/* Framing Cherry Blossom Overhangs (Top Left & Right) */}
        <div className="absolute top-0 left-0 w-48 sm:w-80 h-40 sm:h-64 pointer-events-none opacity-85">
          <svg viewBox="0 0 200 160" className="w-full h-full fill-[#ff8fa3]">
            <path
              d="M 0 0 Q 60 20, 110 5 Q 160 30, 200 10 L 200 0 Z"
              fill="#2b0e16"
            />
            {/* Blossom clusters */}
            {[
              { cx: 50, cy: 35, r: 12 },
              { cx: 80, cy: 25, r: 15 },
              { cx: 120, cy: 40, r: 14 },
              { cx: 155, cy: 28, r: 16 },
              { cx: 180, cy: 50, r: 13 },
              { cx: 100, cy: 60, r: 11 }
            ].map((c, i) => (
              <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={i % 2 === 0 ? '#ffb3c1' : '#ff758f'} />
            ))}
          </svg>
        </div>
      </div>

      {/* Floating User Wishes soaring towards heart sun */}
      {wishes.map((w) => (
        <div
          key={w.id}
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/70 border border-amber-300/40 backdrop-blur-md shadow-[0_0_20px_rgba(255,200,100,0.5)] transition-all duration-75"
          style={{
            left: `${w.x}px`,
            top: `${w.y}px`,
            opacity: 1 - w.progress,
            transform: `scale(${1 - w.progress * 0.4}) translateY(-${w.progress * 80}px)`
          }}
        >
          <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
          <span className="text-xs font-serif text-amber-100 tracking-wide">{w.text}</span>
        </div>
      ))}

      {/* Main Headline (Panel 16 Typography) */}
      <div className="relative z-20 flex flex-col items-center justify-start pt-14 sm:pt-20 px-4 text-center">
        <span className="text-xs sm:text-sm tracking-[0.35em] text-rose-950/75 uppercase font-medium mb-1">
          A Journey of Love
        </span>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl italic text-[#4a1825] font-light tracking-wide drop-shadow-sm">
          Where
        </h1>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl italic text-[#3f131f] font-normal tracking-wide mt-1">
          Love Takes Flight...
        </h2>

        <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-[#883648]/60 to-transparent my-4" />

        <p className="max-w-md text-xs sm:text-sm text-rose-900/85 font-light leading-relaxed px-4">
          Every seed of kindness planted with love blossoms into an eternal garden of dreams.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsCardOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#521c27] hover:bg-[#682433] text-rose-100 text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <BookOpen className="w-4 h-4 text-rose-300" />
            <span>Open Love Letter</span>
          </button>

          <button
            onClick={onReplay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/40 hover:bg-white/60 text-[#3f131f] border border-rose-900/20 backdrop-blur-md text-xs sm:text-sm tracking-wider uppercase transition-all transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Story</span>
          </button>
        </div>
      </div>

      {/* Top Floating Controls (Mute & Sound) */}
      <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-white/30 hover:bg-white/50 text-[#3f131f] border border-rose-900/15 backdrop-blur-md shadow-sm transition-all"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Interactive Wish Form Bar (Bottom Center) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
        <form
          onSubmit={handleSendWish}
          className="flex items-center gap-2 p-1.5 rounded-full bg-white/70 border border-rose-200/80 backdrop-blur-lg shadow-lg"
        >
          <input
            type="text"
            value={customWish}
            onChange={(e) => setCustomWish(e.target.value)}
            placeholder="Type a wish to release into the sky..."
            className="flex-1 px-3 py-1 text-xs sm:text-sm bg-transparent text-[#3f131f] placeholder-rose-900/40 focus:outline-none"
          />
          <button
            type="submit"
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#682433] hover:bg-[#802c3e] text-amber-200 transition-transform active:scale-95 shadow-sm"
            title="Release Wish"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Love Letter Modal Envelope */}
      {isCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#fffcf7] border border-rose-200 text-[#331119] shadow-2xl overflow-hidden">
            {/* Decorative floral watermark header */}
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-600" />
                <span className="font-serif text-lg tracking-wider text-rose-950">A Letter for You</span>
              </div>
              <button
                onClick={() => setIsCardOpen(false)}
                className="text-rose-800/60 hover:text-rose-950 text-xl font-serif px-2"
              >
                ✕
              </button>
            </div>

            {/* Letter Content */}
            <div className="py-6 space-y-4 font-serif text-base sm:text-lg leading-relaxed text-[#401923]">
              <p className="italic text-xl text-rose-800">
                “To the one who makes everyday life feel like poetry,”
              </p>
              <p>
                From a single humble seed quietly rooted in the soil, something miraculous can grow.
                Through every quiet dawn and vibrant sunset, our love branches into the sky—brave,
                vibrant, and filled with thousands of glowing hearts.
              </p>
              <p>
                Wherever the breeze carries us next, know that my heart will always fly beside yours.
              </p>
              <p className="text-right italic font-semibold text-rose-900 mt-6">
                Forever & Always, with all my love ❤️
              </p>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-rose-100 flex items-center justify-between">
              <span className="text-xs text-rose-700/60 font-sans tracking-wide">
                Wishes released: {wishCount}
              </span>
              <button
                onClick={() => setIsCardOpen(false)}
                className="px-5 py-2 rounded-full bg-[#682433] hover:bg-[#802c3e] text-white text-xs uppercase tracking-widest transition-all"
              >
                Close Letter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
