export interface TransactionPattern {
    pattern: string;
    category: string;
    confidence: number;
    isRegex?: boolean;
}

export interface MerchantMapping {
    merchant: string;
    category: string;
    confidence: number;
    isManual?: boolean;
    aliases?: string[];
}

export type MappingError = { merchant: string, error: Error | string };