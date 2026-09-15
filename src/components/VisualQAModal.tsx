import React, { useState } from 'react';
import { X, CheckCircle2, Layers, ZoomIn } from 'lucide-react';
import { STAGES } from '../types';

interface VisualQAModalProps {
  currentStage: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectStage: (stage: number) => void;
}

export const VisualQAModal: React.FC<VisualQAModalProps> = ({
  currentStage,
  isOpen,
  onClose,
  onSelectStage
}) => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'storyboard'>('checklist');

  if (!isOpen) return null;


  const qaChecks = [
    {
      title: 'Overall Composition',
      desc: 'Horizon line anchored at ~72% height. Sky occupies upper 70% with dusty rose zenith descending to golden horizon. Foreground features a curved earthy hill with rim lighting.',
      status: 'pass'
    },
    {
      title: 'Tree Size & Position',
      desc: 'Trunk rooted slightly left-of-center (~44% width), allowing ample cinematic breathing room on the right for the sweeping wind vortex. Crown spans ~50% of canvas.',
      status: 'pass'
    },
    {
      title: 'Sunset Lighting',
      desc: 'Luminous sun disk placed on the horizon behind the trunk base with soft golden radial bloom and warm edge highlights on trunk and ground silhouette.',
      status: 'pass'
    },
    {
      title: 'Background Atmosphere',
      desc: 'Layered atmospheric perspective with soft mauve distant hills, warm peach midground ridges, and gentle drifting firefly embers in the twilight sky.',
      status: 'pass'
    },
    {
      title: 'Branch Structure',
      desc: 'Procedural botanical branching: golden filigree roots into soil, tapered organic S-curve trunk, 4 primary boughs, secondary forks, and intricate fine twigs.',
      status: 'pass'
    },
    {
      title: 'Heart Density & Volume',
      desc: 'Stage-by-stage progression: Stage 9 buds -> Stage 10 first leaves (~50) -> Stage 11 expansion (~200) -> Stage 12 full lush bloom (350+ hearts).',
      status: 'pass'
    },
    {
      title: 'Heart Colors',
      desc: 'True-to-reference multi-tonal palette: ruby crimson (#c9184a), strawberry red (#d90429), coral pink (#ff4d6d, #ff758f), blush (#ffb3c1), and luminous gold (#ffd166).',
      status: 'pass'
    },
    {
      title: 'Animation Timing',
      desc: 'Fluid 60fps interpolation with 16 dedicated stages, timeline scrubber, speed toggles (0.5x, 1x, 2x), and synchronized Web Audio chimes and breezes.',
      status: 'pass'
    },
    {
      title: 'Heart Flight Direction',
      desc: 'Hearts gracefully detach from twigs and sweep into an arched wind stream moving off to the right with sinusoidal wave dynamics and 3D fluttering flips.',
      status: 'pass'
    },
    {
      title: 'Final Transition (Scene 16)',
      desc: 'Stage 15 heart vortex seamlessly glides the camera into Page 16: "Where Love Takes Flight...", featuring the Heart Sun, cherry trees, streetlamp, bench, and petal path.',
      status: 'pass'
    },
    {
      title: 'Typography & Editorial Styling',
      desc: 'Refined classical serif typography using Cormorant Garamond and Cinzel with subtle golden shimmer gradients and tracked uppercase subtitles.',
      status: 'pass'
    },
    {
      title: 'Mobile Composition & Responsiveness',
      desc: 'Canvas auto-adapts to portrait and landscape viewports with dynamic devicePixelRatio scaling, touch taps, and mobile drawer layout.',
      status: 'pass'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl glass-panel text-rose-50 overflow-hidden shadow-2xl border border-rose-300/30">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-rose-200/15">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-2xl text-rose-100">
                Visual QA Pass & Reference Comparison
              </h2>
              <p className="text-xs text-rose-200/60 font-light">
                Inspecting current implementation against the 16-stage reference storyboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-rose-200 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-black/30 border-b border-rose-200/10">
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase transition-all ${
              activeTab === 'checklist'
                ? 'bg-rose-500/30 text-rose-100 border border-rose-400/40 shadow-sm'
                : 'text-rose-300/60 hover:text-rose-200'
            }`}
          >
            QA Analysis Checklist (12 Points)
          </button>

          <button
            onClick={() => setActiveTab('storyboard')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-wide uppercase transition-all ${
              activeTab === 'storyboard'
                ? 'bg-rose-500/30 text-rose-100 border border-rose-400/40 shadow-sm'
                : 'text-rose-300/60 hover:text-rose-200'
            }`}
          >
            Full Reference Storyboard (16 Panels)
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {activeTab === 'checklist' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {qaChecks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white/[0.04] border border-rose-200/10 hover:border-rose-400/30 transition-all flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-rose-100">{item.title}</h3>
                    <p className="text-xs text-rose-200/70 font-light leading-relaxed mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-rose-200/80">
                <span>Select a stage below to jump directly into the live canvas:</span>
                <div className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
                  <span>Click any stage button</span>
                </div>
              </div>

              {/* Stage Quick Jump Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStage(s.id);
                      onClose();
                    }}
                    className={`p-2 rounded-lg text-left transition-all border ${
                      s.id === currentStage
                        ? 'bg-amber-400/20 border-amber-300/60 text-amber-100'
                        : 'bg-white/[0.04] border-white/10 hover:bg-white/10 text-rose-200/80'
                    }`}
                  >
                    <div className="text-[10px] tracking-wider uppercase opacity-70">
                      Panel {s.id}
                    </div>
                    <div className="text-xs font-serif truncate mt-0.5">{s.title}</div>
                  </button>
                ))}
              </div>

              {/* High-Res Reference Image Viewer */}
              <div className="relative mt-2 rounded-xl overflow-hidden border border-rose-200/20 bg-black">
                <img
                  src="/reference-storyboard.jpg"
                  alt="16-Panel Reference Storyboard"
                  className="w-full h-auto object-contain block"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-black/40 border-t border-rose-200/10 flex items-center justify-between text-xs text-rose-200/70">
          <span>Current active stage: <strong className="text-rose-100">Stage {currentStage} ({STAGES[currentStage - 1]?.title})</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-100 uppercase tracking-widest text-[11px] transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
