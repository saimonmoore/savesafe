import { StorageBackend } from '@/lib/TransactionCategorizer/storage/Storage';
import { MerchantMapping, TransactionPattern } from '../Types';

export class InMemoryStorage implements StorageBackend {
  private merchantMappings: MerchantMapping[] = [];
  private patterns: TransactionPattern[] = [];
  private similarityCache: Record<string, [string, number][]> = {};

  constructor() {
    this.merchantMappings = [];
    this.patterns = [];
    this.similarityCache = {};
  }

  async loadMerchantMappings(): Promise<MerchantMapping[]> {
    return this.merchantMappings;
  }

  async saveMerchantMappings(mappings: MerchantMapping[]): Promise<void> {
    this.merchantMappings = mappings;
  }

  async loadPatterns(): Promise<TransactionPattern[]> {
    return this.patterns;
  }

  async savePatterns(patterns: TransactionPattern[]): Promise<void> {
    this.patterns = patterns;
  }

  async loadSimilarityCache(): Promise<Record<string, [string, number][]>> {
    return this.similarityCache;
  }

  async saveSimilarityCache(cache: Record<string, [string, number][]>): Promise<void> {
    this.similarityCache = cache;
  }
} 