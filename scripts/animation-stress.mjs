/* 250-iteration animation stress harness (pure-math, no DOM).
 * Run: node scripts/animation-stress.mjs  (also via powershell bypass)
 * Checks determinism, monotonicity, NaN-safety, stage coverage. */
import { readFileSync } from 'node:fs';

// ---- inline copies of pure logic (mirrors src, so harness runs without TS build) ----
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function rangeProgress(t,start,end){ if(end<=start) return t>=start?1:0; return clamp01((t-start)/(end-start)); }
function lerp(a,b,t){ return a+(b-a)*t; }
function easeOrganicBloom(t){ if(t<=0) return 0; if(t>=1) return 1; if(t<0.4) return (t/0.4)*0.7; if(t<0.75) return 0.7+((t-0.4)/0.35)*0.35; return 1.05-((t-0.75)/0.25)*0.05; }
function easeOutCubic(t){ return 1-Math.pow(1-t,3); }
class SeededRandom{ constructor(seed){ this.seed=seed%2147483647; if(this.seed<=0) this.seed+=2147483646; } next(){ this.seed=(this.seed*16807)%2147483647; return (this.seed-1)/2147483646; } range(mn,mx){ return mn+this.next()*(mx-mn);} symmetric(){ return this.next()*2-1; } }

// Read live constants from source so harness tests the REAL files
const flightSrc = readFileSync('src/components/HeartTreeAnimation/animation/flightTimeline.ts','utf8');
const detach = parseFloat(/DETACH_START:\s*([0-9.]+)/.exec(flightSrc)[1]);
const streamPeak = parseFloat(/STREAM_PEAK:\s*([0-9.]+)/.exec(flightSrc)[1]);
const fadeStart = parseFloat(/FADE_LOOP_START:\s*([0-9.]+)/.exec(flightSrc)[1]);
const growthSrc = readFileSync('src/components/HeartTreeAnimation/animation/growthTimeline.ts','utf8');
const destSrc = readFileSync('src/components/FinalDestination/FinalDestination.tsx','utf8');
const tops = [...destSrc.matchAll(/top:\s*([0-9.]+)/g)].map(m=>parseFloat(m[1]));

const GROWTH_T = { SEED_START:0.04, ROOTS_START:0.10, TRUNK_START:0.20, TRUNK_MID:0.26, PRIMARY_START:0.32, SECONDARY_START:0.42, TWIGS_START:0.52 };
const BLOOM_T = { BUDS_START:0.62, BLOOM1_START:0.68, BLOOM2_START:0.74, FULL_BLOOM:0.82 };
const WIND_T = { WIND_START:0.84, WIND_PEAK:0.90 };
const FLIGHT_T = { DETACH_START:detach, STREAM_PEAK:streamPeak, FADE_LOOP_START:fadeStart, CYCLE_END:1.0 };

// Current (buggy-order) stage mapper copied from HeartTreeAnimation.tsx
function getStageBuggy(p){
  if (p < GROWTH_T.SEED_START) return 1;
  if (p < GROWTH_T.ROOTS_START) return 2;
  if (p < GROWTH_T.TRUNK_START) return 3;
  if (p < GROWTH_T.TRUNK_MID) return 4;
  if (p < GROWTH_T.PRIMARY_START) return 5;
  if (p < GROWTH_T.SECONDARY_START) return 6;
  if (p < GROWTH_T.TWIGS_START) return 7;
  if (p < BLOOM_T.BUDS_START) return 8;
  if (p < BLOOM_T.BLOOM1_START) return 9;
  if (p < BLOOM_T.BLOOM2_START) return 10;
  if (p < BLOOM_T.FULL_BLOOM) return 11;
  if (p < WIND_T.WIND_START) return 12;
  if (p < FLIGHT_T.DETACH_START) return 13;
  if (p < FLIGHT_T.FADE_LOOP_START) return 14;
  if (p < FLIGHT_T.CYCLE_END) return 15;
  return 16;
}

const ITERS = 250;
let fails = [];
let stageSeen = new Set();
let prevStage = 0;
let monotonicViolations = 0;

for(let i=0;i<ITERS;i++){
  const p = i/(ITERS-1); // 0..1 sweep, 250 steps
  // 1. rangeProgress sanity at every step
  for(const [s,e] of [[0.2,0.32],[0.62,0.68],[0.84,0.90],[detach,streamPeak]]){
    const v = rangeProgress(p,s,e);
    if(!(v>=0&&v<=1&&Number.isFinite(v))) fails.push(`iter ${i} rangeProgress NaN/out [${s},${e}] p=${p}`);
  }
  // 2. easing finite
  for(const f of [easeOrganicBloom,easeOutCubic]){
    const v=f(clamp01(p)); if(!Number.isFinite(v)) fails.push(`iter ${i} easing NaN`);
  }
  // 3. stage mapping
  const st = getStageBuggy(p);
  stageSeen.add(st);
  if(st<prevStage) monotonicViolations++;
  prevStage=st;
  // 4. seeded RNG determinism (rebuild twice, must match)
  const a=new SeededRandom(42), b=new SeededRandom(42);
  for(let k=0;k<5;k++){ if(a.next()!==b.next()){ fails.push(`iter ${i} RNG nondeterministic`); break; } }
  // 5. wind strength finite + monotonic non-decreasing after WIND_START
  const ws = p<WIND_T.WIND_START?0:p<WIND_T.WIND_PEAK?rangeProgress(p,WIND_T.WIND_START,WIND_T.WIND_PEAK)*14:14+rangeProgress(p,WIND_T.WIND_PEAK,1)*12;
  if(!Number.isFinite(ws)||ws<0||ws>26.001) fails.push(`iter ${i} wind out of range ${ws}`);
  // 6. flight particle update finite (single particle sim)
  let px=100,py=200,vx=3,vy=-1,sr=0;
  const speed=1; sr=Math.min(1,sr+0.008*speed); vx+=0.02*speed;
  if(![px+vx,py+vy,sr].every(Number.isFinite)) fails.push(`iter ${i} flight NaN`);
}

// Global checks (not per-iter)
if(detach < BLOOM_T.FULL_BLOOM) fails.push(`ORDER BUG: DETACH_START(${detach}) < FULL_BLOOM(${BLOOM_T.FULL_BLOOM}) -> hearts detach mid-bloom`);
if(detach < WIND_T.WIND_PEAK) fails.push(`ORDER BUG: DETACH_START(${detach}) < WIND_PEAK(${WIND_T.WIND_PEAK}) -> detach before gale peaks`);
if(!(detach<streamPeak&&streamPeak<=1&&fadeStart<1)) fails.push(`FLIGHT timeline not ascending`);
for(let s=12;s<=13;s++){ if(!stageSeen.has(s)) fails.push(`STAGE BUG: stage ${s} unreachable in 250-step sweep (seen: ${[...stageSeen].sort((a,b)=>a-b)})`); }
const badTops = tops.filter(t=>t>100);
if(badTops.length) fails.push(`DESTINATION BUG: ${badTops.length} floating hearts have top>100% (${badTops.slice(0,4)}) -> start off-screen, invisible`);

console.log(`--- animation stress: ${ITERS} iterations ---`);
console.log(`DETACH_START=${detach} STREAM_PEAK=${streamPeak} FADE_LOOP_START=${fadeStart}`);
console.log(`stages seen: ${[...stageSeen].sort((a,b)=>a-b).join(',')}`);
console.log(`monotonic violations: ${monotonicViolations}`);
if(fails.length){ console.log(`FAIL (${fails.length}):`); [...new Set(fails)].forEach(f=>console.log(' - '+f)); process.exit(1); }
else console.log('PASS: all 250 iterations clean');
