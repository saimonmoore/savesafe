import { CategorizationMethod, transactionTable } from "@/db/schemas/Transaction";
import { Category } from "@/db/schemas/Category";
import {
  Currency,
  Transaction,
  TransactionInsert,
} from "@/schemas/TransactionSchema";
import { Effect, ParseResult, Schema } from "effect";
import { beforeEach, describe, expect, it } from "vitest";

type InsertTransaction = typeof transactionTable.$inferInsert;

describe("Transaction", () => {
  const validTransactionWithRequiredFields = {
    id: 1,
    merchant: "Test Merchant",
    transactionDate: new Date(),
    amount: 100.0,
  };

  const validTransactionWithAllFields = {
    id: 1,
    merchant: "Test Merchant",
    transactionDate: new Date(),
    effectiveDate: new Date(),
    amount: 100.0,
    balance: 100.0,
    category: Category.EatingOut,
    categoryId: 1,
    confidence: 100,
    categorizationMethod: CategorizationMethod.PATTERN,
    manuallyCategorized: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("Internal representation", () => {
    describe("when decoding an input with only required fields", () => {
      let transaction: Transaction;

      beforeEach(() => {
        transaction = Schema.decodeSync(Transaction)(
          validTransactionWithRequiredFields
        );
      });

      it("should return a valid Transaction", () => {
        expect(transaction).toBeInstanceOf(Transaction);
        expect(transaction.id).toBe(validTransactionWithRequiredFields.id);
        expect(transaction.merchant).toBe(
          validTransactionWithRequiredFields.merchant
        );
        expect(transaction.transactionDate).toBe(
          validTransactionWithRequiredFields.transactionDate
        );
        expect(transaction.amount).toBe(
          validTransactionWithRequiredFields.amount
        );
        expect(transaction.currency).toBe(Currency.EUR);
      });
    });

    describe("when decoding an input with all fields", () => {
      let transaction: Transaction;

      beforeEach(() => {
        transaction = Schema.decodeSync(Transaction)(
          validTransactionWithAllFields
        );
      });

      it("should return a valid Transaction", () => {
        expect(transaction).toBeInstanceOf(Transaction);
        expect(transaction.id).toBe(validTransactionWithAllFields.id);
        expect(transaction.merchant).toBe(
          validTransactionWithAllFields.merchant
        );
        expect(transaction.transactionDate).toBe(
          validTransactionWithAllFields.transactionDate
        );
        expect(transaction.effectiveDate).toBe(
          validTransactionWithAllFields.effectiveDate
        );
        expect(transaction.amount).toBe(validTransactionWithAllFields.amount);
        expect(transaction.balance).toBe(validTransactionWithAllFields.balance);
        expect(transaction.currency).toBe(Currency.EUR);
        expect(transaction.category).toBe(
          validTransactionWithAllFields.category
        );
        expect(transaction.categoryId).toBe(
          validTransactionWithAllFields.categoryId
        );
        expect(transaction.confidence).toBe(
          validTransactionWithAllFields.confidence
        );
        expect(transaction.categorizationMethod).toBe(
          validTransactionWithAllFields.categorizationMethod
        );
        expect(transaction.manuallyCategorized).toBe(
          validTransactionWithAllFields.manuallyCategorized
        );
        expect(transaction.createdAt).toBe(
          validTransactionWithAllFields.createdAt
        );
        expect(transaction.updatedAt).toBe(
          validTransactionWithAllFields.updatedAt
        );
      });
    });

    describe("when decoding an input with missing required fields", () => {
      describe.each(["merchant", "transactionDate", "amount"])(
        "when %s is missing",
        (field) => {
          it("should throw an error", () => {
            Schema.decodeUnknown(Transaction)({
              ...validTransactionWithRequiredFields,
              merchant: "",
            }).pipe(
              Effect.catchTags({
                ParseError: (error) => {
                  expect(
                    ParseResult.ArrayFormatter.formatErrorSync(error)[0].message
                  ).toBe('Expected NonEmptyString, actual ""');

                  expect(
                    ParseResult.ArrayFormatter.formatErrorSync(error)[0].path
                  ).toBe(field);

                  return Effect.succeed(undefined);
                },
              })
            );
          });
        }
      );
    });
  });

  describe("External representations", () => {
    describe("TransactionInsert (for persistence)", () => {
      const merchant = "Test Merchant";
      const transactionDate = new Date();
      const amount = 100.50;

      // What is actually stored in the db
      const transactionAsStoredInDb = {
        id: 1,
        merchant,
        transactionDate: transactionDate.toISOString(),
        amount: amount * 100,
      };

      // What we get after decoding the db output
      const transactionDecodedFromDBWithRequiredFields = {
        id: 1,
        merchant,
        transactionDate,
        amount,
      };

      describe("when decoding an unknown input with only valid required fields", () => {
        let transactionInsert: TransactionInsert;

        beforeEach(() => {
          // Decoding what we get from the db
          transactionInsert = Schema.decodeSync(TransactionInsert)(
            transactionAsStoredInDb
          );
        });

        it("should return a valid TransactionInsert shape", () => {
          expect(transactionInsert).toBeInstanceOf(TransactionInsert);
        });

        it("should not transform the merchant", () => {
          expect(transactionInsert.merchant).toBe(
            transactionDecodedFromDBWithRequiredFields.merchant
          );
        });

        it("should transform the transactionDate from a string to a Date", () => {
          expect(transactionInsert.transactionDate).toStrictEqual(
            transactionDecodedFromDBWithRequiredFields.transactionDate
          );
        });

        it("should transform the amount from a decimal to an integer (e.g. store the cents)", () => {
          expect(transactionInsert.amount).toBe(
            transactionDecodedFromDBWithRequiredFields.amount
          );
        });

        it('decodes as a Transaction', () => {
          const transaction = Schema.decodeSync(Transaction)({
            ...transactionInsert,
            id: 1,
          });

          expect(transaction).toBeInstanceOf(Transaction);
        });
      });

      describe("when encoding the db input", () => {
        let transactionReadyToBePersistedInDb: Pick<InsertTransaction, "merchant" | "transactionDate" | "amount">;

        beforeEach(() => {
          // Encoding what we want to store in the db
          transactionReadyToBePersistedInDb = Schema.encodeSync(TransactionInsert)(
            transactionDecodedFromDBWithRequiredFields
          );
        });

        it("should not transform the merchant", () => {
          expect(transactionReadyToBePersistedInDb.merchant).toBe(
            transactionAsStoredInDb.merchant
          );
        });

        it("should transform the transactionDate from a Date", () => {
          expect(transactionReadyToBePersistedInDb.transactionDate).toStrictEqual(
            transactionAsStoredInDb.transactionDate
          );
        });

        it("should transform the amount from a decimal to an integer (e.g. store the cents)", () => {
          expect(transactionReadyToBePersistedInDb.amount).toBe(
            transactionAsStoredInDb.amount
          );
        });
      });
    });
  });
});
