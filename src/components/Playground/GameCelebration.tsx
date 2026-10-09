import { LoveIcon } from './LoveIcon';
/** Mount only for a new win. CSS runs once, and stays inside the game panel. */
export function GameCelebration() {
  return <div className="game-celebration" aria-hidden="true">{Array.from({ length: 8 }, (_, i) => <span key={i} style={{ left: `${12 + i * 10}%`, animationDelay: `${i * 30}ms` }}><LoveIcon name="heart" /></span>)}</div>;
}
