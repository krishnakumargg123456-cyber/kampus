import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { query, isDatabaseConnected } from './db.ts';

export interface ModuleStateMetadata {
  moduleKey: string;
  version: number;
  checksum: string;
  recordCount: number;
  updatedAt: string;
}

export function computeStateChecksum(data: any): string {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function computeRecordCount(data: any): number {
  if (!data || typeof data !== 'object') return 0;
  if (Array.isArray(data)) return data.length;
  let count = 0;
  for (const val of Object.values(data)) {
    if (Array.isArray(val)) {
      count += val.length;
    } else if (val && typeof val === 'object') {
      count += Object.keys(val).length;
    } else if (val !== null && val !== undefined) {
      count += 1;
    }
  }
  return count;
}

const registeredModules = new Map<string, ModuleStorage<any>>();

export class ModuleStorage<T extends object> {
  public readonly moduleKey: string;
  private readonly filePath: string;
  private readonly defaultFactory: () => T;
  private cache: T | null = null;
  private version: number = 1;
  private recordCount: number = 0;
  private checksum: string = '';
  private isInitialized: boolean = false;
  private isPersisting: boolean = false;
  private pendingState: T | null = null;

  constructor(moduleKey: string, filePath: string, defaultFactory: () => T) {
    this.moduleKey = moduleKey;
    this.filePath = filePath;
    this.defaultFactory = defaultFactory;
    registeredModules.set(moduleKey, this);
  }

  /**
   * Synchronous get from in-memory cache, loading from local file or seed if not yet loaded.
   */
  public get(): T {
    if (!this.cache) {
      this.cache = this.loadFromFileOrSeed();
    }
    return this.cache;
  }

  /**
   * Asynchronously initialize storage from PostgreSQL or import from existing JSON file.
   */
  public async init(): Promise<T> {
    if (this.isInitialized) {
      return this.get();
    }

    if (isDatabaseConnected()) {
      try {
        const res = await query(
          'SELECT state, version, checksum, record_count FROM module_state WHERE module_key = $1',
          [this.moduleKey]
        );

        if (res.rows.length > 0) {
          const row = res.rows[0];
          this.cache = row.state as T;
          this.version = row.version;
          this.checksum = row.checksum;
          this.recordCount = row.record_count;
          this.isInitialized = true;

          // Sync PostgreSQL state back to local JSON file for backup resilience
          this.writeToDiskSafe(this.cache);
          console.log(`[ModuleStorage] Loaded '${this.moduleKey}' from PostgreSQL (v${this.version}, ${this.recordCount} records).`);
          return this.cache;
        }

        // If not found in PostgreSQL, check if local JSON file has existing records to import
        const localData = this.loadFromFileOrSeed();
        const initialCount = computeRecordCount(localData);
        const initialChecksum = computeStateChecksum(localData);

        await query(
          `INSERT INTO module_state (module_key, state, version, checksum, record_count, created_at, updated_at)
           VALUES ($1, $2, 1, $3, $4, NOW(), NOW())
           ON CONFLICT (module_key) DO NOTHING`,
          [this.moduleKey, JSON.stringify(localData), initialChecksum, initialCount]
        );

        this.cache = localData;
        this.version = 1;
        this.checksum = initialChecksum;
        this.recordCount = initialCount;
        this.isInitialized = true;
        console.log(`[ModuleStorage] Idempotently imported '${this.moduleKey}' into PostgreSQL (${initialCount} records).`);
        return this.cache;
      } catch (err: any) {
        console.warn(`[ModuleStorage] Database init warning for '${this.moduleKey}':`, err.message);
      }
    }

    // Fallback if PostgreSQL is offline or dev mode
    this.cache = this.loadFromFileOrSeed();
    this.isInitialized = true;
    return this.cache;
  }

  /**
   * Synchronously update in-memory cache and local file, then trigger async PostgreSQL persistence.
   */
  public saveSync(state: T): void {
    this.cache = state;
    this.writeToDiskSafe(state);
    // Queue asynchronous PostgreSQL persistence
    this.queuePersistence(state).catch((err) => {
      console.warn(`[ModuleStorage Background Save Error] '${this.moduleKey}':`, err.message);
    });
  }

  /**
   * Asynchronously persist state to both local backup and PostgreSQL with checksum and versioning.
   */
  public async save(state: T): Promise<boolean> {
    this.cache = state;
    this.writeToDiskSafe(state);
    return await this.persistToDatabase(state);
  }

  private queuePersistence(state: T): Promise<boolean> {
    this.pendingState = state;
    if (this.isPersisting) {
      return Promise.resolve(true);
    }
    return this.flushPersistence();
  }

  private async flushPersistence(): Promise<boolean> {
    if (this.isPersisting || !this.pendingState) return true;
    this.isPersisting = true;
    const toSave = this.pendingState;
    this.pendingState = null;

    try {
      await this.persistToDatabase(toSave);
      this.isPersisting = false;
      if (this.pendingState) {
        return this.flushPersistence();
      }
      return true;
    } catch (err: any) {
      this.isPersisting = false;
      console.error(`[ModuleStorage Persistence Error] '${this.moduleKey}':`, err.message);
      return false;
    }
  }

  private async persistToDatabase(state: T): Promise<boolean> {
    if (!isDatabaseConnected()) {
      return true; // Local file already saved safely
    }

    const newRecordCount = computeRecordCount(state);
    const newChecksum = computeStateChecksum(state);

    // Guard: Prevent empty defaults from overwriting populated database state
    if (newRecordCount === 0 && this.recordCount > 0) {
      console.error(`[ModuleStorage Safety Block] Aborted saving empty state over populated state for module '${this.moduleKey}'.`);
      return false;
    }

    try {
      const res = await query(
        `INSERT INTO module_state (module_key, state, version, checksum, record_count, updated_at)
         VALUES ($1, $2, 1, $3, $4, NOW())
         ON CONFLICT (module_key) DO UPDATE SET
           state = EXCLUDED.state,
           version = module_state.version + 1,
           checksum = EXCLUDED.checksum,
           record_count = EXCLUDED.record_count,
           updated_at = NOW()
         RETURNING version`,
        [this.moduleKey, JSON.stringify(state), newChecksum, newRecordCount]
      );

      if (res.rows.length > 0) {
        this.version = res.rows[0].version;
      }
      this.recordCount = newRecordCount;
      this.checksum = newChecksum;
      return true;
    } catch (err: any) {
      console.error(`[ModuleStorage DB Save Error] '${this.moduleKey}':`, err.message);
      return false;
    }
  }

  private loadFromFileOrSeed(): T {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed as T;
        }
      }
    } catch (err: any) {
      console.warn(`[ModuleStorage] Warning loading JSON file '${this.filePath}':`, err.message);
    }
    const seeded = this.defaultFactory();
    this.writeToDiskSafe(seeded);
    return seeded;
  }

  private writeToDiskSafe(data: T): void {
    let tempPath = '';
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      tempPath = `${this.filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempPath, this.filePath);
    } catch (err: any) {
      if (tempPath && fs.existsSync(tempPath)) {
        try { fs.unlinkSync(tempPath); } catch {}
      }
      // Never crash or delete source file on disk write error
      console.warn(`[ModuleStorage Disk Save Warning] '${this.moduleKey}':`, err.message);
    }
  }
}

/**
 * Initialize all registered module storage instances from PostgreSQL
 */
export async function initializeAllModules(): Promise<void> {
  console.log(`[ModuleStorage] Initializing ${registeredModules.size} modules...`);
  for (const [key, storage] of registeredModules.entries()) {
    try {
      await storage.init();
    } catch (err: any) {
      console.warn(`[ModuleStorage] Initialization error for '${key}':`, err.message);
    }
  }
  console.log('[ModuleStorage] All module stores initialized successfully.');
}

export function getRegisteredModule(moduleKey: string): ModuleStorage<any> | undefined {
  return registeredModules.get(moduleKey);
}
