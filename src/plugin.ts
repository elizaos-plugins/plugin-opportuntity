/**
 * @fileoverview Plugin Opportunity - Main plugin definition
 *
 * Detects and assesses actionable opportunities,
 * publishing appraisals to plugin-appraisal.
 */

import { Service, type IAgentRuntime, type Plugin, logger } from '@elizaos/core';
import { OpportunityService } from './services/opportunity-service.ts';
import { evaluateOpportunities, setupOpportunityEvaluation } from './evaluators/opportunity-evaluator.ts';
import { OPPORTUNITY_SERVICE_TYPE } from './types.ts';
import { printBanner, type PluginSetting } from './banner.ts';

export const opportunityPlugin: Plugin = {
  name: 'opportunity',
  description: 'Opportunity situation evaluator - detects and assesses actionable opportunities',

  /**
   * Dependencies.
   */
  dependencies: ['appraisal'],

  init: async (_config: Record<string, string>, runtime: IAgentRuntime): Promise<void> => {
    const settings: PluginSetting[] = [
      {
        name: 'OPPORTUNITY_EVALUATION_DELAY',
        value: runtime.getSetting('OPPORTUNITY_EVALUATION_DELAY'),
        defaultValue: 2000,
      },
      {
        name: 'OPPORTUNITY_HIGH_VALUE_THRESHOLD',
        value: runtime.getSetting('OPPORTUNITY_HIGH_VALUE_THRESHOLD'),
        defaultValue: 0.8,
      },
    ];
    printBanner({ runtime, settings });

    setupOpportunityEvaluation(runtime);

    // Wait for init and for our required services to be registered.
    runtime.initPromise.then(async () => {
      try {
        await Promise.all([
          runtime.getServiceLoadPromise(OPPORTUNITY_SERVICE_TYPE as any),
          runtime.getServiceLoadPromise('appraisal' as any),
        ]);
      } catch {
        return;
      }
      await evaluateOpportunities(runtime);
    }).catch(() => {});
  },

  services: [
    class OpportunityServiceFactory extends Service {
      static override serviceType = OPPORTUNITY_SERVICE_TYPE;
      public readonly capabilityDescription = 'Tracks and manages detected opportunities';

      static async start(runtime: IAgentRuntime): Promise<Service> {
        return await OpportunityService.start(runtime);
      }

      static async stop(runtime: IAgentRuntime): Promise<void> {
        const service = runtime.getService(OPPORTUNITY_SERVICE_TYPE) as OpportunityService | null;
        if (service) {
          await service.stop();
        }
      }

      async stop(): Promise<void> {}
    },
  ],
};

export default opportunityPlugin;

