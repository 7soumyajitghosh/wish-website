import { useMemo, useState, type FormEvent } from 'react';
import { Reveal } from '../Effects/Reveal';

const WORDS = [
  { word: 'FOREVER', hint: 'What love promises' },
  { word: 'STARLIT', hint: 'How the wishes look at night' },
  { word: 'HEARTBEAT', hint: 'The sound love makes' },
  { word: 'BLOSSOM', hint: 'What love does in spring' },
  { word: 'MOONLIGHT', hint: 'It guides late-night wishes' },
  { word: 'CHERISH', hint: 'To hold love gently' },
  { word: 'DEVOTION', hint: 'Love that never leaves' },
  { word: 'SERENADE', hint: 'A song sung for a sweetheart' },
];

function scramble(word: string): string {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  const result = letters.join('');
  return result === word ? scramble(word) : result;
}

export const WordScramble = () => {
  const [index, setIndex] = useState(() => Math.floor(Math.random() * WORDS.length));
  const [guess, setGuess] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const current = WORDS[index];
  const tiles = useMemo(() => scramble(current.word), [current.word]);
  const [reshuffled, setReshuffled] = useState<string | null>(null);
  const shown = reshuffled ?? tiles;

  const next = () => {
    setIndex((i) => (i + 1 + Math.floor(Math.random() * (WORDS.length - 1))) % WORDS.length);
    setGuess('');
    setMessage(null);
    setSolved(false);
    setRevealed(false);
    setReshuffled(null);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || solved) return;
    if (guess.trim().toUpperCase() === current.word) {
      setSolved(true);
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setMessage('Correct — your heart knew it all along.');
    } else {
      setStreak(0);
      setMessage('Not quite — try again, slowly.');
    }
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm font-sans tracking-widest uppercase text-[#fff8eb]/80">
          Solved: {score} · Streak: {streak}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReshuffled(scramble(current.word))}
            className="btn-ghost btn-sm font-serif cursor-pointer"
          >
            Re-shuffle
          </button>
          <button type="button" onClick={next} className="btn-ghost btn-sm font-serif cursor-pointer">
            Skip →
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#190710]/60 p-4 sm:p-5 text-center overflow-hidden">
        <p className="text-xs font-sans tracking-[0.3em] uppercase text-[#f5baa4]">Hint — {current.hint}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2" aria-label={`Scrambled word: ${shown.split('').join(' ')}`}>
          {shown.split('').map((letter, i) => (
            <span
              key={`${current.word}-${i}-${letter}`}
              aria-hidden="true"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-[#ffb3c1]/30 bg-[#250b18] font-serif text-lg sm:text-xl text-[#fffdf8]"
            >
              {letter}
            </span>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 flex flex-col items-center gap-3">
          <label htmlFor="scramble-guess" className="sr-only">
            Unscramble the love word
          </label>
          <input
            id="scramble-guess"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type the word…"
            autoComplete="off"
            maxLength={16}
            disabled={solved}
            className="w-full max-w-xs rounded-xl border border-[#ffb3c1]/30 bg-[#220b17]/70 px-4 py-3 text-center font-serif text-lg tracking-[0.2em] uppercase text-[#fffdf8] focus:border-[#ffb3c1]/70 focus-visible:outline-2 focus-visible:outline-[#ffd6a5]"
          />
          <button type="submit" disabled={!guess.trim() || solved} className="btn-primary btn-sm font-serif cursor-pointer">
            {solved ? 'Solved ✓' : 'Check answer'}
          </button>
        </form>

        <div aria-live="polite" className="mt-3 min-h-[1.75rem]">
          {message && <p className={`font-serif italic ${solved ? 'text-[#ffd6a5]' : 'text-[#f5baa4]'}`}>{message}</p>}
        </div>

        {solved ? (
          <button type="button" onClick={next} className="btn-ghost btn-sm mt-1 font-serif cursor-pointer">
            Next puzzle →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="mt-1 cursor-pointer rounded px-2 py-2 font-serif text-sm italic text-[#f5baa4] hover:text-[#ffd6a5]"
          >
            {revealed ? `It was “${current.word}” — press Skip for a new one` : 'Give me the answer'}
          </button>
        )}
      </div>

      {score >= 3 && (
        <Reveal className="mt-5 rounded-2xl border border-[#ffd6a5]/40 bg-[#ffd6a5]/10 p-4 text-center">
          <p className="font-serif italic text-[#ffd6a5]">Wordsmith of love — {score} puzzles solved!</p>
        </Reveal>
      )}
    </div>
  );
};

export default WordScramble;
