import { FuzzyMatcher } from '@/lib/TransactionCategorizer/FuzzyMatcher';

interface TransactionPattern {
    pattern: string;
    category: string;
    confidence: number;
    isRegex?: boolean;
}

interface MerchantMapping {
    merchant: string;
    category: string;
    confidence: number;
    isManual?: boolean;
    aliases?: string[];
}

interface Transaction {
    description: string;
    amount: number;
    date: Date;
    category?: string;
    confidence?: number;
    categorizationMethod?: string;
}

interface LLMResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

interface LLMClient {
    generateResponse(messages: { role: string, content: string }[]): Promise<LLMResponse>;
}

type MappingError = { merchant: string, error: Error | string };


class EnhancedTransactionCategorizer {
    private patterns: TransactionPattern[] = [];
    private merchantMappings: MerchantMapping[] = [];
    private similarityCache: Record<string, [string, number][]> = {};
    private llmClient: LLMClient;

    constructor(llmClient: LLMClient) {
        this.llmClient = llmClient;
    }

    bulkImportCategories(mappings: MerchantMapping[]): { success: string[], error: MappingError[] } {
        const results: { success: string[], error: MappingError[] } = { success: [], error: [] };

        mappings.forEach(mapping => {
            try {
                const existingIndex = this.merchantMappings.findIndex(
                    m => m.merchant === mapping.merchant
                );

                if (existingIndex !== -1) {
                    this.merchantMappings[existingIndex] = mapping;
                } else {
                    this.merchantMappings.push(mapping);
                }

                if (mapping.aliases) {
                    mapping.aliases.forEach(alias => {
                        FuzzyMatcher.calculateSimilarity(mapping.merchant, alias);
                    });
                }

                results.success.push(mapping.merchant);
            } catch (error) {
                results.error.push({
                    merchant: mapping.merchant,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        return results;
    }

    findMerchantCategory(merchant: string): { category: string, confidence: number, method: string } | null {
        const directMapping = this.merchantMappings.find(m => m.merchant === merchant);
        if (directMapping) {
            return {
                category: directMapping.category,
                confidence: directMapping.confidence,
                method: 'stored'
            };
        }

        const patternMatch = this.patterns.find(p =>
        (p.isRegex ? new RegExp(p.pattern, 'i').test(merchant) :
            merchant.toLowerCase().includes(p.pattern.toLowerCase()))
        );

        if (patternMatch) {
            return {
                category: patternMatch.category,
                confidence: patternMatch.confidence,
                method: 'pattern'
            };
        }

        if (!this.similarityCache[merchant]) {
            const merchants = this.merchantMappings.map(m => m.merchant);
            this.similarityCache[merchant] = FuzzyMatcher.findSimilarMerchants(merchant, merchants);
        }

        const similarMerchants = this.similarityCache[merchant];
        if (similarMerchants.length > 0) {
            const [bestMatch, similarity] = similarMerchants[0];
            const similarMapping = this.merchantMappings.find(m => m.merchant === bestMatch);

            if (similarMapping) {
                return {
                    category: similarMapping.category,
                    confidence: similarMapping.confidence * similarity,
                    method: 'fuzzy'
                };
            }
        }

        return null;
    }

    async bulkCategorize(transactions: Transaction[]): Promise<Transaction[]> {
        const uniqueMerchants = [...new Set(transactions.map(t => t.description))];
        const merchantCategories = new Map<string, { category: string, confidence: number, method: string }>();

        // First pass: use local methods (stored mappings, patterns, fuzzy matching)
        const unmatchedMerchants: string[] = [];
        for (const merchant of uniqueMerchants) {
            const result = this.findMerchantCategory(merchant);

            if (result) {
                merchantCategories.set(merchant, result);
            } else {
                unmatchedMerchants.push(merchant);
            }
        }

        // Batch AI categorization for unmatched merchants
        if (unmatchedMerchants.length > 0) {
            const batchedResult = await this.getAiBatchCategory(unmatchedMerchants);
            
            for (const [merchant, category] of batchedResult) {
                merchantCategories.set(merchant, category);
            }
        }

        // Apply categories to transactions
        return transactions.map(tx => {
            const categoryInfo = merchantCategories.get(tx.description);
            return categoryInfo ? {
                ...tx,
                category: categoryInfo.category,
                confidence: categoryInfo.confidence,
                categorizationMethod: categoryInfo.method
            } : tx;
        });
    }

    async getAiBatchCategory(merchants: string[]): Promise<Map<string, { category: string, confidence: number, method: string }>> {
        const categories = [
            'housing', 'utilities', 'food', 'transport', 'technology',
            'entertainment', 'finance', 'education', 'healthcare',
            'shopping', 'telecommunications', 'other'
        ];

        try {
            const response = await this.llmClient.generateResponse([
                {
                    role: "system",
                    content: `You are a financial categorization expert. Respond with a json array of categories matching the input merchants.
                              Use only these categories: ${categories.join(', ')}
                              Format: "[{ Merchant1:Category1}, {Merchant2:Category2}, ...]"`
                },
                {
                    role: "user",
                    content: `Categorize these transactions merchants: ${merchants.join(', ')}`
                }
            ]);

            const responseContent = response.choices[0].message.content.trim();
            const responseJson = JSON.parse(responseContent);

            const categoryMap = new Map<string, { category: string, confidence: number, method: string }>();

            responseJson.forEach((mapping: Record<string, string>) => {
                const [[merchant, category]] = Object.entries(mapping);

                if (merchant && category && categories.includes(category)) {
                    categoryMap.set(merchant, {
                        category,
                        confidence: 0.7,
                        method: 'ai_batch'
                    });
                } else {
                    categoryMap.set(merchant, {
                        category: 'other',
                        confidence: 0.1,
                        method: 'ai_batch_error'
                    });
                }
            });

            return categoryMap;
        } catch (error) {
            console.error('Error in batch AI categorization:', error);
            
            // Fallback: assign 'other' to all unmatched merchants
            const fallbackMap = new Map<string, { category: string, confidence: number, method: string }>();
            for (const merchant of merchants) {
                fallbackMap.set(merchant, {
                    category: 'other',
                    confidence: 0.1,
                    method: 'ai_batch_error'
                });
            }
            return fallbackMap;
        }
    }

    // Optional: Add method to add patterns manually
    addPattern(pattern: TransactionPattern): void {
        this.patterns.push(pattern);
    }
}

// Example usage
// async function exampleUsage(WebLLM: LLMClient) {
//     const categorizer = new EnhancedTransactionCategorizer(WebLLM);

//     // Add manual merchant mappings
//     const mappings: MerchantMapping[] = [
//         {
//             merchant: "CASA AMETLLER",
//             category: "food",
//             confidence: 1.0,
//             aliases: ["AMETLLER ORIGEN", "CASA AMETLLER S.L."]
//         },
//         {
//             merchant: "Som Energia, SCCL",
//             category: "utilities",
//             confidence: 1.0,
//             aliases: ["SOM ENERGIA", "SOM ENERGIA SCCL"]
//         }
//     ];

//     // Import mappings
//     const importResults = categorizer.bulkImportCategories(mappings);

//     // Add a manual pattern
//     categorizer.addPattern({
//         pattern: "energia",
//         category: "utilities",
//         confidence: 0.9,
//         isRegex: false
//     });

//     // Example transactions
//     const transactions: Transaction[] = [
//         {
//             description: "CASA AMETLLER",
//             amount: 42.50,
//             date: new Date()
//         },
//         {
//             description: "Som Energia, SCCL",
//             amount: 75.20,
//             date: new Date()
//         }
//     ];

//     // Categorize transactions
//     const categorizedTransactions = await categorizer.bulkCategorize(transactions);
//     console.log('Categorized Transactions:', categorizedTransactions);
// }

export {
    EnhancedTransactionCategorizer
};
export type {
    Transaction,
    MerchantMapping,
    TransactionPattern
};
