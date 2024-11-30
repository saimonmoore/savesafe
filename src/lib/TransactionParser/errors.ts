export class TransactionParserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TransactionParserError';
    }
}

export class NotCSVParserError extends TransactionParserError { 
    constructor(message: string) {
        super(message);
        this.name = 'NotCSVParserError';
    }
}
