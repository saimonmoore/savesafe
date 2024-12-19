import { FuzzyMatcher } from '@/lib/TransactionCategorizer/FuzzyMatcher';
import { MappingError, MerchantMapping, TransactionPattern } from './Types';
import { WorkerLLMManager } from '@/lib/LLM/WorkerLLMManager';
import { CategorizationMethod } from "@/db/schemas/Transaction";
import { Transaction } from '@/domain/models/Transaction/Transaction';
import { StorageBackend } from './storage/Storage';
import { InMemoryStorage } from './storage/InMemoryStorage';
import { Category, CATEGORIES } from '@/domain/models/Category/Category';
import { Category as CategoryEnum } from "@/db/schemas/Category";
// import { IndexedDBStorage } from './storage/IndexedDBStorage';

export class EnhancedTransactionCategorizer {
    private llmManager: WorkerLLMManager;
    private storage: StorageBackend;

    constructor(storage?: StorageBackend) {
        this.llmManager = WorkerLLMManager.getInstance();
        this.storage = storage || new InMemoryStorage();
        // this.storage = storage || new IndexedDBStorage();
    }

    async bulkImportCategories(mappings: MerchantMapping[]): Promise<{ success: string[], error: MappingError[] }> {
        const existingMappings = await this.storage.loadMerchantMappings();
        const results: { success: string[], error: MappingError[] } = { success: [], error: [] };

        mappings.forEach(mapping => {
            try {
                const existingIndex = existingMappings.findIndex(m => m.merchant === mapping.merchant);

                if (existingIndex !== -1) {
                    existingMappings[existingIndex] = mapping;
                } else {
                    existingMappings.push(mapping);
                }

                results.success.push(mapping.merchant);
            } catch (error) {
                results.error.push({
                    merchant: mapping.merchant,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        await this.storage.saveMerchantMappings(existingMappings);
        return results;
    }

    async findMerchantCategory(merchant: string): Promise<{ category: string, confidence: number, method: CategorizationMethod } | null> {
        const merchantMappings = await this.storage.loadMerchantMappings();
        const directMapping = merchantMappings.find(m => m.merchant === merchant);
        if (directMapping) {
            return {
                category: directMapping.category,
                confidence: directMapping.confidence,
                method: CategorizationMethod.STORED
            };
        }

        const patterns = await this.storage.loadPatterns();
        const patternMatch = patterns.find(p =>
            (p.isRegex ? new RegExp(p.pattern, 'i').test(merchant) :
                merchant.toLowerCase().includes(p.pattern.toLowerCase()))
        );

        if (patternMatch) {
            return {
                category: patternMatch.category,
                confidence: patternMatch.confidence,
                method: CategorizationMethod.PATTERN
            };
        }

        const similarityCache = await this.storage.loadSimilarityCache();
        if (!similarityCache[merchant]) {
            const merchants = merchantMappings.map(m => m.merchant);
            const similarMerchants = FuzzyMatcher.findSimilarMerchants(merchant, merchants);

            if (similarMerchants?.length > 0) {
                similarityCache[merchant] = similarMerchants;
            }

            if (Object.keys(similarityCache).length > 0) {
                console.log('[TransactionCategorizer#findMerchantCategory] ==============> saving similarityCache: ', { similarityCache });
                await this.storage.saveSimilarityCache(similarityCache);
            }
        }

        const similarMerchants = similarityCache[merchant];
        if (similarMerchants?.length > 0) {
            const [bestMatch, similarity] = similarMerchants[0];
            const similarMapping = merchantMappings.find(m => m.merchant === bestMatch);

            if (similarMapping) {
                console.log('[TransactionCategorizer#findMerchantCategory] ==============> Found similarMapping: ', { similarMapping });
                return {
                    category: similarMapping.category,
                    confidence: similarMapping.confidence * similarity,
                    method: CategorizationMethod.FUZZY
                };
            }
        }

        return null;
    }

    async addPattern(pattern: TransactionPattern): Promise<void> {
        const patterns = await this.storage.loadPatterns();
        patterns.push(pattern);
        await this.storage.savePatterns(patterns);
    }

    async addMerchantMapping(merchant: string, category: Category): Promise<void> {
        const merchantMappings = await this.storage.loadMerchantMappings();
        merchantMappings.push({ merchant, category: category.category, confidence: 1, isManual: true });
        await this.storage.saveMerchantMappings(merchantMappings);
    }

    async bulkCategorize(transactions: Transaction[]): Promise<Transaction[]> {
        const uniqueMerchants = [...new Set(transactions.map(t => t.merchant))];
        const merchantCategories = new Map<string, { category: string, confidence: number, method: CategorizationMethod }>();

        console.log('[TransactionCategorizer#bulkCategorize] ==============>', { uniqueMerchants });

        const unmatchedMerchants: string[] = [];
        for (const merchant of uniqueMerchants) {
            const result = await this.findMerchantCategory(merchant);

            if (result) {
                merchantCategories.set(merchant, result);
            } else {
                unmatchedMerchants.push(merchant);
            }
        }

        console.log('[TransactionCategorizer#bulkCategorize] ==============>', { unmatchedMerchants });

        if (unmatchedMerchants.length > 0) {
            const batchedResult = await this.getAiBatchCategory(unmatchedMerchants);
            
            for (const [merchant, category] of batchedResult) {
                merchantCategories.set(merchant, category);
            }
        }

        // Persist the categorized merchants back to the storage
        const existingMappings = await this.storage.loadMerchantMappings();
        merchantCategories.forEach((value, merchant) => {
            const existingIndex = existingMappings.findIndex(m => m.merchant === merchant);
            const newMapping: MerchantMapping = {
                merchant,
                category: value.category,
                confidence: value.confidence,
                isManual: value.method === CategorizationMethod.STORED
            };

            if (existingIndex !== -1) {
                existingMappings[existingIndex] = newMapping;
            } else {
                existingMappings.push(newMapping);
            }
        });

        console.log('[TransactionCategorizer#bulkCategorize] ==============> storing mappings: ', { existingMappings });
        await this.storage.saveMerchantMappings(existingMappings);

        return transactions.map(tx => {
            const categoryInfo = merchantCategories.get(tx.merchant);
            if (categoryInfo) {
                tx.categorize(categoryInfo.category, categoryInfo.confidence, categoryInfo.method);
            }
            return tx;
        });
    }

    async getAiBatchCategory(merchants: string[]): Promise<Map<string, { category: string, confidence: number, method: CategorizationMethod }>> {
        try {
            const response = await this.llmManager.requestInference([
                {
                    role: "system",
                    content: `You are a financial categorization expert. Respond with a json array of categories matching the input merchants.
                              Use only these categories: ${CATEGORIES.join(', ')}
                              Format: "[{ Merchant1:Category1}, {Merchant2:Category2}, ...]"`
                },
                {
                    role: "user",
                    content: `Categorize these transactions merchants: ${merchants.join(', ')}`
                }
            ]);

            const responseContent = response.choices[0].message.content.trim();
            const responseJson = JSON.parse(responseContent);

            const categoryMap = new Map<string, { category: string, confidence: number, method: CategorizationMethod }>();

            responseJson.forEach((mapping: Record<string, string>) => {
                const [[merchant, category]] = Object.entries(mapping);

                if (merchant && category && CATEGORIES.includes(category as CategoryEnum)) {
                    categoryMap.set(merchant, {
                        category,
                        confidence: 0.7, // TODO: Ask LLM for confidence
                        method: CategorizationMethod.AI_BATCH
                    });
                } else {
                    categoryMap.set(merchant, {
                        category: 'other',
                        confidence: 0.1,
                        method: CategorizationMethod.AI_BATCH_ERROR
                    });
                }
            });

            console.log('[TransactionCategorizer#getAiBatchCategory] ==============>', { categoryMap });
            return categoryMap;
        } catch (error) {
            console.error('Error in batch AI categorization:', error);
            
            // TODO: Think deeper about this fallback
            const fallbackMap = new Map<string, { category: string, confidence: number, method: CategorizationMethod }>();
            for (const merchant of merchants) {
                fallbackMap.set(merchant, {
                    category: 'other',
                    confidence: 0.1,
                    method: CategorizationMethod.AI_BATCH_ERROR
                });
            }
            console.log('[TransactionCategorizer#getAiBatchCategory] ==============> fallbackMap: ', { fallbackMap });
            return fallbackMap;
        }
    }
}