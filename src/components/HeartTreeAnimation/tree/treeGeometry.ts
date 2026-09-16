/**
 * Composite Tree Data assembler for HeartTreeAnimation.
 */
import { SeededRandom } from '../../../animation/bezierUtils';
import { type TreeRoot, buildRoots } from './roots';
import { type TreeBranch, type TwigEndInfo, buildBranches } from './branches';
import { type TreeHeart, buildHearts } from './heartAnchors';

export interface TreeData {
  roots: TreeRoot[];
  branches: TreeBranch[];
  hearts: TreeHeart[];
  twigEnds: TwigEndInfo[];
}

export function buildTree(baseX: number, baseY: number, scale: number): TreeData {
  const rng = new SeededRandom(42);
  const roots = buildRoots(baseX, baseY, scale, rng);
  const { branches, twigEnds, trunkH } = buildBranches(baseX, baseY, scale, rng);
  const hearts = buildHearts(branches, twigEnds, baseX, baseY, trunkH, scale, rng);

  return { roots, branches, hearts, twigEnds };
}
