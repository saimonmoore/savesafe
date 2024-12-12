import { Number, ParseResult, Schema } from "effect";

export const FloatQuantityInsert = Schema.NonNegative.pipe(
  Schema.transform(Schema.NonNegative, {
    decode: (value) => Number.round(value / 10, 2),
    encode: (value) => Number.round(value * 10, 2),
  })
);

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
);

export const EmptyStringAsUndefined = Schema.UndefinedOr(Schema.String).pipe(
  Schema.transform(Schema.String, {
    decode: (value) => (value === undefined ? "" : value),
    encode: (value) => (value.trim().length === 0 ? undefined : value),
  })
);

export const PersistedDateSchema = Schema.String.pipe(
  Schema.transform(
    Schema.ValidDateFromSelf,
    {
      strict: true,
      decode: (str: string) => new Date(str),
      encode: (date: Date) => date.toISOString(),
    }
  )
);

export const OptionalPersistedDate = Schema.UndefinedOr(PersistedDateSchema);