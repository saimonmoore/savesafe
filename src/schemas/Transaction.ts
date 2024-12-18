import { Schema } from "effect";
import { CategorizationMethod } from "@/db/schemas/Transaction";
import { CategoryValue } from "@/schemas/Category";
import { FloatQuantityInsert, FloatQuantityOrUndefined, OptionalPersistedDate, PersistedDateSchema, PrimaryKeyIndex } from "@/schemas/shared";

export const CategorizationMethodSchema = Schema.Literal(
  ...(Object.values(CategorizationMethod) as [
    CategorizationMethod,
    ...CategorizationMethod[]
  ])
);

export class TransactionInsert extends Schema.Class<TransactionInsert>(
  "TransactionInsert"
)({
  merchant: Schema.NonEmptyString,
  transactionDate: PersistedDateSchema,
  effectiveDate: Schema.optional(PersistedDateSchema),
  amount: FloatQuantityInsert,
  balance: Schema.optional(FloatQuantityOrUndefined),
  category: Schema.optional(CategoryValue),
  confidence: Schema.optional(Schema.NonNegative),
  categorizationMethod: Schema.optional(CategorizationMethodSchema),
  manuallyCategorized: Schema.optional(Schema.Boolean),
}) {}

export class TransactionUpdate extends Schema.Class<TransactionUpdate>(
  "TransactionUpdate"
)({
  id: PrimaryKeyIndex,
  merchant: Schema.NonEmptyString,
  transactionDate: PersistedDateSchema,
  effectiveDate: OptionalPersistedDate,
  amount: FloatQuantityInsert,
  balance: FloatQuantityInsert,
  category: CategoryValue,
  confidence: Schema.NonNegative,
  categorizationMethod: CategorizationMethodSchema,
  manuallyCategorized: Schema.Boolean.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => false)
  ),
}) {}

export class TransactionSelect extends Schema.Class<TransactionSelect>(
  "TransactionSelect"
)({
  id: PrimaryKeyIndex,
  merchant: Schema.NonEmptyString,
  transactionDate: PersistedDateSchema,
  effectiveDate: OptionalPersistedDate,
  amount: FloatQuantityInsert,
  balance: FloatQuantityInsert,
  category: CategoryValue,
  confidence: Schema.NonNegative,
  categorizationMethod: CategorizationMethodSchema,
  manuallyCategorized: Schema.Boolean.pipe(
    Schema.propertySignature,
    Schema.withConstructorDefault(() => false)
  ),
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc,
}) {}

export const TransactionBatchInsert = Schema.Array(TransactionInsert);