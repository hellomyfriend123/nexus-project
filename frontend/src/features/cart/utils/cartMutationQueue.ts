import type { CommerceCart } from '../../../services/api/commerce';

export type CartSyncState = 'synced' | 'pending' | 'syncing' | 'error';
export type CartStockState = 'available' | 'insufficient' | 'out_of_stock';
export type CartReconcileReason = 'stock' | 'conflict' | 'missing';

export interface CartItemSnapshot {
  id: string;
  syncState: CartSyncState;
  stockState: CartStockState;
  /** Last quantity confirmed by the Backend. */
  confirmedQuantity: number;
  /** Latest quantity requested by the user (optimistic). */
  desiredQuantity: number;
  /** Stock limit learned from the Backend, undefined while unknown. */
  maxQuantity: number | undefined;
  revision: number;
  isProcessing: boolean;
  error?: string;
}

export interface CartQueueEvents {
  onItemState?: (id: string, snapshot: CartItemSnapshot) => void;
  /** Called after each successful quantity PUT or authoritative cart fetch. */
  onConfirmed?: (cart: CommerceCart) => void;
  /** Backend rejected the optimistic value; UI must show `quantity` (0 = item no longer exists). */
  onReconciled?: (id: string, quantity: number, info: { reason: CartReconcileReason; availableQuantity?: number }) => void;
  onError?: (id: string, message: string) => void;
  /** Fired once when the queue becomes idle after activity. */
  onIdle?: () => void;
}

export interface CartQueueDeps {
  updateQuantity: (id: string, quantity: number) => Promise<CommerceCart>;
  removeItem: (id: string) => Promise<void>;
  fetchCart: () => Promise<CommerceCart>;
  /** Quiet period before a request is sent. 0 sends on the next microtask. Default 400. */
  debounceMs?: number;
  events?: CartQueueEvents;
}

interface ItemQueue {
  id: string;
  confirmedQuantity: number;
  desiredQuantity: number;
  isProcessing: boolean;
  revision: number;
  syncState: CartSyncState;
  stockState: CartStockState;
  maxQuantity: number | undefined;
  removed: boolean;
  timer: ReturnType<typeof setTimeout> | undefined;
  inflight: Promise<void> | undefined;
  error: string | undefined;
}

const httpStatus = (error: unknown): number | undefined => {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
};
const errorCode = (error: unknown): string | undefined => {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
};
const availableOf = (error: unknown): number | undefined => {
  const data = (error as { data?: unknown } | null)?.data as { availableQuantity?: unknown } | null | undefined;
  const value = data?.availableQuantity;
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : undefined;
};
const isStockError = (error: unknown) => errorCode(error) === 'INSUFFICIENT_STOCK' || availableOf(error) !== undefined;
const messageOf = (error: unknown) => (error instanceof Error && error.message ? error.message : 'Không thể đồng bộ số lượng với máy chủ.');

/**
 * Per-CartItem mutation queue (latest-value-wins): at most one in-flight quantity request per
 * CartItem, intermediate values are skipped, and different items never block each other.
 * Framework-free so it can be unit-tested without React.
 */
export class CartMutationQueue {
  private readonly items = new Map<string, ItemQueue>();
  private readonly removals = new Set<Promise<void>>();
  private readonly debounceMs: number;
  private readonly deps: CartQueueDeps;
  private disposed = false;
  private dirty = false;

  constructor(deps: CartQueueDeps) {
    this.deps = deps;
    this.debounceMs = deps.debounceMs ?? 400;
  }

  /** Register server-confirmed lines. Items with pending work are left untouched. */
  syncFromServer(lines: ReadonlyArray<{ id: string; quantity: number }>): void {
    const ids = new Set(lines.map(line => line.id));
    for (const line of lines) {
      const existing = this.items.get(line.id);
      if (!existing) { this.items.set(line.id, this.create(line.id, line.quantity)); continue; }
      if (this.isBusy(existing)) continue;
      existing.confirmedQuantity = line.quantity;
      existing.desiredQuantity = line.quantity;
      existing.error = undefined;
      existing.syncState = 'synced';
    }
    for (const [id, item] of this.items) if (!ids.has(id) && !this.isBusy(item)) this.items.delete(id);
  }

  getSnapshot(id: string): CartItemSnapshot | undefined {
    const item = this.items.get(id);
    return item ? this.snapshot(item) : undefined;
  }

  size(): number {
    let count = 0;
    for (const item of this.items.values()) if (!item.removed) count += 1;
    return count;
  }

  /** Optimistic change: records the desired quantity and schedules (or coalesces into) a request. */
  setQuantity(id: string, quantity: number): void {
    const item = this.items.get(id);
    if (!item || item.removed || this.disposed || !Number.isFinite(quantity)) return;
    item.revision += 1;
    item.desiredQuantity = Math.max(1, Math.trunc(quantity));
    this.dirty = true;
    if (item.isProcessing) return; // the running loop will pick up the latest desired value
    if (item.desiredQuantity === item.confirmedQuantity) {
      this.clearTimer(item);
      this.setState(item, 'synced');
      this.checkIdle();
      return;
    }
    this.setState(item, 'pending');
    this.schedule(item);
  }

  /** Re-send the latest desired quantity after a failure. */
  retry(id: string): void {
    const item = this.items.get(id);
    if (!item || item.removed || this.disposed || item.isProcessing) return;
    this.dirty = true;
    this.clearTimer(item);
    void this.run(item);
  }

  /**
   * Delete through the existing DELETE API. Waits for any in-flight PUT first so a late PUT can
   * never recreate or overwrite the deleted item; pending updates are discarded.
   */
  remove(id: string): Promise<void> {
    const item = this.items.get(id);
    this.dirty = true;
    if (!item) return this.deps.removeItem(id);
    item.removed = true;
    item.revision += 1;
    this.clearTimer(item);
    const task = (async () => {
      if (item.inflight) await item.inflight.catch(() => undefined);
      try {
        await this.deps.removeItem(id);
        this.items.delete(id);
      } catch (error) {
        if (httpStatus(error) === 404) { this.items.delete(id); return; }
        item.removed = false;
        item.desiredQuantity = item.confirmedQuantity;
        this.setState(item, 'synced');
        throw error;
      }
    })();
    const tracked = task.then(() => undefined, () => undefined);
    this.removals.add(tracked);
    void tracked.then(() => { this.removals.delete(tracked); this.checkIdle(); });
    return task;
  }

  /**
   * Flush every pending item and wait until nothing is queued or in flight.
   * `ok` is false when any item is left in the error state (unsynchronized data).
   */
  async settle(): Promise<{ ok: boolean }> {
    for (;;) {
      const busy = [...this.items.values()].filter(item => !item.removed && (item.isProcessing || item.timer !== undefined || item.syncState === 'pending' || item.syncState === 'syncing'));
      if (!busy.length && !this.removals.size) break;
      for (const item of busy) this.clearTimer(item);
      await Promise.all([...busy.map(item => this.run(item)), ...this.removals]);
    }
    const hasError = [...this.items.values()].some(item => !item.removed && (item.syncState === 'error' || item.desiredQuantity !== item.confirmedQuantity));
    return { ok: !hasError };
  }

  dispose(): void {
    this.disposed = true;
    for (const item of this.items.values()) this.clearTimer(item);
    this.items.clear();
    this.removals.clear();
  }

  // ---- internals -------------------------------------------------------------------------

  private create(id: string, quantity: number): ItemQueue {
    return { id, confirmedQuantity: quantity, desiredQuantity: quantity, isProcessing: false, revision: 0, syncState: 'synced',
      stockState: 'available', maxQuantity: undefined, removed: false, timer: undefined, inflight: undefined, error: undefined };
  }

  private snapshot(item: ItemQueue): CartItemSnapshot {
    return { id: item.id, syncState: item.syncState, stockState: item.stockState, confirmedQuantity: item.confirmedQuantity,
      desiredQuantity: item.desiredQuantity, maxQuantity: item.maxQuantity, revision: item.revision, isProcessing: item.isProcessing,
      ...(item.error ? { error: item.error } : {}) };
  }

  private isBusy(item: ItemQueue): boolean {
    return item.isProcessing || item.timer !== undefined || item.syncState !== 'synced' || item.desiredQuantity !== item.confirmedQuantity || item.removed;
  }

  private setState(item: ItemQueue, state: CartSyncState): void {
    item.syncState = state;
    if (!this.disposed) this.deps.events?.onItemState?.(item.id, this.snapshot(item));
  }

  private clearTimer(item: ItemQueue): void {
    if (item.timer !== undefined) { clearTimeout(item.timer); item.timer = undefined; }
  }

  private schedule(item: ItemQueue): void {
    this.clearTimer(item);
    if (this.debounceMs <= 0) { void this.run(item); return; }
    item.timer = setTimeout(() => { item.timer = undefined; void this.run(item); }, this.debounceMs);
  }

  private checkIdle(): void {
    if (this.disposed || !this.dirty || this.removals.size) return;
    for (const item of this.items.values()) {
      if (item.removed || item.isProcessing || item.timer !== undefined || item.syncState === 'pending' || item.syncState === 'syncing') return;
    }
    this.dirty = false;
    this.deps.events?.onIdle?.();
  }

  private run(item: ItemQueue): Promise<void> {
    if (item.isProcessing) return item.inflight ?? Promise.resolve();
    if (item.removed || this.disposed) return Promise.resolve();
    this.clearTimer(item);
    if (item.desiredQuantity === item.confirmedQuantity) {
      this.setState(item, 'synced');
      this.checkIdle();
      return Promise.resolve();
    }
    item.isProcessing = true;
    item.inflight = this.loop(item).finally(() => { item.isProcessing = false; item.inflight = undefined; this.checkIdle(); });
    return item.inflight;
  }

  private async loop(item: ItemQueue): Promise<void> {
    while (!this.disposed && !item.removed && item.desiredQuantity !== item.confirmedQuantity) {
      const sent = item.desiredQuantity;
      const revision = item.revision;
      item.error = undefined;
      this.setState(item, 'syncing');
      try {
        const cart = await this.deps.updateQuantity(item.id, sent);
        if (this.disposed || item.removed) return;
        item.confirmedQuantity = sent;
        this.deps.events?.onConfirmed?.(cart);
      } catch (error) {
        if (this.disposed || item.removed) return;
        if (!(await this.handleFailure(item, error, revision))) return;
      }
    }
    if (!this.disposed && !item.removed && item.desiredQuantity === item.confirmedQuantity) this.setState(item, 'synced');
  }

  /** Returns true when the loop should continue with a newer desired quantity. */
  private async handleFailure(item: ItemQueue, error: unknown, revision: number): Promise<boolean> {
    const newer = item.revision !== revision;
    const status = httpStatus(error);
    if (status === 409 || status === 404 || isStockError(error)) {
      let cart: CommerceCart;
      try { cart = await this.deps.fetchCart(); }
      catch (fetchError) { return this.fail(item, fetchError, newer); }
      if (this.disposed || item.removed) return false;
      this.deps.events?.onConfirmed?.(cart);
      const line = cart.items.find(candidate => candidate.id === item.id);
      if (!line) {
        item.removed = true;
        this.deps.events?.onReconciled?.(item.id, 0, { reason: 'missing' });
        this.items.delete(item.id);
        return false;
      }
      item.confirmedQuantity = line.quantity;
      const available = availableOf(error);
      const stock = isStockError(error);
      if (stock && available !== undefined) {
        item.maxQuantity = available;
        item.stockState = available <= 0 ? 'out_of_stock' : 'insufficient';
      }
      if (newer) {
        // A newer interaction exists: never let the older response overwrite it.
        if (stock && available !== undefined && item.desiredQuantity > available) {
          item.desiredQuantity = available >= 1 ? available : item.confirmedQuantity;
        }
        return item.desiredQuantity !== item.confirmedQuantity;
      }
      item.desiredQuantity = item.confirmedQuantity; // no automatic retry of the rejected quantity
      this.setState(item, 'synced');
      this.deps.events?.onReconciled?.(item.id, item.confirmedQuantity,
        { reason: stock ? 'stock' : 'conflict', ...(available !== undefined ? { availableQuantity: available } : {}) });
      return false;
    }
    return this.fail(item, error, newer);
  }

  private fail(item: ItemQueue, error: unknown, newer: boolean): boolean {
    if (newer) return true; // an older failure must not roll back or block a newer interaction
    item.error = messageOf(error);
    this.setState(item, 'error');
    this.deps.events?.onError?.(item.id, item.error);
    return false;
  }
}
