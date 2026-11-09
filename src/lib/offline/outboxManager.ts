import { uid } from '../finance';
import {
  offlineStorage,
  type OutboxOperation,
  type EntityType,
  type OperationType,
  type SyncStatus
} from './indexedDbAdapter';
import { networkManager } from './networkStatus';

export interface BatchSyncItemResponse {
  operation_id: string;
  status: SyncStatus;
  error?: string;
  server_version?: number;
}

export interface BatchSyncResponse {
  success: boolean;
  results: BatchSyncItemResponse[];
  server_timestamp: string;
  server_data?: any;
}

class OutboxManager {
  private isSyncing = false;

  /**
   * Enqueue a new mutation to local outbox
   */
  async enqueue(
    userId: string,
    entityType: EntityType,
    entityId: string,
    operationType: OperationType,
    payload: any,
    localVersion = 1
  ): Promise<OutboxOperation> {
    const now = new Date().toISOString();
    const operationId = `op_${uid()}`;
    const op: OutboxOperation = {
      operation_id: operationId,
      entity_type: entityType,
      entity_id: entityId,
      operation_type: operationType,
      payload,
      created_at: now,
      updated_at: now,
      sync_status: 'PENDING',
      retry_count: 0,
      user_id: userId,
      local_version: localVersion,
      idempotency_key: `${userId}_${entityType}_${entityId}_${operationType}_${operationId}`
    };

    await offlineStorage.addOutboxOperation(op);
    await this.refreshPendingCount(userId);
    return op;
  }

  /**
   * Update pending operation count for UI badges
   */
  async refreshPendingCount(userId: string): Promise<number> {
    const pendingOps = await offlineStorage.getOutboxOperations(userId, 'PENDING');
    const count = pendingOps.length;
    networkManager.setPendingCount(count);
    return count;
  }

  /**
   * Sort operations by dependency: user/account creations first, then categories, then transactions/budgets/goals
   */
  private sortDependencies(operations: OutboxOperation[]): OutboxOperation[] {
    const priorityMap: Record<EntityType, number> = {
      user: 0,
      account: 1,
      budget: 2,
      goal: 3,
      recurring: 4,
      transaction: 5,
      bulk_sync: 6
    };

    return [...operations].sort((a, b) => {
      const pA = priorityMap[a.entity_type] ?? 99;
      const pB = priorityMap[b.entity_type] ?? 99;
      if (pA !== pB) return pA - pB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }

  /**
   * Synchronize pending operations with server
   */
  async syncOutbox(
    userId: string,
    token?: string | null,
    onProgress?: (synced: number, total: number) => void
  ): Promise<{ synced: number; failed: number; conflicts: number; requiresPlan: number }> {
    if (this.isSyncing) {
      return { synced: 0, failed: 0, conflicts: 0, requiresPlan: 0 };
    }

    const pending = await offlineStorage.getOutboxOperations(userId, 'PENDING');
    if (pending.length === 0) {
      await this.refreshPendingCount(userId);
      return { synced: 0, failed: 0, conflicts: 0, requiresPlan: 0 };
    }

    this.isSyncing = true;
    networkManager.setState('SYNCING');

    const ordered = this.sortDependencies(pending);
    let synced = 0;
    let failed = 0;
    let conflicts = 0;
    let requiresPlan = 0;

    // Batch send in chunks of 20
    const chunkSize = 20;
    for (let i = 0; i < ordered.length; i += chunkSize) {
      const batch = ordered.slice(i, i + chunkSize);

      // Mark batch as SYNCING
      for (const op of batch) {
        await offlineStorage.updateOutboxOperation(op.operation_id, { sync_status: 'SYNCING' });
      }

      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/sync/batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({ operations: batch, user_id: userId })
        });

        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }

        const data: BatchSyncResponse = await res.json();
        const resultMap = new Map<string, BatchSyncItemResponse>(
          data.results.map(r => [r.operation_id, r])
        );

        for (const op of batch) {
          const result = resultMap.get(op.operation_id);
          if (result && result.status === 'SYNCED') {
            await offlineStorage.removeOutboxOperation(op.operation_id);
            synced++;
          } else if (result && result.status === 'CONFLICT') {
            await offlineStorage.updateOutboxOperation(op.operation_id, {
              sync_status: 'CONFLICT',
              last_error: result.error || 'Xung đột dữ liệu phiên bản trên máy chủ'
            });
            conflicts++;
          } else if (result && result.status === 'REQUIRES_PLAN') {
            await offlineStorage.updateOutboxOperation(op.operation_id, {
              sync_status: 'REQUIRES_PLAN',
              last_error: result.error || 'Dùng thử VIP Gold đã hết hạn. Dữ liệu được bảo toàn ở trạng thái bản thảo.'
            });
            requiresPlan++;
          } else {
            // Failed, backoff retry
            await offlineStorage.updateOutboxOperation(op.operation_id, {
              sync_status: 'FAILED',
              retry_count: op.retry_count + 1,
              last_error: result?.error || 'Lỗi xử lý đồng bộ'
            });
            failed++;
          }
        }
      } catch (err: any) {
        // Network or server error, revert batch to PENDING with retry_count increment
        for (const op of batch) {
          await offlineStorage.updateOutboxOperation(op.operation_id, {
            sync_status: 'PENDING',
            retry_count: op.retry_count + 1,
            last_error: err?.message || 'Mất kết nối mạng khi đang đồng bộ'
          });
          failed++;
        }
      }

      if (onProgress) {
        onProgress(synced, ordered.length);
      }
    }

    this.isSyncing = false;
    await this.refreshPendingCount(userId);

    if (conflicts > 0) {
      networkManager.setState('SYNC_CONFLICT');
    } else if (failed > 0 && synced === 0) {
      networkManager.setState('SYNC_FAILED');
    } else {
      networkManager.setState('ONLINE');
    }

    return { synced, failed, conflicts, requiresPlan };
  }
}

export const outboxManager = new OutboxManager();
