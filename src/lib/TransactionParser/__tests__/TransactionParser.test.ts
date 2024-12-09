import { describe, it, expect, vi, beforeEach } from "vitest";
import { TransactionParser } from "@/lib/TransactionParser/TransactionParser";
import { NotTransactionParserError, TransactionParserError } from "../errors";
import { WorkerLLMManager } from "@/lib/LLM/WorkerLLMManager";

vi.mock("@/lib/LLM/WorkerLLMManager", () => ({
  WorkerLLMManager: {
    getInstance: vi.fn().mockReturnValue({
      requestInference: vi.fn().mockResolvedValue({
        requestId: "test-request-id",
        choices: [
          {
            message: {
              content: JSON.stringify({
                headers:
                  "Transaction Date,Effective Date,Description,Amount,Balance",
              }),
            },
          },
        ],
      }),
    }),
  },
}));

describe("TransactionParser", () => {
  let parser: TransactionParser;

  beforeEach(() => {
    parser = new TransactionParser();
    console.error = vi.fn();
    vi.clearAllMocks();
    parser["mappingPatterns"].clear();
  });

  const createMockFile = (content: string): File => {
    return new File([content], "test.csv", { type: "text/csv" });
  };

  describe("CSV Format Detection", () => {
    beforeEach(() => {
      WorkerLLMManager.getInstance().requestInference = vi
        .fn()
        .mockResolvedValue({
          requestId: "test-request-id",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headers:
                    "Transaction Date,Effective Date,Description,Amount,Balance",
                }),
              },
            },
          ],
        });
    });

    describe("when AI response is valid", () => {
      it("should correctly detect headers from any metadata", async () => {
        const csvContent =
          "IBAN: ES1901280535460100021246;;;\ntitular: SIMON MOORE / ;;;;\n;;;Divisa:;EUR\nTransaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00";
        const file = createMockFile(csvContent);

        const transactions = await parser.parseTransactions([file]);

        expect(transactions).toHaveLength(1);
        expect(transactions[0].merchant).toBe("Coffee");
        expect(transactions[0].amount).toBe(10.0);
        expect(transactions[0].balance).toBe(100.0);
        expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
        expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
        expect(transactions[0].transactionDate.getDate()).toBe(1);
        expect(transactions[0].effectiveDate?.getFullYear()).toBe(2024);
        expect(transactions[0].effectiveDate?.getMonth()).toBe(0); // January is 0
        expect(transactions[0].effectiveDate?.getDate()).toBe(2);
      });

      it("should correctly detect comma delimiter", async () => {
        const csvContent =
          "Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00";
        const file = createMockFile(csvContent);

        const transactions = await parser.parseTransactions([file]);

        expect(transactions).toHaveLength(1);
        expect(transactions[0].merchant).toBe("Coffee");
        expect(transactions[0].amount).toBe(10.0);
        expect(transactions[0].balance).toBe(100.0);
        expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
        expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
        expect(transactions[0].transactionDate.getDate()).toBe(1);
        expect(transactions[0].effectiveDate?.getFullYear()).toBe(2024);
        expect(transactions[0].effectiveDate?.getMonth()).toBe(0); // January is 0
        expect(transactions[0].effectiveDate?.getDate()).toBe(2);
      });

      describe("when delimiter is semicolon", () => {
        beforeEach(() => {
          WorkerLLMManager.getInstance().requestInference = vi
            .fn()
            .mockResolvedValue({
              requestId: "test-request-id",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      headers:
                        "Transaction Date;Effective Date;Description;Amount;Balance",
                    }),
                  },
                },
              ],
            });
        });

        it("should correctly detect semicolon delimiter", async () => {
          const csvContent =
            "Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00";
          const file = createMockFile(csvContent);

          const transactions = await parser.parseTransactions([file]);
          expect(transactions).toHaveLength(1);
          expect(transactions[0].merchant).toBe("Coffee");
          expect(transactions[0].amount).toBe(10.0);
          expect(transactions[0].balance).toBe(100.0);
          expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
          expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
          expect(transactions[0].transactionDate.getDate()).toBe(1);
          expect(transactions[0].effectiveDate?.getFullYear()).toBe(2024);
          expect(transactions[0].effectiveDate?.getMonth()).toBe(0); // January is 0
          expect(transactions[0].effectiveDate?.getDate()).toBe(2);
        });
      });

      describe("Error Handling", () => {
        it("should skip invalid lines", async () => {
          const csvContent =
            "Transaction Date,Effective Date,Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,10.00,100.00\ninvalid,line,data";
          const file = createMockFile(csvContent);

          const transactions = await parser.parseTransactions([file]);
          expect(transactions).toHaveLength(1);
        });

        it("should throw an error if a file is empty", async () => {
          const file = createMockFile("");
          await expect(parser.parseTransactions([file])).rejects.toThrow(
            new TransactionParserError("CSV file must have at least 2 lines")
          );
        });

        describe("when AMOUNT column is missing", () => {
          it("should throw an error", async () => {
            const csvContent =
              "Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00";
            const file = createMockFile(csvContent);

            vi.mocked(
              WorkerLLMManager.getInstance().requestInference
            ).mockResolvedValueOnce({
              requestId: "test-request-id",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      headers:
                        "Transaction Date;Effective Date;Description;;Balance",
                    }),
                  },
                },
              ],
            });

            await expect(parser.parseTransactions([file])).rejects.toThrow(
              new TransactionParserError("Missing required column: AMOUNT")
            );
          });
        });

        describe("when DESCRIPTION column is missing", () => {
          it("should throw an error", async () => {
            const csvContent =
              "Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,00;100,00";
            const file = createMockFile(csvContent);

            vi.mocked(
              WorkerLLMManager.getInstance().requestInference
            ).mockResolvedValueOnce({
              requestId: "test-request-id",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      headers:
                        "Transaction Date;Effective Date;;Amount;Balance",
                    }),
                  },
                },
              ],
            });

            await expect(parser.parseTransactions([file])).rejects.toThrow(
              new TransactionParserError("Missing required column: DESCRIPTION")
            );
          });
        });

        describe("when TRANSACTION DATE column is missing but EFFECTIVE DATE is present", () => {
          it("should fill in TRANSACTION DATE with EFFECTIVE DATE", async () => {
            const csvContent =
              ";Effective Date;Description;Amount;Balance\n;2024-01-02;Coffee;10,00;100,00";
            const file = createMockFile(csvContent);

            vi.mocked(
              WorkerLLMManager.getInstance().requestInference
            ).mockResolvedValueOnce({
              requestId: "test-request-id",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      headers: ";Effective Date;Description;Amount;Balance",
                    }),
                  },
                },
              ],
            });

            const transactions = await parser.parseTransactions([file]);

            expect(transactions[0].transactionDate.getFullYear()).toBe(2024);
            expect(transactions[0].transactionDate.getMonth()).toBe(0); // January is 0
            expect(transactions[0].transactionDate.getDate()).toBe(2);

            expect(transactions[0].effectiveDate?.getFullYear()).toBe(2024);
            expect(transactions[0].effectiveDate?.getMonth()).toBe(0); // January is 0
            expect(transactions[0].effectiveDate?.getDate()).toBe(2);
          });
        });

        describe("when TRANSACTION DATE and EFFECTIVE DATE columns are both missing", () => {
          it("should throw an error", async () => {
            const csvContent =
              "Description;Amount;Balance\nCoffee;10.00;100.00";
            const file = createMockFile(csvContent);

            vi.mocked(
              WorkerLLMManager.getInstance().requestInference
            ).mockResolvedValueOnce({
              requestId: "test-request-id",
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      headers: "Description;Amount;Balance",
                    }),
                  },
                },
              ],
            });

            await expect(parser.parseTransactions([file])).rejects.toThrow(
              new TransactionParserError(
                "Missing required column: TRANSACTION DATE"
              )
            );
          });
        });
      });
    });

    describe("when ai does not return valid json", () => {
      const csvContent = "Date,Attempt,Count\n2024-01-01,Coffee,1";
      const file = createMockFile(csvContent);

      beforeEach(() => {
        vi.mocked(
          WorkerLLMManager.getInstance().requestInference
        ).mockResolvedValueOnce({
          requestId: "test-request-id",
          choices: [
            {
              message: {
                content: "invalid json",
              },
            },
          ],
        });
      });

      it("should throw an error", async () => {
        await expect(parser.parseTransactions([file])).rejects.toThrow(
          TransactionParserError
        );
      });
    });
  });

  describe("Date Parsing", () => {
    it("should parse DD/MM/YYYY format", async () => {
      const csvContent =
        "Transaction Date,Effective Date,Description,Amount,Balance\n30/12/2023,31/12/2023,Coffee,10.00,100.00";
      const file = createMockFile(csvContent);

      const transactions = await parser.parseTransactions([file]);
      expect(transactions[0].transactionDate.getFullYear()).toBe(2023);
      expect(transactions[0].transactionDate.getMonth()).toBe(11); // December is 11
      expect(transactions[0].transactionDate.getDate()).toBe(30);

      expect(transactions[0].effectiveDate?.getFullYear()).toBe(2023);
      expect(transactions[0].effectiveDate?.getMonth()).toBe(11); // December is 11
      expect(transactions[0].effectiveDate?.getDate()).toBe(31);
    });

    it("should parse YYYY-MM-DD format", async () => {
      const csvContent =
        "Transaction Date,Effective Date,Description,Amount,Balance\n2023-12-30,2023-12-31,Coffee,10.00,100.00";
      const file = createMockFile(csvContent);

      const transactions = await parser.parseTransactions([file]);
      expect(transactions[0].transactionDate.getFullYear()).toBe(2023);
      expect(transactions[0].transactionDate.getMonth()).toBe(11); // December is 11
      expect(transactions[0].transactionDate.getDate()).toBe(30);

      expect(transactions[0].effectiveDate?.getFullYear()).toBe(2023);
      expect(transactions[0].effectiveDate?.getMonth()).toBe(11); // December is 11
      expect(transactions[0].effectiveDate?.getDate()).toBe(31);
    });
  });

  describe("Number Parsing", () => {
    describe("when decimal separator is comma", () => {
      beforeEach(() => {
        WorkerLLMManager.getInstance().requestInference = vi
          .fn()
          .mockResolvedValue({
            requestId: "test-request-id",
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    headers:
                      "Transaction Date,Effective Date,Description,Amount,Balance",
                  }),
                },
              },
            ],
          });
      });

      it("should parse negative amounts", async () => {
        const csvContent =
          "Transaction Date,Effective Date;Description,Amount,Balance\n2024-01-01,2024-01-02,Coffee,-10.00,100.00";
        const file = createMockFile(csvContent);

        const transactions = await parser.parseTransactions([file]);
        expect(transactions[0].amount).toBe(-10.0);
      });
    });

    describe("when decimal separator is comma", () => {
      beforeEach(() => {
        WorkerLLMManager.getInstance().requestInference = vi
          .fn()
          .mockResolvedValue({
            requestId: "test-request-id",
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    headers:
                      "Transaction Date;Effective Date;Description;Amount;Balance",
                  }),
                },
              },
            ],
          });
      });

      it("should parse comma decimal separator", async () => {
        const csvContent =
          "Transaction Date;Effective Date;Description;Amount;Balance\n2024-01-01;2024-01-02;Coffee;10,50;100,00";
        const file = createMockFile(csvContent);

        const transactions = await parser.parseTransactions([file]);
        expect(transactions[0].amount).toBe(10.5);
      });
    });
  });

  describe("Multiple Files", () => {
    it("should process multiple files with different formats", async () => {
      const csvContent1 =
        "Transaction Date,Description,Amount,Balance\n2024-01-01,Coffee,10.00,100.00";
      const csvContent2 =
        "DATA VALOR;DESCRIPCIO;IMPORT;SALDO\n02/10/2023;Cafe;-92,19;186.869,50";
      const file1 = createMockFile(csvContent1);
      const file2 = createMockFile(csvContent2);

      vi.mocked(WorkerLLMManager.getInstance().requestInference)
        .mockResolvedValueOnce({
          requestId: "test-request-id",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headers: "Transaction Date,Description,Amount,Balance",
                }),
              },
            },
          ],
        })
        .mockResolvedValueOnce({
          requestId: "test-request-id",
          choices: [
            {
              message: {
                content: JSON.stringify({
                  headers: "DATA VALOR;DESCRIPCIO;IMPORT;SALDO",
                }),
              },
            },
          ],
        });

      const transactions = await parser.parseTransactions([file1, file2]);
      expect(transactions).toHaveLength(2);
      expect(transactions[0].amount).toBe(10.0);
      expect(transactions[1].amount).toBe(-92.19);
    });
  });
});
