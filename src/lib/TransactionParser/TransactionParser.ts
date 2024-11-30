import { Transaction } from "@/domain/models/Transaction/Transaction";
import { TransactionParserError } from "@/lib/TransactionParser/errors";
import { TransactionColumnNames, TransactionColumnNamesMap } from "@/lib/data/Transaction";
import { CSVHeaderParser } from "@/lib/CSVHeaderParser/CSVHeaderParser";

import type { LLMClient } from "@/lib/webllm";
import type { RawTransaction } from "@/domain/models/Transaction/Transaction";

interface CSVMapping {
    delimiter: string;
    merchant: string;
    amount: string;
    balance: string;
    transactionDate: string;
    effectiveDate: string;
}

class TransactionParser {
    private mappingPatterns: Map<string, CSVMapping> = new Map();
    private csvHeaderParser: CSVHeaderParser;

    constructor(webLLM: LLMClient) {
        this.csvHeaderParser = new CSVHeaderParser(webLLM);
    }

    private async getHeadersFromAI(lines: string[]): Promise<string> {
        const headerLines = lines.slice(0, 5).join('\n');
        return await this.csvHeaderParser.extractWithAI(headerLines);
    }

    private standardizeHeader(header: string): string {
        return header.toUpperCase().replace(/[-_]/g, ' ');
    }

    // Map headers to a common format using the TransactionColumnNames mapping
    private getTranslatedHeaders(headers: string[]): Record<string, string> {
        return headers.reduce((translatedHeaders: Record<string, string>, header: string) => {
            const standardHeader = this.standardizeHeader(header);
            const translatedHeader = TransactionColumnNamesMap[standardHeader as keyof typeof TransactionColumnNamesMap];

            if (translatedHeader) {
                translatedHeaders[translatedHeader] = standardHeader;
            }

            return translatedHeaders;
        }, {});
    }

    private getMappingFromTranslatedHeaders(translatedHeaders: Record<string, string>, delimiter: string): CSVMapping {
        const requiredHeaders = [TransactionColumnNames.AMOUNT, TransactionColumnNames.DESCRIPTION];

        for (const header of requiredHeaders) {
            if (!translatedHeaders[header]) {
                throw new TransactionParserError(`Missing required column: ${header}`);
            }
        }

        // If no transaction date is found, use effective date
        // otherwise throw an error
        if (!translatedHeaders[TransactionColumnNames.TRANSACTION_DATE] && !translatedHeaders[TransactionColumnNames.EFFECTIVE_DATE]) {
            throw new TransactionParserError('Missing required column: TRANSACTION DATE');
        }

        return {
            delimiter,
            merchant: translatedHeaders[TransactionColumnNames.DESCRIPTION] || '',
            amount: translatedHeaders[TransactionColumnNames.AMOUNT] || '',
            balance: translatedHeaders[TransactionColumnNames.BALANCE] || '',
            transactionDate: translatedHeaders[TransactionColumnNames.TRANSACTION_DATE] || translatedHeaders[TransactionColumnNames.EFFECTIVE_DATE] || '',
            effectiveDate: translatedHeaders[TransactionColumnNames.EFFECTIVE_DATE] || ''
        };
    }

    private detectDelimiter(firstLine: string): string {
        const delimiters = [',', ';', '\t', '\\|'];
        const counts = delimiters.map(d => ({
            delimiter: d,
            count: (firstLine.match(new RegExp(d, 'g')) || []).length
        }));

        const mostLikely = counts.reduce((max, curr) =>
            curr.count > max.count ? curr : max, counts[0]);

        return mostLikely.delimiter.replace('\\', '');
    }

    private parseDate(dateStr: string): Date {
        // Handle various date formats
        const formats = [
            // DD/MM/YYYY
            (s: string) => {
                const [d, m, y] = s.split('/').map(Number);
                return new Date(y, m - 1, d);
            },
            // YYYY-MM-DD
            (s: string) => new Date(s),
            // MM/DD/YYYY
            (s: string) => {
                const [m, d, y] = s.split('/').map(Number);
                return new Date(y, m - 1, d);
            }
        ];

        for (const format of formats) {
            try {
                const date = format(dateStr);
                if (!isNaN(date.getTime())) return date;
                console.error(`Invalid date: ${dateStr}`);
            } catch (error: unknown) {
                console.error(`Error parsing date: ${dateStr} - ${error}`);
            }
        }

        throw new Error(`Unable to parse date: ${dateStr}`);
    }

    private generateMappingKey(headers: string[]): string {
        return headers.join('|').toLowerCase();
    }

    private getMapping(headers: string[], delimiter: string): CSVMapping {
        const mappingKey = this.generateMappingKey(headers);

        if (this.mappingPatterns.has(mappingKey)) {
            return this.mappingPatterns.get(mappingKey)!;
        }

        const translatedHeaders = this.getTranslatedHeaders(headers);
        const mapping = this.getMappingFromTranslatedHeaders(translatedHeaders, delimiter);
        mapping.delimiter = delimiter;

        this.mappingPatterns.set(mappingKey, mapping);

        return mapping;
    }

    public async parseTransactions(files: File[]): Promise<Transaction[]> {
        const allTransactions: Transaction[] = [];

        // TODO: allow further processing if one file fails
        for (const file of files) {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                throw new TransactionParserError('CSV file must have at least 2 lines');
            }

            const headersString = await this.getHeadersFromAI(lines);

            const delimiter = this.detectDelimiter(headersString);
            const headers = headersString.split(delimiter);

            const mapping = this.getMapping(headers, delimiter);

            const headerIndexMap = headers.reduce((acc, header, index) => {
                acc[this.standardizeHeader(header)] = index;
                return acc;
            }, {} as Record<string, number>);

            // Skip any lines before the headersString
            const headerLineIndex = lines.findIndex(line => line.includes(headersString));

            for (let i = headerLineIndex + 1; i < lines.length; i++) {
                const fields = lines[i].split(delimiter).map(f => f.trim());

                try {
                    const merchant = fields[headerIndexMap[mapping.merchant]];
                    const amount = fields[headerIndexMap[mapping.amount]];
                    const balance = fields[headerIndexMap[mapping.balance]];
                    const transactionDate = fields[headerIndexMap[mapping.transactionDate]];
                    const effectiveDate = fields[headerIndexMap[mapping.effectiveDate]];

                    const transaction: RawTransaction = {
                        merchant,
                        amount: parseFloat(amount.replace(',', '.')),
                        balance: parseFloat(balance.replace(',', '.')),
                        transactionDate: this.parseDate(transactionDate),
                        effectiveDate: effectiveDate ? this.parseDate(effectiveDate) : undefined
                    };

                    allTransactions.push(Transaction.fromJSON(transaction));
                } catch (e) {
                    console.error(`Error parsing transaction at line ${i + 1}:`, e);
                    continue;
                }
            }
        }

        return allTransactions;
    }
}

export { TransactionParser };