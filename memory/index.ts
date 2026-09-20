/**
 * MemoryOS Layer Barrel Export
 * Central exports for Project Wish AI's 6 memory layers and self-healing engine.
 */

export * from './memoryos';

// Type definitions for the 6 Memory Planes
export interface UserMemoryProfile {
  userId: string;
  profile: {
    displayName: string;
    preferredTone: string;
    audioAutoPlayConsent: boolean;
    reducedMotion: boolean;
  };
  persistedWishes: Array<{
    wishId: string;
    text: string;
    stageOrigin: number;
    timestamp: string;
    sentimentScore: number;
  }>;
}

export interface ProjectMemoryProfile {
  projectGoals: string[];
  implementationStatus: Record<string, string>;
  architecturalDecisions: Array<{
    id: string;
    title: string;
    decision: string;
    status: string;
  }>;
  knownProblems: string[];
  todos: string[];
  roadmap: Array<{ phase: number; title: string; status: string }>;
  changelog: Array<{ version: string; date: string; notes: string }>;
}

export interface ConversationTurn {
  turnId: number;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  tokenCount: number;
  importance: number;
}

export interface AgentMemoryProfile {
  agentId: string;
  role: string;
  status: string;
  currentDriftScore: number;
  driftThreshold: number;
  scratchpad: string;
}

export interface KnowledgeGraphTriple {
  source: string;
  relation: string;
  target: string;
}
