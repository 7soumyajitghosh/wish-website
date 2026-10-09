import { useState } from 'react';
import { Reveal } from '../Effects/Reveal';
import { MemoryMatch } from './MemoryMatch';
import { WordScramble } from './WordScramble';
import { TicTacToe } from './TicTacToe';
import { LoveIcon, type LoveIconName } from './LoveIcon';

type GameId = 'memory' | 'scramble' | 'tictactoe';

const TABS: { id: GameId; label: string; icon: LoveIconName; blurb: string }[] = [
  { id: 'memory', label: 'Memory Match', icon: 'memory', blurb: 'Find every pair of love tokens.' },
  { id: 'scramble', label: 'Word Puzzle', icon: 'puzzle', blurb: 'Unscramble words of love.' },
  { id: 'tictactoe', label: 'Hearts vs Roses', icon: 'rose', blurb: 'Tic-tac-toe against Cupid.' },
];

export const Playground = () => {
  const [active, setActive] = useState<GameId>('memory');
  const current = TABS.find((t) => t.id === active)!;

  return (
    <section
      id="playground"
      aria-label="Play and Puzzles playground"
      className="section relative w-full overflow-hidden bg-gradient-to-b from-[#0d0408] via-[#1a0812] to-[#0d0408] px-4 sm:px-6 text-[#fffdf8] md:px-12"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_40%_at_50%_15%,rgba(216,27,70,0.12),transparent_70%)]"
      />
      <div className="relative z-10 mx-auto max-w-4xl">
        <Reveal className="mb-8 sm:mb-10 text-center">
          <header className="px-1">
            <span className="eyebrow">A Little Intermission</span>
            <h2
              className="font-serif mt-2 mb-4 text-balance break-words text-[#fffdf8]"
              style={{ fontSize: 'clamp(1.75rem,8vw,3.5rem)', lineHeight: 'var(--leading-tight,1.05)' }}
            >
              Play &amp; Puzzles
            </h2>
            <div aria-hidden="true" className="mx-auto mb-4 h-px w-20 bg-gradient-to-r from-transparent via-[#ffd6a5]/60 to-transparent" />
            <p className="font-serif text-[#fff8eb]/85 text-sm sm:text-base">
              Three tiny love-themed games — flip memories, solve word puzzles, or challenge Cupid.
            </p>
          </header>
        </Reveal>

        {/* Game picker — toggle buttons (not tabs: switching games intentionally resets
            the previous board and there is no tabpanel keyboard contract). */}
        <Reveal delay={0.1}>
          <div className="mb-8 flex flex-col justify-center gap-3 sm:flex-row" role="group" aria-label="Choose a game">
            {TABS.map((tab) => {
              const selected = tab.id === active;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActive(tab.id)}
                  className={`game-picker ${selected ? 'is-selected' : ''}`}
                >
                  <LoveIcon name={tab.icon} />
                  <span className="mt-1 block font-serif text-lg text-[#fffdf8]">{tab.label}</span>
                  <span className="block font-sans text-xs tracking-wide text-[#fff8eb]/80">{tab.blurb}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div
            role="group"
            aria-label={current.label}
            className="game-panel p-4 sm:p-8"
          >
            <div key={active} className="game-enter">
            {active === 'memory' && <MemoryMatch />}
            {active === 'scramble' && <WordScramble />}
            {active === 'tictactoe' && <TicTacToe />}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Playground;
