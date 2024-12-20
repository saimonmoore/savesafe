import { Schema } from "effect";

export const DBIdentifier = Schema.NonNegativeBigInt.annotations({
  identifier: "DBIdentifier",
  message: () => "Must be a positive integer",
  description: "Represents a unique identifier for a database record",
  documentation: "Represents a unique identifier for a database record"
})

export const Money = Schema.NonNegative.annotations({
  identifier: "Money",
  message: () => "Must be a positive decimal number",
  description: "Represents a monetary value in a specific currency",
  documentation: "Represents a monetary value in a specific currency"
})

export const FloatQuantityInsert = Schema.NonNegative.pipe(
  Schema.transform(Schema.NonNegative, {
    decode: (value) => value / 100,
    encode: (value) => value * 100,
  })
);

export const PersistedMoney = FloatQuantityInsert.annotations({
  identifier: "PersistedMoney",
  message: () => "Must be a positive decimal number",
  description: "Represents a monetary decimal value in a specific currency that is persisted to the database as an integer",
  documentation: "Represents a monetary decimal value in a specific currency that is persisted to the database as an integer"
})

export const FloatQuantityOrUndefined = Schema.UndefinedOr(
  Schema.NonNegative
).pipe(
  Schema.transform(Schema.UndefinedOr(FloatQuantityInsert), {
    decode: (value) => (value === undefined ? undefined : value / 10),
    encode: (value) => (value === undefined ? undefined : value * 10),
  })
);

export const FloatQuantityInsertPositive = FloatQuantityInsert.pipe(
  Schema.filter((value) =>
    value === undefined || value >= 0 ? true : "Quantity must be non positive"
  )
);

export const PrimaryKeyIndex = Schema.NonNegative.pipe(
  Schema.brand("PrimaryKeyIndex")
).annotations({
  identifier: "PrimaryKeyIndex",
  message: () => "Must be a positive integer",
  description: "Represents a unique identifier for a primary key index",
  documentation: "Represents a unique identifier for a primary key index"
});

export const EmptyStringAsUndefined = Schema.UndefinedOr(Schema.String).pipe(
  Schema.transform(Schema.String, {
    decode: (value) => (value === undefined ? "" : value),
    encode: (value) => (value.trim().length === 0 ? undefined : value),
  })
);

export const PersistedDateSchema = Schema.ValidDateFromSelf.pipe(
  Schema.transform(
    Schema.String,
    {
      strict: true,
      encode: (str: string) => new Date(str),
      decode: (date: Date) => date.toISOString(),
    }
  )
);

export const OptionalPersistedDate = Schema.UndefinedOr(PersistedDateSchema);