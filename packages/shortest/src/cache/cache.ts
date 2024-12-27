import * as fs from 'fs';
import { CacheEntry, CacheStore } from '../types/cache';
import { hashData } from '../utils/crypto';
import { Logger } from '../utils/logger';
import path from 'path';
import * as objects from '../utils/objects';

export class BaseCache<T extends CacheEntry> {
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 1 week
  private readonly CLEANUP_PROBABILITY = 0.03; // 3% chance

  private logger: Logger;

  private cacheFile: string;

  // Locking (ensures that only one process or thread can access or modify cache)
  private lockFile: string;
  private readonly LOCK_TIMEOUT_MS = 1_000;
  protected lockAcquired = false;
  protected lockAcquireFailures = 0;

  constructor() {
    this.logger = new Logger();
    this.cacheFile = path.join(process.cwd(), '.cache', 'cache.json');
    this.lockFile = path.join(process.cwd(), '.cache', 'cache.lock');
    this.ensureDirectory();
    this.setupProcessHandlers();
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(path.dirname(this.cacheFile))) {
      fs.mkdirSync(path.dirname(this.cacheFile), { recursive: true });
    }
  }

  private read(): CacheStore {
    if (fs.existsSync(this.cacheFile)) {
      try {
        return JSON.parse(
          fs.readFileSync(this.cacheFile, 'utf-8')
        ) as CacheStore;
      } catch (error) {
        return {};
      }
    } else {
      return {};
    }
  }

  public async get(key: Record<any, any>): Promise<T | null> {
    if (!(await this.acquireLock())) {
      console.error('Cache', 'Failed to acquire lock for get operation');
      return null;
    }
    try {
      const hashedKey = hashData(key);
      const cache = this.read();
      return (cache[hashedKey] as T | undefined) ?? null;
    } catch (error) {
      this.logger.error('Cache', 'Failed to get');
      return null;
    } finally {
      this.releaseLock();
    }
  }

  public async set(
    key: Record<string, any>,
    value: Partial<T['data']>
  ): Promise<void> {
    if (!(await this.acquireLock())) {
      console.error('Cache', 'Failed to acquire lock for set operation');
      return;
    }
    try {
      const hashedKey = hashData(key);
      const cache = this.read();

      if (!cache[hashedKey]) {
        cache[hashedKey] = { data: {} } as T;
      }

      cache[hashedKey].data = objects.mergeDeep(cache[hashedKey].data, {
        ...value,
        timeStamp: Date.now(),
      }) as T['data'];

      this.write(cache);
    } catch (error) {
      this.logger.error('Cache', 'Failed to set');
      this.reset();
    } finally {
      this.releaseLock();
      if (Math.random() < this.CLEANUP_PROBABILITY) {
        this.cleanup();
      }
    }
  }

  private reset(): void {
    try {
      fs.writeFileSync(this.cacheFile, '{}');
    } catch (error) {
      this.logger.error('Cache', 'Failed to reset');
    } finally {
      this.releaseLock();
    }
  }

  private write(cache: CacheStore): void {
    try {
      fs.writeFileSync(this.cacheFile, JSON.stringify(cache, null, 2));
    } catch (error) {
      this.logger.error('Cache', 'Failed to write');
    }
  }

  private cleanup() {
    try {
      const cache = this.read();
      let cacheModified = false;
      for (const [key, value] of Object.entries(cache)) {
        // TODO (current) remove it
        if (value) {
          if (Date.now() - value.timestamp > this.CACHE_TTL) {
            delete cache[key];
            cacheModified = true;
          }
        }
      }

      if (cacheModified) {
        this.write(cache);
      }
    } catch (error) {
      this.logger.error('Cache', 'Failed to cleanup');
    }
  }

  public async acquireLock(): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < this.LOCK_TIMEOUT_MS) {
      try {
        if (fs.existsSync(this.lockFile)) {
          const lockAge = Date.now() - fs.statSync(this.lockFile).mtimeMs;
          if (lockAge > this.LOCK_TIMEOUT_MS) {
            fs.unlinkSync(this.lockFile);
            this.logger.reportStatus('Cache Stale lock file removed');
          }
        }

        fs.writeFileSync(this.lockFile, process.pid.toString(), { flag: 'wx' });
        this.lockAcquireFailures = 0;
        this.lockAcquired = true;
        this.logger.reportStatus('Cache Lock acquired');
        return true;
      } catch (e) {
        this.logger.error('Cache', 'Failed to acquire lock');
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    }
    this.logger.error('Cache', 'Failed to acquire lock after timeout');
    this.lockAcquireFailures++;
    if (this.lockAcquireFailures >= 3) {
      this.logger.error(
        'Cache',
        'Failed to acquire lock 3 times in a row. Releasing lock manually.'
      );
      this.releaseLock();
    }
    return false;
  }

  public releaseLock(): void {
    try {
      if (fs.existsSync(this.lockFile)) {
        fs.unlinkSync(this.lockFile);
        this.logger.reportStatus('Cache lock released');
      }
      this.lockAcquired = false;
    } catch (error) {
      this.logger.error('Cache', 'Failed to release lock');
    }
  }

  private setupProcessHandlers(): void {
    const releaseLockAndExit = () => {
      this.releaseLock();
      process.exit();
    };

    process.on('exit', releaseLockAndExit);
    process.on('SIGINT', releaseLockAndExit);
    process.on('SIGTERM', releaseLockAndExit);
    process.on('uncaughtException', (err) => {
      this.logger.error('Cache', err.message);
      if (this.lockAcquired) {
        releaseLockAndExit();
      }
    });
  }
}