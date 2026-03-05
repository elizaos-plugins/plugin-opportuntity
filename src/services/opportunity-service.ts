/**
 * @fileoverview OpportunityService - Manages opportunity detection and tracking
 *
 * This service tracks detected opportunities and manages their lifecycle.
 */

import { Service, type IAgentRuntime, type UUID } from '@elizaos/core';
import type { DetectedOpportunity, OpportunityType } from '../types.ts';
import { OPPORTUNITY_SERVICE_TYPE } from '../types.ts';
import { OpportunityEvents, Thresholds, Defaults } from '../constants.ts';

export class OpportunityService extends Service {
  static override serviceType = OPPORTUNITY_SERVICE_TYPE;
  public readonly capabilityDescription = 'Tracks and manages detected opportunities';

  private opportunities: Map<string, DetectedOpportunity> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(runtime: IAgentRuntime) {
    super(runtime);
  }

  static async start(runtime: IAgentRuntime): Promise<OpportunityService> {
    runtime.logger.info(
      { src: 'plugin:opportunity', agentId: runtime.agentId },
      'Starting Opportunity service'
    );

    const service = new OpportunityService(runtime);
    service.setupCleanup();

    runtime.logger.success(
      { src: 'plugin:opportunity', agentId: runtime.agentId },
      'Opportunity service started'
    );

    return service;
  }

  private setupCleanup(): void {
    // Clean up expired opportunities periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, Defaults.EVALUATION_INTERVAL);
  }

  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.opportunities.clear();
    this.runtime.logger.info(
      { src: 'plugin:opportunity', agentId: this.runtime.agentId },
      'Opportunity service stopped'
    );
  }

  /**
   * Add a new opportunity.
   */
  addOpportunity(opportunity: Omit<DetectedOpportunity, 'id' | 'detectedAt'>): DetectedOpportunity {
    const id = crypto.randomUUID();
    const full: DetectedOpportunity = {
      ...opportunity,
      id,
      detectedAt: Date.now(),
    };

    // Enforce max tracked
    if (this.opportunities.size >= Thresholds.MAX_TRACKED) {
      this.removeLowestPotential();
    }

    this.opportunities.set(id, full);

    this.runtime.emitEvent(OpportunityEvents.DETECTED, {
      runtime: this.runtime,
      source: 'opportunity',
      agentId: this.runtime.agentId,
      opportunity: full,
    });

    this.runtime.logger.debug(
      {
        src: 'plugin:opportunity',
        type: opportunity.type,
        potential: opportunity.potential,
      },
      'Opportunity detected'
    );

    return full;
  }

  /**
   * Remove an opportunity by ID.
   */
  removeOpportunity(id: string): boolean {
    return this.opportunities.delete(id);
  }

  /**
   * Get all active opportunities.
   */
  getOpportunities(): DetectedOpportunity[] {
    return Array.from(this.opportunities.values());
  }

  /**
   * Get opportunities by type.
   */
  getByType(type: OpportunityType): DetectedOpportunity[] {
    return this.getOpportunities().filter((o) => o.type === type);
  }

  /**
   * Get top opportunities by potential.
   */
  getTop(n: number = 5): DetectedOpportunity[] {
    return this.getOpportunities()
      .sort((a, b) => b.potential - a.potential)
      .slice(0, n);
  }

  /**
   * Get count of opportunities.
   */
  getCount(): number {
    return this.opportunities.size;
  }

  /**
   * Get available opportunity types.
   */
  getAvailableTypes(): OpportunityType[] {
    const types = new Set<OpportunityType>();
    for (const opp of this.opportunities.values()) {
      types.add(opp.type);
    }
    return Array.from(types);
  }

  /**
   * Clean up expired opportunities.
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [id, opp] of this.opportunities) {
      if (now - opp.detectedAt > Thresholds.EXPIRY_MS) {
        this.opportunities.delete(id);
        removed++;
      }
    }

    if (removed > 0) {
      this.runtime.logger.debug(
        { src: 'plugin:opportunity', removed },
        'Cleaned up expired opportunities'
      );
    }
  }

  /**
   * Remove the lowest potential opportunity to make room.
   */
  private removeLowestPotential(): void {
    let lowest: DetectedOpportunity | null = null;

    for (const opp of this.opportunities.values()) {
      if (!lowest || opp.potential < lowest.potential) {
        lowest = opp;
      }
    }

    if (lowest) {
      this.opportunities.delete(lowest.id);
    }
  }
}

