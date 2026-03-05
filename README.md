# @elizaos/plugin-opportunity

Opportunity situation evaluator for elizaOS agents - detects, tracks, and assesses actionable opportunities.

## Overview

This plugin provides opportunity detection and assessment capabilities for elizaOS agents. It tracks potential opportunities across various domains (collaboration, networking, financial, etc.) and publishes structured appraisals to the [plugin-appraisal](../plugin-appraisal) registry for use by motivation systems.

### Architecture

```
conversation/context → opportunity detection → assessment → appraisal publication
```

- **Detection**: Identifies actionable opportunities from conversations and context
- **Tracking**: Manages opportunity lifecycle with automatic expiry and cleanup
- **Assessment**: Evaluates the overall opportunity landscape
- **Publication**: Publishes appraisals for motivation to consume

## Installation

```bash
npm install @elizaos/plugin-opportunity
```

## Dependencies

This plugin requires `@elizaos/plugin-appraisal` to be installed and registered:

```typescript
import { appraisalPlugin } from '@elizaos/plugin-appraisal';
import { opportunityPlugin } from '@elizaos/plugin-opportunity';

const character = {
  name: 'MyAgent',
  plugins: [appraisalPlugin, opportunityPlugin],
};
```

## Usage

### Adding to Your Agent

```typescript
import { opportunityPlugin } from '@elizaos/plugin-opportunity';

const character = {
  name: 'MyAgent',
  plugins: [opportunityPlugin],
};
```

### Detecting Opportunities

Use the `OpportunityService` to register detected opportunities:

```typescript
import { OpportunityService, OPPORTUNITY_SERVICE_TYPE } from '@elizaos/plugin-opportunity';

async function detectOpportunity(runtime: IAgentRuntime) {
  const opportunityService = runtime.getService(OPPORTUNITY_SERVICE_TYPE) as OpportunityService;

  // Add a detected opportunity
  const opportunity = opportunityService.addOpportunity({
    type: 'collaboration',
    description: 'Potential partnership with Project X on AI research',
    potential: 0.85,      // How valuable (0-1)
    immediacy: 0.6,       // How actionable now (0-1)
    confidence: 0.75,     // Detection confidence (0-1)
    timeframe: 'short_term',
    source: 'discord-channel-123',
  });
}
```

### Querying Opportunities

```typescript
const opportunityService = runtime.getService(OPPORTUNITY_SERVICE_TYPE) as OpportunityService;

// Get all active opportunities
const all = opportunityService.getOpportunities();

// Get top 5 by potential
const top = opportunityService.getTop(5);

// Get by type
const networkingOpps = opportunityService.getByType('networking');

// Get available types
const types = opportunityService.getAvailableTypes();

// Get count
const count = opportunityService.getCount();
```

### Triggering Evaluation

Evaluation runs automatically on:
- New opportunity detection
- Periodic interval (every 5 minutes by default)
- Initial plugin load (after 2 second delay)

You can also trigger manually:

```typescript
import { evaluateOpportunities } from '@elizaos/plugin-opportunity';

await evaluateOpportunities(runtime);
```

## Configuration

Configure via environment variables or character settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `OPPORTUNITY_EVALUATION_DELAY` | `2000` | Initial evaluation delay (ms) |
| `OPPORTUNITY_HIGH_VALUE_THRESHOLD` | `0.8` | Threshold for high-value opportunities |

### Character-Level Control

Use the appraisal plugin's evaluator configuration to enable/disable:

```typescript
settings: {
  // Disable opportunity evaluator for this character
  APPRAISAL_DISABLED_EVALUATORS: 'opportunity',
}
```

## API Reference

### Opportunity Types

```typescript
type OpportunityType =
  | 'collaboration'  // Partnership/teamwork opportunities
  | 'networking'     // New connections
  | 'learning'       // Knowledge/skill acquisition
  | 'financial'      // Money-making opportunities
  | 'influence'      // Power/authority opportunities
  | 'visibility'     // Fame/reputation opportunities
  | 'assistance'     // Helping others
  | 'resource'       // Resource acquisition
  | 'other';
```

### DetectedOpportunity Interface

```typescript
interface DetectedOpportunity {
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

  /** When detected (timestamp ms) */
  detectedAt: number;

  /** Source context (room, entity, etc.) */
  source?: string;

  /** Time sensitivity */
  timeframe: 'immediate' | 'short_term' | 'long_term' | 'unknown';
}
```

### OpportunityPayload (Appraisal Output)

```typescript
interface OpportunityPayload {
  /** Overall opportunity landscape status */
  status: 'scarce' | 'limited' | 'open' | 'rich' | 'abundant';

  /** Number of active opportunities */
  activeCount: number;

  /** Top opportunities by potential */
  topOpportunities: DetectedOpportunity[];

  /** Opportunity types currently available */
  availableTypes: OpportunityType[];

  /** Average potential of detected opportunities */
  avgPotential: number;

  /** How time-sensitive are the opportunities */
  urgency: 'none' | 'low' | 'moderate' | 'high';

  /** Notes or context */
  notes?: string[];
}
```

### OpportunityService Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `addOpportunity(opp)` | `DetectedOpportunity` | Add a new opportunity. Auto-generates ID and timestamp. |
| `removeOpportunity(id)` | `boolean` | Remove an opportunity by ID. |
| `getOpportunities()` | `DetectedOpportunity[]` | Get all active opportunities. |
| `getByType(type)` | `DetectedOpportunity[]` | Get opportunities of a specific type. |
| `getTop(n)` | `DetectedOpportunity[]` | Get top N opportunities by potential. |
| `getCount()` | `number` | Get total count of tracked opportunities. |
| `getAvailableTypes()` | `OpportunityType[]` | Get types with active opportunities. |

### Events

| Event | Payload | When |
|-------|---------|------|
| `OPPORTUNITY_DETECTED` | `{ runtime, source, agentId, opportunity }` | A new opportunity is detected |
| `OPPORTUNITY_EVALUATED` | `{ runtime, source, agentId, payload, opportunityCount }` | Opportunities are evaluated |
| `OPPORTUNITY_APPRAISAL_PUBLISHED` | `{ runtime, source, agentId, payload, confidence }` | Appraisal published successfully |

### Listening to Events

```typescript
runtime.registerEvent('OPPORTUNITY_DETECTED', async (payload) => {
  console.log('New opportunity:', payload.opportunity.description);
});

runtime.registerEvent('OPPORTUNITY_EVALUATED', async (payload) => {
  console.log(`Landscape: ${payload.payload.status}, Count: ${payload.opportunityCount}`);
});
```

## Status Thresholds

The opportunity landscape status is determined by count and quality:

| Status | Condition |
|--------|-----------|
| `scarce` | 0 opportunities |
| `limited` | 1-2 opportunities |
| `open` | 3-4 opportunities (normal flow) |
| `rich` | 5+ opportunities OR avg potential ≥ 0.8 |
| `abundant` | 10+ opportunities AND avg potential ≥ 0.5 |

## Urgency Levels

| Urgency | Condition |
|---------|-----------|
| `none` | No opportunities |
| `low` | Has short-term opportunities |
| `moderate` | 1+ urgent (immediacy ≥ 0.7) OR 1+ immediate timeframe |
| `high` | 3+ urgent OR 2+ immediate timeframe |

## Lifecycle Management

### Automatic Cleanup

- **Expiry**: Opportunities expire after 24 hours
- **Max Tracked**: Limited to 20 opportunities (lowest potential removed when full)
- **Cleanup Interval**: Runs every 5 minutes

### Manual Management

```typescript
// Remove specific opportunity
opportunityService.removeOpportunity(opportunityId);
```

## Integration with Motivation

The opportunity appraisal is consumed by motivation systems via the appraisal provider:

```typescript
const state = await runtime.composeState(message, ['APPRAISALS']);
const opportunityAppraisal = state.data.providers.APPRAISALS?.appraisals?.opportunity;

if (opportunityAppraisal?.payload.status === 'rich') {
  // Many good opportunities available - adjust priorities
}

if (opportunityAppraisal?.payload.urgency === 'high') {
  // Time-sensitive opportunities need attention
}
```

## Example: Custom Opportunity Detector

```typescript
import type { Plugin } from '@elizaos/core';
import { OpportunityService, OPPORTUNITY_SERVICE_TYPE } from '@elizaos/plugin-opportunity';

export const myDetectorPlugin: Plugin = {
  name: 'my-detector',
  dependencies: ['opportunity'],

  init: async (config, runtime) => {
    // Listen for messages that might contain opportunities
    runtime.registerEvent('MESSAGE_RECEIVED', async ({ message }) => {
      const opportunityService = runtime.getService(OPPORTUNITY_SERVICE_TYPE) as OpportunityService;

      // Your detection logic...
      if (message.content.includes('partnership')) {
        opportunityService.addOpportunity({
          type: 'collaboration',
          description: `Partnership mention from ${message.userId}`,
          potential: 0.7,
          immediacy: 0.5,
          confidence: 0.6,
          timeframe: 'short_term',
          source: message.roomId,
        });
      }
    });
  },
};
```

## Testing

```bash
cd packages/plugin-opportunity
bun test
```

## License

MIT
