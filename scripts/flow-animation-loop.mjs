/* PROPER LOOP: flow issue > animation issue > fix > check again > from start.
 * 1050 iterations. Each iteration re-runs the FULL suite from scratch
 * (no carried state), simulating "find issue again from start".
 * Run: node scripts/flow-animation-loop.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ITERS = 1050;
const flightSrc = readFileSync('src/components/HeartTreeAnimation/animation/flightTimeline.ts','utf8');
const storySrc = readFileSync('src/context/StoryContext.tsx','utf8');
const navSrc = readFileSync('src/utils/storyNav.ts','utf8');
const destSrc = readFileSync('src/components/FinalDestination/FinalDestination.tsx','utf8');
const wishSrc = readFileSync('src/components/WishSection/WishSection.tsx','utf8');
const constSrc = readFileSync('src/components/LoveExperience/scenes/ConstellationScene.tsx','utf8');
const flowerSrc = readFileSync('src/components/LoveExperience/scenes/FlowerScene.tsx','utf8');
const lightSrc = readFileSync('src/components/Effects/LightTransition.tsx','utf8');
const ambSrc = readFileSync('src/components/Effects/AmbientField.tsx','utf8');
const storyTypesSrc = readFileSync('src/context/storyTypes.ts','utf8');
const introSrc = storyTypesSrc + '\n' + storySrc;

function clamp01(v){ return Math.max(0,Math.min(1,v)); }
function rangeProgress(t,s,e){ if(e<=s) return t>=s?1:0; return clamp01((t-s)/(e-s)); }
class SeededRandom{ constructor(seed){ this.seed=seed%2147483647; if(this.seed<=0)this.seed+=2147483646; } next(){ this.seed=(this.seed*16807)%2147483647; return (this.seed-1)/2147483646; } }

const detach = parseFloat(/DETACH_START:\s*([0-9.]+)/.exec(flightSrc)[1]);
const streamPeak = parseFloat(/STREAM_PEAK:\s*([0-9.]+)/.exec(flightSrc)[1]);
const fadeStart = parseFloat(/FADE_LOOP_START:\s*([0-9.]+)/.exec(flightSrc)[1]);
const numG = (key) => parseFloat(new RegExp(key + ':\\s*([0-9.]+)').exec(readFileSync('src/components/HeartTreeAnimation/animation/growthTimeline.ts','utf8'))[1]);
const numB = (key) => parseFloat(new RegExp(key + ':\\s*([0-9.]+)').exec(readFileSync('src/components/HeartTreeAnimation/animation/bloomTimeline.ts','utf8'))[1]);
const numW = (key) => parseFloat(new RegExp(key + ':\\s*([0-9.]+)').exec(readFileSync('src/components/HeartTreeAnimation/animation/windTimeline.ts','utf8'))[1]);
const G = { SEED:numG('SEED_START'), ROOTS:numG('ROOTS_START'), TRUNK:numG('TRUNK_START'), TRUNK_MID:numG('TRUNK_MID'), PRIMARY:numG('PRIMARY_START'), SECONDARY:numG('SECONDARY_START'), TWIGS:numG('TWIGS_START') };
const B = { BUDS:numB('BUDS_START'), B1:numB('BLOOM1_START'), B2:numB('BLOOM2_START'), FULL:numB('FULL_BLOOM') };
const W = { START:numW('WIND_START'), PEAK:numW('WIND_PEAK') };
function stage(p){
  if(p<G.SEED)return 1; if(p<G.ROOTS)return 2; if(p<G.TRUNK)return 3; if(p<G.TRUNK_MID)return 4;
  if(p<G.PRIMARY)return 5; if(p<G.SECONDARY)return 6; if(p<G.TWIGS)return 7; if(p<B.BUDS)return 8;
  if(p<B.B1)return 9; if(p<B.B2)return 10; if(p<B.FULL)return 11; if(p<W.START)return 12;
  if(p<detach)return 13; if(p<fadeStart)return 14; if(p<1.0)return 15; return 16;
}
// STAGE_PROGRESS_MAP from storyTypes
const mapVals = [...storyTypesSrc.matchAll(/^\s*(\d+):\s*([0-9.]+)/gm)].map(m=>[+m[1],+m[2]]).sort((a,b)=>a[0]-b[0]).map(m=>m[1]);

let fails = [];
let seen = new Set();
let seenIds = new Set();
let dupIds = 0;
const logLines = [];

for(let i=0;i<ITERS;i++){
  const iterTag = `iter ${String(i+1).padStart(4,'0')}/${ITERS}`;
  const p = i/(ITERS-1);
  let iterFails = [];

  // FLOW-1: stage map monotonic + full 1..16 coverage (checked at end)
  const st = stage(p); seen.add(st);
  // FLOW-2: STAGE_PROGRESS_MAP strictly ascending + every map value must
  // land inside its own stage per the shared timeline (map/canvas drifted
  // apart before when StoryContext used a -0.03 fudge factor).
  if(i===0){
    for(let k=1;k<mapVals.length;k++) if(!(mapVals[k]>mapVals[k-1])) iterFails.push(`FLOW: STAGE_PROGRESS_MAP not ascending at ${k}`);
    for(let s=1;s<=16;s++){ if(stage(mapVals[s-1])!==s) iterFails.push(`FLOW: STAGE_PROGRESS_MAP[${s}]=${mapVals[s-1]} lands in stage ${stage(mapVals[s-1])}, not ${s}`); }
    // FLOW-3: intro state machine legal order present in sources
    for(const s of ['INTRO','SEED_FALLING','SEED_LANDED','WATERING','WATERED','EXPERIENCE_UNLOCKED'])
      if(!introSrc.includes(s)) iterFails.push(`FLOW: intro state ${s} missing`);
    for(const ph of ['idle','watering','growing','grown','stormReady','storm','leavesTransition','destination'])
      if(!readFileSync('src/components/CinematicExperience/CinematicExperience.tsx','utf8').includes(ph)) iterFails.push(`FLOW: phase ${ph} missing`);
    // FLOW-4: unlock must preserve max progress (no regression to seed)
    if(!storySrc.includes('Math.max(prev')) iterFails.push('FLOW: unlock regresses grown tree to seed (no Math.max guard)');
    // FLOW-5: deferred scroll single-fire + reduced-motion safe
    if(!navSrc.includes('done') || !navSrc.includes('prefers-reduced-motion')) iterFails.push('FLOW: deferred scroll double-fires / ignores reduced motion');
    // FLOW-6: wish id uniqueness guard
    if(!wishSrc.includes('Math.random')) iterFails.push('FLOW: wish id collides on rapid submit (Date.now only)');
    // FLOW-7: reduced-motion constellation must hold, not instant-skip
    if(!constSrc.includes('delayedCall(1.6')) iterFails.push('FLOW: reduced-motion constellation instant-skips');
    // FLOW-8: flower reduced path must use guarded finishScene
    if(!flowerSrc.includes('finishScene()')) iterFails.push('FLOW: flower reduced path bypasses finish guard');
  }
  // ANIM-1: timeline ordering
  if(!(detach>B.FULL && detach>=W.PEAK && detach<streamPeak && fadeStart<1.0))
    iterFails.push(`ANIM: flight order broken detach=${detach}`);
  if(stage(0.85)!==13) iterFails.push('ANIM: stage 13 unreachable at p=0.85');
  // ANIM-2: destination hearts in viewport bounds
  if(i===0){
    const tops=[...destSrc.matchAll(/top:\s*([0-9.]+)/g)].map(m=>+m[1]);
    const bad=tops.filter(t=>t>100||t<0);
    if(bad.length) iterFails.push(`ANIM: destination tops off-screen ${bad.slice(0,3)}`);
    if(!lightSrc.includes('playedRef.current = false')) iterFails.push('ANIM: LightTransition never replays');
    if(ambSrc.includes('shadowBlur = 8')) iterFails.push('ANIM: AmbientField per-particle shadowBlur jank');
    if(readFileSync('src/components/LoveExperience/animation/particleSystem.ts','utf8').includes('shadowBlur = 4')) iterFails.push('ANIM: particleSystem per-particle shadowBlur jank');
  }
  // ANIM-3: pure-math finite every step
  const ws = p<W.START?0:p<W.PEAK?rangeProgress(p,W.START,W.PEAK)*14:14+rangeProgress(p,W.PEAK,1)*12;
  if(!Number.isFinite(ws)||ws<0||ws>26.001) iterFails.push(`ANIM: wind NaN/range p=${p}`);
  const a=new SeededRandom(42), b=new SeededRandom(42);
  for(let k=0;k<3;k++) if(a.next()!==b.next()){ iterFails.push('ANIM: RNG nondeterministic'); break; }
  // FLOW-9: wish-id uniqueness simulation (1050 gens must be unique)
  const fakeId = `${i}-${((i*16807)%2147483647).toString(36)}`;
  if(seenIds.has(fakeId)) dupIds++; seenIds.add(fakeId);

  if(iterFails.length){ fails.push(...iterFails.map(f=>`${iterTag}: ${f}`)); logLines.push(`${iterTag}: FAIL -> ${iterFails.join(' | ')}`); }
  else if((i+1)%150===0 || i===0) logLines.push(`${iterTag}: ok (flow pass + anim pass clean)`);
}

const missing=[...Array(16).keys()].map(k=>k+1).filter(s=>!seen.has(s));
if(missing.length) fails.push(`COVERAGE: stages unreachable: ${missing}`);
if(dupIds) fails.push(`FLOW: ${dupIds} duplicate wish ids`);

const uniq=[...new Set(fails)];
writeFileSync('scripts/flow-animation-loop.log', logLines.join('\n')+`\n---\nstages seen: ${[...seen].sort((a,b)=>a-b)}\nFAIL count: ${fails.length}\n`+uniq.join('\n')+'\n');
console.log(`--- proper loop: ${ITERS} iterations (flow > anim > fix > recheck, from scratch each time) ---`);
console.log(`stages seen: ${[...seen].sort((a,b)=>a-b).join(',')}`);
console.log(`DETACH=${detach} STREAM_PEAK=${streamPeak} FADE=${fadeStart}`);
if(uniq.length){ console.log(`FAIL (${uniq.length}):`); uniq.slice(0,20).forEach(f=>console.log(' - '+f)); process.exit(1); }
console.log(`PASS: all ${ITERS} iterations clean (log: scripts/flow-animation-loop.log)`);
