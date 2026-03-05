/**
 * @fileoverview OpportunityEvaluator - Assesses opportunity landscape
 *
 * Evaluates the current opportunity landscape and publishes appraisals.
 */

import type { IAgentRuntime } from '@elizaos/core';
import type { AppraisalService } from '@elizaos/plugin-appraisal';
import { APPRAISAL_SERVICE_TYPE, isEvaluatorEnabled } from '@elizaos/plugin-appraisal';

import type { OpportunityService } from '../services/opportunity-service.ts';
import type { OpportunityPayload, DetectedOpportunity } from '../types.ts';
import { OPPORTUNITY_SERVICE_TYPE, OPPORTUNITY_DOMAIN_ID } from '../types.ts';
import { OpportunityEvents, Thresholds, Defaults } from '../constants.ts';

/**
 * Evaluate opportunities and publish appraisal.
 */
export async function evaluateOpportunities(runtime: IAgentRuntime): Promise<void> {
  // Check if this evaluator is enabled for the current character
  if (!isEvaluatorEnabled(runtime, OPPORTUNITY_DOMAIN_ID)) {
    runtime.logger.debug(
      { src: 'plugin:opportunity' },
      'Opportunity evaluator disabled for this character - skipping'
    );
    return;
  }

  await runtime.initPromise;
  const opportunityService = runtime.getService(OPPORTUNITY_SERVICE_TYPE) as OpportunityService | null;
  const appraisalService = runtime.getService(APPRAISAL_SERVICE_TYPE) as AppraisalService | null;

  if (!opportunityService) {
    runtime.logger.warn(
      { src: 'plugin:opportunity' },
      'Opportunity service not available - skipping evaluation'
    );
    return;
  }

  const opportunities = opportunityService.getOpportunities();
  const payload = analyzeOpportunities(opportunities);
  const confidence = calculateConfidence(opportunities);

  // Emit evaluation event
  await runtime.emitEvent(OpportunityEvents.EVALUATED, {
    runtime,
    source: 'opportunity',
    agentId: runtime.agentId,
    payload,
    opportunityCount: opportunities.length,
  });

  // Publish to appraisal service if available
  if (appraisalService) {
    const accepted = appraisalService.publish<OpportunityPayload>({
      id: OPPORTUNITY_DOMAIN_ID,
      ts: Date.now(),
      confidence,
      source: 'plugin-opportunity',
      payload,
    });

    if (accepted) {
      await runtime.emitEvent(OpportunityEvents.APPRAISAL_PUBLISHED, {
        runtime,
        source: 'opportunity',
        agentId: runtime.agentId,
        payload,
        confidence,
      });
    }
  }
}

/**
 * Analyze opportunities and create payload.
 */
function analyzeOpportunities(opportunities: DetectedOpportunity[]): OpportunityPayload {
  const status = determineStatus(opportunities);
  const topOpportunities = opportunities
    .sort((a, b) => b.potential - a.potential)
    .slice(0, 5);
  const availableTypes = Array.from(new Set(opportunities.map((o) => o.type)));
  const avgPotential =
    opportunities.length > 0
      ? opportunities.reduce((sum, o) => sum + o.potential, 0) / opportunities.length
      : 0;
  const urgency = determineUrgency(opportunities);

  const notes: string[] = [];

  if (opportunities.length === 0) {
    notes.push('No active opportunities detected');
  }

  const highPotential = opportunities.filter((o) => o.potential >= Thresholds.EXCELLENT_POTENTIAL);
  if (highPotential.length > 0) {
    notes.push(`${highPotential.length} high-potential opportunit${highPotential.length === 1 ? 'y' : 'ies'}`);
  }

  const urgent = opportunities.filter((o) => o.immediacy >= Thresholds.URGENT_IMMEDIACY);
  if (urgent.length > 0) {
    notes.push(`${urgent.length} time-sensitive opportunit${urgent.length === 1 ? 'y' : 'ies'}`);
  }

  return {
    status,
    activeCount: opportunities.length,
    topOpportunities,
    availableTypes,
    avgPotential,
    urgency,
    notes: notes.length > 0 ? notes : undefined,
  };
}

/**
 * Determine overall opportunity status.
 */
function determineStatus(opportunities: DetectedOpportunity[]): OpportunityPayload['status'] {
  const count = opportunities.length;
  const avgPotential =
    count > 0 ? opportunities.reduce((sum, o) => sum + o.potential, 0) / count : 0;

  if (count <= Thresholds.SCARCE_COUNT) return 'scarce';
  if (count <= Thresholds.LIMITED_COUNT) return 'limited';
  if (count >= Thresholds.ABUNDANT_COUNT && avgPotential >= Thresholds.GOOD_POTENTIAL) {
    return 'abundant';
  }
  if (count >= Thresholds.RICH_COUNT || avgPotential >= Thresholds.EXCELLENT_POTENTIAL) {
    return 'rich';
  }
  return 'open';
}

/**
 * Determine urgency level.
 */
function determineUrgency(opportunities: DetectedOpportunity[]): OpportunityPayload['urgency'] {
  if (opportunities.length === 0) return 'none';

  const urgent = opportunities.filter((o) => o.immediacy >= Thresholds.URGENT_IMMEDIACY);
  const immediateCount = opportunities.filter((o) => o.timeframe === 'immediate').length;

  if (urgent.length >= 3 || immediateCount >= 2) return 'high';
  if (urgent.length >= 1 || immediateCount >= 1) return 'moderate';

  const shortTerm = opportunities.filter((o) => o.timeframe === 'short_term').length;
  if (shortTerm > 0) return 'low';

  return 'none';
}

/**
 * Calculate confidence based on data quality.
 */
function calculateConfidence(opportunities: DetectedOpportunity[]): number {
  // Base confidence from having any opportunities
  let confidence = Defaults.MIN_CONFIDENCE;

  if (opportunities.length > 0) {
    confidence += 0.2;

    // More diverse types = more comprehensive picture
    const types = new Set(opportunities.map((o) => o.type));
    confidence += Math.min(0.2, types.size * 0.05);

    // High individual confidence in detections
    const avgConfidence =
      opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length;
    confidence += avgConfidence * 0.2;
  }

  return Math.min(confidence, Defaults.MAX_CONFIDENCE);
}

/**
 * Set up evaluation triggers.
 */
export function setupOpportunityEvaluation(runtime: IAgentRuntime): void {
  // Evaluate on new opportunity detection
  runtime.registerEvent(OpportunityEvents.DETECTED, async () => {
    await evaluateOpportunities(runtime);
  });

  // Set up periodic evaluation
  setInterval(async () => {
    await evaluateOpportunities(runtime);
  }, Defaults.EVALUATION_INTERVAL);

  runtime.logger.debug(
    { src: 'plugin:opportunity' },
    'Opportunity evaluation triggers configured'
  );
}

