import { StorageBackend } from "./Storage";
import { MerchantMapping, TransactionPattern } from "../Types";

// @browser
export class IndexedDBStorage implements StorageBackend {
  private dbName = 'TransactionCategorizerDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    if (!indexedDB) {
      throw new Error("IndexedDB is not supported");
    }

    this.initDB();
  }

  private initDB() {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('merchantMappings', { keyPath: 'merchant' });
      db.createObjectStore('patterns', { keyPath: 'pattern' });
      db.createObjectStore('similarityCache');
    };

    request.onsuccess = (event) => {
      console.log('IndexedDB initialized');
      this.db = (event.target as IDBOpenDBRequest).result;
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
    };
  }

  private getObjectStore(storeName: string, mode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async loadMerchantMappings(): Promise<MerchantMapping[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('merchantMappings', 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as MerchantMapping[]);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMerchantMappings(mappings: MerchantMapping[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('merchantMappings', 'readwrite');
      mappings.forEach(mapping => store.put(mapping));

      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  }

  async loadPatterns(): Promise<TransactionPattern[]> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('patterns', 'readonly');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as TransactionPattern[]);
      request.onerror = () => reject(request.error);
    });
  }

  async savePatterns(patterns: TransactionPattern[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('patterns', 'readwrite');
      patterns.forEach(pattern => store.put(pattern));

      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  }

  async loadSimilarityCache(): Promise<Record<string, [string, number][]>> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('similarityCache', 'readonly');
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, [string, number][]> = {};
        (request.result as { key: string, value: [string, number][] }[]).forEach(item => {
          result[item.key] = item.value;
        });
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveSimilarityCache(cache: Record<string, [string, number][]>): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getObjectStore('similarityCache', 'readwrite');
      Object.entries(cache).forEach(([key, value]) => store.put({ key, value }));

      store.transaction.oncomplete = () => resolve();
      store.transaction.onerror = () => reject(store.transaction.error);
    });
  }

  async clear(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['merchantMappings', 'patterns', 'similarityCache'], 'readwrite');
    transaction.objectStore('merchantMappings').clear();
    transaction.objectStore('patterns').clear();
    transaction.objectStore('similarityCache').clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
} 