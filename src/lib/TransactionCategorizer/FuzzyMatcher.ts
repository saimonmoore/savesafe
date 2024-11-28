class FuzzyMatcher {
    static calculateSimilarity(str1: string, str2: string): number {
        const longerStr = str1.length > str2.length ? str1 : str2;
        const shorterStr = str1.length > str2.length ? str2 : str1;

        const maxDistance = longerStr.length;
        const levenshteinDistance = this.computeLevenshteinDistance(longerStr, shorterStr);

        return 1 - (levenshteinDistance / maxDistance);
    }

    static computeLevenshteinDistance(str1: string, str2: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= str1.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str2.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str1.length; i++) {
            for (let j = 1; j <= str2.length; j++) {
                if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str1.length][str2.length];
    }

    static findSimilarMerchants(
        merchant: string,
        merchants: string[],
        minSimilarity: number = 0.85
    ): [string, number][] {
        return merchants
            .map(m => [m, this.calculateSimilarity(merchant, m)] as [string, number])
            .filter(([, similarity]) => similarity >= minSimilarity)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
}

export { FuzzyMatcher };