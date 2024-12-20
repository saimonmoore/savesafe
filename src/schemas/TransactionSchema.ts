import { Schema } from "effect";
import { CategorizationMethod } from "@/db/schemas/Transaction";
import { CategoryValue } from "@/schemas/Category";
import {
  DBIdentifier,
  Money,
  PrimaryKeyIndex,
  PersistedMoney,
} from "@/schemas/shared";

export const CategorizationMethodSchema = Schema.Enums(CategorizationMethod);
export enum Currency {
  EUR = "EUR",
  USD = "USD",
  GBP = "GBP",
  BTC = "BTC",
  ETH = "ETH",
}

export const CurrencySchema = Schema.optional(Schema.Enums(Currency)).pipe(
  Schema.withConstructorDefault(() => Currency.EUR),
  Schema.withDecodingDefault(() => Currency.EUR)
);

// TRUE internal representation of a transaction
// DB row returned by select query is decoded into this type
export class Transaction extends Schema.Class<Transaction>("Transaction")({
  // Required fields
  id: PrimaryKeyIndex,
  merchant: Schema.NonEmptyString,
  transactionDate: Schema.ValidDateFromSelf,
  amount: Money,
  currency: CurrencySchema,

  // Optional fields
  effectiveDate: Schema.optional(Schema.ValidDateFromSelf),
  balance: Schema.optional(Money),
  category: Schema.optional(CategoryValue),
  categoryId: Schema.optional(PrimaryKeyIndex),
  confidence: Schema.optional(Schema.NonNegative),
  categorizationMethod: Schema.optional(CategorizationMethodSchema),
  manuallyCategorized: Schema.optional(Schema.Boolean),

  // Timestamps
  createdAt: Schema.optional(Schema.ValidDateFromSelf),
  updatedAt: Schema.optional(Schema.ValidDateFromSelf),
}) {}

// External representation allowing for INSERT persistence to the database
export class TransactionInsert extends Schema.Class<TransactionInsert>(
  "TransactionInsert"
)({
  merchant: Schema.NonEmptyString,
  transactionDate: Schema.Date,
  effectiveDate: Schema.optional(Schema.Date),
  amount: PersistedMoney,
  balance: Schema.optional(PersistedMoney),
  category: Schema.optional(CategoryValue),
  categoryId: Schema.optional(PrimaryKeyIndex),
  confidence: Schema.optional(Schema.NonNegative),
  categorizationMethod: Schema.optional(CategorizationMethodSchema),
  manuallyCategorized: Schema.optional(Schema.Boolean),
}) {}

// External representation allowing for UPDATE persistence to the database
export class TransactionUpdate extends Schema.Class<TransactionUpdate>(
  "TransactionUpdate"
)({
  id: PrimaryKeyIndex,
  merchant: Schema.NonEmptyString,
  transactionDate: Schema.Date,
  effectiveDate: Schema.optional(Schema.Date),
  amount: PersistedMoney,
  balance: Schema.optional(PersistedMoney),
  category: Schema.optional(CategoryValue),
  categoryId: Schema.optional(DBIdentifier),
  confidence: Schema.optional(Schema.NonNegative),
  categorizationMethod: Schema.optional(CategorizationMethodSchema),
  manuallyCategorized: Schema.optional(Schema.Boolean),
}) {}

export const TransactionBatchInsert = Schema.Array(TransactionInsert);
