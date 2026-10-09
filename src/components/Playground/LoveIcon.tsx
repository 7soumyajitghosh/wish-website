export type LoveIconName = 'heart' | 'rose' | 'moon' | 'star' | 'letter' | 'butterfly' | 'memory' | 'puzzle' | 'thought' | 'check';
const paths: Record<LoveIconName, string> = {
  heart: 'M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z',
  rose: 'M12 14c-5 0-8-4-6-7 1-2 3-3 6-2 3-1 5 0 6 2 2 3-1 7-6 7Zm0 0v7m0-4c3-3 5-2 6-2-1 3-4 4-6 4M9 9c0-3 6-3 6 0 0 3-6 3-6 0Z',
  moon: 'M20 15A9 9 0 0 1 9 3a9 9 0 1 0 11 12Z',
  star: 'm12 3 2.5 6 6.5 3-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-3L12 3Z',
  letter: 'M3 6h18v13H3V6Zm0 0 9 8 9-8M3 19l6-7m12 7-6-7',
  butterfly: 'M12 8c-7-10-13 6-3 5-8 4-1 10 3 2 4 8 11 2 3-2 10 1 4-15-3-5Zm0 0v9',
  memory: 'M6 3h12v16H6V3ZM3 7v14h11m-2-14c-4-4-7 1 0 6 7-5 4-10 0-6Z',
  puzzle: 'M4 4h6c-2 6 6 6 4 0h6v6c-6-2-6 6 0 4v6h-6c2-6-6-6-4 0H4v-6c6 2 6-6 0-4V4Z',
  thought: 'M20 10a8 7 0 1 1-4-6m-9 14-3 3m1-4-2 2m13-17 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z',
  check: 'm5 12 4 4L19 6',
};
export function LoveIcon({ name, className = '' }: { name: LoveIconName; className?: string }) {
  return <svg aria-hidden="true" focusable="false" className={`love-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
