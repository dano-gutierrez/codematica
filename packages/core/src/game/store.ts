import {
  emptyGameProgress,
  mergeGameProgress,
  validateGameProgress,
  GAME_STORAGE_KEY,
  type GameProgress,
} from "./progress";
import type { GameCampaign } from "./schema";
export type GameStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
};
export type GameRemote = {
  account?: () => Promise<string | null>;
  load: (account?: string) => Promise<unknown>;
  save: (progress: GameProgress, account?: string) => Promise<unknown>;
};
/** Serial local writes, account-scoped caches, and idempotent remote union merges. */
export class GameStore {
  private value: GameProgress;
  private listeners = new Set<() => void>();
  private pending: Promise<void> = Promise.resolve();
  private account: string | null = null;
  private generation = 0;
  private loadRevision = 0;
  private incompatible = new Map<string, string>();
  persistenceError: string | null = null;
  constructor(
    readonly campaign: GameCampaign,
    private storage: GameStorage,
    private remote?: GameRemote,
    private key = GAME_STORAGE_KEY,
  ) {
    this.value = this.empty();
  }
  private empty() {
    return emptyGameProgress(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }
  private scopedKey(account = this.account) {
    return account ? `${this.key}:account:${account}` : this.key;
  }
  getStatus = () => this.persistenceError;
  private status(value: string | null) {
    if (value === this.persistenceError) return;
    this.persistenceError = value;
    for (const fn of this.listeners) fn();
  }
  isAnonymous = () => this.account === null;
  getSnapshot = () => this.value;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private emit(value: GameProgress) {
    this.value = value;
    for (const fn of this.listeners) fn();
  }
  private async read(key: string) {
    const raw = await this.storage.getItem(key);
    if (!raw) return null;
    try {
      return validateGameProgress(JSON.parse(raw), this.campaign);
    } catch {
      this.incompatible.set(key, raw);
      return null;
    }
  }
  private async write(key: string, value: GameProgress) {
    // Never erase a malformed or newer-format save. Retain its exact bytes first.
    const raw = this.incompatible.get(key);
    if (raw) {
      await this.storage.setItem(`${key}:recovery`, raw);
      this.incompatible.delete(key);
    }
    await this.storage.setItem(key, JSON.stringify(value));
  }
  private async sync(account: string | null, generation: number) {
    if (!this.remote || (this.remote.account && !account)) return;
    try {
      if (this.remote.account && (await this.remote.account()) !== account)
        return;
      const data = await this.remote.load(account ?? undefined);
      if (generation !== this.generation) return;
      if (data)
        this.emit(
          mergeGameProgress(
            this.value,
            validateGameProgress(data, this.campaign),
          ),
        );
      if (this.remote.account && (await this.remote.account()) !== account)
        return;
      const response = await this.remote.save(this.value, account ?? undefined);
      if (generation !== this.generation) return;
      if (response)
        this.emit(
          mergeGameProgress(
            this.value,
            validateGameProgress(response, this.campaign),
          ),
        );
      await this.write(this.scopedKey(account), this.value);
    } catch {
      /* The local union is retried on the next load, save, or reconnect. */
    }
  }
  async load() {
    const revision = ++this.loadRevision;
    try {
      const account = (await this.remote?.account?.()) ?? null;
      if (revision !== this.loadRevision) return;
      if (this.account !== account) {
        this.account = account;
        this.generation++;
        this.emit(this.empty());
      }
      const generation = this.generation;
      const local = await this.read(this.scopedKey(account));
      if (generation !== this.generation) return;
      if (local) this.emit(mergeGameProgress(this.value, local));
      if (account) {
        const claimant = await this.storage.getItem(`${this.key}:claimed`);
        if (!claimant || claimant === account) {
          const anonymous = await this.read(this.key);
          if (anonymous) {
            await this.storage.setItem(`${this.key}:claimed`, account);
            if (generation !== this.generation) return;
            this.emit(mergeGameProgress(this.value, anonymous));
            await this.write(this.scopedKey(account), this.value);
          }
        }
      }
      this.status(null);
    } catch {
      this.status(
        "Progress is held in memory because local storage is unavailable.",
      );
    }
    if (revision === this.loadRevision)
      await this.sync(this.account, this.generation);
  }
  save(value: GameProgress) {
    const checked = validateGameProgress(value, this.campaign),
      account = this.account,
      generation = this.generation;
    this.emit(mergeGameProgress(this.value, checked));
    this.pending = this.pending
      .catch(() => {})
      .then(async () => {
        try {
          if (
            this.remote?.account &&
            (await this.remote.account()) !== account
          ) {
            await this.load();
            return;
          }
          if (generation !== this.generation) return;
          await this.write(this.scopedKey(account), this.value);
          this.status(null);
          await this.sync(account, generation);
        } catch {
          this.status(
            "Progress is held in memory because local storage is unavailable.",
          );
        }
      });
    return this.pending;
  }
}
