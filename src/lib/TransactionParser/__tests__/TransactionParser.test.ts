import { describe, it, expect, vi, beforeEach, MockInstance } from 'vitest';
import { TransactionParser } from '@/lib/TransactionParser/TransactionParser';
import { NotTransactionParserError, TransactionParserError } from '../errors';

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
        describe('when AI response is valid', () => {
            it('should correctly detect headers from any metadata', async () => {
                const csvContent = 'IBAN: ES1901280535460100021246;;;\ntitular: SIMON MOORE / ;;;;\n;;;Divisa:;EUR\nTransaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00';
                const file = createMockFile(csvContent);

                generateResponseSpy.mockResolvedValueOnce({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
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
            it('should correctly detect comma delimiter', async () => {
                const csvContent = 'Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00';
                const file = createMockFile(csvContent);

                generateResponseSpy.mockResolvedValueOnce({
                    choices: [{
                        message: {
                            content: JSON.stringify({
                                headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
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
                                headers: 'Transaction Date;Effective Date;Description;Amount;Balance',
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

            describe('Error Handling', () => {
                it('should skip invalid lines', async () => {
                    const csvContent = 'Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00\ninvalid,line,data';
                    const file = createMockFile(csvContent);

                    generateResponseSpy.mockResolvedValueOnce({
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                                })
                            }
                        }]
                    });

                    const transactions = await parser.parseTransactions([file]);
                    expect(transactions).toHaveLength(1);
                });

                it('should throw an error if a file is empty', async () => {
                    const file = createMockFile('');
                    await expect(parser.parseTransactions([file])).rejects.toThrow(new TransactionParserError('CSV file must have at least 2 lines'));
                });

                describe('when AMOUNT column is missing', () => {
                    it('should throw an error', async () => {
                        const csvContent = 'Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00';
                        const file = createMockFile(csvContent);

                        generateResponseSpy.mockResolvedValueOnce({
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        headers: 'Transaction Date;Effective Date;Description;;Balance',
                                    })
                                }
                            }]
                        });

                        await expect(parser.parseTransactions([file])).rejects.toThrow(new TransactionParserError('Missing required column: AMOUNT'));
                    });
                });

                describe('when DESCRIPTION column is missing', () => {
                    it('should throw an error', async () => {
                        const csvContent = 'Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00';
                        const file = createMockFile(csvContent);

                        generateResponseSpy.mockResolvedValueOnce({
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        headers: 'Transaction Date;Effective Date;;Amount;Balance',
                                    })
                                }
                            }]
                        });

                        await expect(parser.parseTransactions([file])).rejects.toThrow(new TransactionParserError('Missing required column: DESCRIPTION'));
                    });
                });

                describe('when TRANSACTION DATE column is missing but EFFECTIVE DATE is present', () => {
                    it('should fill in TRANSACTION DATE with EFFECTIVE DATE', async () => {
                        const csvContent = ';Effective Date;Description;Amount;Balance\n;2024-01-02;Coffee;10,00;100,00';
                        const file = createMockFile(csvContent);

                        generateResponseSpy.mockResolvedValueOnce({
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        headers: ';Effective Date;Description;Amount;Balance',
                                    })
                                }
                            }]
                        });

                        const transactions = await parser.parseTransactions([file]);

                        expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
                        expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
                        expect(transactions[0].transactionDate.getDate()).toBe(2);

                        expect(transactions[0].effectiveDate.getFullYear()).toBe(2024);
                        expect(transactions[0].effectiveDate.getMonth()).toBe(0); // January is 0
                        expect(transactions[0].effectiveDate.getDate()).toBe(2);
                    });
                });

                describe('when TRANSACTION DATE and EFFECTIVE DATE columns are both missing', () => {
                    it('should throw an error', async () => {
                        const csvContent = 'Description;Amount;Balance\nCoffee;10.00;100.00';
                        const file = createMockFile(csvContent);

                        generateResponseSpy.mockResolvedValueOnce({
                            choices: [{
                                message: {
                                    content: JSON.stringify({
                                        headers: 'Description;Amount;Balance',
                                    })
                                }
                            }]
                        });

                        await expect(parser.parseTransactions([file])).rejects.toThrow(new TransactionParserError('Missing required column: TRANSACTION DATE'));
                    });
                });
            });
        });

        describe('when ai does not return valid json', () => {
            const csvContent = 'Date,Attempt,Count\n2024-01-01,Coffee,1';
            const file = createMockFile(csvContent);

            beforeEach(() => {
                generateResponseSpy.mockResolvedValueOnce({
                    choices: [{
                        message: {
                            content: 'invalid json'
                        }
                    }]
                });
            });

            it('should throw an error', async () => {
                await expect(parser.parseTransactions([file])).rejects.toThrow(TransactionParserError);
            });
        });
    });

    describe('Date Parsing', () => {
        it('should parse DD/MM/YYYY format', async () => {
            const csvContent = 'Transaction Date,Effective Date,Description,Amount,Balance\n30/12/2023,31/12/2023,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                        })
                    }
                }]
            }).mockResolvedValueOnce({
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
            expect(transactions[0].transactionDate.getDate()).toBe(30);

            expect(transactions[0].effectiveDate.getFullYear()).toBe(2023);
            expect(transactions[0].effectiveDate.getMonth()).toBe(11); // December is 11
            expect(transactions[0].effectiveDate.getDate()).toBe(31);
        });

        it('should parse YYYY-MM-DD format', async () => {
            const csvContent = 'Transaction Date,Effective Date,Description,Amount,Balance\n2023-12-30,2023-12-31,Coffee,10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].transactionDate.getFullYear()).toBe(2023);
            expect(transactions[0].transactionDate.getMonth()).toBe(11); // December is 11
            expect(transactions[0].transactionDate.getDate()).toBe(30);

            expect(transactions[0].effectiveDate.getFullYear()).toBe(2023);
            expect(transactions[0].effectiveDate.getMonth()).toBe(11); // December is 11
            expect(transactions[0].effectiveDate.getDate()).toBe(31);
        });
    });

    describe('Number Parsing', () => {
        it('should parse negative amounts', async () => {
            const csvContent = 'Transaction Date,Effective Date;Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,-10.00,100.00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                        })
                    }
                }]
            });

            const transactions = await parser.parseTransactions([file]);
            expect(transactions[0].amount).toBe(-10.00);
        });

        it('should parse comma decimal separator', async () => {
            const csvContent = 'Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,50;100,00';
            const file = createMockFile(csvContent);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date;Effective Date;Description;Amount;Balance',
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
            const csvContent1 = 'Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00';
            const csvContent2 = 'Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-02,2024-01-03,Tea,5.00,95.00';
            const file1 = createMockFile(csvContent1);
            const file2 = createMockFile(csvContent2);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                        })
                    }
                }]
            }).mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Effective Date,Description,Amount,Balance',
                        })
                    }
                }]
            });

            await parser.parseTransactions([file1]);
            await parser.parseTransactions([file2]);

            expect(generateResponseSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('Multiple Files', () => {
        it('should process multiple files with different formats', async () => {
            const csvContent1 = 'Transaction Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00';
            const csvContent2 = 'DATA VALOR;DESCRIPCIO;IMPORT;SALDO\n02/10/2023;Cafe;-92,19;186.869,50';
            const file1 = createMockFile(csvContent1);
            const file2 = createMockFile(csvContent2);

            generateResponseSpy.mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'Transaction Date,Description,Amount,Balance',
                        })
                    }
                }]
            }).mockResolvedValueOnce({
                choices: [{
                    message: {
                        content: JSON.stringify({
                            headers: 'DATA VALOR;DESCRIPCIO;IMPORT;SALDO',
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