export enum TransactionEvents {
    TransactionsParsed = "TransactionsParsedEvent",
    TransactionsCategorized = "TransactionsCategorizedEvent"
}

export enum CategorizationMethod {
    AI_BATCH = "ai_batch",
    AI_BATCH_ERROR = "ai_batch_error",
    STORED = "stored",
    PATTERN = "pattern",
    FUZZY = "fuzzy"
}

export interface RawTransaction {
    merchant: string;
    amount: number;
    balance?: number;
    transactionDate: Date;
    effectiveDate?: Date;
}

export class Transaction {
    merchant: string;
    amount: number;
    balance?: number;
    transactionDate: Date;
    effectiveDate?: Date;
    category?: string;
    confidence?: number;
    categorizationMethod?: CategorizationMethod;

    constructor(
        merchant: string,
        amount: number,
        transactionDate: Date,
        balance?: number,
        effectiveDate?: Date,
        category?: string,
        confidence?: number,
        categorizationMethod?: CategorizationMethod
    ) { 
        this.merchant = merchant;
        this.amount = amount;
        this.balance = balance;
        this.transactionDate = transactionDate;
        this.effectiveDate = effectiveDate;
        this.category = category;
        this.confidence = confidence;
        this.categorizationMethod = categorizationMethod;
    }

    categorize(category: string, confidence: number, method: CategorizationMethod): void {
        this.category = category;
        this.confidence = confidence;
        this.categorizationMethod = method;
    }

    public static fromJSON(json: RawTransaction): Transaction {
        return new Transaction(
            json.merchant,
            json.amount,
            new Date(json.transactionDate),
            json.balance,
            json.effectiveDate ? new Date(json.effectiveDate) : undefined
        );
    }
}