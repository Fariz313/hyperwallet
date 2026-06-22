export interface WalletSyncResult {
  address: string;
  syncedAt: string;
  snapshotCount: number;
  positionCount: number;
  fillCount: number;
  orderCount: number;
}

export interface WalletSyncEvent {
  type: "wallet:synced";
  payload: WalletSyncResult;
  at: string;
}

export interface WalletErrorEvent {
  type: "wallet:error";
  payload: {
    address: string;
    error: string;
    at: string;
  };
  at: string;
}

export type WalletEvent = WalletSyncEvent | WalletErrorEvent;

class WalletEventBus {
  private listeners: Array<(event: WalletEvent) => void> = [];
  private latestEvent: WalletEvent | null = null;

  emitWalletSynced(payload: WalletSyncResult): void {
    this.emit({
      type: "wallet:synced",
      payload,
      at: new Date().toISOString(),
    });
  }

  emitWalletError(payload: WalletErrorEvent["payload"]): void {
    this.emit({
      type: "wallet:error",
      payload,
      at: new Date().toISOString(),
    });
  }

  getLatest(): WalletEvent | null {
    return this.latestEvent;
  }

  waitForEventAfter(
    lastAt: string | null,
    timeoutMs = 25_000,
  ): Promise<WalletEvent | null> {
    const latest = this.latestEvent;

    if (latest && (!lastAt || latest.at > lastAt)) {
      return Promise.resolve(latest);
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.unsubscribe(listener);
        resolve(null);
      }, timeoutMs);

      const listener = (event: WalletEvent) => {
        if (!lastAt || event.at > lastAt) {
          clearTimeout(timeout);
          this.unsubscribe(listener);
          resolve(event);
        }
      };

      this.listeners.push(listener);
    });
  }

  subscribe(listener: (event: WalletEvent) => void): () => void {
    this.listeners.push(listener);

    return () => this.unsubscribe(listener);
  }

  private emit(event: WalletEvent): void {
    this.latestEvent = event;

    for (const listener of [...this.listeners]) {
      listener(event);
    }
  }

  private unsubscribe(listener: (event: WalletEvent) => void): void {
    this.listeners = this.listeners.filter((item) => item !== listener);
  }
}

export const walletEvents = new WalletEventBus();
