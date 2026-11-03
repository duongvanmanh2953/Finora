import type { FinanceData } from '../types';
import type { AIChatMessage, ActionPlan, AIUsageMetrics } from '../server/ai/types';
import { aiService } from '../server/ai/aiService';
import type { ExecutionResult } from '../server/ai/aiActionExecutor';

export class AIApiClient {
  public async sendMessage(
    text: string,
    data: FinanceData,
    conversationId?: string
  ): Promise<AIChatMessage> {
    return aiService.handleMessage(text, data, conversationId);
  }

  public async executeActionPlan(
    planId: string,
    data: FinanceData
  ): Promise<ExecutionResult> {
    return aiService.executeActionPlan(planId, data);
  }

  public updateActionInPlan(
    planId: string,
    actionId: string,
    proposedValues: Record<string, any>,
    isSelected?: boolean
  ): ActionPlan | null {
    return aiService.updateActionInPlan(planId, actionId, proposedValues, isSelected);
  }

  public getUsage(data: FinanceData): AIUsageMetrics {
    return aiService.getUsage(data);
  }

  public getAdminTelemetry(): {
    totalRequests: number;
    totalTokens: number;
    estimatedCostVND: number;
    activeConversations: number;
  } {
    return aiService.getTelemetry();
  }
}

export const aiApiClient = new AIApiClient();
