import { useEffect, useRef, useState } from 'react';

type Mark = 'YOU' | 'CUPID' | null;

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const EMOJI: Record<Exclude<Mark, null>, string> = { YOU: '❤️', CUPID: '🌹' };

function winnerOf(board: Mark[]): Mark | 'DRAW' | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return board.every(Boolean) ? 'DRAW' : null;
}

/** Cupid plays: win if possible, block if needed, else centre/corner/random. */
function cupidMove(board: Mark[]): number {
  const empty = board.map((m, i) => (m === null ? i : -1)).filter((i) => i >= 0);
  const tryLine = (mark: Exclude<Mark, null>) => {
    for (const [a, b, c] of LINES) {
      const line = [board[a], board[b], board[c]];
      if (line.filter((m) => m === mark).length === 2 && line.includes(null)) {
        return [a, b, c][line.indexOf(null)];
      }
    }
    return -1;
  };
  const win = tryLine('CUPID');
  if (win >= 0) return win;
  const block = tryLine('YOU');
  if (block >= 0) return block;
  if (board[4] === null) return 4;
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empty[Math.floor(Math.random() * empty.length)];
}

export const TicTacToe = () => {
  const [board, setBoard] = useState<Mark[]>(Array(9).fill(null));
  const [tally, setTally] = useState({ you: 0, cupid: 0, draws: 0 });
  const result = winnerOf(board);
  const over = result !== null;
  const playAgainRef = useRef<HTMLButtonElement>(null);
  // Tally is event-driven (not setState-in-effect): each terminal board is
  // counted once via its board key, reset clears the key for the next round.
  const talliedKeyRef = useRef<string | null>(null);
  const boardRef = useRef(board);
  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  const countResult = (next: Mark[]) => {
    const r = winnerOf(next);
    if (r === null) return;
    const key = next.join(',');
    if (talliedKeyRef.current === key) return;
    talliedKeyRef.current = key;
    if (r === 'YOU') setTally((t) => ({ ...t, you: t.you + 1 }));
    else if (r === 'CUPID') setTally((t) => ({ ...t, cupid: t.cupid + 1 }));
    else if (r === 'DRAW') setTally((t) => ({ ...t, draws: t.draws + 1 }));
  };

  const play = (i: number) => {
    const current = boardRef.current;
    const youCount = current.filter((m) => m === 'YOU').length;
    const cupidCount = current.filter((m) => m === 'CUPID').length;
    if (current[i] || winnerOf(current) || youCount !== cupidCount) return;
    const next = [...current];
    next[i] = 'YOU';
    boardRef.current = next;
    setBoard(next);
    countResult(next);
  };

  // Cupid answers shortly after you play.
  useEffect(() => {
    if (over) {
      // Announce the result to keyboard/SR users by moving focus on.
      playAgainRef.current?.focus({ preventScroll: true });
      return;
    }
    const current = boardRef.current;
    const youCount = current.filter((m) => m === 'YOU').length;
    const cupidCount = current.filter((m) => m === 'CUPID').length;
    if (youCount === cupidCount + 1) {
      const snapshot = [...current];
      const t = window.setTimeout(() => {
        // Skip if the board changed (e.g. reset) while thinking.
        const latest = boardRef.current;
        if (latest.join(',') !== snapshot.join(',')) return;
        if (winnerOf(latest)) return;
        const next = [...latest];
        next[cupidMove(next)] = 'CUPID';
        boardRef.current = next;
        setBoard(next);
        countResult(next);
      }, 450);
      return () => window.clearTimeout(t);
    }
  }, [board, over]);

  const reset = () => {
    talliedKeyRef.current = null;
    const empty: Mark[] = Array(9).fill(null);
    boardRef.current = empty;
    setBoard(empty);
  };

  const status =
    result === 'YOU'
      ? 'You win — love conquers all!'
      : result === 'CUPID'
        ? 'Cupid wins this round — try again.'
        : result === 'DRAW'
          ? 'A draw — perfectly balanced hearts.'
          : board.filter((m) => m === 'YOU').length > board.filter((m) => m === 'CUPID').length
            ? 'Cupid is thinking…'
            : 'Your move — place a heart.';

  const isYourTurn =
    board.filter((m) => m === 'YOU').length ===
    board.filter((m) => m === 'CUPID').length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-sans tracking-widest uppercase text-[#fff8eb]/80">
          You {tally.you} · Cupid {tally.cupid} · Draws {tally.draws}
        </p>
        <button type="button" onClick={reset} className="btn-ghost btn-sm font-serif cursor-pointer">
          New round
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-[320px] grid-cols-3 gap-2 sm:gap-3" role="group" aria-label="Tic tac toe board">
        {board.map((mark, i) => (
          <button
            key={i}
            type="button"
            onClick={() => play(i)}
            disabled={!!mark || over || !isYourTurn}
            aria-label={mark ? `${EMOJI[mark]} at position ${i + 1}` : `Empty square ${i + 1}`}
            className={`aspect-square min-h-[64px] rounded-2xl border text-2xl sm:text-3xl transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ffd6a5] ${
              mark
                ? 'border-[#ffb3c1]/50 bg-[#250b18]'
                : 'border-white/10 bg-[#190710]/70 hover:border-[#ffb3c1]/40 hover:bg-[#250b18]/80'
            } ${!mark && !over ? 'hover:-translate-y-0.5' : ''} disabled:cursor-default`}
          >
            <span aria-hidden="true">{mark ? EMOJI[mark] : ''}</span>
          </button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-center font-serif italic text-[#ffd6a5]">
        {status}
      </p>
      {over && (
        <div className="mt-2 text-center">
          <button ref={playAgainRef} type="button" onClick={reset} className="btn-primary btn-sm font-serif cursor-pointer">
            Play again
          </button>
        </div>
      )}
      <p className="mt-3 text-center text-xs font-sans tracking-widest uppercase text-[#fff8eb]/80">
        You are ❤️ · Cupid is 🌹
      </p>
    </div>
  );
};

export default TicTacToe;
