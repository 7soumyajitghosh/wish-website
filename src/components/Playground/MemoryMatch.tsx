import { useEffect, useMemo, useRef, useState } from 'react';
import { LoveIcon } from './LoveIcon';
import { symbolIcon } from './symbolIcons';
import { GameCelebration } from './GameCelebration';

const SYMBOLS = ['❤️', '🌹', '🌙', '✨', '💌', '🦋'];
const BEST_KEY = 'love-memory-best';

type Card = {
  id: number;
  symbol: string;
  matched: boolean;
};

function shuffledDeck(): Card[] {
  const doubled = [...SYMBOLS, ...SYMBOLS];
  // Fisher–Yates
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((symbol, id) => ({ id, symbol, matched: false }));
}

const readBest = (): number | null => {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    // Storage blocked (private mode / SSR) — play on without a best score.
    return null;
  }
};

const writeBest = (moves: number) => {
  try {
    localStorage.setItem(BEST_KEY, String(moves));
  } catch {
    /* blocked storage — best score simply isn't persisted */
  }
};

export const MemoryMatch = () => {
  const [cards, setCards] = useState<Card[]>(() => shuffledDeck());
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(readBest);
  const [lock, setLock] = useState(false);
  // The mismatch timeout is tracked so restart/unmount cancels it instead
  // of it firing late and clearing the next game's cards.
  const mismatchTimerRef = useRef<number | null>(null);
  const winRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (mismatchTimerRef.current !== null) {
        window.clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = null;
      }
    };
  }, []);

  const pairsFound = useMemo(() => cards.filter((c) => c.matched).length / 2, [cards]);
  const won = pairsFound === SYMBOLS.length;

  // Best score is event-driven (not setState-in-effect): recorded at the
  // winning flip, never via a won/moves watcher effect.
  const recordBest = (finalMoves: number) => {
    setBest((prev) => {
      if (prev === null || finalMoves < prev) {
        writeBest(finalMoves);
        return finalMoves;
      }
      return prev;
    });
  };

  const flip = (id: number) => {
    // Discrete taps re-render between events, so closure state is fresh.
    // The lock + open-length guards make double-fires harmless.
    if (lock || open.length >= 2 || won) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || open.includes(id)) return;
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const byId = new Map(cards.map((c) => [c.id, c]));
      const a = byId.get(nextOpen[0]);
      const b = byId.get(nextOpen[1]);
      if (!a || !b) {
        setOpen([]);
        return;
      }
      if (a.symbol === b.symbol) {
        const nextCards = cards.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c));
        setCards(nextCards);
        setOpen([]);
        if (nextCards.filter((c) => c.matched).length / 2 === SYMBOLS.length) {
          recordBest(nextMoves);
          // Move focus to the win announcement so SR users hear it.
          requestAnimationFrame(() => winRef.current?.focus());
        }
      } else {
        setLock(true);
        if (mismatchTimerRef.current !== null) window.clearTimeout(mismatchTimerRef.current);
        mismatchTimerRef.current = window.setTimeout(() => {
          mismatchTimerRef.current = null;
          setOpen([]);
          setLock(false);
        }, 700);
      }
    }
  };

  const restart = () => {
    if (mismatchTimerRef.current !== null) {
      window.clearTimeout(mismatchTimerRef.current);
      mismatchTimerRef.current = null;
    }
    setCards(shuffledDeck());
    setOpen([]);
    setMoves(0);
    setLock(false);
  };

  return (
    <div className="game-content">
      {won && <GameCelebration />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-sans tracking-widest uppercase text-[#fff8eb]/80">
          Moves: {moves} · Pairs: {pairsFound}/{SYMBOLS.length}
          {best !== null && <span className="ml-3 text-[#ffd6a5]">Best: {best}</span>}
        </p>
        <button type="button" onClick={restart} className="btn-ghost btn-sm font-serif cursor-pointer">
          Shuffle again
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3" role="group" aria-label="Memory match board">
        {cards.map((card) => {
          const faceUp = card.matched || open.includes(card.id);
          const position = `card ${card.id + 1} of ${cards.length}`;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card.id)}
              disabled={faceUp}
              aria-label={faceUp ? `${card.symbol}, ${position}, ${card.matched ? 'matched' : 'showing'}` : `Hidden ${position}`}
              className={`memory-card ${faceUp ? 'is-open' : ''} ${card.matched ? 'is-matched' : ''}`}
            >
              <span className="memory-flip" aria-hidden="true">
                <span className="memory-face memory-back"><LoveIcon name="thought" /></span>
                <span className="memory-face memory-front"><LoveIcon name={symbolIcon[card.symbol]} /></span>
              </span>
            </button>
          );
        })}
      </div>

      {won && (
        <div className="game-result game-enter mt-5 p-4 text-center">
          <div ref={winRef} tabIndex={-1} role="status" className="focus-visible:outline-2 focus-visible:outline-[#ffd6a5] rounded">
          <p className="font-serif italic text-lg text-[#ffd6a5]">
            You matched every memory in {moves} moves. <LoveIcon name="heart" className="inline-icon" />
          </p>
          </div>
          <button type="button" onClick={restart} className="btn-primary btn-sm mt-3 font-serif cursor-pointer">
            Play again
          </button>
        </div>
      )}
    </div>
  );
};

export default MemoryMatch;
