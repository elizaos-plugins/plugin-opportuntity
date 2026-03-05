/**
 * @fileoverview Type definitions for plugin-opportunity
 *
 * Opportunity evaluator detects and assesses actionable opportunities
 * from conversations and context.
 */

/**
 * Types of opportunities.
 */
export type OpportunityType =
  | 'collaboration'      // Partnership/teamwork opportunities
  | 'networking'         // New connections
  | 'learning'           // Knowledge/skill acquisition
  | 'financial'          // Money-making opportunities
  | 'influence'          // Power/authority opportunities
  | 'visibility'         // Fame/reputation opportunities
  | 'assistance'         // Helping others
  | 'resource'           // Resource acquisition
  | 'other';

/**
 * Individual detected opportunity.
 */
export interface DetectedOpportunity {
  /** Unique identifier */
  id: string;

  /** Type of opportunity */
  type: OpportunityType;

  /** Brief description */
  description: string;

  /** Potential value (0-1) */
  potential: number;

  /** How actionable right now (0-1) */
  immediacy: number;

  /** How confident we are in this detection */
  confidence: number;

  /** When detected */
  detectedAt: number;

  /** Source context (room, entity, etc.) */
  source?: string;

  /** Time sensitivity */
  timeframe: 'immediate' | 'short_term' | 'long_term' | 'unknown';
}

/**
 * Opportunity payload published to plugin-appraisal.
 */
export interface OpportunityPayload {
  /**
   * Overall opportunity landscape status.
   * - 'scarce': Very few opportunities
   * - 'limited': Some opportunities but constrained
   * - 'open': Normal opportunity flow
   * - 'rich': Many good opportunities
   * - 'abundant': Excellent opportunity landscape
   */
  status: 'scarce' | 'limited' | 'open' | 'rich' | 'abundant';

  /**
   * Number of active opportunities.
   */
  activeCount: number;

  /**
   * Top opportunities by potential.
   */
  topOpportunities: DetectedOpportunity[];

  /**
   * Opportunity types currently available.
   */
  availableTypes: OpportunityType[];

  /**
   * Average potential of detected opportunities.
   */
  avgPotential: number;

  /**
   * How time-sensitive are the opportunities.
   */
  urgency: 'none' | 'low' | 'moderate' | 'high';

  /**
   * Notes or context.
   */
  notes?: string[];
}

/**
 * Service type identifier.
 */
export const OPPORTUNITY_SERVICE_TYPE = 'opportunity';

/**
 * Domain identifier for appraisals.
 */
export const OPPORTUNITY_DOMAIN_ID = 'opportunity';

