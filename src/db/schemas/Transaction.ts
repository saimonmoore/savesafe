import { timestamps } from "./column.helpers";
import { dbSchema } from "./schema";
import * as t from "drizzle-orm/pg-core";


export enum CategorizationMethod {
    AI_BATCH = "ai_batch",
    AI_BATCH_ERROR = "ai_batch_error",
    STORED = "stored",
    PATTERN = "pattern",
    FUZZY = "fuzzy"
}

export const categorizationMethodEnum = dbSchema.enum(
  "categorization_methods",
  Object.values(CategorizationMethod) as [string, ...string[]]
);

export const transactionTable = dbSchema.table(
  "transactions",
  {
    id: t.integer().primaryKey().generatedAlwaysAsIdentity(),
    merchant: t.varchar({ length: 255 }).notNull().unique(),
    transactionDate: t.date().notNull(),
    effectiveDate: t.date(),
    amount: t.numeric().notNull(),
    balance: t.numeric().notNull(),
    category: t.varchar({ length: 255 }).notNull(),
    confidence: t.integer().notNull(),
    categorizationMethod: categorizationMethodEnum().notNull(),
    manuallyCategorized: t.boolean().default(false),
    ...timestamps,
  },
  (table) => [
    t.index("merchant_idx").on(table.merchant),
    t.index("transaction_date_idx").on(table.transactionDate),
    t.index("category_idx").on(table.category),
  ]
);

export const systemTable = dbSchema.table("system", {
  version: t.integer().notNull().default(0),
});
