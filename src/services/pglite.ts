import { PGliteWorker } from "@electric-sql/pglite/worker";
import { live } from "@electric-sql/pglite/live";
import { drizzle } from "drizzle-orm/pglite";
import { Config, Data, Effect } from "effect";
import { PGlite, PGliteInterface } from "@electric-sql/pglite";

class PgliteError extends Data.TaggedError("PgliteError")<{
  cause: unknown;
}> {}

export class Pglite extends Effect.Service<Pglite>()("Pglite", {
  effect: Effect.gen(function* () {
    const indexDb = yield* Config.string("INDEX_DB");

    const client = yield* Effect.tryPromise({
      try: () =>
        PGliteWorker.create(
          new Worker(new URL("../workers/pglite.worker.ts", import.meta.url), {
            type: "module",
          }),
          {
            dataDir: `idb://${indexDb}`,
            meta: {
                // additional metadata passed to `init`
            },
            extensions: {
              live,
            },
          }
        ) as Promise<PGliteInterface>,
      catch: (error) => new PgliteError({ cause: error }),
    });

    // We need to cast to PGlite because the client is a PGliteWorker
    const orm = drizzle({ client: client as unknown as PGlite });

    const query = <R>(execute: (_: typeof orm) => Promise<R>) =>
      Effect.tryPromise({
        try: () => execute(orm),
        catch: (error) => new PgliteError({ cause: error }),
      });

    return { client, orm, query };
  }),
}) {}
