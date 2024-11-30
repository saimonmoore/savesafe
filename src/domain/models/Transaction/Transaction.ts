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
    balance: number;
    transactionDate: Date;
    effectiveDate: Date;
    category?: string;

    constructor(
        merchant: string,
        amount: number,
        balance: number,
        transactionDate: Date,
        effectiveDate: Date
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
            json.balance,
            new Date(json.transactionDate),
            new Date(json.effectiveDate)
        );
    }
}