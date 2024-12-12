import { Effect, Schema } from "effect";
import { assign, fromPromise, setup } from "xstate";
import { RuntimeClient } from "@/services/runtimeClient";
import { WriteApi } from "@/services/writeApi";
import { TransactionInsert } from "@/schemas/Transaction";
import { PersistedDateSchema } from "@/schemas/shared";

interface Context {
  transactions: TransactionInsert[] | [];
  submitError: string | null;
}

export const machine = setup({
  types: {
    context: {} as Context,
    events: {} as { 
      type: "transactions.create"; 
      transactions: TransactionInsert[]
    },
  },
  actors: {
    createTransactions: fromPromise(
      ({ input }: { input: TransactionInsert[] }) =>
        RuntimeClient.runPromise(
          Effect.gen(function* () {
            const api = yield* WriteApi;
            const encodedPersistedDate = Schema.encode(PersistedDateSchema);
            
            const mappedInput = input.map((transaction) => ({
              ...transaction,
              transactionDate: Effect.runSync(encodedPersistedDate(transaction.transactionDate)),
              effectiveDate: transaction.effectiveDate ? Effect.runSync(encodedPersistedDate(transaction.effectiveDate)) : undefined,
            }));

            yield* api.createTransactions(mappedInput);
          })
        )
    ),
  },
}).createMachine({
  id: "create-transactions",
  context: {
    transactions: [],
    submitError: null,
  },
  initial: "Idle",
  states: {
    Idle: {
      on: {
        "transactions.create": {
          target: "CreatingTransactions",
          actions: [
            assign({
              transactions: ({ event }) => event.transactions,
              submitError: null,
            }),
          ],
        },
      },
    },
    CreatingTransactions: {
      invoke: {
        src: "createTransactions",
        input: ({ context }) => context.transactions,
        onError: {
          target: "Idle",
          actions: assign(({ event }) => ({
            submitError:
              event.error instanceof Error
                ? event.error.message
                : "Unknown error",
          })),
        },
        onDone: { target: "Created" },
      },
    },
    Created: {
      after: { 
        5000: "Idle" 
      },
    },
  },
});