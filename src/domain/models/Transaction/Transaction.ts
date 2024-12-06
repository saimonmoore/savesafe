export enum TransactionEvents {
    TransactionsParsed = "TransactionsParsedEvent",
    TransactionsCategorized = "TransactionsCategorizedEvent"
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

    constructor(
        merchant: string,
        amount: number,
        transactionDate: Date,
        balance?: number,
        effectiveDate?: Date
    ) { 
        this.merchant = merchant;
        this.amount = amount;
        this.balance = balance;
        this.transactionDate = transactionDate;
        this.effectiveDate = effectiveDate;
    }

    categorize(category: string): void {
        this.category = category;
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