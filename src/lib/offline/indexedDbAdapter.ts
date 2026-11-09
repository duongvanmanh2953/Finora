import type { FinanceData } from '../../types';

export type EntityType = 'transaction' | 'account' | 'budget' | 'goal' | 'recurring' | 'user' | 'bulk_sync';
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT' | 'REQUIRES_PLAN';

export interface OutboxOperation {
  operation_id: string;
  entity_type: EntityType;
  entity_id: string;
  operation_type: OperationType;
  payload: any;
  created_at: string;
  updated_at: string;
  sync_status: SyncStatus;
  retry_count: number;
  last_error?: string;
  user_id: string;
  local_version: number;
  idempotency_key: string;
}

export interface SignedLease {
  user_id: string;
  plan_id: string;
  tier: 'free' | 'pro' | 'gold';
  issued_at: string;
  expires_at: string;
  last_verified_server_time: string;
  signature: string;
}

export interface ConsentRecord {
  user_id: string;
  terms_version: string;
  subscription_policy_version: string;
  accepted_at: string;
  consent_type: 'trial_and_offline_sync';
  device_info?: string;
}

const DB_NAME = 'finora_offline_db';
const DB_VERSION = 1;
const STORE_USER_DATA = 'userData';
const STORE_OUTBOX = 'outbox';
const STORE_LEASES = 'leases';
const STORE_CONSENTS = 'consents';

/**
 * Memory fallback when running outside the browser or when IndexedDB is blocked
 */
class MemoryStorageAdapter {
  private userData = new Map<string, FinanceData>();
  private outbox = new Map<string, OutboxOperation>();
  private leases = new Map<string, SignedLease>();
  private consents = new Map<string, ConsentRecord>();

  async getUserData(userId: string): Promise<FinanceData | null> {
    return this.userData.get(userId) || null;
  }
  async setUserData(userId: string, data: FinanceData): Promise<void> {
    this.userData.set(userId, structuredClone(data));
  }
  async getOutboxOperations(userId: string, status?: SyncStatus): Promise<OutboxOperation[]> {
    const all = Array.from(this.outbox.values()).filter(op => op.user_id === userId);
    return status ? all.filter(op => op.sync_status === status) : all;
  }
  async addOutboxOperation(op: OutboxOperation): Promise<void> {
    this.outbox.set(op.operation_id, { ...op });
  }
  async updateOutboxOperation(operationId: string, updates: Partial<OutboxOperation>): Promise<void> {
    const existing = this.outbox.get(operationId);
    if (existing) {
      this.outbox.set(operationId, { ...existing, ...updates, updated_at: new Date().toISOString() });
    }
  }
  async removeOutboxOperation(operationId: string): Promise<void> {
    this.outbox.delete(operationId);
  }
  async getLease(userId: string): Promise<SignedLease | null> {
    return this.leases.get(userId) || null;
  }
  async setLease(lease: SignedLease): Promise<void> {
    this.leases.set(lease.user_id, { ...lease });
  }
  async saveConsent(consent: ConsentRecord): Promise<void> {
    const key = `${consent.user_id}:${consent.terms_version}`;
    this.consents.set(key, { ...consent });
  }
  async getConsent(userId: string, termsVersion: string): Promise<ConsentRecord | null> {
    return this.consents.get(`${userId}:${termsVersion}`) || null;
  }
  async clearUserStore(userId: string): Promise<void> {
    this.userData.delete(userId);
    this.leases.delete(userId);
    for (const [id, op] of this.outbox.entries()) {
      if (op.user_id === userId) this.outbox.delete(id);
    }
  }
}

/**
 * StorageAdapter interface: enables wrapping IndexedDB or custom native storage
 */
export interface StorageAdapter {
  getUserData(userId: string): Promise<FinanceData | null>;
  setUserData(userId: string, data: FinanceData): Promise<void>;
  getOutboxOperations(userId: string, status?: SyncStatus): Promise<OutboxOperation[]>;
  addOutboxOperation(op: OutboxOperation): Promise<void>;
  updateOutboxOperation(operationId: string, updates: Partial<OutboxOperation>): Promise<void>;
  removeOutboxOperation(operationId: string): Promise<void>;
  getLease(userId: string): Promise<SignedLease | null>;
  setLease(lease: SignedLease): Promise<void>;
  saveConsent(consent: ConsentRecord): Promise<void>;
  getConsent(userId: string, termsVersion: string): Promise<ConsentRecord | null>;
  clearUserStore(userId: string): Promise<void>;
}

class IndexedDbAdapter implements StorageAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryFallback = new MemoryStorageAdapter();
  private isIndexedDbAvailable: boolean;

  constructor() {
    this.isIndexedDbAvailable = typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDbAvailable) {
      throw new Error('IndexedDB not supported in this environment');
    }

    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_USER_DATA)) {
            db.createObjectStore(STORE_USER_DATA);
          }
          if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
            const outboxStore = db.createObjectStore(STORE_OUTBOX, { keyPath: 'operation_id' });
            outboxStore.createIndex('user_id', 'user_id', { unique: false });
            outboxStore.createIndex('sync_status', 'sync_status', { unique: false });
            outboxStore.createIndex('created_at', 'created_at', { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_LEASES)) {
            db.createObjectStore(STORE_LEASES, { keyPath: 'user_id' });
          }
          if (!db.objectStoreNames.contains(STORE_CONSENTS)) {
            db.createObjectStore(STORE_CONSENTS, { keyPath: 'key' });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          this.isIndexedDbAvailable = false;
          reject(req.error);
        };
      } catch (err) {
        this.isIndexedDbAvailable = false;
        reject(err);
      }
    });

    return this.dbPromise;
  }

  async getUserData(userId: string): Promise<FinanceData | null> {
    if (!this.isIndexedDbAvailable) return this.memoryFallback.getUserData(userId);
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USER_DATA, 'readonly');
        const store = tx.objectStore(STORE_USER_DATA);
        const req = store.get(userId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.getUserData(userId);
    }
  }

  async setUserData(userId: string, data: FinanceData): Promise<void> {
    await this.memoryFallback.setUserData(userId, data);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_USER_DATA, 'readwrite');
        const store = tx.objectStore(STORE_USER_DATA);
        const req = store.put(data, userId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback already updated
    }
  }

  async getOutboxOperations(userId: string, status?: SyncStatus): Promise<OutboxOperation[]> {
    if (!this.isIndexedDbAvailable) return this.memoryFallback.getOutboxOperations(userId, status);
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const store = tx.objectStore(STORE_OUTBOX);
        const index = store.index('user_id');
        const req = index.getAll(IDBKeyRange.only(userId));
        req.onsuccess = () => {
          const ops: OutboxOperation[] = req.result || [];
          ops.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          resolve(status ? ops.filter(o => o.sync_status === status) : ops);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.getOutboxOperations(userId, status);
    }
  }

  async addOutboxOperation(op: OutboxOperation): Promise<void> {
    await this.memoryFallback.addOutboxOperation(op);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.put(op);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  async updateOutboxOperation(operationId: string, updates: Partial<OutboxOperation>): Promise<void> {
    await this.memoryFallback.updateOutboxOperation(operationId, updates);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        const getReq = store.get(operationId);
        getReq.onsuccess = () => {
          const current = getReq.result;
          if (!current) return resolve();
          const updated = {
            ...current,
            ...updates,
            updated_at: new Date().toISOString()
          };
          const putReq = store.put(updated);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        };
        getReq.onerror = () => reject(getReq.error);
      });
    } catch {
      // Memory fallback updated
    }
  }

  async removeOutboxOperation(operationId: string): Promise<void> {
    await this.memoryFallback.removeOutboxOperation(operationId);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.delete(operationId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Handled
    }
  }

  async getLease(userId: string): Promise<SignedLease | null> {
    if (!this.isIndexedDbAvailable) return this.memoryFallback.getLease(userId);
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LEASES, 'readonly');
        const store = tx.objectStore(STORE_LEASES);
        const req = store.get(userId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.getLease(userId);
    }
  }

  async setLease(lease: SignedLease): Promise<void> {
    await this.memoryFallback.setLease(lease);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_LEASES, 'readwrite');
        const store = tx.objectStore(STORE_LEASES);
        const req = store.put(lease);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Handled
    }
  }

  async saveConsent(consent: ConsentRecord): Promise<void> {
    await this.memoryFallback.saveConsent(consent);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONSENTS, 'readwrite');
        const store = tx.objectStore(STORE_CONSENTS);
        const key = `${consent.user_id}:${consent.terms_version}`;
        const req = store.put({ ...consent, key });
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Handled
    }
  }

  async getConsent(userId: string, termsVersion: string): Promise<ConsentRecord | null> {
    if (!this.isIndexedDbAvailable) return this.memoryFallback.getConsent(userId, termsVersion);
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_CONSENTS, 'readonly');
        const store = tx.objectStore(STORE_CONSENTS);
        const req = store.get(`${userId}:${termsVersion}`);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return this.memoryFallback.getConsent(userId, termsVersion);
    }
  }

  async clearUserStore(userId: string): Promise<void> {
    await this.memoryFallback.clearUserStore(userId);
    if (!this.isIndexedDbAvailable) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction([STORE_USER_DATA, STORE_LEASES], 'readwrite');
      tx.objectStore(STORE_USER_DATA).delete(userId);
      tx.objectStore(STORE_LEASES).delete(userId);
    } catch {}
  }
}

export const offlineStorage: StorageAdapter = new IndexedDbAdapter();
