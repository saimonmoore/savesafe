import { ref, S, TypedObject } from "@dxos/echo-schema";

export class CategoryType extends TypedObject<CategoryType>({
  typename: "savesafe.com/type/Category",
  version: "0.1.0",
})({
  _tag: S.tag("Category"),
  label: S.NonEmptyString,
  aliases: S.mutable(S.Array(S.String)),
}) {}

export class TransactionType extends TypedObject<TransactionType>({
  typename: "savesafe.com/type/Transaction",
  version: "0.1.0",
})({
  _tag: S.tag("Transaction"),
  description: S.String,
  amount: S.Number,
  balance: S.Number,
  transactionDate: S.Date,
  effectiveDate: S.Date,
  category: S.optional(ref(CategoryType)),
}) {}

export class AccountType extends TypedObject<AccountType>({
  typename: "savesafe.com/type/Account",
  version: "0.1.0",
})({
  _tag: S.tag("Account"),
  iban: S.NonEmptyString,
  description: S.String,
  aliases: S.mutable(S.Array(ref(TransactionType))),
}) {}
