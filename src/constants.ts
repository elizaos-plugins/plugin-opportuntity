/**
 * @fileoverview Constants for plugin-opportunity
 */

export const OpportunityEvents = {
    /** Emitted when a new opportunity is detected */
    DETECTED: 'OPPORTUNITY_DETECTED',

    /** Emitted when opportunities are re-evaluated */
    EVALUATED: 'OPPORTUNITY_EVALUATED',

    /** Emitted when appraisal is published */
    APPRAISAL_PUBLISHED: 'OPPORTUNITY_APPRAISAL_PUBLISHED',
} as const;

/**
 * Evaluation thresholds.
 */
export const Thresholds = {
    /** Count for scarce status */
    SCARCE_COUNT: 0,

    /** Count for limited status */
    LIMITED_COUNT: 2,

    /** Count for rich status */
    RICH_COUNT: 5,

    /** Count for abundant status */
    ABUNDANT_COUNT: 10,

    /** Potential threshold for "good" opportunities */
    GOOD_POTENTIAL: 0.5,

    /** Potential threshold for "excellent" opportunities */
    EXCELLENT_POTENTIAL: 0.8,

    /** Immediacy threshold for urgent */
    URGENT_IMMEDIACY: 0.7,

    /** Max opportunities to track */
    MAX_TRACKED: 20,

    /** Opportunity expiry (ms) */
    EXPIRY_MS: 86400000, // 24 hours
} as const;

/**
 * Default values.
 */
export const Defaults = {
    /** Evaluation interval (ms) */
    EVALUATION_INTERVAL: 300000, // 5 minutes

    /** Minimum confidence to report */
    MIN_CONFIDENCE: 0.3,

    /** Maximum confidence */
    MAX_CONFIDENCE: 0.9,
} as const;

