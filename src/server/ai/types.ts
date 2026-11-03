export type AIIntentType =
  | 'GENERAL_CHAT'
  | 'FINANCIAL_OVERVIEW'
  | 'EXPENSE_ANALYSIS'
  | 'INCOME_ANALYSIS'
  | 'BUDGET_ANALYSIS'
  | 'INVESTMENT_ANALYSIS'
  | 'DEBT_ANALYSIS'
  | 'SAVINGS_PLANNING'
  | 'CASH_FLOW_FORECAST'
  | 'ACTION_TRANSACTION_CREATE'
  | 'ACTION_TRANSACTION_UPDATE'
  | 'ACTION_BUDGET_CREATE'
  | 'ACTION_BUDGET_UPDATE'
  | 'ACTION_SAVINGS_CREATE'
  | 'ACTION_INLINE_EDIT';

export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export type EntityType = 'transaction' | 'budget' | 'savings_goal' | 'debt' | 'category' | 'account';

export interface ActionItem {
  id: string;
  actionType: ActionType;
  entityType: EntityType;
  entityId?: string;
  title: string;
  description: string;
  originalValues?: Record<string, any>;
  proposedValues: Record<string, any>;
  validationStatus: 'valid' | 'invalid' | 'warning';
  warnings?: string[];
  isSelected: boolean; // CRITICAL: true by default for all valid actions
  executionStatus?: 'pending' | 'success' | 'failed';
  errorMessage?: string;
  idempotencyKey: string;
}

export interface ActionPlan {
  id: string;
  userId: string;
  conversationId: string;
  title: string;
  summary: string;
  status: 'draft' | 'validated' | 'confirmed' | 'executed' | 'cancelled';
  actions: ActionItem[];
  createdAt: string;
  expiresAt: string;
  executedAt?: string;
}

export type MessageType =
  | 'text'
  | 'financial_insight'
  | 'metric_card'
  | 'action_plan'
  | 'action_result'
  | 'warning'
  | 'error'
  | 'subscription_required';

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  type: MessageType;
  text: string;
  data?: any;
  actionPlan?: ActionPlan;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  userId: string;
  title: string;
  messages: AIChatMessage[];
  summary?: string;
  pendingActionPlanId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIUsageMetrics {
  totalRequests: number;
  totalTokens: number;
  estimatedCostVND: number;
  freeQuotaUsedToday: number;
  freeQuotaMaxDaily: number;
  isPro: boolean;
}
