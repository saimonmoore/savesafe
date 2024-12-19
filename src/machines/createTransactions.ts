import { Effect } from "effect";
import { assign, fromPromise, setup } from "xstate";
import { RuntimeClient } from "@/services/runtimeClient";
import { WriteApi } from "@/services/writeApi";
import { TransactionInsert } from "@/schemas/Transaction";
// import { PersistedDateSchema } from "@/schemas/shared";
// import { TransactionProcessor } from "@/lib/TransactionProcessor/TransactionProcessor";
import { Transaction } from "@/domain/models/Transaction/Transaction";
import { TransactionsApi } from "@/services/transactionsApi";

interface Context {
  transactions: TransactionInsert[] | [];
  rawTransactions: Transaction[] | [];
  uploadedFiles: File[];
  submitError: string | null;
}

type Event =
  | { type: "transactions.create"; transactions: TransactionInsert[] }
  | { type: "files.upload"; files: File[] }
  | { type: "transactions.processed"; transactions: Transaction[] }
  | { type: "error"; error: string }

export const machine = setup({
  types: {
    context: {} as Context,
    events: {} as Event,
  },
  actors: {
    processFiles: fromPromise(
      ({ input }: { input: File[] }) =>
        RuntimeClient.runPromise(
          Effect.gen(function* () {
            const api = yield* TransactionsApi;
            return api.process(input, (transactions) => {
              console.log("Transactions processed:", transactions);
            });
          })
        )
    ),
    createTransactions: fromPromise(
      ({ input }: { input: Transaction[] }) =>
        RuntimeClient.runPromise(
          Effect.gen(function* () {
            const api = yield* WriteApi;
            // const encodedPersistedDate = Schema.encode(PersistedDateSchema);
            
            const mappedInput = input.map((transaction) => ({
              ...transaction,
              // transactionDate: Effect.runSync(encodedPersistedDate(transaction.transactionDate)),
              // effectiveDate: transaction.effectiveDate ? Effect.runSync(encodedPersistedDate(transaction.effectiveDate)) : undefined,
              manuallyCategorized: false,
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
    rawTransactions: [],
    uploadedFiles: [],
    submitError: null,
  },
  initial: "Idle",
  states: {
    Idle: {
      on: {
        "files.upload": {
          target: "ProcessingFiles",
          actions: assign({
            uploadedFiles: ({ event }) => event.files,
            submitError: null,
          }),
        },
      },
    },
    ProcessingFiles: {
      invoke: {
        src: "processFiles",
        input: ({ context }) => context.uploadedFiles,
        onDone: {
          target: "CreatingTransactions",
          actions: assign({
            rawTransactions: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "Idle",
          actions: assign(({ event }) => ({
            submitError: event.error instanceof Error ? event.error.message : "Unknown error",
          })),
        },
      },
    },
    CreatingTransactions: {
      invoke: {
        src: "createTransactions",
        input: ({ context }) => context.rawTransactions,
        onError: {
          target: "Idle",
          actions: assign(({ event }) => ({
            submitError: event.error instanceof Error ? event.error.message : "Unknown error",
          })),
        },
        onDone: { target: "Created" },
      },
    },
    Created: {
      after: {
        5000: "Idle",
      },
    },
  },
});