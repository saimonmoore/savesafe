import { Data, Effect, flow, Schema } from "effect";
import { Pglite } from "@/services/pglite";
import { TransactionMutations } from "@/services/mutations/TransactionMutations";
import { AppMutations } from "@/services/mutations/AppMutations";

export class WriteApiError extends Data.TaggedError("WriteApiError")<{
  cause: unknown;
}> {}

export const execute = <A, I, T, E>(
  schema: Schema.Schema<A, I>,
  exec: (values: I) => Effect.Effect<T, E>
) =>
  flow(
    Schema.decode(schema),
    Effect.flatMap(Schema.encode(schema)),
    Effect.tap((encoded) => Effect.log("Insert", encoded)),
    Effect.mapError((error) => new WriteApiError({ cause: error })),
    Effect.flatMap(exec)
  );

export class WriteApi extends Effect.Service<WriteApi>()("WriteApi", {
  effect: Effect.gen(function* () {
    const transactionMutations = yield* TransactionMutations();
    const appMutations = yield* AppMutations();

    return {
      ...transactionMutations,
      ...appMutations,
    };
  }),
  dependencies: [Pglite.Default],
}) {}
