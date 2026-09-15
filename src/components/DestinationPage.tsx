/**
 * Destination page — shown as an HTML overlay on top of the canvas
 * once the animation reaches progress >= 0.97.
 *
 * The visual background (sky, path, bench, lamp) is drawn on the canvas.
 * This component only provides the interactive HTML elements:
 * text, buttons, wish form, and love letter modal.
 */
import React, { useState, useEffect } from 'react';
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
}

export const DestinationPage: React.FC<DestinationPageProps> = ({
  onReplay, isMuted, onToggleMute,
}) => {
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [customWish, setCustomWish] = useState('');
  const [wishes, setWishes] = useState<FloatingWish[]>([]);
  const [wishCount, setWishCount] = useState(1);
  const [visible, setVisible] = useState(false);

  // Fade in on mount
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault();
    const wishText = customWish.trim() || 'A prayer for endless joy & gentle love';
    soundManager.playBloomChime();

    try {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#ff4d6d', '#ff758f', '#ffd166', '#fff'],
      });
    } catch {}

    const newWish: FloatingWish = {
      id: Date.now(),
      text: wishText,
      x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 140,
      y: window.innerHeight * 0.75,
      progress: 0,
    };

    setWishes(prev => [...prev, newWish]);
    setCustomWish('');
    setWishCount(c => c + 1);

    const interval = setInterval(() => {
      setWishes(prev =>
        prev
          .map(w => (w.id === newWish.id ? { ...w, progress: w.progress + 0.015, y: w.y - 3 } : w))
          .filter(w => w.progress < 1),
      );
    }, 30);

    setTimeout(() => {
      clearInterval(interval);
      setWishes(prev => prev.filter(w => w.id !== newWish.id));
    }, 4000);
  };

  return (
    <div
      className={`absolute inset-0 z-20 flex flex-col items-center justify-start transition-opacity duration-1000 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Floating wishes */}
      {wishes.map(w => (
        <div
          key={w.id}
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/70 border border-amber-300/40 backdrop-blur-md shadow-[0_0_20px_rgba(255,200,100,0.5)]"
          style={{
            left: `${w.x}px`,
            top: `${w.y}px`,
            opacity: 1 - w.progress,
            transform: `scale(${1 - w.progress * 0.4}) translateY(-${w.progress * 80}px)`,
          }}
        >
          <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
          <span className="text-xs font-serif text-amber-100 tracking-wide">{w.text}</span>
        </div>
      ))}

      {/* Main Headline */}
      <div className="relative z-20 flex flex-col items-center justify-start pt-14 sm:pt-20 px-4 text-center">
        <span className="text-xs sm:text-sm tracking-[0.35em] text-rose-100/75 uppercase font-medium mb-1 drop-shadow-md">
          A Journey of Love
        </span>

        <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl italic text-[#fff0eb] font-light tracking-wide drop-shadow-[0_2px_15px_rgba(0,0,0,0.6)]">
          Where
        </h1>

        <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl italic text-[#fde8e0] font-normal tracking-wide mt-1 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
          Love Takes Flight...
        </h2>

        <div className="w-24 h-[1.5px] bg-gradient-to-r from-transparent via-rose-300/60 to-transparent my-4" />

        <p className="max-w-md text-xs sm:text-sm text-rose-100/80 font-light leading-relaxed px-4 drop-shadow-md">
          Every seed of kindness planted with love blossoms into an eternal garden of dreams.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => setIsCardOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#521c27]/80 hover:bg-[#682433]/80 text-rose-100 text-xs sm:text-sm tracking-wider uppercase shadow-md hover:shadow-lg backdrop-blur-sm transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <BookOpen className="w-4 h-4 text-rose-300" />
            <span>Open Love Letter</span>
          </button>

          <button
            onClick={onReplay}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-rose-100 border border-rose-200/20 backdrop-blur-md text-xs sm:text-sm tracking-wider uppercase transition-all transform hover:-translate-y-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Replay Story</span>
          </button>
        </div>
      </div>

      {/* Top Controls */}
      <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
        <button
          onClick={onToggleMute}
          className="p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-rose-100 border border-rose-200/15 backdrop-blur-md shadow-sm transition-all"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Wish Form */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-full max-w-sm px-4">
        <form
          onSubmit={handleSendWish}
          className="flex items-center gap-2 p-1.5 rounded-full bg-black/30 border border-rose-200/30 backdrop-blur-lg shadow-lg"
        >
          <input
            type="text"
            value={customWish}
            onChange={e => setCustomWish(e.target.value)}
            placeholder="Type a wish to release into the sky..."
            className="flex-1 px-3 py-1 text-xs sm:text-sm bg-transparent text-rose-100 placeholder-rose-200/40 focus:outline-none"
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

      {/* Love Letter Modal */}
      {isCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#fffcf7] border border-rose-200 text-[#331119] shadow-2xl overflow-hidden">
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

            <div className="py-6 space-y-4 font-serif text-base sm:text-lg leading-relaxed text-[#401923]">
              <p className="italic text-xl text-rose-800">
                "To the one who makes everyday life feel like poetry,"
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
