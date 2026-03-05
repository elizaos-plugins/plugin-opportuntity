/**
 * @elizaos/plugin-opportunity
 *
 * Opportunity situation evaluator for ElizaOS agents.
 * Detects and assesses actionable opportunities,
 * publishing appraisals to plugin-appraisal.
 */

export * from './types.ts';
export * from './constants.ts';
export { OpportunityService } from './services/opportunity-service.ts';
export { evaluateOpportunities, setupOpportunityEvaluation } from './evaluators/opportunity-evaluator.ts';
export { opportunityPlugin, default } from './plugin.ts';

