import { useMemo, useState } from 'react';
import { Reveal } from '../Effects/Reveal';

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

export const MemoryMatch = () => {
  const [cards, setCards] = useState<Card[]>(() => shuffledDeck());
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState<number | null>(() => {
    const raw = localStorage.getItem(BEST_KEY);
    return raw ? Number(raw) : null;
  });
  const [lock, setLock] = useState(false);

  const pairsFound = useMemo(() => cards.filter((c) => c.matched).length / 2, [cards]);
  const won = pairsFound === SYMBOLS.length;

  // Best score is event-driven (not setState-in-effect): recorded at the
  // winning flip, never via a won/moves watcher effect.
  const recordBest = (finalMoves: number) => {
    setBest((prev) => {
      if (prev === null || finalMoves < prev) {
        localStorage.setItem(BEST_KEY, String(finalMoves));
        return finalMoves;
      }
      return prev;
    });
  };

  const flip = (id: number) => {
    if (lock || won) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.matched || open.includes(id)) return;
    const nextOpen = [...open, id];
    setOpen(nextOpen);
    if (nextOpen.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = nextOpen.map((oid) => cards.find((c) => c.id === oid)!);
      if (a.symbol === b.symbol) {
        const nextCards = cards.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c));
        setCards(nextCards);
        setOpen([]);
        if (nextCards.filter((c) => c.matched).length / 2 === SYMBOLS.length) {
          recordBest(nextMoves);
        }
      } else {
        setLock(true);
        window.setTimeout(() => {
          setOpen([]);
          setLock(false);
        }, 700);
      }
    }
  };

  const restart = () => {
    setCards(shuffledDeck());
    setOpen([]);
    setMoves(0);
    setLock(false);
  };

  return (
    <div>
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
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => flip(card.id)}
              disabled={faceUp}
              aria-label={faceUp ? `${card.symbol}` : 'Hidden card'}
              className={`aspect-square rounded-2xl border text-2xl sm:text-3xl transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] min-h-[56px] ${
                faceUp
                  ? 'border-[#ffb3c1]/50 bg-[#250b18] scale-100'
                  : 'border-white/10 bg-[#190710]/70 hover:border-[#ffb3c1]/40 hover:bg-[#250b18]/80 hover:-translate-y-0.5'
              } ${card.matched ? 'opacity-90 shadow-[0_0_18px_rgba(216,27,70,0.35)]' : ''}`}
            >
              <span aria-hidden="true">{faceUp ? card.symbol : '💭'}</span>
            </button>
          );
        })}
      </div>

      {won && (
        <Reveal className="mt-5 rounded-2xl border border-[#ffd6a5]/40 bg-[#ffd6a5]/10 p-4 text-center">
          <p className="font-serif italic text-lg text-[#ffd6a5]">
            You matched every memory in {moves} moves. <span aria-hidden="true">💖</span>
          </p>
          <button type="button" onClick={restart} className="btn-primary btn-sm mt-3 font-serif cursor-pointer">
            Play again
          </button>
        </Reveal>
      )}
    </div>
  );
};

export default MemoryMatch;
