import { Data, Effect, pipe } from "effect";
import { TransactionProcessor } from "@/lib/TransactionProcessor/TransactionProcessor";
import { Transaction } from "@/domain/models/Transaction/Transaction";

export class TransactionsApiError extends Data.TaggedError("TransactionsApiError")<{
  cause: unknown;
}> {}

export class TransactionsApi extends Effect.Service<TransactionsApi>()("TransactionsApi", {
  dependencies: [],
  effect: Effect.gen(function* () {
    return {
      process: (files: File[], setTransactions: (transactions: Transaction[]) => void) =>
        yield pipe(
          Effect.try({
            try: () => {
              return TransactionProcessor.getInstance().process(files, setTransactions)
            },
            catch: (error) => new Error(`Error parsing transactions: ${error}`)
          }),
          Effect.tap(() => Effect.sync(() => console.log("Transaction processing completed"))),
          Effect.catchAll((error) =>
            Effect.sync(() => console.error("Error parsing transactions:", error))
          )
        )
    };
  }),
}) {}
