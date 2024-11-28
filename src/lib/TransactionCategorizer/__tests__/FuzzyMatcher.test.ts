import { describe, it, expect } from 'vitest';
import { FuzzyMatcher } from '@/lib/TransactionCategorizer/FuzzyMatcher';

describe('FuzzyMatcher', () => {
    describe('calculateSimilarity', () => {
        it('should calculate string similarity', () => {
            const similar1 = FuzzyMatcher.findSimilarMerchants('Starbucks', ['Starbux', 'StarBucks', 'Starbuks']);
            expect(similar1).toHaveLength(2);

            const similar2 = FuzzyMatcher.findSimilarMerchants('Som Energia', ['SomEnergia', 'NoSomosEnergia']);
            expect(similar2).toHaveLength(1);
        });

        it('handles edge cases', () => {
            const similar = FuzzyMatcher.findSimilarMerchants('Exact', ['Exact'], 1.0);
            expect(similar).toHaveLength(1);

            const dissimilar = FuzzyMatcher.findSimilarMerchants('Different', ['Other'], 0.9);
            expect(dissimilar).toHaveLength(0);
        });
    });
});