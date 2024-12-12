import { flow } from "effect";
import { Pglite } from "@/services/pglite";
import { TransactionInsert } from "@/schemas/Transaction";
import { transactionTable } from "@/db/schemas/Transaction";
import { singleResult } from "@/lib/utils";
import { execute, WriteApiError } from "@/services/writeApi";

export const TransactionMutations = function* () {
  const { query } = yield* Pglite;

  return {
    createTransaction: flow(
      execute(TransactionInsert, (values) =>
        query((_) =>
          _.insert(transactionTable)
            .values(values)
            .returning({ id: transactionTable.id })
        )
      ),
      singleResult(
        () => new WriteApiError({ cause: "Transaction not created" })
      )
    ),
    createTransactions: flow(
      execute(TransactionInsert, (values) =>
        query((_) =>
          _.insert(transactionTable)
            .values(values)
        )
      ),
    ),
  };
};
