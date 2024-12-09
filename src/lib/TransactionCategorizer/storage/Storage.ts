import { MerchantMapping, TransactionPattern } from "../Types";

export interface StorageBackend {
  loadMerchantMappings(): Promise<MerchantMapping[]>;
  saveMerchantMappings(mappings: MerchantMapping[]): Promise<void>;

  loadPatterns(): Promise<TransactionPattern[]>;
  savePatterns(patterns: TransactionPattern[]): Promise<void>;

  loadSimilarityCache(): Promise<Record<string, [string, number][]>>;
  saveSimilarityCache(cache: Record<string, [string, number][]>): Promise<void>;
} 