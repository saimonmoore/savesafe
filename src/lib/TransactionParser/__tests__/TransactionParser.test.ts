import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { TransactionParser } from '@/lib/TransactionParser/TransactionParser';
import exp from 'constants';

describe('TransactionParser', () => {
    let mockLLMClient: MockLLMClient;
    let parser: TransactionParser;
    let generateResponseSpy: MockInstance<typeof mockLLMClient.generateResponse>;

    interface MockLLMClientMessage {
        content: string;
    }

    class MockLLMClient {
        async generateResponse(messages: MockLLMClientMessage[]) {
            return {
                choices: [{
                    message: {
                        content: messages[0].content
                    }
                }]
            };
        }
    }

    beforeEach(() => {
        mockLLMClient = new MockLLMClient();
        generateResponseSpy = vi.spyOn(mockLLMClient, 'generateResponse');
        parser = new TransactionParser(mockLLMClient);

        // silence console.error
        console.error = vi.fn();
    });

    const createMockFile = (content: string): File => {
        return new File([content], 'test.csv', { type: 'text/csv' });
    };

    describe('CSV Format Detection', () => {
        it('should correctly detect comma delimiter', async () => {
            const csvContent = 'Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Transaction Date',
                            effectiveDate: 'Effective Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);

            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Coffee');
            expect(transactions[0].amount).toBe(10.00);
            expect(transactions[0].balance).toBe(100.00);
            expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
            expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
            expect(transactions[0].transactionDate.getDate()).toBe(1);
            expect(transactions[0].effectiveDate.getFullYear()).toBe(2024);
            expect(transactions[0].effectiveDate.getMonth()).toBe(0); // January is 0
            expect(transactions[0].effectiveDate.getDate()).toBe(2);
        });

        it('should correctly detect semicolon delimiter', async () => {
            const csvContent = 'Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ';',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Transaction Date',
                            effectiveDate: 'Effective Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions).toHaveLength(1);
            expect(transactions[0].merchant).toBe('Coffee');
            expect(transactions[0].amount).toBe(10.00);
            expect(transactions[0].balance).toBe(100.00);
            expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
            expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
            expect(transactions[0].transactionDate.getDate()).toBe(1);
            expect(transactions[0].effectiveDate.getFullYear()).toBe(2024);
            expect(transactions[0].effectiveDate.getMonth()).toBe(0); // January is 0
            expect(transactions[0].effectiveDate.getDate()).toBe(2);
        });
    });

    describe('Date Parsing', () => {
        it('should parse DD/MM/YYYY format', async () => {
            const csvContent = 'Date,Description,Amount,Balance\n31/12/2023,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].transactionDate.getFullYear()).toBe(2023);
            expect(transactions[0].transactionDate.getMonth()).toBe(11); // December is 11
            expect(transactions[0].transactionDate.getDate()).toBe(31);
        });

        it('should parse YYYY-MM-DD format', async () => {
            const csvContent = 'Date,Description,Amount,Balance\n2023-12-31,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].transactionDate.getFullYear()).toBe(2023);
            expect(transactions[0].transactionDate.getMonth()).toBe(11); // December is 11
            expect(transactions[0].transactionDate.getDate()).toBe(31);
        });
    });

    describe('Number Parsing', () => {
        it('should parse negative amounts', async () => {
            const csvContent = 'Date,Description,Amount,Balance\n2024-01-01,Coffee,-10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].amount).toBe(-10.00);
        });

        it('should parse comma decimal separator', async () => {
            const csvContent = 'Date;Description;Amount;Balance\n2024-01-01;Coffee;10,50;100,00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ';',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].amount).toBe(10.50);
        });
    });

    describe('Mapping Cache', () => {
        it('should reuse cached mapping for identical headers', async () => {
            const csvContent1 = 'Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00';
            const csvContent2 = 'Date,Description,Amount,Balance\n2024-01-02,Tea,5.00,95.00';
            const file1 = createMockFile(csvContent1);
            const file2 = createMockFile(csvContent2);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            await parser.parseTransactions([file1]);
            await parser.parseTransactions([file2]);

            expect(generateResponseSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Error Handling', () => {
        it('should skip invalid lines', async () => {
            const csvContent = 'Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00\ninvalid,line,data';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions).toHaveLength(1);
        });

        it('should handle empty files', async () => {
            const file = createMockFile('');
            const transactions = await parser.parseTransactions([file]);
            expect(transactions).toHaveLength(0);
        });

        it('should handle AI mapping failure', async () => {
            const csvContent = 'Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: 'invalid json'
                    }
                }]
            });

            await expect(parser.parseTransactions([file])).rejects.toThrow('Failed to parse AI response to valid mapping');
        });
    });

    describe('Multiple Files', () => {
        it('should process multiple files with different formats', async () => {
            const csvContent1 = 'Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00';
            const csvContent2 = 'DATA;DESCRIPCIO;IMPORT;SALDO\n02/10/2023;Cafe;-92,19;186.869,50';
            const file1 = createMockFile(csvContent1);
            const file2 = createMockFile(csvContent2);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ',',
                            merchant: 'Description',
                            amount: 'Amount',
                            balance: 'Balance',
                            transactionDate: 'Date',
                            effectiveDate: 'Date'
                        })
                    }
                }]
            }).mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            delimiter: ';',
                            merchant: 'DESCRIPCIO',
                            amount: 'IMPORT',
                            balance: 'SALDO',
                            transactionDate: 'DATA',
                            effectiveDate: 'DATA'
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file1, file2]);
            expect(transactions).toHaveLength(2);
            expect(transactions[0].amount).toBe(10.00);
            expect(transactions[1].amount).toBe(-92.19);
        });
    });
});