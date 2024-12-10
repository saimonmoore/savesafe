import { Data, Effect } from "effect";
import { Pglite } from "./pglite";
import { AppQueries } from "./queries/AppQueries";

export class ReadApiError extends Data.TaggedError("ReadApiError")<{
  cause: unknown;
}> {}

export class ReadApi extends Effect.Service<ReadApi>()("ReadApi", {
  dependencies: [Pglite.Default],
  effect: Effect.gen(function* () {
    const appQueries = yield* AppQueries();

    return {
      ...appQueries,
    };
  }),
}) {}
