interface Transaction {
    merchant: string;
    amount: number;
    balance: number;
    transactionDate: Date;
    effectiveDate: Date;
}

interface CSVMapping {
    delimiter: string;
    merchant: string;
    amount: string;
    balance: string;
    transactionDate: string;
    effectiveDate: string;
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

class TransactionParser {
    private mappingPatterns: Map<string, CSVMapping> = new Map();
    private llmClient: LLMClient;

    constructor(webLLM: LLMClient) {
        this.llmClient = webLLM;
    }

    private async getMappingFromAI(headers: string[]): Promise<CSVMapping> {
        const prompt = `
Given these CSV headers: ${headers.join(', ')}
Identify which columns map to these transaction fields:
- merchant/description
- amount (numeric)
- balance (numeric)
- transaction date
- effective/value date

Respond with a JSON object with these fields:
{
    "delimiter": "detected delimiter",
    "merchant": "header name for merchant/description",
    "amount": "header name for amount",
    "balance": "header name for balance",
    "transactionDate": "header name for transaction date",
    "effectiveDate": "header name for effective date"
}

Use null for any fields that don't have a matching header.`;

        const response = await this.llmClient.generateResponse([
            { role: "system", content: "You are a helpful assistant that identifies CSV mappings." },
            { role: "user", content: prompt }
        ]);

        try {
            return JSON.parse(response.choices[0].message.content || '{}');
        } catch (error: unknown) {
            throw new Error(`Failed to parse AI response to valid mapping: ${error}`);
        }
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
            } catch (error: unknown) {
                console.error(`Error parsing date: ${dateStr} - ${error}`);
            }
        }

        throw new Error(`Unable to parse date: ${dateStr}`);
    }

    private generateMappingKey(headers: string[]): string {
        return headers.join('|').toLowerCase();
    }

    private async getMapping(headers: string[], delimiter: string): Promise<CSVMapping> {
        const mappingKey = this.generateMappingKey(headers);
        
        if (this.mappingPatterns.has(mappingKey)) {
            return this.mappingPatterns.get(mappingKey)!;
        }

        const mapping = await this.getMappingFromAI(headers);
        mapping.delimiter = delimiter;

        this.mappingPatterns.set(mappingKey, mapping);
        
        return mapping;
    }

    public async parseTransactions(files: File[]): Promise<Transaction[]> {
        const allTransactions: Transaction[] = [];

        for (const file of files) {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            // TODO: Handle CSV files with different line endings
            if (lines.length < 2) continue;

            const delimiter = this.detectDelimiter(lines[0]);
            const headers = lines[0].split(delimiter).map(h => h.trim());

            const mapping = await this.getMapping(headers, delimiter);

            const headerIndexMap = headers.reduce((acc, header, index) => {
                acc[header] = index;
                return acc;
            }, {} as Record<string, number>);

            for (let i = 1; i < lines.length; i++) {
                const fields = lines[i].split(delimiter).map(f => f.trim());
                
                try {
                    const transaction: Transaction = {
                        merchant: fields[headerIndexMap[mapping.merchant]],
                        amount: parseFloat(fields[headerIndexMap[mapping.amount]].replace(',', '.')),
                        balance: parseFloat(fields[headerIndexMap[mapping.balance]].replace(',', '.')),
                        transactionDate: this.parseDate(fields[headerIndexMap[mapping.transactionDate]]),
                        effectiveDate: this.parseDate(fields[headerIndexMap[mapping.effectiveDate]])
                    };
                    
                    allTransactions.push(transaction);
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