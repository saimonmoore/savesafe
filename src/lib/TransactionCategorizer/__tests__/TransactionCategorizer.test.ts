/**
 * @vitest-environment happy-dom
 */

import "fake-indexeddb/auto";

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EnhancedTransactionCategorizer } from "@/lib/TransactionCategorizer/TransactionCategorizer";
import { InMemoryStorage } from "@/lib/TransactionCategorizer/storage/InMemoryStorage";
// import { IndexedDBStorage } from "@/lib/TransactionCategorizer/storage/IndexedDBStorage";
import { MerchantMapping } from "@/lib/TransactionCategorizer/Types";
import { Transaction } from "@/domain/models/Transaction/Transaction";
import { WorkerLLMManager } from "@/lib/LLM/WorkerLLMManager";

vi.mock("@/lib/LLM/WorkerLLMManager", () => ({
  WorkerLLMManager: {
    getInstance: vi.fn().mockReturnValue({
      requestInference: vi.fn().mockResolvedValue({
        requestId: "test-request-id",
        choices: [
          {
            message: {
              content: JSON.stringify([
                { "Som Energia, SCCL": "utilities" },
                { "Unknown Merchant": "other" },
              ]),
            },
          },
        ],
      }),
    }),
  },
}));

describe("EnhancedTransactionCategorizer with InMemoryStorage", () => {
  let categorizer: EnhancedTransactionCategorizer;

  beforeEach(() => {
    console.error = vi.fn();
    const memoryStorage = new InMemoryStorage();
    categorizer = new EnhancedTransactionCategorizer(memoryStorage);
  });

  describe("bulkImportCategories", () => {
    it("should successfully import merchant mappings", async () => {
      const mappings: MerchantMapping[] = [
        {
          merchant: "ACME Corp",
          category: "shopping",
          confidence: 1.0,
          aliases: ["ACME", "ACME Store"],
        },
      ];

      const result = await categorizer.bulkImportCategories(mappings);

      expect(result.success).toHaveLength(1);
      expect(result.success[0]).toBe("ACME Corp");
      expect(result.error).toHaveLength(0);
    });

    it("should handle duplicate merchant mappings", async () => {
      const mappings: MerchantMapping[] = [
        {
          merchant: "ACME Corp",
          category: "shopping",
          confidence: 1.0,
        },
        {
          merchant: "ACME Corp",
          category: "technology",
          confidence: 0.9,
        },
      ];

      const result = await categorizer.bulkImportCategories(mappings);

      expect(result.success).toHaveLength(2);
      expect(result.error).toHaveLength(0);
    });
  });

  describe("findMerchantCategory", () => {
    beforeEach(async () => {
      await categorizer.bulkImportCategories([
        {
          merchant: "Amazon",
          category: "shopping",
          confidence: 1.0,
        },
        {
          merchant: "Starbucks",
          category: "food",
          confidence: 0.9,
        },
      ]);

      await categorizer.addPattern({
        pattern: "energy",
        category: "utilities",
        confidence: 0.8,
        isRegex: false,
      });
    });

    it("should find exact merchant match", async () => {
      const result = await categorizer.findMerchantCategory("Amazon");

      expect(result).toEqual({
        category: "shopping",
        confidence: 1.0,
        method: "stored",
      });
    });

    it("should find category by pattern", async () => {
      const result = await categorizer.findMerchantCategory("Green Energy Inc");

      expect(result).toEqual({
        category: "utilities",
        confidence: 0.8,
        method: "pattern",
      });
    });

    it("should find similar merchants via fuzzy matching", async () => {
      const result = await categorizer.findMerchantCategory("Starbuks");

      expect(result).toEqual({
        category: "food",
        confidence: expect.any(Number),
        method: "fuzzy",
      });
    });

    it("should return null for completely unknown merchant", async () => {
      const result = await categorizer.findMerchantCategory("Unknown Merchant");

      expect(result).toBeNull();
    });
  });

  describe("bulkCategorize", () => {
    it("should categorize transactions with multiple methods, using batched AI", async () => {
      await categorizer.bulkImportCategories([
        {
          merchant: "Amazon",
          category: "shopping",
          confidence: 1.0,
        },
      ]);

      const transactions: Transaction[] = [
        {
          merchant: "Amazon",
          amount: 50.0,
          transactionDate: new Date(),
          categorize: vi.fn(),
        },
        {
          merchant: "Som Energia, SCCL",
          amount: 75.2,
          transactionDate: new Date(),
          categorize: vi.fn(),
        },
        {
          merchant: "Unknown Merchant",
          amount: 25.5,
          transactionDate: new Date(),
          categorize: vi.fn(),
        },
      ];

      const categorizedTransactions = await categorizer.bulkCategorize(
        transactions
      );

      expect(categorizedTransactions).toHaveLength(3);

      expect(categorizedTransactions[0].categorize).toHaveBeenCalledWith(
        "shopping",
        1.0,
        "stored"
      );
      expect(categorizedTransactions[1].categorize).toHaveBeenCalledWith(
        "utilities",
        0.7,
        "ai_batch"
      );
      expect(categorizedTransactions[2].categorize).toHaveBeenCalledWith(
        "other",
        0.1,
        "ai_batch_error"
      );
    });
  });

  describe("getAiBatchCategory", () => {
    it("should batch categorize multiple merchants", async () => {
      const merchants = ["Som Energia, SCCL", "Unknown Merchant"];

      const result = await categorizer.getAiBatchCategory(merchants);

      expect(result.size).toBe(2);

      const energiaCategory = result.get("Som Energia, SCCL");
      expect(energiaCategory).toEqual({
        category: "utilities",
        confidence: 0.7,
        method: "ai_batch",
      });

      const unknownCategory = result.get("Unknown Merchant");
      expect(unknownCategory).toEqual({
        category: "other",
        confidence: 0.1,
        method: "ai_batch_error",
      });
    });

    describe("handles batch AI categorization errors", () => {
      beforeEach(async () => {
        // Mock the LLM to throw an error
        vi.mocked(
          WorkerLLMManager.getInstance().requestInference
        ).mockRejectedValue(new Error("AI Error"));
      });

      it("handles batch AI categorization errors", async () => {
        const errorCategorizer = new EnhancedTransactionCategorizer(
          new InMemoryStorage()
        );
        const merchants = ["Test Merchant1", "Test Merchant2"];

        const result = await errorCategorizer.getAiBatchCategory(merchants);

        expect(result.size).toBe(2);

        for (const [_, category] of result.entries()) {
          expect(category).toEqual({
            category: "other",
            confidence: 0.1,
            method: "ai_batch_error",
          });
        }
      });
    });
  });
});
