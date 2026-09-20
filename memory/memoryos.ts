/**
 * MemoryOS — Self-Healing Memory Architecture for AI Agents
 * 
 * Inspired by BAI-LAB / shivampoddar12/memoryos-project.
 * Implements 6-layer memory hierarchy, mathematical drift detection,
 * exponential temporal decay, autonomous auto-healing, and a synchronization bus.
 */

export interface MemoryItem {
  id: string;
  layer: 'user' | 'project' | 'conversation' | 'agent' | 'codebase' | 'knowledge';
  content: string;
  importance: number; // 0.0 to 1.0
  createdAt: number;  // epoch timestamp ms
  lastAccessedAt: number;
  metadata?: Record<string, unknown>;
}

export interface HealEvent {
  healId: string;
  timestamp: number;
  agentId: string;
  preHealDrift: number;
  postHealDrift: number;
  prunedCount: number;
  reInjectedAnchors: string[];
}

export interface SyncBusEvent {
  eventId: string;
  timestamp: number;
  sourceAgent: string;
  eventType: 'MEMORY_STORED' | 'MEMORY_PRUNED' | 'DRIFT_DETECTED' | 'AUTO_HEALED';
  payload: Record<string, unknown>;
}

export type SyncBusListener = (event: SyncBusEvent) => void;

/**
 * Computes cosine similarity between two numeric vectors.
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * MemoryOS Core Engine
 */
export class MemoryOS {
  private memories: Map<string, MemoryItem> = new Map();
  private baselineVector: number[] = [];
  private currentVector: number[] = [];
  private driftThreshold: number = 0.45; // theta = 0.45 from benchmark
  private decayRate: number = 0.05;      // lambda = 0.05 per hour/turn
  private listeners: Set<SyncBusListener> = new Set();
  private healHistory: HealEvent[] = [];

  constructor(baselineVector?: number[], threshold: number = 0.45) {
    if (baselineVector) {
      this.baselineVector = [...baselineVector];
      this.currentVector = [...baselineVector];
    }
    this.driftThreshold = threshold;
  }

  /**
   * Set foundational baseline vector (anchor for drift calculation).
   */
  public setBaselineVector(vec: number[]) {
    this.baselineVector = [...vec];
    this.currentVector = [...vec];
  }

  /**
   * Update active context state vector.
   */
  public updateCurrentVector(vec: number[]) {
    this.currentVector = [...vec];
  }

  /**
   * Store or update a memory item.
   */
  public storeMemory(item: Omit<MemoryItem, 'createdAt' | 'lastAccessedAt'>): MemoryItem {
    const now = Date.now();
    const fullItem: MemoryItem = {
      ...item,
      createdAt: now,
      lastAccessedAt: now,
    };
    this.memories.set(fullItem.id, fullItem);
    this.emitSyncEvent('MEMORY_STORED', { memoryId: fullItem.id, layer: fullItem.layer });
    return fullItem;
  }

  /**
   * Calculate temporal relevance of a memory item using exponential decay:
   * relevance(m, t) = importance(m) * e^(-lambda * deltaT)
   */
  public calculateRelevance(item: MemoryItem, currentTimestamp: number = Date.now()): number {
    const deltaHours = Math.max(0, (currentTimestamp - item.lastAccessedAt) / (1000 * 60 * 60));
    return item.importance * Math.exp(-this.decayRate * deltaHours);
  }

  /**
   * Calculate current semantic drift score:
   * drift(t) = 1 - cosine_similarity(v_baseline, v_current)
   */
  public calculateDrift(): number {
    if (this.baselineVector.length === 0 || this.currentVector.length === 0) return 0;
    const similarity = cosineSimilarity(this.baselineVector, this.currentVector);
    const drift = Math.max(0, 1 - similarity);
    return Number(drift.toFixed(4));
  }

  /**
   * Evaluate health and trigger auto-heal if drift >= threshold (0.45).
   */
  public evaluateAndAutoHeal(agentId: string = 'system_agent'): { healed: boolean; drift: number; healEvent?: HealEvent } {
    const drift = this.calculateDrift();
    if (drift < this.driftThreshold) {
      return { healed: false, drift };
    }

    // Trigger Auto-Heal Routine
    const preHealDrift = drift;
    const prunedIds: string[] = [];
    const now = Date.now();

    // 1. Prune stale memories with low relevance
    for (const [id, item] of this.memories.entries()) {
      if (item.layer === 'conversation' || item.layer === 'agent') {
        const relevance = this.calculateRelevance(item, now);
        if (relevance < 0.25) {
          this.memories.delete(id);
          prunedIds.push(id);
        }
      }
    }

    // 2. Identify top anchor memories (Project & User Memory)
    const anchorItems = Array.from(this.memories.values())
      .filter((m) => m.layer === 'project' || m.layer === 'user')
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3);

    const anchorKeys = anchorItems.map((m) => m.content);

    // 3. Re-anchor current vector to baseline
    this.currentVector = [...this.baselineVector];
    const postHealDrift = this.calculateDrift();

    const healEvent: HealEvent = {
      healId: `heal_${Date.now()}`,
      timestamp: now,
      agentId,
      preHealDrift,
      postHealDrift,
      prunedCount: prunedIds.length,
      reInjectedAnchors: anchorKeys,
    };

    this.healHistory.push(healEvent);
    this.emitSyncEvent('AUTO_HEALED', { healEvent });

    return { healed: true, drift: postHealDrift, healEvent };
  }

  /**
   * Retrieve memories filtered by layer and ranked by relevance.
   */
  public queryLayer(layer: MemoryItem['layer'], minRelevance: number = 0.2): MemoryItem[] {
    const now = Date.now();
    return Array.from(this.memories.values())
      .filter((m) => m.layer === layer)
      .filter((m) => this.calculateRelevance(m, now) >= minRelevance)
      .sort((a, b) => this.calculateRelevance(b, now) - this.calculateRelevance(a, now));
  }

  /**
   * Multi-Agent Synchronization Bus
   */
  public subscribe(listener: SyncBusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitSyncEvent(eventType: SyncBusEvent['eventType'], payload: Record<string, unknown>) {
    const event: SyncBusEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      sourceAgent: 'MemoryOS_Kernel',
      eventType,
      payload,
    };
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  public getHealHistory(): HealEvent[] {
    return [...this.healHistory];
  }

  public getAllMemories(): MemoryItem[] {
    return Array.from(this.memories.values());
  }
}

// Global MemoryOS Singleton instance
export const memoryOS = new MemoryOS();
