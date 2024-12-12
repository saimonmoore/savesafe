import v0000 from "../db/migrations/0000_cold_gladiator.sql?raw";

import type { PGlite } from "@electric-sql/pglite";
import { Data, Effect } from "effect";
import { Pglite } from "@/services/pglite";

class MigrationsError extends Data.TaggedError("MigrationsError")<{
  cause: unknown;
}> {}

const execute = (client: PGlite) => (sql: string) =>
  Effect.tryPromise({
    try: () => client.exec(sql),
    catch: (error) => new MigrationsError({ cause: error }),
  });

export class Migrations extends Effect.Service<Migrations>()("Migrations", {
  dependencies: [Pglite.Default],
  effect: Effect.gen(function* () {
    const db = yield* Pglite;
    return [execute(db.client as PGlite)(v0000)] as const;
  }),
}) {}