import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EnhancedTransactionCategorizer, Transaction, MerchantMapping } from '@/lib/TransactionCategorizer/TransactionCategorizer';

interface MockLLMClientMessage {
    content: string;
}

// Mock LLM Client
class MockLLMClient {
    async generateResponse(messages: MockLLMClientMessage[]) {
        const content = messages[1].content;

        return {
            choices: [{
                message: {
                    content: content.includes('Energia')
                        ? JSON.stringify([{ 'Som Energia, SCCL': 'utilities' }, { 'Unknown Merchant': 'other' }])
                        : JSON.stringify([{ 'Merchant1': 'other' }, { 'Merchant2': 'other' }])
                }
            }]
        };
    }
}

describe('EnhancedTransactionCategorizer', () => {
    let categorizer: EnhancedTransactionCategorizer;
    let mockLLMClient: MockLLMClient;

    beforeEach(() => {
        // silence console.error
        console.error = vi.fn();
        mockLLMClient = new MockLLMClient();
        categorizer = new EnhancedTransactionCategorizer(mockLLMClient);
    });

    describe('bulkImportCategories', () => {
        it('should successfully import merchant mappings', () => {
            const mappings: MerchantMapping[] = [
                {
                    merchant: 'ACME Corp',
                    category: 'shopping',
                    confidence: 1.0,
                    aliases: ['ACME', 'ACME Store']
                }
            ];

            const result = categorizer.bulkImportCategories(mappings);

            expect(result.success).toHaveLength(1);
            expect(result.success[0]).toBe('ACME Corp');
            expect(result.error).toHaveLength(0);
        });

        it('should handle duplicate merchant mappings', () => {
            const mappings: MerchantMapping[] = [
                {
                    merchant: 'ACME Corp',
                    category: 'shopping',
                    confidence: 1.0
                },
                {
                    merchant: 'ACME Corp',
                    category: 'technology',
                    confidence: 0.9
                }
            ];

            const result = categorizer.bulkImportCategories(mappings);

            expect(result.success).toHaveLength(2);
            expect(result.error).toHaveLength(0);
        });
    });

    describe('findMerchantCategory', () => {
        beforeEach(() => {
            // Preload some merchant mappings
            categorizer.bulkImportCategories([
                {
                    merchant: 'Amazon',
                    category: 'shopping',
                    confidence: 1.0
                },
                {
                    merchant: 'Starbucks',
                    category: 'food',
                    confidence: 0.9
                }
            ]);

            // Add a pattern
            categorizer.addPattern({
                pattern: 'energy',
                category: 'utilities',
                confidence: 0.8,
                isRegex: false
            });
        });

        it('should find exact merchant match', () => {
            const result = categorizer.findMerchantCategory('Amazon');

            expect(result).toEqual({
                category: 'shopping',
                confidence: 1.0,
                method: 'stored'
            });
        });

        it('should find category by pattern', () => {
            const result = categorizer.findMerchantCategory('Green Energy Inc');

            expect(result).toEqual({
                category: 'utilities',
                confidence: 0.8,
                method: 'pattern'
            });
        });

        it('should find similar merchants via fuzzy matching', () => {
            const result = categorizer.findMerchantCategory('Starbuks');

            expect(result).toEqual({
                category: 'food',
                confidence: expect.any(Number),
                method: 'fuzzy'
            });
        });

        it('should return null for completely unknown merchant', () => {
            const result = categorizer.findMerchantCategory('Unknown Merchant');

            expect(result).toBeNull();
        });
    });

    describe('bulkCategorize', () => {
        it('should categorize transactions with multiple methods, using batched AI', async () => {
            // Preload mappings and patterns
            categorizer.bulkImportCategories([
                {
                    merchant: 'Amazon',
                    category: 'shopping',
                    confidence: 1.0
                }
            ]);

            const transactions: Transaction[] = [
                {
                    description: 'Amazon',
                    amount: 50.00,
                    date: new Date()
                },
                {
                    description: 'Som Energia, SCCL',
                    amount: 75.20,
                    date: new Date()
                },
                {
                    description: 'Unknown Merchant',
                    amount: 25.50,
                    date: new Date()
                }
            ];

            const categorizedTransactions = await categorizer.bulkCategorize(transactions);

            expect(categorizedTransactions).toHaveLength(3);

            // Check Amazon transaction (stored method)
            expect(categorizedTransactions[0]).toMatchObject({
                description: 'Amazon',
                category: 'shopping',
                categorizationMethod: 'stored'
            });

            // Check Som Energia transaction (batched AI method)
            expect(categorizedTransactions[1]).toMatchObject({
                description: 'Som Energia, SCCL',
                category: 'utilities',
                categorizationMethod: 'ai_batch'
            });

            // Check Unknown Merchant transaction (batched AI method)
            expect(categorizedTransactions[2]).toMatchObject({
                description: 'Unknown Merchant',
                category: 'other',
                categorizationMethod: 'ai_batch'
            });
        });
    });

    describe('getAiBatchCategory', () => {
        it('should batch categorize multiple merchants', async () => {
            const merchants = ['Som Energia, SCCL', 'Unknown Merchant'];
            
            const result = await categorizer.getAiBatchCategory(merchants);

            expect(result.size).toBe(2);
            
            // Check Som Energia categorization
            const energiaCategory = result.get('Som Energia, SCCL');
            expect(energiaCategory).toEqual({
                category: 'utilities',
                confidence: 0.7,
                method: 'ai_batch'
            });

            // Check Unknown Merchant categorization
            const unknownCategory = result.get('Unknown Merchant');
            expect(unknownCategory).toEqual({
                category: 'other',
                confidence: 0.7,
                method: 'ai_batch'
            });
        });

        it('handles batch AI categorization errors', async () => {
            // Mock an error in the LLM client
            const errorClient = {
                generateResponse: vi.fn().mockRejectedValue(new Error('AI Error'))
            };

            const errorCategorizer = new EnhancedTransactionCategorizer(errorClient);
            const merchants = ['Test Merchant1', 'Test Merchant2'];

            const result = await errorCategorizer.getAiBatchCategory(merchants);

            expect(result.size).toBe(2);
            
            // Both merchants should be categorized as 'other' with low confidence
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const [_, category] of result.entries()) {
                expect(category).toEqual({
                    category: 'other',
                    confidence: 0.1,
                    method: 'ai_batch_error'
                });
            }
        });
    });
});